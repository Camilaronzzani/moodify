import { pedir } from "./cliente";

/** Endpoints do backend que cuidam da integração com o Spotify. */

export type StatusSpotify = {
  disponivel: boolean;
  clientId: string | null;
  motivo: string | null;
};

export function buscarStatusSpotify(): Promise<StatusSpotify> {
  return pedir<StatusSpotify>("/v1/spotify/status", { tentativas: 1, timeoutMs: 6_000 });
}

export function trocarCodigoPorToken(
  codigo: string,
  verificador: string,
  redirectUri: string,
): Promise<{ tokenUsuario: string; expiraEmSegundos: number }> {
  return pedir("/v1/spotify/token", {
    metodo: "POST",
    corpo: { codigo, verificador, redirectUri },
    tentativas: 1,
  });
}

export function criarPlaylist(
  nome: string,
  faixaIds: string[],
  tokenUsuario: string,
  descricao?: string,
): Promise<{ url: string; quantidade: number }> {
  return pedir("/v1/playlists", {
    metodo: "POST",
    corpo: { nome, faixaIds, tokenUsuario, descricao },
    tentativas: 1,
    timeoutMs: 25_000,
  });
}
