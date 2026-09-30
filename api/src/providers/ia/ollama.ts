import { CONTEXTOS, EMOCOES, ENERGIAS, TAGS, TEMAS, type Intencao } from "../../dominio/taxonomia.ts";
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

  async analisarHumor(texto: string, _intencao?: Intencao): Promise<PerfilEmocional> {
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

  /**
   * Gera a frase de acolhimento a partir do que a pessoa escreveu.
   *
   * Restrições no prompt existem por segurança, não por estilo: um modelo
   * solto neste contexto pode dar conselho médico, prometer que "vai passar"
   * ou minimizar o que a pessoa sente. Todas as três são respostas ruins para
   * alguém em momento difícil.
   */
  async gerarAcolhimento(texto: string, perfil: PerfilEmocional): Promise<string> {
    const resposta = await fetch(`${this.url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(this.timeoutMs),
      body: JSON.stringify({
        model: this.modelo,
        prompt: this.montarPromptAcolhimento(texto, perfil),
        stream: false,
        // Temperatura mais alta que na classificação: aqui queremos variedade
        // de linguagem, não previsibilidade.
        options: { temperature: 0.7, num_predict: 90 },
      }),
    });

    if (!resposta.ok) {
      throw new Error(`Ollama respondeu ${resposta.status}`);
    }

    const corpo = (await resposta.json()) as { response?: string };
    const frase = (corpo.response ?? "").trim().replace(/^["']|["']$/g, "");

    // Um modelo pequeno às vezes devolve vazio, ou um parágrafo inteiro.
    // Nos dois casos é melhor usar o texto curado.
    if (frase.length < 15 || frase.length > 260) {
      throw new Error(`Acolhimento fora do tamanho aceitável (${frase.length} caracteres)`);
    }

    return frase;
  }

  private montarPromptAcolhimento(texto: string, perfil: PerfilEmocional): string {
    return `Alguém escreveu como está se sentindo. Responda com UMA a DUAS frases que reconheçam o que a pessoa contou, em português do Brasil.

REGRAS ABSOLUTAS:
- NÃO dê conselhos, NÃO sugira o que fazer, NÃO recomende músicas.
- NÃO diga que vai passar, nem "pense positivo", nem minimize o que ela sente.
- NÃO faça perguntas.
- NÃO use emoji.
- Escreva com naturalidade, como um amigo que ouviu e entendeu.
- Máximo de 2 frases curtas. Responda APENAS a frase, sem aspas.

Contexto identificado: emoção ${perfil.emotion}, assunto ${perfil.theme}.

O que a pessoa escreveu: "${texto.replace(/"/g, "'")}"`;
  }

  private montarPrompt(texto: string): string {
    return `Você é um analisador de emoções. Interprete o texto do usuário e responda APENAS com JSON.

REGRAS ABSOLUTAS:
- Você NUNCA sugere artistas, álbuns ou músicas. Isso não é seu trabalho.
- Você escolhe valores APENAS das listas abaixo. Não invente rótulos.
- Se o texto for ambíguo, escolha o mais provável e reduza "confidence".

emotion (escolha 1): ${EMOCOES.join(", ")}
theme (escolha 1, use "nenhum" se o texto não contar um acontecimento): ${TEMAS.join(", ")}
context (escolha 1): ${CONTEXTOS.join(", ")}
energy (escolha 1): ${ENERGIAS.join(", ")}
tags (escolha de 3 a 5): ${TAGS.join(", ")}

Formato exato da resposta:
{"emotion":"","theme":"","context":"","energy":"","tags":[],"keywords":[],"confidence":0.0}

- keywords: até 5 palavras do próprio texto do usuário.
- confidence: 0.0 a 1.0, quanto você confia na interpretação.

Texto do usuário: "${texto.replace(/"/g, '\\"')}"`;
  }
}
