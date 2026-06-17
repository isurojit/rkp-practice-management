import ProtectedRoute from "@/components/dashboard/protected-route";
import AppSidebar from "@/components/dashboard/app-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <AppSidebar />

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
