import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  getDoc 
} from "firebase/firestore";
import { auth, db } from "@/src/config/firebase";

export type Client = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  userId?: string; 
  salonId?: string; 
};

type Ctx = {
  clients: Client[];
  addClient: (c: Omit<Client, "id">) => Promise<void>;
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
};

const ClientsContext = createContext<Ctx | null>(null);

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [user, setUser] = useState(auth.currentUser);
  const [salonId, setSalonId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setSalonId(null);
        setClients([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    async function fetchUserSalonId() {
      if (!user) return;
      
      try {
        const userRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(userRef);
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSalonId(data.salonId || null);
        } else {
          setSalonId(null);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        setSalonId(null);
      }
    }

    fetchUserSalonId();
  }, [user]);

  useEffect(() => {
    if (!salonId) {
      setClients([]);
      return;
    }

    const q = query(
      collection(db, "clients"), 
      where("salonId", "==", salonId)
    );

    const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
      const clientsList: Client[] = [];
      querySnapshot.forEach((doc) => {
        clientsList.push({ id: doc.id, ...doc.data() } as Client);
      });
      
      clientsList.sort((a, b) => a.name.localeCompare(b.name));
      
      setClients(clientsList);
    });

    return () => unsubscribeSnapshot();
  }, [salonId]);

  const addClient = async (c: Omit<Client, "id">) => {
    if (!user || !salonId) {
      console.warn("Usuário ou Salão não identificados ao criar cliente.");
      return; 
    }
    
    try {
      await addDoc(collection(db, "clients"), {
        ...c,
        userId: user.uid,
        salonId: salonId, // Salva o salonId no cliente
        createdAt: new Date()
      });
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
      throw error;
    }
  };

  const updateClient = async (id: string, patch: Partial<Client>) => {
    try {
      const docRef = doc(db, "clients", id);
      await updateDoc(docRef, patch);
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      throw error;
    }
  };

  const removeClient = async (id: string) => {
    try {
      await deleteDoc(doc(db, "clients", id));
    } catch (error) {
      console.error("Erro ao remover:", error);
      throw error;
    }
  };

  return (
    <ClientsContext.Provider value={{ clients, addClient, updateClient, removeClient }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used within ClientsProvider");
  return ctx;
}