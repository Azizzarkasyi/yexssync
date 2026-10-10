import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';
import { 
  useFonts, 
  Poppins_400Regular, 
  Poppins_500Medium, 
  Poppins_600SemiBold, 
  Poppins_700Bold 
} from '@expo-google-fonts/poppins';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorProvider } from '@/context/ErrorContext';
import { VersionUpdateChecker } from '@/components/VersionUpdateChecker';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { RouteGuard } from '@/components/RouteGuard';
import { GlobalModalProvider } from '@/context/GlobalModalContext';
import { GlobalModal } from '@/components/GlobalModal';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  const [loaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (loaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, fontError]);

  // Safety fallback: dismiss native splash after 2.5s even if font loading is slow
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <AnimatedSplashOverlay />
        <VersionUpdateChecker />
        <ErrorProvider>
          <GlobalModalProvider>
            <AuthProvider>
              <RouteGuard>
                <Stack screenOptions={{ headerShown: false }} />
                <PWAInstallPrompt />
                <GlobalModal />
              </RouteGuard>
            </AuthProvider>
          </GlobalModalProvider>
        </ErrorProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
