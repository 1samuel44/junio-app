import {
  Archivo_400Regular,
  Archivo_600SemiBold,
  Archivo_800ExtraBold,
  Archivo_900Black,
  useFonts,
} from '@expo-google-fonts/archivo';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Notice } from '@/components/Notice';
import { StoreProvider, useStore } from '@/state/store';
import { colors, fonts } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Navigator() {
  const { t } = useStore();
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.hueso },
          headerTintColor: colors.negro,
          headerTitleStyle: { fontFamily: fonts.bold },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.hueso },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="producto/[id]" options={{ presentation: 'modal', title: '' }} />
        <Stack.Screen name="carrito" options={{ title: t.cart }} />
        <Stack.Screen name="pedido/[id]" options={{ title: '' }} />
      </Stack>
      <Notice />
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ Archivo_400Regular, Archivo_600SemiBold, Archivo_800ExtraBold, Archivo_900Black });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Navigator />
    </StoreProvider>
  );
}
