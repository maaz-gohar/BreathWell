import { Stack } from 'expo-router';

export default function HealWellLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="sleep" />
      <Stack.Screen name="relationships" />
    </Stack>
  );
}
