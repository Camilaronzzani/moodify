/**
 * Plataformas de streaming são catálogo e destino. Nunca cérebro.
 *
 * Note o que NÃO está aqui: nada de `recomendar()`, `descobrir()` ou
 * `openMusic()`. Recomendar é do motor do Moodify; abrir é do cliente.
 */

export type Faixa = {
  /** Id no provider de origem. */
  providerId: string;
  provider: string;
  titulo: string;
  artista: string;
  album?: string;
  duracaoSegundos?: number;
  /** Identificador canônico da gravação. É o que torna a troca real. */
  isrc?: string;
  /** Trecho de 30s, quando o provider oferece. */
  previewUrl?: string;
  capaUrl?: string;
  urls: {
    web: string;
    /** Deep link. Quem abre é o app, com Linking.openURL. */
    app?: string;
  };
};

export type Artista = {
  providerId: string;
  provider: string;
  nome: string;
  seguidores?: number;
  capaUrl?: string;
  urls: { web: string; app?: string };
};

export type Album = {
  providerId: string;
  provider: string;
  nome: string;
  artista: string;
  ano?: number;
  capaUrl?: string;
  urls: { web: string; app?: string };
};

export interface MusicProvider {
  readonly nome: string;

  buscarFaixa(titulo: string, artista?: string, market?: string): Promise<Faixa[]>;
  buscarArtista(nome: string, market?: string): Promise<Artista[]>;
  buscarAlbum(termo: string, market?: string): Promise<Album[]>;

  obterFaixa(providerId: string): Promise<Faixa | null>;

  /**
   * Reencontra a mesma gravação em outro catálogo.
   * Chave da portabilidade entre providers.
   */
  obterFaixaPorISRC(isrc: string, market?: string): Promise<Faixa | null>;

  /**
   * Faixas mais ouvidas de um artista, buscado por nome.
   *
   * É por aqui que a curadoria do Moodify chega em música real: a base diz
   * QUAIS artistas combinam com a emoção, e este método traz as faixas deles.
   * Continua disponível nos dois providers (não foi removido em 2024).
   */
  topFaixasDoArtista(nome: string, limite?: number, market?: string): Promise<Faixa[]>;
}

/**
 * Segregada de propósito: a Deezer não emite mais tokens novos para escrita,
 * então forçá-la a implementar isto criaria um método que só lança erro.
 */
export interface MusicProviderComPlaylist extends MusicProvider {
  criarPlaylist(nome: string, providerIds: string[], tokenUsuario: string): Promise<string>;
}

export function suportaPlaylist(
  provider: MusicProvider,
): provider is MusicProviderComPlaylist {
  return "criarPlaylist" in provider;
}
