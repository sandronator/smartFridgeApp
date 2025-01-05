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
    </StateManagementProvider>
  );
}
