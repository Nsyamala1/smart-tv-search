import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0f0f0f' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#0f0f0f' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Smart TV Search' }} />
        <Stack.Screen name="devices" options={{ title: 'Select TV' }} />
        <Stack.Screen name="results" options={{ title: 'Results' }} />
      </Stack>
    </>
  );
}
