import { Brand, BrandFonts } from "@/constants/theme";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

type Props = {
  valor: string;
  onChange: (texto: string) => void;
  placeholder?: string;
};

export function CampoBusca({ valor, onChange, placeholder = "Buscar..." }: Props) {
  return (
    <View style={styles.caixa}>
      <Ionicons name="search-outline" size={19} color={Brand.violetLight} />
      <TextInput
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(204, 204, 204, 0.45)"
        style={styles.campo}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {valor.length > 0 && (
        <Pressable onPress={() => onChange("")} hitSlop={10} accessibilityLabel="Limpar busca">
          <Ionicons name="close-circle" size={19} color={Brand.gray} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(147, 112, 219, 0.28)",
    backgroundColor: "rgba(106, 13, 173, 0.12)",
  },
  campo: {
    flex: 1,
    paddingVertical: 13,
    fontFamily: BrandFonts.bodyRegular,
    fontSize: 15,
    color: Brand.white,
  },
});
