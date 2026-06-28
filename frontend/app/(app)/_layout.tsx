import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { LocationProvider } from '../../context/LocationContext';

export default function AppLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a loading screen
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <LocationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(drawer)" />
      </Stack>
    </LocationProvider>
  );
}