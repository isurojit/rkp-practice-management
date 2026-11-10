"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ShieldCheck, X } from "lucide-react";

import { navigation } from "@/constants/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useFirmSettings } from "@/providers/firm-settings-provider";

interface AppSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

const sections = [
  { label: "Overview", names: ["Dashboard", "Productivity", "Client Analytics"] },
  { label: "Practice", names: ["Clients", "Assignments", "Assignment Board", "Timesheets", "Narrations"] },
  { label: "People", names: ["Employees", "Attendance", "Leave"] },
  { label: "Finance", names: ["Reports", "Invoices"] },
  { label: "Workspace", names: ["Settings"] },
];

export default function AppSidebar({ mobileOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { role } = useAuth();
  const { settings } = useFirmSettings();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[3px] lg:hidden"
        />
      )}

      <aside
        aria-label="Main navigation"
        className={`rkp-sidebar fixed inset-y-0 left-0 z-50 flex w-[272px] shrink-0 flex-col overflow-hidden text-slate-100 transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
      >
        <div className="flex h-[95px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-2xl font-extrabold tracking-tighter text-white shadow-lg shadow-slate-950/10">
            R<span className="text-cyan-300">.</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-bold tracking-tight text-white">{settings.firmName}</p>
            <p className="mt-0.5 text-[11px] font-medium tracking-[0.04em] text-slate-300/80">Practice management</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <nav aria-label="Primary" className="rkp-sidebar-scroll min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {sections.map((section) => {
            const links = navigation.filter(
              (item) => section.names.includes(item.title) && item.roles.includes(role ?? ""),
            );

            if (links.length === 0) return null;

            return (
              <div key={section.label}>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400/75">
                  {section.label}
                </p>

                <div className="space-y-1">
                  {links.map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname === item.url ||
                      (item.url !== "/dashboard" && pathname.startsWith(item.url + "/"));

                    return (
                      <Link
                        key={item.url}
                        href={item.url}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${active ? "bg-white/13 text-white shadow-sm ring-1 ring-white/10" : "text-slate-300 hover:bg-white/7 hover:text-white"}`}
                      >
                        {active && <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-cyan-300" />}
                        <Icon size={18} strokeWidth={active ? 2.3 : 1.8} className={active ? "text-cyan-300" : "text-slate-400 transition-colors group-hover:text-slate-200"} />
                        <span className="flex-1">{item.title}</span>
                        {active && <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="rounded-2xl border border-white/10 bg-white/6 p-3.5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-emerald-300" />
              <p className="text-[12px] font-semibold text-white">RKP workspace</p>
              <ArrowUpRight size={14} className="ml-auto text-white/40" />
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-300/80">
              Your firm's daily operations, all in one place.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
