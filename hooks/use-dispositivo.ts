import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

/**
 * Identificador anônimo do aparelho.
 *
 * Serve para a anti-repetição de faixas e para a telemetria. NÃO identifica
 * pessoa: é um valor aleatório gerado no primeiro uso, sem relação com e-mail,
 * conta ou qualquer identificador de hardware. Apagar o app apaga o id.
 */

const CHAVE = "moodify:dispositivo";

function gerarId(): string {
  // Aleatório simples é suficiente: não é credencial, é rótulo de agrupamento.
  const aleatorio = Math.random().toString(36).slice(2, 12);
  return `dev-${aleatorio}${Date.now().toString(36)}`;
}

export function useDispositivo() {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    async function preparar() {
      try {
        const salvo = await AsyncStorage.getItem(CHAVE);

        if (salvo) {
          setId(salvo);
          return;
        }

        const novo = gerarId();
        await AsyncStorage.setItem(CHAVE, novo);
        setId(novo);
      } catch {
        // Sem storage o app continua funcionando — só perde a continuidade
        // entre sessões, o que é melhor que travar.
        setId(gerarId());
      }
    }

    preparar();
  }, []);

  return id;
}
