import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged, User } from "firebase/auth";
import { ClientsProvider } from "../store/clients";
import { SchedulesProvider } from "../store/schedules";
import { auth } from "../src/config/firebase";

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === "login" || segments[0] === "register";

    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, initializing, segments]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ClientsProvider>
      <SchedulesProvider>
        <Stack screenOptions={{ headerShadowVisible: false }}>
          {}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          
          {}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="user_profile" options={{ title: "Meu Perfil" }} />
          <Stack.Screen name="clients_register" options={{ title: "Novo Cliente" }} />
          <Stack.Screen name="scheduling" options={{ title: "Novo Agendamento" }} />
          <Stack.Screen name="client_history" options={{ title: "Histórico" }} />
          
          {}
          <Stack.Screen name="register_professional" options={{ title: "Registrar Profissional" }} />
        </Stack>
      </SchedulesProvider>
    </ClientsProvider>
  );
}