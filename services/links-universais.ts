import type { Faixa } from "@/services/api/tipos";

/**
 * Links universais via Odesli (song.link).
 *
 * Resolve o problema de "exportar para Spotify, Deezer ou YouTube Music" sem
 * OAuth em três plataformas — o que seria inviável: a Deezer não emite mais
 * tokens novos para escrita, o YouTube Music não tem API oficial, e o modo de
 * desenvolvimento do Spotify limita quantas contas podem autorizar.
 *
 * Um link do song.link abre a MESMA faixa no serviço que a pessoa usa. Ela
 * escolhe onde ouvir, e o Moodify continua sendo recomendação, não player.
 *
 * Verificado em agosto de 2026: a API responde sem chave e cobre Spotify,
 * Deezer, Apple Music, YouTube Music, Tidal, Amazon Music e outros.
 */

const BASE = "https://api.song.link/v1-alpha.1/links";
const TIMEOUT_MS = 8_000;

/**
 * Monta o link universal a partir da URL da faixa no provider de origem.
 *
 * Formato previsível (`song.link/d/<id>` para Deezer), então dá para gerar
 * sem chamada de rede — o Odesli resolve no momento do clique. Isso evita
 * uma requisição por faixa só para montar um link de compartilhamento.
 */
export function linkUniversal(faixa: Faixa): string {
  const prefixo = faixa.provider === "spotify" ? "s" : "d";
  return `https://song.link/${prefixo}/${faixa.providerId}`;
}

export type PlataformasDaFaixa = {
  pageUrl: string;
  plataformas: Record<string, string>;
};

/**
 * Consulta em quais serviços a faixa existe.
 *
 * Só vale a pena para uma faixa específica (tela de detalhe). Para uma lista
 * inteira, use `linkUniversal`, que não faz rede.
 */
export async function consultarPlataformas(
  faixa: Faixa,
): Promise<PlataformasDaFaixa | null> {
  const url =
    faixa.provider === "deezer"
      ? `https://www.deezer.com/track/${faixa.providerId}`
      : faixa.urls.web;

  const controlador = new AbortController();
  const timer = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(
      `${BASE}?url=${encodeURIComponent(url)}&userCountry=BR`,
      { signal: controlador.signal },
    );

    if (!resposta.ok) {
      return null;
    }

    const dados = (await resposta.json()) as {
      pageUrl?: string;
      linksByPlatform?: Record<string, { url: string }>;
    };

    if (!dados.pageUrl) {
      return null;
    }

    const plataformas: Record<string, string> = {};
    for (const [nome, valor] of Object.entries(dados.linksByPlatform ?? {})) {
      plataformas[nome] = valor.url;
    }

    return { pageUrl: dados.pageUrl, plataformas };
  } catch {
    // Falha aqui não é crítica: o link previsível já funciona.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Nomes de exibição das plataformas que o Odesli devolve. */
export const NOMES_PLATAFORMA: Record<string, string> = {
  spotify: "Spotify",
  deezer: "Deezer",
  appleMusic: "Apple Music",
  youtubeMusic: "YouTube Music",
  youtube: "YouTube",
  tidal: "Tidal",
  amazonMusic: "Amazon Music",
  soundcloud: "SoundCloud",
  napster: "Napster",
  pandora: "Pandora",
};

/**
 * Monta o texto de compartilhamento da seleção.
 *
 * Texto puro com links universais em vez de imagem ou arquivo: funciona em
 * WhatsApp, Instagram, e-mail e qualquer app, sem depender de formato.
 */
export function montarTextoParaCompartilhar(
  faixas: Faixa[],
  emocaoNome: string,
  limite = 10,
): string {
  const linhas = faixas
    .slice(0, limite)
    .map((faixa, i) => `${i + 1}. ${faixa.titulo} — ${faixa.artista}\n${linkUniversal(faixa)}`);

  const restantes = faixas.length - linhas.length;

  return [
    `🎵 Moodify · ${emocaoNome}`,
    "",
    ...linhas,
    restantes > 0 ? `\n+ ${restantes} ${restantes === 1 ? "música" : "músicas"}` : "",
    "",
    "Cada link abre no seu serviço de música.",
  ]
    .filter((linha) => linha !== "")
    .join("\n");
}
