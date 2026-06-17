"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { loginWithEmail } from "@/lib/auth/login";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleLogin = async () => {
    try {
      setLoading(true);

      await loginWithEmail(email, password);

      router.replace("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="w-full max-w-md border rounded-xl p-6 space-y-4 bg-background shadow-lg">
        <h1 className="text-2xl font-bold text-center">RKP Associates</h1>

        <p className="text-sm text-muted-foreground text-center">
          Audit & Practice Management System
        </p>

        <input
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-black text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </div>
    </div>
  );
}
