import type { Album, Artista, Faixa, MusicProvider } from "./contrato.ts";

/**
 * Catálogo via Spotify, usando **Client Credentials**.
 *
 * Por que Client Credentials e não OAuth de usuário: esse fluxo é
 * servidor↔Spotify, não passa por login e por isso NÃO cai no limite de
 * usuários cadastrados do development mode. Busca e metadados funcionam para
 * qualquer pessoa que baixe o app.
 *
 * O que este provider deliberadamente NÃO usa (removido para apps novos
 * em 27/11/2024): recommendations, audio-features, audio-analysis,
 * related-artists, playlists editoriais e previews em multi-get.
 *
 * Consequência: `previewUrl` fica quase sempre vazio aqui. Use a Deezer
 * quando o preview importar.
 */

const AUTH = "https://accounts.spotify.com/api/token";
const BASE = "https://api.spotify.com/v1";
const TIMEOUT_MS = 8_000;

type Imagem = { url: string };

type SpotifyFaixa = {
  id: string;
  name: string;
  duration_ms: number;
  preview_url: string | null;
  external_ids?: { isrc?: string };
  external_urls: { spotify: string };
  uri: string;
  artists: { name: string }[];
  album?: { name: string; images?: Imagem[]; release_date?: string };
};

type SpotifyArtista = {
  id: string;
  name: string;
  followers?: { total: number };
  images?: Imagem[];
  external_urls: { spotify: string };
  uri: string;
};

type SpotifyAlbum = {
  id: string;
  name: string;
  release_date?: string;
  images?: Imagem[];
  external_urls: { spotify: string };
  uri: string;
  artists: { name: string }[];
};

export class SpotifyCredenciaisAusentesError extends Error {
  constructor() {
    super(
      "SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET não estão definidos. " +
        "Crie um app em https://developer.spotify.com/dashboard ou use MUSIC_PROVIDER=deezer.",
    );
    this.name = "SpotifyCredenciaisAusentesError";
  }
}

export class SpotifyProvider implements MusicProvider {
  readonly nome = "spotify";

  private token: string | null = null;
  private expiraEm = 0;

  constructor(
    private readonly clientId = process.env.SPOTIFY_CLIENT_ID ?? "",
    private readonly clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? "",
  ) {}

  get configurado(): boolean {
    return this.clientId.length > 0 && this.clientSecret.length > 0;
  }

  /** Reaproveita o token até 30s antes de expirar. */
  private async obterToken(): Promise<string> {
    if (!this.configurado) {
      throw new SpotifyCredenciaisAusentesError();
    }

    if (this.token && Date.now() < this.expiraEm - 30_000) {
      return this.token;
    }

    const credencial = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

    const resposta = await fetch(AUTH, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credencial}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!resposta.ok) {
      throw new Error(`Spotify recusou as credenciais (${resposta.status})`);
    }

    const corpo = (await resposta.json()) as { access_token: string; expires_in: number };

    this.token = corpo.access_token;
    this.expiraEm = Date.now() + corpo.expires_in * 1000;

    return this.token;
  }

  private async pedir<T>(caminho: string): Promise<T> {
    const token = await this.obterToken();

    const resposta = await fetch(`${BASE}${caminho}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (resposta.status === 401) {
      // Token pode ter sido revogado antes do prazo: descarta e tenta 1x.
      this.token = null;
      const novoToken = await this.obterToken();
      const segunda = await fetch(`${BASE}${caminho}`, {
        headers: { Authorization: `Bearer ${novoToken}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!segunda.ok) {
        throw new Error(`Spotify respondeu ${segunda.status} em ${caminho}`);
      }
      return (await segunda.json()) as T;
    }

    if (resposta.status === 429) {
      const espera = resposta.headers.get("Retry-After") ?? "?";
      throw new Error(`Spotify limitou a taxa. Retry-After: ${espera}s`);
    }

    if (!resposta.ok) {
      throw new Error(`Spotify respondeu ${resposta.status} em ${caminho}`);
    }

    return (await resposta.json()) as T;
  }

  async buscarFaixa(titulo: string, artista?: string, market = "BR"): Promise<Faixa[]> {
    const termo = artista ? `track:${titulo} artist:${artista}` : `track:${titulo}`;

    const corpo = await this.pedir<{ tracks?: { items: SpotifyFaixa[] } }>(
      `/search?q=${encodeURIComponent(termo)}&type=track&limit=8&market=${market}`,
    );

    return (corpo.tracks?.items ?? []).map((bruta) => this.converterFaixa(bruta));
  }

  async buscarArtista(nome: string, market = "BR"): Promise<Artista[]> {
    const corpo = await this.pedir<{ artists?: { items: SpotifyArtista[] } }>(
      `/search?q=${encodeURIComponent(nome)}&type=artist&limit=8&market=${market}`,
    );

    return (corpo.artists?.items ?? []).map((bruto) => ({
      providerId: bruto.id,
      provider: this.nome,
      nome: bruto.name,
      seguidores: bruto.followers?.total,
      capaUrl: bruto.images?.[0]?.url,
      urls: { web: bruto.external_urls.spotify, app: bruto.uri },
    }));
  }

  async buscarAlbum(termo: string, market = "BR"): Promise<Album[]> {
    const corpo = await this.pedir<{ albums?: { items: SpotifyAlbum[] } }>(
      `/search?q=${encodeURIComponent(termo)}&type=album&limit=8&market=${market}`,
    );

    return (corpo.albums?.items ?? []).map((bruto) => ({
      providerId: bruto.id,
      provider: this.nome,
      nome: bruto.name,
      artista: bruto.artists[0]?.name ?? "Desconhecido",
      ano: bruto.release_date ? Number(bruto.release_date.slice(0, 4)) : undefined,
      capaUrl: bruto.images?.[0]?.url,
      urls: { web: bruto.external_urls.spotify, app: bruto.uri },
    }));
  }

  async obterFaixa(providerId: string): Promise<Faixa | null> {
    try {
      const bruta = await this.pedir<SpotifyFaixa>(`/tracks/${providerId}`);
      return this.converterFaixa(bruta);
    } catch {
      return null;
    }
  }

  /** O Spotify não tem lookup direto por ISRC — usa a sintaxe de busca. */
  async obterFaixaPorISRC(isrc: string, market = "BR"): Promise<Faixa | null> {
    try {
      const corpo = await this.pedir<{ tracks?: { items: SpotifyFaixa[] } }>(
        `/search?q=isrc:${encodeURIComponent(isrc)}&type=track&limit=1&market=${market}`,
      );
      const primeira = corpo.tracks?.items[0];
      return primeira ? this.converterFaixa(primeira) : null;
    } catch {
      return null;
    }
  }

  /**
   * ATENÇÃO — mudança de fevereiro de 2026.
   *
   * `GET /artists/{id}/top-tracks` foi REMOVIDO, junto com `GET /artists`,
   * `GET /albums` e `GET /browse/new-releases`. As remoções valem para todos
   * os client IDs desde 9 de março de 2026.
   *
   * Sem endpoint de top faixas, a única saída é a busca: pedimos faixas do
   * artista e ordenamos pelo que o Spotify devolver. É menos preciso que
   * "top tracks" — o resultado é relevância textual, não popularidade real.
   *
   * A Deezer ainda tem `/artist/{id}/top`, e por isso segue como provider
   * padrão do motor.
   */
  async topFaixasDoArtista(nome: string, limite = 5, market = "BR"): Promise<Faixa[]> {
    const corpo = await this.pedir<{ tracks?: { items: SpotifyFaixa[] } }>(
      `/search?q=${encodeURIComponent(`artist:${nome}`)}&type=track&limit=${limite}&market=${market}`,
    );

    return (corpo.tracks?.items ?? [])
      // A busca por `artist:` é aproximada e traz colaborações e covers;
      // filtramos para o artista pedido não virar outro.
      .filter((bruta) =>
        bruta.artists.some((a) => a.name.toLowerCase() === nome.toLowerCase()),
      )
      .slice(0, limite)
      .map((bruta) => this.converterFaixa(bruta));
  }

  /**
   * Cria uma playlist na conta do usuário e adiciona as faixas.
   *
   * Exige token de USUÁRIO (Authorization Code + PKCE) com os escopos
   * `playlist-modify-private` / `playlist-modify-public` — Client Credentials
   * não serve aqui, porque não há usuário associado.
   *
   * Endpoints atualizados em fevereiro de 2026:
   * - criar: `POST /me/playlists` (antes era `/users/{user_id}/playlists`)
   * - adicionar: `POST /playlists/{id}/items` (antes era `/tracks`)
   *
   * NÃO TESTADO: sem credenciais, este caminho nunca foi executado.
   */
  async criarPlaylist(
    nome: string,
    providerIds: string[],
    tokenUsuario: string,
    descricao = "Criada pelo Moodify",
  ): Promise<string> {
    const criada = await this.pedirComoUsuario<{ id: string; external_urls: { spotify: string } }>(
      "/me/playlists",
      tokenUsuario,
      { method: "POST", body: { name: nome, description: descricao, public: false } },
    );

    if (providerIds.length > 0) {
      // O limite é 100 itens por requisição.
      const uris = providerIds.slice(0, 100).map((id) => `spotify:track:${id}`);

      await this.pedirComoUsuario(`/playlists/${criada.id}/items`, tokenUsuario, {
        method: "POST",
        body: { uris },
      });
    }

    return criada.external_urls.spotify;
  }

  /** Chamada em nome do usuário, com o token dele em vez do do app. */
  private async pedirComoUsuario<T>(
    caminho: string,
    tokenUsuario: string,
    opcoes: { method: "GET" | "POST"; body?: unknown },
  ): Promise<T> {
    const resposta = await fetch(`${BASE}${caminho}`, {
      method: opcoes.method,
      headers: {
        Authorization: `Bearer ${tokenUsuario}`,
        "Content-Type": "application/json",
      },
      body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (resposta.status === 401 || resposta.status === 403) {
      throw new Error(
        "O Spotify recusou o token do usuário. Ele pode ter expirado, ou a conta " +
          "não está na lista de usuários do app (limite do modo de desenvolvimento).",
      );
    }

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      throw new Error(`Spotify respondeu ${resposta.status} em ${caminho}: ${detalhe}`);
    }

    const texto = await resposta.text();
    return (texto.length > 0 ? JSON.parse(texto) : null) as T;
  }

  private converterFaixa(bruta: SpotifyFaixa): Faixa {
    return {
      providerId: bruta.id,
      provider: this.nome,
      titulo: bruta.name,
      artista: bruta.artists[0]?.name ?? "Desconhecido",
      album: bruta.album?.name,
      duracaoSegundos: Math.round(bruta.duration_ms / 1000),
      isrc: bruta.external_ids?.isrc,
      // Quase sempre null para apps novos — ver comentário do topo.
      previewUrl: bruta.preview_url ?? undefined,
      capaUrl: bruta.album?.images?.[0]?.url,
      urls: { web: bruta.external_urls.spotify, app: bruta.uri },
    };
  }
}
