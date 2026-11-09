"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import type { AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | null>(null);
const validRoles = new Set(["super_admin", "manager", "employee"]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const currentRequest = useRef(0);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const requestId = ++currentRequest.current;
      setLoading(true);
      setRole(null);
      setUser(firebaseUser);

      if (!firebaseUser) {
        if (mounted && currentRequest.current === requestId) setLoading(false);
        return;
      }

      try {
        const profile = await getDoc(doc(db, "users", firebaseUser.uid));

        if (!mounted || requestId !== currentRequest.current) return;

        const profileData = profile.exists() ? profile.data() : null;
        const nextRole = profileData?.role;

        if (profileData?.active === false || !validRoles.has(nextRole)) {
          setRole(null);
        } else {
          setRole(nextRole);
        }
      } catch (error) {
        console.error("Unable to validate team member role:", error);
        if (mounted && currentRequest.current === requestId) setRole(null);
      } finally {
        if (mounted && currentRequest.current === requestId) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      ++currentRequest.current;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
