import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AnaliseAtualProvider } from '@/contexts/analise-atual';
import { FavoritosProvider } from '@/contexts/favoritos';
import { HistoricoProvider } from '@/contexts/historico';
import { SessaoProvider } from '@/contexts/sessao';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    Roboto_400Regular,
    Roboto_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SessaoProvider>
        <FavoritosProvider>
          <HistoricoProvider>
            <AnaliseAtualProvider>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="carregando" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                <Stack.Screen name="not-found" options={{ title: 'Página não encontrada' }} />
              </Stack>
            </AnaliseAtualProvider>
          </HistoricoProvider>
        </FavoritosProvider>
      </SessaoProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
