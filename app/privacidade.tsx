import { Card } from "@/components/ui/card";
import { Tela } from "@/components/ui/tela";
import { Brand, BrandFonts } from "@/constants/theme";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/**
 * Política de privacidade.
 *
 * Escrita em linguagem direta de propósito: um aviso que ninguém entende não
 * é consentimento informado. Cada afirmação aqui corresponde a algo que o
 * código realmente faz — se o comportamento mudar, este texto muda também.
 */

const SECOES = [
  {
    icone: "text-outline",
    titulo: "O que você escreve",
    corpo:
      "O texto que você digita sobre como está se sentindo é enviado ao nosso servidor " +
      "para ser interpretado. Depois de identificar a emoção, o texto é descartado: " +
      "ele NÃO é gravado em banco de dados, nem em arquivo, nem em log.",
  },
  {
    icone: "server-outline",
    titulo: "O que fica guardado",
    corpo:
      "Guardamos apenas o resultado da análise — a emoção identificada, o nível de " +
      "energia e as tags musicais —, junto com o tempo que a análise levou. Isso serve " +
      "para melhorar as recomendações e não permite reconstruir o que você escreveu.",
  },
  {
    icone: "phone-portrait-outline",
    titulo: "O que fica só no seu aparelho",
    corpo:
      "Seus favoritos, seu histórico de análises e seus dados de conta (nome e e-mail) " +
      "ficam apenas neste dispositivo. Não sobem para servidor nenhum. Se você apagar " +
      "o aplicativo, eles desaparecem.",
  },
  {
    icone: "finger-print-outline",
    titulo: "Identificação",
    corpo:
      "Usamos um código aleatório gerado no primeiro uso para não repetir as mesmas " +
      "músicas para você. Ele não contém seu nome, e-mail ou qualquer dado do aparelho, " +
      "e não permite identificar você.",
  },
  {
    icone: "lock-closed-outline",
    titulo: "Sua senha",
    corpo:
      "A senha que você cria é usada apenas para validar o formulário e nunca é " +
      "armazenada — nem no aparelho, nem no servidor. Esta versão do aplicativo não " +
      "possui autenticação real.",
  },
  {
    icone: "musical-notes-outline",
    titulo: "Serviços de música",
    corpo:
      "Para encontrar músicas reais, consultamos catálogos públicos de serviços de " +
      "streaming. Enviamos apenas termos de busca musical — nunca o seu texto nem " +
      "qualquer dado seu.",
  },
  {
    icone: "trash-outline",
    titulo: "Seus direitos",
    corpo:
      "Você pode retirar o consentimento e apagar tudo a qualquer momento, em " +
      "Configurações. Retirar o consentimento desativa a análise de texto, mas o " +
      "aplicativo continua funcionando com as sugestões rápidas de emoção.",
  },
] as const;

export default function Privacidade() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Privacidade",
          headerStyle: { backgroundColor: Brand.deepBlack },
          headerTintColor: Brand.violetLight,
          headerTitleStyle: { fontFamily: BrandFonts.titleSemibold, fontSize: 16 },
          headerShadowVisible: false,
        }}
      />

      <Tela protegerTopo={false}>
        <Text style={styles.titulo}>Como cuidamos dos seus dados</Text>
        <Text style={styles.introducao}>
          Você vai contar como está se sentindo. Isso é um dado sensível, e tratamos
          assim. Abaixo está exatamente o que acontece — sem letras miúdas.
        </Text>

        {SECOES.map((secao) => (
          <Card key={secao.titulo}>
            <View style={styles.cabecalho}>
              <View style={styles.iconeCirculo}>
                <Ionicons name={secao.icone} size={18} color={Brand.violetLight} />
              </View>
              <Text style={styles.secaoTitulo}>{secao.titulo}</Text>
            </View>
            <Text style={styles.corpo}>{secao.corpo}</Text>
          </Card>
        ))}

        <Card>
          <Text style={styles.secaoTitulo}>Projeto acadêmico</Text>
          <Text style={styles.corpo}>
            O Moodify está em desenvolvimento como projeto de estudo. Não é um produto
            comercial e não deve ser usado como apoio para questões de saúde mental. Se
            você estiver passando por um momento difícil, procure o CVV pelo telefone 188
            — gratuito, sigiloso e disponível 24 horas.
          </Text>
        </Card>
      </Tela>
    </>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontFamily: BrandFonts.titleBold,
    fontSize: 26,
    lineHeight: 34,
    color: Brand.white,
  },
  introducao: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 15,
    lineHeight: 23,
    color: Brand.gray,
    marginTop: -10,
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  iconeCirculo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(147, 112, 219, 0.3)",
    backgroundColor: "rgba(106, 13, 173, 0.12)",
  },
  secaoTitulo: {
    flex: 1,
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 16,
    color: Brand.white,
  },
  corpo: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    lineHeight: 22,
    color: Brand.gray,
  },
});
