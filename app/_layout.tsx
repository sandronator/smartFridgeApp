<<<<<<< HEAD
// app/_layout.tsx

import { Stack } from "expo-router";
import { ThemeProvider } from "@react-navigation/native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { StateManagementProvider } from "@/components/StateManagment";
import { DocumentDetailsProvider } from "@/components/DocumentDetailsContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <StateManagementProvider>
      <DocumentDetailsProvider>
        <ThemeProvider
          //value={colorScheme === "dark" ? DarkTheme : DefaultTheme}

          value={DefaultTheme}
        >
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="GroceryResultsScreen"
              options={{ headerShown: true, title: "Grocery Results" }}
            />
            {/* Include other screens if necessary */}
          </Stack>
        </ThemeProvider>
      </DocumentDetailsProvider>
=======
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { StateManagementProvider } from '@/components/StateManagment';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <StateManagementProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
>>>>>>> origin/main
    </StateManagementProvider>
  );
}
