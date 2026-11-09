"use client";

import { Settings2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="rkp-page min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="rounded-3xl border border-sky-100 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
            <Settings2 className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
            <p className="mt-1 text-slate-500">
              RKP Practice Management System
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-800">
            Application Settings
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Settings and administrative preferences will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}
