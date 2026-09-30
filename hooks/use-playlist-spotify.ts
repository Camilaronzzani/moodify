import { ErroApi } from "@/services/api/cliente";
import {
  buscarStatusSpotify,
  criarPlaylist,
  trocarCodigoPorToken,
} from "@/services/api/spotify";
import type { Faixa } from "@/services/api/tipos";
import {
  makeRedirectUri,
  useAuthRequest,
  type AuthSessionResult,
} from "expo-auth-session";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cria uma playlist real na conta do Spotify do usuário.
 *
 * Fluxo: Authorization Code + PKCE. O app nunca vê o `client_secret` — ele
 * obtém um código de autorização e manda para o backend, que faz a troca pelo
 * token. É o único desenho seguro para app público.
 *
 * DEGRADAÇÃO ELEGANTE: se o servidor não tiver credenciais, `disponivel` fica
 * `false` e a tela simplesmente não mostra o botão. O resto do app funciona.
 *
 * NÃO TESTADO em execução: exige credenciais do Spotify, que não temos.
 */

const DESCOBERTA = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

/** Escopos mínimos: só criar e editar playlist. Nada de ler biblioteca. */
const ESCOPOS = ["playlist-modify-private", "playlist-modify-public"];

export function usePlaylistSpotify() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [motivoIndisponivel, setMotivoIndisponivel] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [urlCriada, setUrlCriada] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // As faixas ficam guardadas aqui porque o login abre o navegador e volta:
  // quando a resposta chega, precisamos saber o que estava sendo criado.
  const pendente = useRef<{ nome: string; faixas: Faixa[] } | null>(null);

  /**
   * Precisa ser IDÊNTICO a um dos URIs cadastrados no dashboard do Spotify.
   *
   * Usamos `path: "callback"` porque o Spotify tem rejeitado custom schemes
   * sem caminho, e desde abril de 2025 não aceita mais HTTP comum — apenas
   * HTTPS ou loopback (127.0.0.1). Cadastre no dashboard:
   *   moodify://callback      (app no celular)
   *   http://127.0.0.1:8081   (testes no navegador)
   */
  const redirectUri = makeRedirectUri({ scheme: "moodify", path: "callback" });

  const [pedido, resposta, pedirAutorizacao] = useAuthRequest(
    {
      clientId: clientId ?? "",
      scopes: ESCOPOS,
      usePKCE: true,
      redirectUri,
    },
    DESCOBERTA,
  );

  // Descobre se o servidor tem credenciais configuradas.
  useEffect(() => {
    let ativo = true;

    async function verificar() {
      try {
        const status = await buscarStatusSpotify();
        if (!ativo) {
          return;
        }
        setClientId(status.clientId);
        setMotivoIndisponivel(status.disponivel ? null : status.motivo);
      } catch {
        if (ativo) {
          setMotivoIndisponivel("Não foi possível falar com o servidor.");
        }
      }
    }

    verificar();
    return () => {
      ativo = false;
    };
  }, []);

  const concluir = useCallback(
    async (retorno: AuthSessionResult) => {
      const trabalho = pendente.current;
      pendente.current = null;

      if (!trabalho) {
        return;
      }

      if (retorno.type === "cancel" || retorno.type === "dismiss") {
        setCriando(false);
        return;
      }

      if (retorno.type !== "success" || !retorno.params.code) {
        setCriando(false);
        setErro("A autorização do Spotify não foi concluída.");
        return;
      }

      try {
        const verificador = pedido?.codeVerifier;

        if (!verificador) {
          throw new Error("Verificador PKCE ausente.");
        }

        const { tokenUsuario } = await trocarCodigoPorToken(
          retorno.params.code,
          verificador,
          redirectUri,
        );

        // Só faixas do Spotify podem entrar numa playlist do Spotify. Se o
        // catálogo em uso é a Deezer, não há id compatível — daí o filtro.
        const ids = trabalho.faixas
          .filter((f) => f.provider === "spotify")
          .map((f) => f.providerId);

        if (ids.length === 0) {
          setErro(
            "As faixas desta seleção vêm de outro catálogo e não podem ir " +
              "direto para uma playlist do Spotify.",
          );
          return;
        }

        const { url } = await criarPlaylist(trabalho.nome, ids, tokenUsuario);
        setUrlCriada(url);
      } catch (causa) {
        setErro(
          causa instanceof ErroApi
            ? causa.mensagemAmigavel
            : "Não conseguimos criar a playlist.",
        );
      } finally {
        setCriando(false);
      }
    },
    [pedido, redirectUri],
  );

  useEffect(() => {
    if (resposta) {
      void concluir(resposta);
    }
  }, [resposta, concluir]);

  const criar = useCallback(
    async (nome: string, faixas: Faixa[]) => {
      if (!clientId || !pedido) {
        return;
      }

      setErro(null);
      setUrlCriada(null);
      setCriando(true);
      pendente.current = { nome, faixas };

      await pedirAutorizacao();
    },
    [clientId, pedido, pedirAutorizacao],
  );

  return {
    /** `true` só quando o servidor tem credenciais e o pedido está pronto. */
    disponivel: Boolean(clientId) && Boolean(pedido),
    motivoIndisponivel,
    criar,
    criando,
    urlCriada,
    erro,
  };
}
