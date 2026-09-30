import { Router } from "express";
import { z } from "zod";
import { SpotifyProvider } from "../providers/musica/spotify.ts";

/**
 * Criação de playlist na conta do usuário.
 *
 * Duas coisas ficam no servidor de propósito:
 *
 * 1. O `client_secret`. Ele NUNCA pode ir para o app — qualquer pessoa
 *    extrai strings de um APK. Por isso a troca do código de autorização
 *    pelo token acontece aqui.
 * 2. O token de acesso do usuário não é persistido. Ele chega, é usado e
 *    descartado. Guardar token de terceiro exige criptografia em repouso e
 *    política de retenção; sem necessidade real, o melhor é não guardar.
 */

const TrocaSchema = z.object({
  /** Código devolvido pelo Spotify ao app após o login. */
  codigo: z.string().min(10),
  /** Verificador do PKCE, gerado no app. */
  verificador: z.string().min(20),
  /** Deve ser idêntico ao usado no pedido de autorização. */
  redirectUri: z.string().url(),
});

const PlaylistSchema = z.object({
  nome: z.string().min(1).max(100),
  descricao: z.string().max(300).optional(),
  /** Ids de faixa no Spotify. */
  faixaIds: z.array(z.string().min(1)).min(1).max(100),
  /** Token de acesso do usuário, obtido em /v1/spotify/token. */
  tokenUsuario: z.string().min(20),
});

export function criarRotasPlaylist(): Router {
  const rotas = Router();
  const spotify = new SpotifyProvider();

  /** Informa ao app se vale a pena mostrar o botão de playlist. */
  rotas.get("/v1/spotify/status", (_req, res) => {
    res.json({
      disponivel: spotify.configurado,
      clientId: spotify.configurado ? process.env.SPOTIFY_CLIENT_ID : null,
      motivo: spotify.configurado
        ? null
        : "SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET não configurados no servidor.",
    });
  });

  /** Troca o código de autorização por um token de acesso. */
  rotas.post("/v1/spotify/token", async (req, res, next) => {
    try {
      if (!spotify.configurado) {
        res.status(503).json({ erro: "Integração com o Spotify não configurada." });
        return;
      }

      const entrada = TrocaSchema.parse(req.body);

      const corpo = new URLSearchParams({
        grant_type: "authorization_code",
        code: entrada.codigo,
        redirect_uri: entrada.redirectUri,
        client_id: process.env.SPOTIFY_CLIENT_ID ?? "",
        code_verifier: entrada.verificador,
      });

      const resposta = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // Client secret fica só aqui, no servidor.
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
          ).toString("base64")}`,
        },
        body: corpo.toString(),
        signal: AbortSignal.timeout(10_000),
      });

      if (!resposta.ok) {
        const detalhe = await resposta.text();
        res.status(400).json({
          erro: "O Spotify recusou a autorização.",
          detalhe: detalhe.slice(0, 300),
        });
        return;
      }

      const dados = (await resposta.json()) as {
        access_token: string;
        expires_in: number;
      };

      // Devolve só o necessário. O refresh_token não é repassado: sem
      // persistência, ele não teria uso e só aumentaria a superfície de risco.
      res.json({
        tokenUsuario: dados.access_token,
        expiraEmSegundos: dados.expires_in,
      });
    } catch (erro) {
      next(erro);
    }
  });

  rotas.post("/v1/playlists", async (req, res, next) => {
    try {
      if (!spotify.configurado) {
        res.status(503).json({ erro: "Integração com o Spotify não configurada." });
        return;
      }

      const entrada = PlaylistSchema.parse(req.body);

      const url = await spotify.criarPlaylist(
        entrada.nome,
        entrada.faixaIds,
        entrada.tokenUsuario,
        entrada.descricao,
      );

      res.status(201).json({ url, quantidade: entrada.faixaIds.length });
    } catch (erro) {
      // Erro do Spotify aqui costuma ser token expirado ou conta fora da
      // lista do modo de desenvolvimento — o app precisa da mensagem.
      if (erro instanceof Error && erro.message.includes("token do usuário")) {
        res.status(401).json({ erro: erro.message });
        return;
      }
      next(erro);
    }
  });

  return rotas;
}
