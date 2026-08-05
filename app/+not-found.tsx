import { Button } from "@/components/ui/button";
import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import VisualizadorImagem from "@/components/visualizador-imagens";

const PlaceholderImage = require("@/assets/images/404.png");

export default function NotFoundScreen(){
    const router = useRouter();

    return(
        <>
        <Stack.Screen options={{ title: "Oops! Pagina não encontrada" }} />
            <View style={style.container}>
                <View style={style.imagemContainer}>
                    <VisualizadorImagem imgSource={PlaceholderImage} />
                </View>
                <View style={style.footerContainer}>
                    <Text style={style.text}>
                    Ops! Parece que essa melodia se perdeu no espaço.
                    </Text>
                    <Button label="Voltar para a tela inicial" onPress={() => router.replace('/home')} />
                </View>
            </View>
        </>
)}
const style = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center'
    },
    button: {
        fontSize: 20,
        textDecorationLine: 'underline',
        color: '#CCCCCC'
    },
    text: {
        fontSize: 20,
        color: '#FFFFFF',
        margin: 30
        
    },
    imagemContainer: {
        flex: 1,
    },
    imagem:{
        width:410,
        height:440,
        borderRadius: 10,
    },
    footerContainer:{
        flex:2/3,
        alignItems: 'center',
    }
})