import { Button } from "@/components/ui/button";
import { CampoTexto } from "@/components/ui/campo-texto";
import { Brand, BrandFonts } from "@/constants/theme";
import { useSessao } from "@/contexts/sessao";
import { LinearGradient } from "expo-linear-gradient";
import { Link, Stack, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Login() {
  const router = useRouter();
  const { entrar } = useSessao();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});
  const [entrando, setEntrando] = useState(false);

  async function aoEnviar() {
    const novosErros: typeof erros = {};

    if (!email.includes("@") || !email.includes(".")) {
      novosErros.email = "Digite um e-mail válido.";
    }
    if (senha.length < 6) {
      novosErros.senha = "A senha precisa ter ao menos 6 caracteres.";
    }

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      return;
    }

    setEntrando(true);
    // Sem servidor: usamos a parte antes do @ como nome.
    const nome = email.split("@")[0];
    await entrar({ nome, email: email.trim() });
    router.replace("/carregando");
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerStyle: { backgroundColor: Brand.deepBlack },
          headerTintColor: Brand.violetLight,
          headerShadowVisible: false,
        }}
      />

      <LinearGradient colors={[Brand.deepBlack, "#1A0B2E", Brand.deepBlack]} style={styles.fundo}>
        <KeyboardAvoidingView
          style={styles.fundo}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
            <Text style={styles.titulo}>Bem-vindo de volta</Text>
            <Text style={styles.subtitulo}>Entre para continuar de onde você parou.</Text>

            <View style={styles.formulario}>
              <CampoTexto
                rotulo="E-mail"
                placeholder="voce@email.com"
                value={email}
                onChangeText={setEmail}
                erro={erros.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <CampoTexto
                rotulo="Senha"
                placeholder="Sua senha"
                value={senha}
                onChangeText={setSenha}
                erro={erros.senha}
                secureTextEntry
              />
            </View>

            <Button label="Entrar" onPress={aoEnviar} loading={entrando} />

            <View style={styles.rodape}>
              <Text style={styles.rodapeTexto}>Ainda não tem conta?</Text>
              <Link href="/criar-conta" style={styles.rodapeLink}>
                Criar conta
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
  },
  conteudo: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    gap: 20,
  },
  titulo: {
    fontFamily: BrandFonts.titleBold,
    fontSize: 30,
    color: Brand.white,
  },
  subtitulo: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 15,
    lineHeight: 23,
    color: Brand.gray,
    marginTop: -12,
  },
  formulario: {
    gap: 18,
    marginTop: 8,
  },
  rodape: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  rodapeTexto: {
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 14,
    color: Brand.gray,
  },
  rodapeLink: {
    fontFamily: BrandFonts.titleSemibold,
    fontSize: 14,
    color: Brand.violetLight,
  },
});
