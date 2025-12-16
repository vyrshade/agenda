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

  // 1. Monitorar estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  // 2. Lógica de Redirecionamento (Auth Guard)
  useEffect(() => {
    if (initializing) return;

    // Verifica se estamos em uma rota de autenticação (login ou register)
    // segments[0] pega o primeiro pedaço da URL. Ex: 'login', 'register' ou '(tabs)'
    const inAuthGroup = segments[0] === "login" || segments[0] === "register";

    if (!user && !inAuthGroup) {
      // Se NÃO tem usuário e NÃO está na tela de login/registro -> Manda pro Login
      router.replace("/login");
    } else if (user && inAuthGroup) {
      // Se TEM usuário e está na tela de login/registro -> Manda pra Home
      router.replace("/(tabs)");
    }
  }, [user, initializing, segments]);

  // 3. Tela de carregamento enquanto conecta ao Firebase
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
        <Stack screenOptions={{ headerShadowVisible: false, headerBackTitleVisible: false }}>
          {/* Rotas de Autenticação */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          
          {/* Rotas Protegidas */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="user_profile" options={{ title: "Meu Perfil" }} />
          <Stack.Screen name="clients_register" options={{ title: "Novo Cliente" }} />
          <Stack.Screen name="scheduling" options={{ title: "Novo Agendamento" }} />
          <Stack.Screen name="client_history" options={{ title: "Histórico" }} />
          
          {/* Outras rotas */}
          <Stack.Screen name="register_professional" options={{ title: "Registrar Profissional" }} />
        </Stack>
      </SchedulesProvider>
    </ClientsProvider>
  );
}