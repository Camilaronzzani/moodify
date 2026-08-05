import type { Album, Artista, Faixa, MusicProvider } from "./contrato.ts";

/**
 * Catálogo via Deezer.
 *
 * Escolhida como provider padrão de desenvolvimento por três motivos:
 * 1. os endpoints públicos não exigem autenticação nenhuma;
 * 2. devolve `isrc` direto na resposta de busca;
 * 3. devolve `preview` de 30s — exatamente o que o Spotify removeu.
 *
 * Docs: https://developers.deezer.com/api
 */

const BASE = "https://api.deezer.com";
const TIMEOUT_MS = 8_000;

type DeezerFaixa = {
  id: number;
  title: string;
  isrc?: string;
  duration: number;
  preview?: string;
  link: string;
  artist?: { id: number; name: string; picture_medium?: string; link?: string };
  album?: { id: number; title: string; cover_medium?: string };
};

type DeezerArtista = {
  id: number;
  name: string;
  nb_fan?: number;
  picture_medium?: string;
  link: string;
};

type DeezerAlbum = {
  id: number;
  title: string;
  release_date?: string;
  cover_medium?: string;
  link: string;
  artist?: { name: string };
};

type Envelope<T> = { data?: T[]; error?: { message?: string } };

export class DeezerProvider implements MusicProvider {
  readonly nome = "deezer";

  private async pedir<T>(caminho: string): Promise<T> {
    const resposta = await fetch(`${BASE}${caminho}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!resposta.ok) {
      throw new Error(`Deezer respondeu ${resposta.status} em ${caminho}`);
    }

    const corpo = (await resposta.json()) as T & { error?: { message?: string } };

    // A Deezer devolve 200 com um objeto `error` no corpo — não dá para
    // confiar apenas no status HTTP.
    if (corpo.error) {
      throw new Error(`Deezer: ${corpo.error.message ?? "erro desconhecido"}`);
    }

    return corpo;
  }

  async buscarFaixa(titulo: string, artista?: string, _market?: string): Promise<Faixa[]> {
    // A sintaxe de busca avançada da Deezer é mais precisa que texto solto.
    const termo = artista
      ? `track:"${titulo}" artist:"${artista}"`
      : `track:"${titulo}"`;

    const corpo = await this.pedir<Envelope<DeezerFaixa>>(
      `/search/track?q=${encodeURIComponent(termo)}&limit=8`,
    );

    return (corpo.data ?? []).map((bruta) => this.converterFaixa(bruta));
  }

  async buscarArtista(nome: string, _market?: string): Promise<Artista[]> {
    const corpo = await this.pedir<Envelope<DeezerArtista>>(
      `/search/artist?q=${encodeURIComponent(nome)}&limit=8`,
    );

    return (corpo.data ?? []).map((bruto) => ({
      providerId: String(bruto.id),
      provider: this.nome,
      nome: bruto.name,
      seguidores: bruto.nb_fan,
      capaUrl: bruto.picture_medium,
      urls: { web: bruto.link, app: `deezer://www.deezer.com/artist/${bruto.id}` },
    }));
  }

  async buscarAlbum(termo: string, _market?: string): Promise<Album[]> {
    const corpo = await this.pedir<Envelope<DeezerAlbum>>(
      `/search/album?q=${encodeURIComponent(termo)}&limit=8`,
    );

    return (corpo.data ?? []).map((bruto) => ({
      providerId: String(bruto.id),
      provider: this.nome,
      nome: bruto.title,
      artista: bruto.artist?.name ?? "Desconhecido",
      ano: bruto.release_date ? Number(bruto.release_date.slice(0, 4)) : undefined,
      capaUrl: bruto.cover_medium,
      urls: { web: bruto.link, app: `deezer://www.deezer.com/album/${bruto.id}` },
    }));
  }

  async obterFaixa(providerId: string): Promise<Faixa | null> {
    try {
      const bruta = await this.pedir<DeezerFaixa>(`/track/${providerId}`);
      return this.converterFaixa(bruta);
    } catch {
      return null;
    }
  }

  /** A Deezer tem lookup nativo por ISRC — barato e exato. */
  async obterFaixaPorISRC(isrc: string, _market?: string): Promise<Faixa | null> {
    try {
      const bruta = await this.pedir<DeezerFaixa>(`/track/isrc:${encodeURIComponent(isrc)}`);
      return this.converterFaixa(bruta);
    } catch {
      return null;
    }
  }

  async topFaixasDoArtista(nome: string, limite = 5, _market?: string): Promise<Faixa[]> {
    // Duas chamadas: resolve o nome em id, depois pede as top faixas.
    const busca = await this.pedir<Envelope<DeezerArtista>>(
      `/search/artist?q=${encodeURIComponent(nome)}&limit=1`,
    );

    const artista = busca.data?.[0];

    if (!artista) {
      return [];
    }

    const top = await this.pedir<Envelope<DeezerFaixa>>(
      `/artist/${artista.id}/top?limit=${limite}`,
    );

    return (top.data ?? []).map((bruta) => ({
      ...this.converterFaixa(bruta),
      // O endpoint /top não repete o artista em cada item.
      artista: bruta.artist?.name ?? artista.name,
    }));
  }

  /**
   * Busca por termo livre. Fora do MusicProvider porque é descoberta,
   * não catálogo — usada para semear a base.
   */
  async buscarPorTermoLivre(termo: string, limite = 20): Promise<Faixa[]> {
    const corpo = await this.pedir<Envelope<DeezerFaixa>>(
      `/search/track?q=${encodeURIComponent(termo)}&limit=${limite}`,
    );

    return (corpo.data ?? []).map((bruta) => this.converterFaixa(bruta));
  }

  private converterFaixa(bruta: DeezerFaixa): Faixa {
    return {
      providerId: String(bruta.id),
      provider: this.nome,
      titulo: bruta.title,
      artista: bruta.artist?.name ?? "Desconhecido",
      album: bruta.album?.title,
      duracaoSegundos: bruta.duration,
      isrc: bruta.isrc,
      previewUrl: bruta.preview,
      capaUrl: bruta.album?.cover_medium,
      urls: {
        web: bruta.link,
        app: `deezer://www.deezer.com/track/${bruta.id}`,
      },
    };
  }
}
