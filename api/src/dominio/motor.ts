import type { PerfilEmocional } from "../providers/ia/contrato.ts";
import type { Faixa, MusicProvider } from "../providers/musica/contrato.ts";
import { sortearArtistas } from "./artistas-semente.ts";
import { resolverRegra } from "./mapa-emocional.ts";
import { NOMES_ENERGIA, type Intencao, type Tag, type Tema } from "./taxonomia.ts";

/**
 * O motor de recomendação do Moodify.
 *
 * Aqui é onde a inteligência mora — e por isso ela não depende de nenhum
 * endpoint de recomendação de terceiro. O provider de música é usado apenas
 * para resolver termos de busca em faixas reais.
 */

export type FaixaPontuada = Faixa & {
  score: number;
  /** Quais tags trouxeram esta faixa — mostra o "porquê" ao usuário. */
  motivos: Tag[];
};

export type Recomendacao = {
  perfil: PerfilEmocional;
  mensagem: string;
  faixas: FaixaPontuada[];
  /** Providers consultados, para telemetria e depuração. */
  origem: {
    musica: string;
    tagsConsultadas: Tag[];
    /** Quantas buscas de tag falharam — resultado curto tem explicação. */
    buscasFalhas: number;
  };
};

/** Quantas tags do perfil viram busca. Mais que isso vira latência sem ganho. */
const TAGS_POR_BUSCA = 4;
/** No máximo 2 faixas do mesmo artista — sem isso o resultado fica monótono. */
const MAX_POR_ARTISTA = 2;
/** Artistas curados consultados por tag. */
const ARTISTAS_POR_TAG_NA_BUSCA = 4;
/** Top faixas trazidas de cada artista. */
const FAIXAS_POR_ARTISTA = 4;

type Opcoes = {
  limite?: number;
  market?: string;
  /** Faixas já mostradas a este usuário; recebem penalidade. */
  jaVistas?: Set<string>;
  /** Rotaciona quais artistas curados entram — evita repetir sempre os mesmos. */
  semente?: number;
  tema?: Tema;
  intencao?: Intencao;
};

export class MotorRecomendacao {
  constructor(private readonly musica: MusicProvider) {}

  async recomendar(perfil: PerfilEmocional, opcoes: Opcoes = {}): Promise<Recomendacao> {
    const { limite = 15, market = "BR", jaVistas = new Set<string>() } = opcoes;

    const regra = resolverRegra(
      perfil.emotion,
      perfil.context,
      opcoes.tema ?? perfil.theme,
      opcoes.intencao ?? "acolher",
    );

    // Prioriza as tags que o perfil trouxe, mas garante que sejam tags do
    // mapa curado — é o mapa que sabe o peso de cada uma.
    const pesoPorTag = new Map<Tag, number>(regra.tags.map((t) => [t.tag, t.peso]));
    const tagsConsultadas = [
      ...perfil.tags.filter((tag) => pesoPorTag.has(tag)),
      ...regra.tags.map((t) => t.tag),
    ]
      .filter((tag, i, todas) => todas.indexOf(tag) === i)
      .slice(0, TAGS_POR_BUSCA);

    // Uma busca por tag, todas em paralelo. Uma falha não derruba as outras.
    const buscas = await Promise.allSettled(
      tagsConsultadas.map((tag) => this.buscarPorTag(tag, market, opcoes.semente ?? 0)),
    );

    // Agrega: a mesma faixa pode vir de várias tags, e isso é um bom sinal —
    // significa que ela combina com mais de um aspecto do momento.
    const acumulado = new Map<string, { faixa: Faixa; score: number; motivos: Tag[] }>();

    buscas.forEach((resultado, indice) => {
      if (resultado.status !== "fulfilled") {
        return;
      }

      const tag = tagsConsultadas[indice]!;
      const peso = pesoPorTag.get(tag) ?? 0.5;

      resultado.value.forEach((faixa, posicao) => {
        const chave = this.chaveDeFaixa(faixa);
        const existente = acumulado.get(chave);

        // Posição na busca importa: o 1º resultado é mais relevante que o 20º.
        const relevancia = 1 - posicao / (resultado.value.length + 1);
        const contribuicao = peso * relevancia;

        if (existente) {
          existente.score += contribuicao;
          existente.motivos.push(tag);
        } else {
          acumulado.set(chave, { faixa, score: contribuicao, motivos: [tag] });
        }
      });
    });

    const pontuadas = [...acumulado.values()]
      .map((item) => ({
        ...item.faixa,
        motivos: item.motivos,
        score: this.ajustarScore(item.score, item.faixa, jaVistas),
      }))
      .sort((a, b) => b.score - a.score);

    const escolhidas = this.diversificar(pontuadas, limite);
    const buscasFalhas = buscas.filter((b) => b.status === "rejected").length;

    // Silêncio é pior que erro: sem este aviso, uma recomendação vazia por
    // limite de taxa do provider parece "não achamos nada para você".
    if (escolhidas.length === 0) {
      console.warn(
        `[moodify] recomendação vazia — emoção=${perfil.emotion} ` +
          `tags=${tagsConsultadas.join(",")} buscasFalhas=${buscasFalhas}/${buscas.length}`,
      );
    }

    return {
      perfil,
      mensagem: this.montarMensagem(perfil),
      faixas: await this.enriquecerComISRC(escolhidas),
      origem: { musica: this.musica.nome, tagsConsultadas, buscasFalhas },
    };
  }

  /**
   * Preenche o ISRC das faixas que vieram sem ele.
   *
   * Endpoints de "top faixas do artista" costumam omitir o ISRC — só o detalhe
   * da faixa o traz. Como o ISRC é o identificador canônico do sistema (sem
   * ele a troca de provider não funciona), vale uma chamada extra.
   *
   * Feito só nas faixas que sobraram após a diversificação, e em paralelo:
   * enriquecer os ~200 candidatos seria desperdício.
   */
  private async enriquecerComISRC(faixas: FaixaPontuada[]): Promise<FaixaPontuada[]> {
    const resultados = await Promise.allSettled(
      faixas.map(async (faixa) => {
        if (faixa.isrc) {
          return faixa;
        }

        const detalhe = await this.musica.obterFaixa(faixa.providerId);
        return detalhe?.isrc ? { ...faixa, isrc: detalhe.isrc } : faixa;
      }),
    );

    // Falha no enriquecimento não descarta a faixa — ela só fica sem ISRC.
    return resultados.map((resultado, indice) =>
      resultado.status === "fulfilled" ? resultado.value : faixas[indice]!,
    );
  }

  /**
   * Traduz uma tag em faixas reais.
   *
   * NÃO busca a tag como texto: `track:"chill"` devolve músicas com "chill"
   * no título, não músicas do estilo chill — foi assim que a primeira versão
   * recomendou "Funk & Chill Guitar Backing Track". Nenhum provider tem mais
   * endpoint de descoberta por estilo.
   *
   * O caminho correto: a curadoria diz QUAIS artistas combinam com a tag, e o
   * catálogo traz as faixas mais ouvidas deles. Quem escolhe são pessoas; o
   * provider só confirma que a música existe.
   */
  private async buscarPorTag(tag: Tag, market: string, semente: number): Promise<Faixa[]> {
    const artistas = sortearArtistas(tag, ARTISTAS_POR_TAG_NA_BUSCA, semente);

    if (artistas.length === 0) {
      return [];
    }

    const porArtista = await Promise.allSettled(
      artistas.map((nome) =>
        this.musica.topFaixasDoArtista(nome, FAIXAS_POR_ARTISTA, market),
      ),
    );

    return porArtista
      .filter(
        (resultado): resultado is PromiseFulfilledResult<Faixa[]> =>
          resultado.status === "fulfilled",
      )
      .flatMap((resultado) => resultado.value);
  }

  private ajustarScore(base: number, faixa: Faixa, jaVistas: Set<string>): number {
    let score = base;

    // Repetição: sem esta penalidade o app devolve as mesmas 10 músicas
    // para sempre e o usuário desiste na terceira análise.
    if (jaVistas.has(this.chaveDeFaixa(faixa))) {
      score *= 0.35;
    }

    // Faixa com ISRC vale mais: é portátil entre catálogos.
    if (faixa.isrc) {
      score *= 1.05;
    }

    // Preview disponível reduz a fricção — o usuário decide sem sair do app.
    if (faixa.previewUrl) {
      score *= 1.1;
    }

    return score;
  }

  /** Limita faixas por artista, preservando a ordem de score. */
  private diversificar(faixas: FaixaPontuada[], limite: number): FaixaPontuada[] {
    const porArtista = new Map<string, number>();
    const escolhidas: FaixaPontuada[] = [];

    for (const faixa of faixas) {
      if (escolhidas.length >= limite) {
        break;
      }

      const artista = faixa.artista.toLowerCase();
      const quantas = porArtista.get(artista) ?? 0;

      if (quantas >= MAX_POR_ARTISTA) {
        continue;
      }

      porArtista.set(artista, quantas + 1);
      escolhidas.push(faixa);
    }

    return escolhidas;
  }

  /**
   * Chave de deduplicação por artista + título, não por id do provider:
   * a mesma música aparece com ids diferentes (single, álbum, remaster).
   */
  private chaveDeFaixa(faixa: Faixa): string {
    const normalizar = (texto: string) =>
      texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");

    return `${normalizar(faixa.artista)}::${normalizar(faixa.titulo)}`;
  }

  /**
   * Mensagem explicativa. Aqui é o lugar natural para um LLM gerar texto
   * empático de verdade — este template é a versão determinística.
   */
  private montarMensagem(perfil: PerfilEmocional): string {
    const porEnergia: Record<typeof perfil.energy, string> = {
      low: "Escolhemos faixas mais calmas, para acompanhar o seu momento sem atropelar.",
      medium: "Selecionamos músicas equilibradas, que dão espaço para pensar sem pesar.",
      high: "Separamos faixas com mais energia para embalar o que você está sentindo.",
    };

    return `${porEnergia[perfil.energy]} Energia ${NOMES_ENERGIA[
      perfil.energy
    ].toLowerCase()}.`;
  }
}
