import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { BackendProvider } from '@/lib/backend-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <BackendProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="camera" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="plan-preview" options={{ headerShown: false }} />
          <Stack.Screen name="reset-session" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="reset-complete" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="reset-detail" options={{ headerShown: false }} />
          <Stack.Screen name="insights" options={{ headerShown: false }} />
          <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </BackendProvider>
  );
}
