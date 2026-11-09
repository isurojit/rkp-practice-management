"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

import { navigation } from "@/constants/navigation";
import { useAuth } from "@/providers/auth-provider";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center gap-3 bg-slate-50 text-slate-600">
        <Loader2 size={21} className="animate-spin" />
        Checking your workspace access...
      </main>
    );
  }

  if (!user) return null;

  const section = [...navigation]
    .filter((item) => pathname === item.url || pathname.startsWith(item.url + "/"))
    .sort((a, b) => b.url.length - a.url.length)[0];

  if (!role || !section || !section.roles.includes(role)) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <ShieldAlert size={38} className="mx-auto text-amber-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Access restricted</h1>
          <p className="mt-3 leading-7 text-slate-600">
            This screen is unavailable to your account. If you were recently invited,
            ask your Super Admin to confirm your team profile and access role.
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
