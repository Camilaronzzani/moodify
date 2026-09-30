import { ImageSourcePropType, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

type Props = {
  imgSource: ImageSourcePropType;
};

export default function VisualizadorImagem({ imgSource }: Props) {
  return <Image source={imgSource} style={styles.image} />;
}

const styles = StyleSheet.create({
  image: {
    // Largura relativa com proporção fixa em vez de 320x440 cravado: num
    // iPhone SE (375pt) o valor fixo estourava a área disponível.
    width: "100%",
    maxWidth: 320,
    aspectRatio: 320 / 440,
    borderRadius: 18,
  },
});
