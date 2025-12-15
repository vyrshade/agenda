import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { ClientsProvider } from "../store/clients";
import { SchedulesProvider } from "../store/schedules";
import { auth } from "../src/config/firebase";
import { User } from "firebase/auth";

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  // Handle authentication-based navigation
  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === "(tabs)" || 
                        segments[0] === "user_profile" || 
                        segments[0] === "clients_register" || 
                        segments[0] === "scheduling" || 
                        segments[0] === "client_history" ||
                        segments[0] === "register_professional";
    
    const inPublicGroup = segments[0] === "login" || segments[0] === "register";

    if (!user && inAuthGroup) {
      // User is not signed in and trying to access protected routes
      router.replace("/login");
    } else if (user && inPublicGroup) {
      // User is signed in but trying to access login/register
      router.replace("/(tabs)");
    } else if (!user && segments.length === 0) {
      // Initial load with no user - go to login
      router.replace("/login");
    } else if (user && segments.length === 0) {
      // Initial load with user - go to tabs
      router.replace("/(tabs)");
    }
  }, [user, segments, initializing]);

  // Show loading screen while checking auth state
  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ClientsProvider>
      <SchedulesProvider>
        <Stack screenOptions={{ headerShadowVisible: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />

          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="user_profile" options={{ title: "Meu Perfil" }} />
          <Stack.Screen name="clients_register" options={{ title: "Novo Cliente" }} />
          <Stack.Screen name="scheduling" options={{ title: "Novo Agendamento" }} />
          <Stack.Screen name="client_history" options={{ title: "Histórico" }} />
          
          <Stack.Screen name="register_professional" options={{ title: "Registrar Profissional" }} />
        </Stack>
      </SchedulesProvider>
    </ClientsProvider>
  );
}