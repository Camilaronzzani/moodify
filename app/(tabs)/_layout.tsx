import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { MiniPlayer } from '@/components/mini-player';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@react-native-vector-icons/ionicons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      // O mini-player é desenhado ACIMA da barra de abas: assim continua
      // visível e controlável ao trocar de aba enquanto o trecho toca.
      tabBar={(props) => (
        <>
          <MiniPlayer />
          <BottomTabBar {...props} />
        </>
      )}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Brand.deepBlack,
        },
        tabBarLabel: ({ focused, color, children }) => (
          <Text style={{ color, fontSize: 11, fontWeight: focused ? 'bold' : 'normal' }}>
            {children}
          </Text>
        ),
        headerShadowVisible: false,
        headerTintColor: Colors[colorScheme ?? 'light'].tint,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="recomendacao"
        options={{
          title: 'Recomendações',
          tabBarIcon: ({ color, focused }) => <Ionicons size={28} name={focused ? 'star-sharp' : 'star-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorito"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, focused }) => <Ionicons size={28} name={focused ? 'heart-sharp' : 'heart-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color, focused }) => <Ionicons size={28} name={focused ? 'time' : 'time-outline'} color={color} />,
        }}
      />
       <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => <Ionicons size={28} name={focused ? 'person-sharp' : 'person-outline'} color={color} />,
        }}
      />
    </Tabs>
  );
}
