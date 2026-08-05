import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Sessão local do app — apenas para o protótipo.
 * NÃO é autenticação real: não há servidor validando nada e a senha
 * nunca é guardada. Só o nome e o e-mail ficam salvos no dispositivo.
 */

const CHAVE = "moodify:sessao";

export type Usuario = {
  nome: string;
  email: string;
};

type Sessao = {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (usuario: Usuario) => Promise<void>;
  sair: () => Promise<void>;
};

const SessaoContext = createContext<Sessao | null>(null);

export function SessaoProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Ao abrir o app, tenta recuperar a sessão salva no dispositivo.
  useEffect(() => {
    async function recuperar() {
      try {
        const salvo = await AsyncStorage.getItem(CHAVE);

        if (salvo) {
          const bruto: unknown = JSON.parse(salvo);

          // Valida a forma antes de aceitar: um dado meio gravado aqui
          // deixaria o app "logado" com nome undefined.
          if (
            typeof bruto === "object" &&
            bruto !== null &&
            typeof (bruto as Usuario).nome === "string" &&
            typeof (bruto as Usuario).email === "string"
          ) {
            setUsuario(bruto as Usuario);
          }
        }
      } catch {
        // Se o dado estiver corrompido, começa sem sessão.
      } finally {
        setCarregando(false);
      }
    }
    recuperar();
  }, []);

  const entrar = useCallback(async (novo: Usuario) => {
    setUsuario(novo);
    await AsyncStorage.setItem(CHAVE, JSON.stringify(novo));
  }, []);

  const sair = useCallback(async () => {
    setUsuario(null);
    await AsyncStorage.removeItem(CHAVE);
  }, []);

  const valor = useMemo(
    () => ({ usuario, carregando, entrar, sair }),
    [usuario, carregando, entrar, sair],
  );

  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>;
}

/** Atalho para ler a sessão em qualquer tela. */
export function useSessao() {
  const contexto = useContext(SessaoContext);
  if (!contexto) {
    throw new Error("useSessao precisa estar dentro de <SessaoProvider>");
  }
  return contexto;
}
