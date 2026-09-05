import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useFonts } from '@expo-google-fonts/noto-sans-kr/useFonts';
import { NotoSansKR_400Regular } from '@expo-google-fonts/noto-sans-kr/400Regular';
import { NotoSansKR_500Medium } from '@expo-google-fonts/noto-sans-kr/500Medium';
import { NotoSansKR_700Bold } from '@expo-google-fonts/noto-sans-kr/700Bold';

import { AuthProvider } from '../features/auth';
import { WishDataProvider } from '../features/wishes';
import { PushNotificationProvider } from '../features/notifications';
import { MemoryProvider } from '../features/memories';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'NotoSansKR-Regular': NotoSansKR_400Regular,
    'NotoSansKR-Medium': NotoSansKR_500Medium,
    'NotoSansKR-Bold': NotoSansKR_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <PushNotificationProvider>
        <WishDataProvider>
          <MemoryProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </MemoryProvider>
        </WishDataProvider>
      </PushNotificationProvider>
    </AuthProvider>
  );
}
