import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Timeline das análises que o usuário salvou, guardada no aparelho.
 *
 * O tipo é propositalmente simples e desacoplado do backend: guardamos os
 * rótulos já traduzidos, então mudar a taxonomia no servidor não corrompe o
 * histórico de quem já usou o app.
 */

/**
 * Versionada pelo mesmo motivo dos favoritos: a v1 guardava
 * `emocaoPrincipal`/`generos`, a v2 guarda os rótulos já traduzidos. Ler o
 * formato antigo não quebraria o render, mas mostraria campos vazios.
 */
const CHAVE = "moodify:historico:v2";
const LIMITE = 100;

/** Aceita apenas o que tem a forma de AnaliseSalva. */
function ehAnaliseValida(valor: unknown): valor is AnaliseSalva {
  if (typeof valor !== "object" || valor === null) {
    return false;
  }
  const candidata = valor as Partial<AnaliseSalva>;
  return (
    typeof candidata.id === "string" &&
    typeof candidata.emocaoNome === "string" &&
    typeof candidata.criadaEm === "string" &&
    Array.isArray(candidata.tags)
  );
}

export type AnaliseSalva = {
  id: string;
  /** Slug da emoção, para agrupar e gerar estatísticas. */
  emocao: string;
  emocaoNome: string;
  emocaoEmoji: string;
  energiaNome: string;
  contextoNome: string;
  tags: string[];
  mensagem: string;
  /** Data em ISO. */
  criadaEm: string;
};

type Historico = {
  analises: AnaliseSalva[];
  carregando: boolean;
  salvar: (analise: AnaliseSalva) => Promise<void>;
  limpar: () => Promise<void>;
};

const HistoricoContext = createContext<Historico | null>(null);

export function HistoricoProvider({ children }: { children: React.ReactNode }) {
  const [analises, setAnalises] = useState<AnaliseSalva[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function recuperar() {
      try {
        const salvo = await AsyncStorage.getItem(CHAVE);

        if (salvo) {
          const bruto: unknown = JSON.parse(salvo);

          if (Array.isArray(bruto)) {
            setAnalises(bruto.filter(ehAnaliseValida));
          }
        }
      } catch {
        // Dado corrompido: começa vazio em vez de derrubar o app.
      } finally {
        setCarregando(false);
      }
    }
    recuperar();
  }, []);

  const salvar = useCallback(
    async (analise: AnaliseSalva) => {
      // Evita duplicar quando o usuário toca em "Salvar" duas vezes.
      const semRepetida = analises.filter((a) => a.id !== analise.id);
      const atualizado = [analise, ...semRepetida].slice(0, LIMITE);

      setAnalises(atualizado);
      await AsyncStorage.setItem(CHAVE, JSON.stringify(atualizado));
    },
    [analises],
  );

  const limpar = useCallback(async () => {
    setAnalises([]);
    await AsyncStorage.removeItem(CHAVE);
  }, []);

  const valor = useMemo(
    () => ({ analises, carregando, salvar, limpar }),
    [analises, carregando, salvar, limpar],
  );

  return <HistoricoContext.Provider value={valor}>{children}</HistoricoContext.Provider>;
}

export function useHistorico() {
  const contexto = useContext(HistoricoContext);
  if (!contexto) {
    throw new Error("useHistorico precisa estar dentro de <HistoricoProvider>");
  }
  return contexto;
}
