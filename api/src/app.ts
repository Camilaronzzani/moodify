import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { RepositorioJsonl, type Repositorio } from "./dados/repositorio.ts";
import { montarAcolhimento } from "./dominio/acolhimento.ts";
import { resolverRegra } from "./dominio/mapa-emocional.ts";
import { MotorRecomendacao } from "./dominio/motor.ts";
import {
  CONTEXTOS,
  EMOCOES,
  EMOJIS_EMOCAO,
  ENERGIAS,
  TEMAS,
  NOMES_CONTEXTO,
  NOMES_EMOCAO,
  NOMES_ENERGIA,
  NOMES_TEMA,
  TAGS,
} from "./dominio/taxonomia.ts";
import { AIComFallback } from "./providers/ia/com-fallback.ts";
import type { AIProvider, PerfilEmocional } from "./providers/ia/contrato.ts";
import { LexicoProvider } from "./providers/ia/lexico.ts";
import { OllamaProvider } from "./providers/ia/ollama.ts";
import { MusicProviderComCache } from "./providers/musica/com-cache.ts";
import type { MusicProvider } from "./providers/musica/contrato.ts";
import { DeezerProvider } from "./providers/musica/deezer.ts";
import { SpotifyProvider } from "./providers/musica/spotify.ts";
import { criarRotasPlaylist } from "./rotas/playlists.ts";
import { MENSAGEM_APOIO, RECURSOS_APOIO, triarRisco } from "./seguranca/crise.ts";

/** Monta a cadeia de IA conforme o ambiente. O léxico é sempre o último. */
function montarIA(): AIComFallback {
  const providers: AIProvider[] = [];

  if ((process.env.AI_PROVIDER ?? "lexico") === "ollama") {
    providers.push(new OllamaProvider());
  }

  providers.push(new LexicoProvider());

  return new AIComFallback(providers);
}

function montarMusica(): MusicProviderComCache {
  let base: MusicProvider = new DeezerProvider();

  if ((process.env.MUSIC_PROVIDER ?? "deezer") === "spotify") {
    const spotify = new SpotifyProvider();

    // Sem credencial o Spotify não serve para nada — cai na Deezer, que
    // não exige autenticação, em vez de derrubar o servidor no boot.
    if (spotify.configurado) {
      base = spotify;
    } else {
      console.warn("[moodify] MUSIC_PROVIDER=spotify mas faltam credenciais. Usando Deezer.");
    }
  }

  // O cache não é opcional: sem ele cada análise dispara ~16 chamadas e o
  // provider começa a limitar a taxa, zerando recomendações.
  return new MusicProviderComCache(base);
}

const AnaliseSchema = z.object({
  texto: z.string().min(3, "Escreva um pouco mais sobre como você está.").max(300),
  /** Id anônimo do aparelho. Não identifica pessoa. */
  dispositivoId: z.string().min(6).max(64),
  limite: z.number().int().min(1).max(30).optional(),
});

/**
 * Segunda etapa: a pessoa já viu o acolhimento e escolheu o que quer.
 * O perfil volta inteiro para não precisar reinterpretar o texto — e o
 * texto original nem sai do aparelho de novo.
 */
const RecomendacaoSchema = z.object({
  dispositivoId: z.string().min(6).max(64),
  intencao: z.enum(["acolher", "levantar"]),
  perfil: z.object({
    emotion: z.enum(EMOCOES),
    theme: z.enum(TEMAS),
    context: z.enum(CONTEXTOS),
    energy: z.enum(ENERGIAS),
    tags: z.array(z.string()),
    keywords: z.array(z.string()).default([]),
    confidence: z.number().min(0).max(1),
  }),
  limite: z.number().int().min(1).max(30).optional(),
});

/** Eventos de faixa exigem `faixaChave`; eventos de fluxo, não. */
const EventoSchema = z
  .object({
    analiseId: z.string().min(1),
    dispositivoId: z.string().min(6).max(64),
    faixaChave: z.string().min(1).optional(),
    isrc: z.string().optional(),
    tipo: z.enum([
      "exibida",
      "aberta",
      "favoritada",
      "descartada",
      "preview",
      "analise_iniciada",
      "analise_concluida",
      "analise_falhou",
      "analise_abandonada",
    ]),
    latenciaMs: z.number().int().min(0).optional(),
    motivo: z.string().max(200).optional(),
  })
  .refine((e) => e.tipo.startsWith("analise_") || Boolean(e.faixaChave), {
    message: "faixaChave é obrigatória em eventos de faixa",
    path: ["faixaChave"],
  });

export function criarApp(
  opcoes: { repositorio?: Repositorio; musica?: MusicProvider } = {},
) {
  const app = express();
  const repositorio = opcoes.repositorio ?? new RepositorioJsonl();
  const musica = opcoes.musica ?? montarMusica();
  const ia = montarIA();
  const motor = new MotorRecomendacao(musica);

  app.use(cors());
  app.use(express.json({ limit: "16kb" }));

  app.get("/saude", (_req, res) => {
    res.json({
      ok: true,
      ia: ia.nome,
      musica: musica.nome,
      cache: musica instanceof MusicProviderComCache ? musica.estatisticas : undefined,
    });
  });

  /** Alimenta os chips da Home sem o app precisar duplicar a taxonomia. */
  app.get("/v1/taxonomia", (_req, res) => {
    res.json({
      emocoes: EMOCOES.map((slug) => ({
        slug,
        nome: NOMES_EMOCAO[slug],
        emoji: EMOJIS_EMOCAO[slug],
      })),
      contextos: CONTEXTOS.map((slug) => ({ slug, nome: NOMES_CONTEXTO[slug] })),
      energias: Object.entries(NOMES_ENERGIA).map(([slug, nome]) => ({ slug, nome })),
      tags: TAGS,
    });
  });

  app.post("/v1/analises", async (req, res, next) => {
    const inicio = Date.now();

    try {
      const entrada = AnaliseSchema.parse(req.body);

      // Triagem de risco ANTES de qualquer análise musical. Se alguém está
      // em sofrimento grave, a resposta certa não é uma playlist.
      const triagem = triarRisco(entrada.texto);

      if (triagem.risco) {
        await repositorio.salvarAnalise({
          id: `analise-${Date.now()}`,
          dispositivoId: entrada.dispositivoId,
          perfil: {
            emotion: "triste",
            theme: "nenhum",
            context: "qualquer",
            energy: "low",
            tags: [],
            keywords: [],
            confidence: 0,
          },
          providerIa: "triagem",
          providerMusica: "nenhum",
          quantidadeFaixas: 0,
          latenciaMs: Date.now() - inicio,
          criadaEm: new Date().toISOString(),
          triagemRisco: true,
        });

        // 200, não erro: para o app isto é uma resposta válida e prevista.
        res.json({
          tipo: "apoio",
          mensagem: MENSAGEM_APOIO,
          recursos: RECURSOS_APOIO,
        });
        return;
      }

      // Etapa 1 devolve APENAS a leitura do momento — nenhuma busca de
      // catálogo acontece aqui. Responde em milissegundos, então a pessoa vê
      // o acolhimento na hora e decide sem esperar.
      const perfil = await ia.analisarHumor(entrada.texto);
      const acolhimento = montarAcolhimento(perfil.emotion, perfil.theme);

      // Mensagem escrita pelo modelo a partir do texto real da pessoa.
      // Se não houver modelo disponível, ou se ele falhar, fica o texto
      // curado — que é genérico, mas nunca diz algo inadequado.
      const gerada = await ia.tentarGerarAcolhimento(entrada.texto, perfil);
      const latenciaMs = Date.now() - inicio;

      res.json({
        tipo: "acolhimento",
        perfil: {
          ...perfil,
          emocaoNome: NOMES_EMOCAO[perfil.emotion],
          emocaoEmoji: EMOJIS_EMOCAO[perfil.emotion],
          temaNome: NOMES_TEMA[perfil.theme],
          contextoNome: NOMES_CONTEXTO[perfil.context],
          energiaNome: NOMES_ENERGIA[perfil.energy],
        },
        mensagem: gerada ?? acolhimento.mensagem,
        pergunta: acolhimento.pergunta,
        escolhas: acolhimento.escolhas,
        diagnostico: {
          providerIa: ia.ultimoProviderUsado,
          mensagemGeradaPorIa: gerada !== null,
          latenciaMs,
        },
      });
    } catch (erro) {
      next(erro);
    }
  });

  /**
   * Etapa 2: a pessoa escolheu o que quer, agora buscamos as faixas.
   *
   * Recebe o perfil de volta em vez do texto — o texto original nem sai do
   * aparelho novamente, e não há reinterpretação.
   */
  app.post("/v1/recomendacoes", async (req, res, next) => {
    const inicio = Date.now();

    try {
      const entrada = RecomendacaoSchema.parse(req.body);

      // Recalcula as tags pela intenção usando o MAPA, não a IA.
      //
      // Re-interpretar aqui seria errado por dois motivos: a leitura do
      // sentimento já foi feita na etapa 1, e as `keywords` soltas perdem o
      // contexto da frase — "acabei terminar namorada" sem a frase inteira
      // levava a uma energia diferente da correta. O mapa é código puro e
      // determinístico: mesma emoção + tema + intenção sempre dá o mesmo.
      const regra = resolverRegra(
        entrada.perfil.emotion,
        entrada.perfil.context,
        entrada.perfil.theme,
        entrada.intencao,
      );

      const perfilFinal = {
        ...entrada.perfil,
        tags: regra.tags.slice(0, 5).map((t) => t.tag),
        energy: regra.energia,
      } as PerfilEmocional;

      const [jaVistas, totalAnalises] = await Promise.all([
        repositorio.faixasJaVistas(entrada.dispositivoId),
        repositorio.contarAnalises(entrada.dispositivoId),
      ]);

      const recomendacao = await motor.recomendar(perfilFinal, {
        limite: entrada.limite,
        market: process.env.MUSIC_MARKET ?? "BR",
        jaVistas,
        // A semente cresce a cada análise e muda com a intenção, então
        // repetir a mesma emoção não devolve a mesma lista.
        semente: totalAnalises * 7 + (entrada.intencao === "levantar" ? 3 : 0),
        tema: entrada.perfil.theme,
        intencao: entrada.intencao,
      });

      const id = `analise-${Date.now()}`;
      const latenciaMs = Date.now() - inicio;

      await repositorio.salvarAnalise({
        id,
        dispositivoId: entrada.dispositivoId,
        perfil: perfilFinal,
        providerIa: "mapa",
        providerMusica: recomendacao.origem.musica,
        quantidadeFaixas: recomendacao.faixas.length,
        latenciaMs,
        criadaEm: new Date().toISOString(),
        intencao: entrada.intencao,
      });

      res.json({
        tipo: "recomendacao",
        id,
        intencao: entrada.intencao,
        perfil: {
          ...perfilFinal,
          emocaoNome: NOMES_EMOCAO[perfilFinal.emotion],
          emocaoEmoji: EMOJIS_EMOCAO[perfilFinal.emotion],
          temaNome: NOMES_TEMA[perfilFinal.theme],
          contextoNome: NOMES_CONTEXTO[perfilFinal.context],
          energiaNome: NOMES_ENERGIA[perfilFinal.energy],
        },
        mensagem: recomendacao.mensagem,
        faixas: recomendacao.faixas,
        diagnostico: {
          providerIa: "mapa",
          providerMusica: recomendacao.origem.musica,
          tagsConsultadas: recomendacao.origem.tagsConsultadas,
          latenciaMs,
        },
      });
    } catch (erro) {
      next(erro);
    }
  });

  app.post("/v1/eventos", async (req, res, next) => {
    try {
      const entrada = EventoSchema.parse(req.body);
      await repositorio.salvarEvento({ ...entrada, criadoEm: new Date().toISOString() });
      res.status(204).end();
    } catch (erro) {
      next(erro);
    }
  });

  // Playlist na conta do usuário. Só responde se houver credenciais.
  app.use(criarRotasPlaylist());

  app.use((_req, res) => {
    res.status(404).json({ erro: "Rota não encontrada" });
  });

  app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (erro instanceof z.ZodError) {
      res.status(400).json({
        erro: "Dados inválidos",
        detalhes: erro.issues.map((i) => ({ campo: i.path.join("."), mensagem: i.message })),
      });
      return;
    }

    console.error("[moodify] erro não tratado:", erro);
    res.status(500).json({ erro: "Erro interno" });
  });

  return app;
}
