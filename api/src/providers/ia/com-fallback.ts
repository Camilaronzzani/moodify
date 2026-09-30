import type { Intencao } from "../../dominio/taxonomia.ts";
import type { AIProvider, PerfilEmocional } from "./contrato.ts";

/**
 * Encadeia providers de IA: tenta na ordem e usa o primeiro que entregar um
 * perfil confiável. O último da fila deve ser o LexicoProvider, que nunca falha.
 *
 * O usuário nunca vê erro porque o modelo caiu, demorou ou devolveu lixo.
 */

const CONFIANCA_MINIMA = 0.35;

export type FalhaProvider = {
  provider: string;
  motivo: string;
};

export class AIComFallback implements AIProvider {
  readonly nome = "cadeia";

  /** Preenchido a cada análise — útil para telemetria e depuração. */
  ultimasFalhas: FalhaProvider[] = [];
  /** Qual provider realmente resolveu a última análise. */
  ultimoProviderUsado = "";

  constructor(private readonly providers: AIProvider[]) {
    if (providers.length === 0) {
      throw new Error("AIComFallback precisa de pelo menos um provider");
    }
  }

  /**
   * Tenta gerar o acolhimento com o primeiro provider que saiba fazer isso.
   * Devolve `null` se nenhum conseguir — a rota então usa o texto curado.
   *
   * Nome diferente do método da interface de propósito: `gerarAcolhimento`
   * promete uma string, e este pode não ter nenhuma para dar.
   */
  async tentarGerarAcolhimento(texto: string, perfil: PerfilEmocional): Promise<string | null> {
    for (const provider of this.providers) {
      if (!provider.gerarAcolhimento) {
        continue;
      }

      try {
        return await provider.gerarAcolhimento(texto, perfil);
      } catch (erro) {
        this.ultimasFalhas.push({
          provider: `${provider.nome}:acolhimento`,
          motivo: erro instanceof Error ? erro.message : String(erro),
        });
      }
    }

    return null;
  }

  async analisarHumor(texto: string, intencao: Intencao = "acolher"): Promise<PerfilEmocional> {
    this.ultimasFalhas = [];

    for (const provider of this.providers) {
      try {
        const perfil = await provider.analisarHumor(texto, intencao);

        // Confiança baixa é tratada como falha: vale tentar o próximo.
        // O léxico é o último da fila, então sua confiança baixa é aceita
        // por não haver mais ninguém depois dele.
        const ehUltimo = provider === this.providers.at(-1);

        if (perfil.confidence < CONFIANCA_MINIMA && !ehUltimo) {
          this.ultimasFalhas.push({
            provider: provider.nome,
            motivo: `confiança ${perfil.confidence.toFixed(2)} abaixo do mínimo`,
          });
          continue;
        }

        this.ultimoProviderUsado = provider.nome;
        return perfil;
      } catch (erro) {
        this.ultimasFalhas.push({
          provider: provider.nome,
          motivo: erro instanceof Error ? erro.message : String(erro),
        });
      }
    }

    // Só chega aqui se até o léxico falhar, o que não deveria acontecer.
    throw new Error(
      `Todos os providers de IA falharam: ${this.ultimasFalhas
        .map((f) => `${f.provider} (${f.motivo})`)
        .join("; ")}`,
    );
  }
}
