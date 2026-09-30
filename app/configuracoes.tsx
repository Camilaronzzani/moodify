import { Card } from "@/components/ui/card";
import { Tela } from "@/components/ui/tela";
import { Brand, BrandFonts } from "@/constants/theme";
import { useConsentimento } from "@/contexts/consentimento";
import { useFavoritos } from "@/contexts/favoritos";
import { useHistorico } from "@/contexts/historico";
import { useSessao } from "@/contexts/sessao";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Stack, useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function Configuracoes() {
  const router = useRouter();
  const { limpar: limparFavoritos } = useFavoritos();
  const { limpar: limparHistorico, analises } = useHistorico();
  const { sair } = useSessao();
  const { aceito: consentiu, aceitoEm, revogar } = useConsentimento();

  /** Toda ação destrutiva passa por confirmação antes de apagar. */
  function confirmar(titulo: string, mensagem: string, acao: () => Promise<void>) {
    Alert.alert(titulo, mensagem, [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: () => void acao() },
    ]);
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Configurações",
          headerStyle: { backgroundColor: Brand.deepBlack },
          headerTintColor: Brand.violetLight,
          headerTitleStyle: { fontFamily: BrandFonts.titleSemibold, fontSize: 16 },
          headerShadowVisible: false,
        }}
      />

      <Tela protegerTopo={false}>
        <Card>
          <View style={styles.linha}>
            <Ionicons name="moon-outline" size={20} color={Brand.violetLight} />
            <View style={styles.textos}>
              <Text style={styles.rotulo}>Tema</Text>
              <Text style={styles.detalhe}>
                Escuro — o Moodify foi desenhado para o modo escuro. O tema claro ainda não
                está disponível.
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <Item
            icone="time-outline"
            rotulo="Limpar histórico"
            detalhe={`${analises.length} ${analises.length === 1 ? "análise salva" : "análises salvas"}`}
            onPress={() =>
              confirmar(
                "Limpar histórico",
                "Todas as análises salvas serão apagadas. Não é possível desfazer.",
                limparHistorico,
              )
            }
          />
          <View style={styles.divisor} />
          <Item
            icone="heart-outline"
            rotulo="Limpar favoritos"
            detalhe="Músicas, artistas e álbuns"
            onPress={() =>
              confirmar(
                "Limpar favoritos",
                "Todos os seus favoritos serão apagados. Não é possível desfazer.",
                limparFavoritos,
              )
            }
          />
          <View style={styles.divisor} />
          <Item
            icone="information-circle-outline"
            rotulo="Sobre o aplicativo"
            detalhe="O que é o Moodify"
            onPress={() => router.push("/sobre")}
          />
        </Card>

        <Card>
          <Item
            icone="shield-checkmark-outline"
            rotulo="Privacidade"
            detalhe="O que fazemos com seus dados"
            onPress={() => router.push("/privacidade")}
          />
          <View style={styles.divisor} />
          <Item
            icone={consentiu ? "checkmark-circle-outline" : "close-circle-outline"}
            rotulo="Análise de texto"
            detalhe={
              consentiu
                ? `Autorizada${aceitoEm ? ` em ${new Date(aceitoEm).toLocaleDateString("pt-BR")}` : ""} — toque para retirar`
                : "Não autorizada — só as sugestões rápidas funcionam"
            }
            onPress={() => {
              if (!consentiu) {
                return;
              }
              // Retirar consentimento é um direito do titular: confirma, mas
              // não dificulta.
              Alert.alert(
                "Retirar autorização",
                "A análise de texto livre será desativada. As sugestões rápidas de emoção continuam funcionando.",
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Retirar", style: "destructive", onPress: () => void revogar() },
                ],
              );
            }}
          />
        </Card>

        <Card>
          <Item
            icone="log-out-outline"
            rotulo="Sair da conta"
            detalhe="Você voltará para a tela inicial"
            onPress={() =>
              confirmar("Sair da conta", "Deseja encerrar a sessão neste aparelho?", async () => {
                await sair();
                router.replace("/");
              })
            }
          />
        </Card>
      </Tela>
    </>
  );
}

type ItemProps = {
  icone: React.ComponentProps<typeof Ionicons>["name"];
  rotulo: string;
  detalhe: string;
  onPress: () => void;
};

function Item({ icone, rotulo, detalhe, onPress }: ItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.linha, pressed && styles.pressionado]}
    >
      <Ionicons name={icone} size={20} color={Brand.violetLight} />
      <View style={styles.textos}>
        <Text style={styles.rotulo}>{rotulo}</Text>
        <Text style={styles.detalhe}>{detalhe}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Brand.gray} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 6,
  },
  pressionado: {
    opacity: 0.65,
  },
  textos: {
    flex: 1,
    gap: 3,
  },
  rotulo: {
    fontFamily: BrandFonts.bodyMedium,
    fontSize: 15,
    color: Brand.white,
  },
  detalhe: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Brand.gray,
  },
  divisor: {
    height: 1,
    backgroundColor: "rgba(147, 112, 219, 0.18)",
    marginVertical: 12,
  },
});
