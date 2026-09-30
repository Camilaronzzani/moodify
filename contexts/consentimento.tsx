import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Consentimento para o tratamento do texto emocional (LGPD).
 *
 * O texto que a pessoa escreve sobre como se sente é dado pessoal sensível:
 * revela informação sobre saúde mental. Enviá-lo para análise exige base legal
 * — aqui, consentimento livre, informado e específico.
 *
 * O consentimento é VERSIONADO. Se o que fazemos com o dado mudar, sobe a
 * versão e a pessoa é consultada de novo — consentimento antigo não cobre
 * finalidade nova.
 */

const CHAVE = "moodify:consentimento";

/** Suba isto sempre que a finalidade ou o destino do dado mudar. */
export const VERSAO_TERMO = 1;

type Registro = {
  versao: number;
  aceitoEm: string;
};

type Consentimento = {
  /** `true` só quando existe aceite da versão ATUAL do termo. */
  aceito: boolean;
  carregando: boolean;
  aceitoEm: string | null;
  aceitar: () => Promise<void>;
  /** Revogar é um direito do titular, não um extra. */
  revogar: () => Promise<void>;
};

const ConsentimentoContext = createContext<Consentimento | null>(null);

export function ConsentimentoProvider({ children }: { children: React.ReactNode }) {
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function recuperar() {
      try {
        const salvo = await AsyncStorage.getItem(CHAVE);

        if (salvo) {
          const bruto: unknown = JSON.parse(salvo);

          if (
            typeof bruto === "object" &&
            bruto !== null &&
            typeof (bruto as Registro).versao === "number"
          ) {
            setRegistro(bruto as Registro);
          }
        }
      } catch {
        // Sem registro válido = sem consentimento. Falha fecha, não abre.
      } finally {
        setCarregando(false);
      }
    }

    recuperar();
  }, []);

  const aceitar = useCallback(async () => {
    const novo: Registro = {
      versao: VERSAO_TERMO,
      aceitoEm: new Date().toISOString(),
    };

    setRegistro(novo);
    await AsyncStorage.setItem(CHAVE, JSON.stringify(novo));
  }, []);

  const revogar = useCallback(async () => {
    setRegistro(null);
    await AsyncStorage.removeItem(CHAVE);
  }, []);

  const valor = useMemo<Consentimento>(
    () => ({
      // Aceite de versão anterior não vale para a versão atual.
      aceito: registro?.versao === VERSAO_TERMO,
      carregando,
      aceitoEm: registro?.aceitoEm ?? null,
      aceitar,
      revogar,
    }),
    [registro, carregando, aceitar, revogar],
  );

  return (
    <ConsentimentoContext.Provider value={valor}>{children}</ConsentimentoContext.Provider>
  );
}

export function useConsentimento() {
  const contexto = useContext(ConsentimentoContext);
  if (!contexto) {
    throw new Error("useConsentimento precisa estar dentro de <ConsentimentoProvider>");
  }
  return contexto;
}
