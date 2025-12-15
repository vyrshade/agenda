import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { ClientsProvider } from "../store/clients";
import { SchedulesProvider } from "../store/schedules";
import { auth } from "../src/config/firebase";
import { User } from "firebase/auth";

// Define protected and public routes
const PROTECTED_ROUTES = new Set([
  "(tabs)",
  "user_profile",
  "clients_register",
  "scheduling",
  "client_history",
  "register_professional"
]);

const PUBLIC_ROUTES = new Set(["login", "register"]);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments[0];
  const isAtRoot = segments.length === 0;

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  // Determine route types
  const inProtectedRoute = PROTECTED_ROUTES.has(currentRoute);
  const inPublicRoute = PUBLIC_ROUTES.has(currentRoute);

  // Handle authentication-based navigation
  useEffect(() => {
    if (initializing) return;

    if (!user && (inProtectedRoute || isAtRoot)) {
      // User is not signed in and trying to access protected routes or at root
      router.replace("/login");
    } else if (user && (inPublicRoute || isAtRoot)) {
      // User is signed in but at login/register or root
      router.replace("/(tabs)");
    }
  }, [user, initializing, currentRoute, isAtRoot, router]);

  // Show loading screen while checking auth state
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
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