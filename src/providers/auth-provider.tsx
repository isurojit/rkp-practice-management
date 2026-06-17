"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { User, onAuthStateChanged } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [role, setRole] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          }
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
