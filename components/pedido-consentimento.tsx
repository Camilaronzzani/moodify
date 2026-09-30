import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brand, BrandFonts } from "@/constants/theme";
import { useConsentimento } from "@/contexts/consentimento";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/**
 * Pedido de consentimento mostrado no lugar do campo de texto livre.
 *
 * Aparece só quando é necessário — antes de enviar texto emocional para
 * análise. As sugestões rápidas continuam funcionando sem isso, porque elas
 * não enviam nada que a pessoa escreveu: a emoção já é uma escolha entre
 * opções fixas, e o app não aprende nada novo sobre ela ali.
 */
export function PedidoConsentimento() {
  const { aceitar } = useConsentimento();

  return (
    <Card destacado>
      <View style={styles.cabecalho}>
        <Ionicons name="shield-checkmark-outline" size={20} color={Brand.violetLight} />
        <Text style={styles.titulo}>Antes de você escrever</Text>
      </View>

      <Text style={styles.corpo}>
        Para interpretar o que você escrever, o texto é enviado ao nosso servidor. Depois
        de identificar a emoção, <Text style={styles.enfase}>ele é descartado</Text> — não
        guardamos o que você escreveu, só o resultado da análise.
      </Text>

      <Text style={styles.corpo}>
        Como isso fala sobre como você se sente, precisamos da sua autorização.
      </Text>

      <Link href="/privacidade" style={styles.link}>
        Ler a política de privacidade
      </Link>

      <View style={styles.acoes}>
        <Button label="Autorizar e escrever" onPress={aceitar} />
      </View>

      <Text style={styles.rodape}>
        Você pode retirar essa autorização quando quiser, em Configurações. As sugestões
        rápidas acima funcionam sem ela.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  titulo: {
    flex: 1,
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 17,
    color: Brand.white,
  },
  corpo: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 22,
    color: Brand.gray,
    marginBottom: 10,
  },
  enfase: {
    fontFamily: BrandFonts.bodyMedium,
    color: Brand.white,
  },
  link: {
    fontFamily: BrandFonts.bodyMedium,
    fontSize: 14,
    color: Brand.violetLight,
    paddingVertical: 6,
  },
  acoes: {
    marginTop: 10,
  },
  rodape: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 12,
    lineHeight: 18,
    color: Brand.gray,
    marginTop: 12,
  },
});
