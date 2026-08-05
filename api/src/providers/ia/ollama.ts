import { CONTEXTOS, EMOCOES, ENERGIAS, TAGS } from "../../dominio/taxonomia.ts";
import { validarRespostaModelo, type AIProvider, type PerfilEmocional } from "./contrato.ts";

/**
 * IA local via Ollama.
 *
 * Duas defesas contra alucinação de rótulo, e as duas são necessárias:
 * 1. o prompt injeta a taxonomia fechada e proíbe inventar;
 * 2. `validarRespostaModelo` descarta o que não pertence à taxonomia.
 */

type Opcoes = {
  url?: string;
  modelo?: string;
  timeoutMs?: number;
};

export class OllamaProvider implements AIProvider {
  readonly nome = "ollama";

  private readonly url: string;
  private readonly modelo: string;
  private readonly timeoutMs: number;

  constructor(opcoes: Opcoes = {}) {
    this.url = opcoes.url ?? process.env.OLLAMA_URL ?? "http://localhost:11434";
    this.modelo = opcoes.modelo ?? process.env.OLLAMA_MODEL ?? "llama3.2";
    this.timeoutMs = opcoes.timeoutMs ?? 12_000;
  }

  async analisarHumor(texto: string): Promise<PerfilEmocional> {
    // AbortSignal.timeout evita que um modelo travado prenda o request.
    const resposta = await fetch(`${this.url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(this.timeoutMs),
      body: JSON.stringify({
        model: this.modelo,
        prompt: this.montarPrompt(texto),
        stream: false,
        format: "json", // o Ollama garante JSON sintaticamente válido
        options: { temperature: 0.2 }, // classificação quer previsibilidade
      }),
    });

    if (!resposta.ok) {
      throw new Error(`Ollama respondeu ${resposta.status}`);
    }

    const corpo = (await resposta.json()) as { response?: string };

    if (!corpo.response) {
      throw new Error("Ollama devolveu resposta vazia");
    }

    // Pode lançar RespostaInvalidaError — o orquestrador trata caindo no léxico.
    return validarRespostaModelo(JSON.parse(corpo.response));
  }

  private montarPrompt(texto: string): string {
    return `Você é um analisador de emoções. Interprete o texto do usuário e responda APENAS com JSON.

REGRAS ABSOLUTAS:
- Você NUNCA sugere artistas, álbuns ou músicas. Isso não é seu trabalho.
- Você escolhe valores APENAS das listas abaixo. Não invente rótulos.
- Se o texto for ambíguo, escolha o mais provável e reduza "confidence".

emotion (escolha 1): ${EMOCOES.join(", ")}
context (escolha 1): ${CONTEXTOS.join(", ")}
energy (escolha 1): ${ENERGIAS.join(", ")}
tags (escolha de 3 a 5): ${TAGS.join(", ")}

Formato exato da resposta:
{"emotion":"","context":"","energy":"","tags":[],"keywords":[],"confidence":0.0}

- keywords: até 5 palavras do próprio texto do usuário.
- confidence: 0.0 a 1.0, quanto você confia na interpretação.

Texto do usuário: "${texto.replace(/"/g, '\\"')}"`;
  }
}
