"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigation } from "@/constants/navigation";

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-background">
      <div className="border-b p-6">
        <h2 className="text-xl font-bold">RKP Associates</h2>

        <p className="text-sm text-muted-foreground">Audit Management</p>
      </div>

      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.url}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                pathname === item.url
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Icon size={18} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
