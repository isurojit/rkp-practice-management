"use client";

import { useAuth } from "@/providers/auth-provider";

export default function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const { role, loading } = useAuth();

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="p-6">
        <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-red-700">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
