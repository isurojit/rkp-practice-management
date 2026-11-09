import { BellRing, Building2, LockKeyhole, Palette, Settings2 } from "lucide-react";

const settingsAreas = [
  { title: "Firm profile", description: "Organization information, office details and branding.", icon: Building2 },
  { title: "Appearance", description: "Workspace preferences, themes and display settings.", icon: Palette },
  { title: "Notifications", description: "Email alerts and workflow reminders.", icon: BellRing },
  { title: "Access & permissions", description: "Team roles and permission management.", icon: LockKeyhole },
];

export default function SettingsPage() {
  return (
    <div className="rkp-page space-y-7">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          <Settings2 size={14} />
          Workspace preferences
        </div>
        <h1>Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
          Keep your practice preferences organized in one place.
        </p>
      </div>

      <div className="rounded-[24px] border border-[#e5eaf3] bg-white p-6 shadow-[0_3px_18px_rgba(18,35,63,.035)] sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Settings2 size={23} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#102340]">Your workspace, your way</h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-7 text-slate-500">
              This area is being prepared for the technical configuration phase.
              The categories below are a preview and do not change live application settings yet.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {settingsAreas.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                  <Icon size={19} />
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                  Planned
                </span>
              </div>
              <h3 className="mt-4 text-[15px] font-bold text-slate-800">{title}</h3>
              <p className="mt-1 text-[13px] leading-6 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
