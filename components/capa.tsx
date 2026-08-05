import { BrandFonts } from "@/constants/theme";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text } from "react-native";

/**
 * Capa de álbum gerada por código. Como o app não usa imagens da internet,
 * cada álbum ganha um gradiente escolhido a partir do próprio id — o mesmo
 * álbum sempre recebe as mesmas cores.
 */

const PALETAS: [string, string][] = [
  ["#6A0DAD", "#9370DB"],
  ["#4B0082", "#7B4BC4"],
  ["#5B21B6", "#A78BFA"],
  ["#3B0764", "#8B5CF6"],
  ["#701A75", "#C084FC"],
  ["#2E1065", "#6D28D9"],
];

function paletaDoId(id: string) {
  // Soma os códigos das letras para virar um número estável.
  const soma = [...id].reduce((total, letra) => total + letra.charCodeAt(0), 0);
  return PALETAS[soma % PALETAS.length];
}

type Props = {
  id: string;
  nome: string;
  tamanho?: number;
  raio?: number;
  mostrarInicial?: boolean;
};

export function Capa({ id, nome, tamanho = 56, raio = 12, mostrarInicial = true }: Props) {
  const [inicio, fim] = paletaDoId(id);
  const inicial = nome.trim().charAt(0).toUpperCase();

  return (
    <LinearGradient
      colors={[inicio, fim]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.capa, { width: tamanho, height: tamanho, borderRadius: raio }]}
    >
      {mostrarInicial ? (
        <Text style={[styles.inicial, { fontSize: tamanho * 0.42 }]}>{inicial}</Text>
      ) : (
        <Ionicons name="musical-notes" size={tamanho * 0.4} color="rgba(255,255,255,0.85)" />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  capa: {
    alignItems: "center",
    justifyContent: "center",
  },
  inicial: {
    fontFamily: BrandFonts.titleBold,
    color: "rgba(255, 255, 255, 0.9)",
  },
});
