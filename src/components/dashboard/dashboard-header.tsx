"use client";

import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { ArrowUpRight, ChevronRight, LogOut, Menu } from "lucide-react";

import { auth } from "@/lib/firebase";
import { navigation } from "@/constants/navigation";
import { useAuth } from "@/providers/auth-provider";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

function getPageName(pathname: string): string {
  const match = [...navigation]
    .filter((item) => pathname === item.url || pathname.startsWith(item.url + "/"))
    .sort((a, b) => b.url.length - a.url.length)[0];

  if (match) {
    return match.title;
  }

  return "Workspace";
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { user, role } = useAuth();
  const pageName = getPageName(pathname);
  const displayName = user?.displayName?.trim() || user?.email?.split("@")[0] || "Team member";
  const initial = displayName.charAt(0).toUpperCase();
  const roleLabel = (role || "Member").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <header className="rkp-topbar sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xl sm:px-6 xl:px-9 print:hidden">
      <div className="mx-auto flex h-[76px] max-w-[1520px] items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="rkp-icon-button flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <div className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:flex">
              <span>Firm workspace</span>
              <ChevronRight size={12} />
              <span className="text-blue-600">Overview</span>
            </div>
            <h2 className="truncate text-[17px] font-bold tracking-[-0.025em] text-slate-900 sm:mt-1 sm:text-xl">
              {pageName}
            </h2>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 xl:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Practice management
            <ArrowUpRight size={13} className="text-slate-400" />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-2 py-1.5 sm:gap-3 sm:pl-2 sm:pr-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-blue-600 to-indigo-700 text-sm font-bold text-white shadow-sm"
            >
              {initial}
            </span>
            <div className="hidden max-w-44 min-w-0 sm:block">
              <p className="truncate text-xs font-bold text-slate-800">{displayName}</p>
              <p className="truncate text-[11px] font-medium text-slate-500">{roleLabel}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            title="Sign out"
            aria-label="Sign out"
            className="rkp-icon-button flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
