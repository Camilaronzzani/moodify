import Constants from "expo-constants";

/**
 * Cliente HTTP do backend do Moodify.
 *
 * Resolve três problemas que sempre aparecem em app + API local:
 * 1. `localhost` não existe no celular — a URL é descoberta a partir do Metro;
 * 2. requisição sem timeout trava a tela para sempre;
 * 3. falha de rede momentânea não deveria virar erro na cara do usuário.
 */

const PORTA_API = 3333;
const TIMEOUT_MS = 20_000;
const TENTATIVAS = 3;

/**
 * Descobre onde o backend está.
 *
 * Ordem: variável de ambiente → IP do servidor Metro → localhost.
 *
 * O passo do meio é o que faz funcionar no celular físico: o Expo expõe em
 * `hostUri` o IP da máquina que roda o Metro (ex.: "192.168.0.12:8081"), e o
 * backend está na mesma máquina, em outra porta. Sem isso, o app no celular
 * tentaria falar com o próprio aparelho.
 */
function descobrirUrlBase(): string {
  const doAmbiente = process.env.EXPO_PUBLIC_API_URL;
  if (doAmbiente) {
    return doAmbiente.replace(/\/$/, "");
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const ip = hostUri?.split(":")[0];

  if (ip) {
    return `http://${ip}:${PORTA_API}`;
  }

  return `http://localhost:${PORTA_API}`;
}

export const URL_BASE = descobrirUrlBase();

/** Erro com causa identificável, para a tela saber o que dizer. */
export class ErroApi extends Error {
  constructor(
    message: string,
    readonly causa: "rede" | "timeout" | "validacao" | "servidor",
    readonly status?: number,
  ) {
    super(message);
    this.name = "ErroApi";
  }

  /** Só faz sentido tentar de novo em falha transitória. */
  get vaiAdiantarTentarDeNovo(): boolean {
    return this.causa === "rede" || this.causa === "timeout" || (this.status ?? 0) >= 500;
  }

  /** Mensagem pronta para mostrar ao usuário, sem jargão. */
  get mensagemAmigavel(): string {
    switch (this.causa) {
      case "timeout":
        return "A análise está demorando mais que o normal. Quer tentar de novo?";
      case "rede":
        return "Não conseguimos falar com o servidor. Verifique sua conexão.";
      case "validacao":
        return this.message;
      default:
        return "Algo deu errado do nosso lado. Tente novamente em instantes.";
    }
  }
}

type Opcoes = {
  metodo?: "GET" | "POST";
  corpo?: unknown;
  tentativas?: number;
  timeoutMs?: number;
};

/** Espera crescente entre tentativas: 400ms, 800ms, 1600ms... */
function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pedir<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const {
    metodo = "GET",
    corpo,
    tentativas = TENTATIVAS,
    timeoutMs = TIMEOUT_MS,
  } = opcoes;

  let ultimoErro: ErroApi | null = null;

  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    try {
      return await umaTentativa<T>(caminho, metodo, corpo, timeoutMs);
    } catch (erro) {
      ultimoErro = erro instanceof ErroApi ? erro : new ErroApi(String(erro), "rede");

      // Erro de validação não melhora tentando de novo — o pedido está errado.
      if (!ultimoErro.vaiAdiantarTentarDeNovo || tentativa === tentativas) {
        throw ultimoErro;
      }

      await esperar(400 * 2 ** (tentativa - 1));
    }
  }

  throw ultimoErro ?? new ErroApi("Falha desconhecida", "servidor");
}

async function umaTentativa<T>(
  caminho: string,
  metodo: string,
  corpo: unknown,
  timeoutMs: number,
): Promise<T> {
  // AbortController em vez de AbortSignal.timeout: no React Native o suporte
  // a AbortSignal.timeout ainda é irregular entre versões de engine.
  const controlador = new AbortController();
  const timer = setTimeout(() => controlador.abort(), timeoutMs);

  try {
    const resposta = await fetch(`${URL_BASE}${caminho}`, {
      method: metodo,
      headers: corpo ? { "Content-Type": "application/json" } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: controlador.signal,
    });

    if (resposta.status === 204) {
      return undefined as T;
    }

    const texto = await resposta.text();
    const dados = texto.length > 0 ? JSON.parse(texto) : null;

    if (!resposta.ok) {
      // O backend devolve { erro, detalhes[] } — aproveita a mensagem de campo.
      const detalhe = dados?.detalhes?.[0]?.mensagem as string | undefined;
      throw new ErroApi(
        detalhe ?? dados?.erro ?? `HTTP ${resposta.status}`,
        resposta.status >= 500 ? "servidor" : "validacao",
        resposta.status,
      );
    }

    return dados as T;
  } catch (erro) {
    if (erro instanceof ErroApi) {
      throw erro;
    }

    if (erro instanceof Error && erro.name === "AbortError") {
      throw new ErroApi("Tempo esgotado", "timeout");
    }

    throw new ErroApi(
      `Não foi possível alcançar ${URL_BASE}. O backend está rodando?`,
      "rede",
    );
  } finally {
    clearTimeout(timer);
  }
}
