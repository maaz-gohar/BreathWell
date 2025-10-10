import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { AuthProvider } from '../context/AuthContext';
import { MoodProvider } from '../context/MoodContext';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // ✅ Use MD3 themes instead of require()
  const baseTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  // ✅ Safely extend colors
  const theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: '#2196F3',
      secondary: '#03A9F4',
    },
  };

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <MoodProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          >
            <Stack.Screen name="(screens)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
          </Stack>
        </MoodProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
