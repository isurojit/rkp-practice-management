"use client";

import { useEffect, useState, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useTheme } from "next-themes";
import {
  Building2, CheckCircle2, ClipboardCheck, Eye, KeyRound, Laptop,
  Loader2, LockKeyhole, Moon, Palette, RefreshCw, Settings2,
  ShieldCheck, SlidersHorizontal, Sun, Type, UserRound, Zap,
} from "lucide-react";

import { auth } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";
import { useWorkspacePreferences } from "@/providers/workspace-preferences";
import { useFirmSettings, type FirmSettings } from "@/providers/firm-settings-provider";

const themeOptions = [
  { id: "light", title: "Light", icon: Sun, detail: "Bright workspace" },
  { id: "dark", title: "Dark", icon: Moon, detail: "Lower-glare workspace" },
  { id: "system", title: "System", icon: Laptop, detail: "Follow your device" },
] as const;

const accents = [
  { id: "blue", title: "Ocean blue", color: "#285cce" },
  { id: "teal", title: "Emerald teal", color: "#087f8c" },
  { id: "violet", title: "Royal violet", color: "#7047cb" },
] as const;

const roleTitle = (value: string | null) =>
  (value || "Member").replaceAll("_", " ").replace(/\b\w/g, (text) => text.toUpperCase());

export default function SettingsPage() {
  const { user, role } = useAuth();
  const { theme, setTheme } = useTheme();
  const { preferences, updatePreferences, resetPreferences } = useWorkspacePreferences();
  const { settings, error: serverError, loading: firmLoading, reload, save } = useFirmSettings();

  const [firmForm, setFirmForm] = useState<FirmSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [firmError, setFirmError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState("");

  useEffect(() => { setFirmForm(settings); }, [settings]);

  const handleSaveFirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (role !== "super_admin") return;
    setFirmError("");
    setSaved("");
    setSaving(true);
    try {
      await save(firmForm);
      setSaved("Firm settings saved and applied. These controls affect task delegation and narration rules.");
    } catch (error) {
      setFirmError(error instanceof Error ? error.message : "Unable to save firm settings.");
    } finally {
      setSaving(false);
    }
  };

  const resetOwnPassword = async () => {
    if (!user?.email) return;
    setPasswordNotice("");
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setPasswordNotice("A password reset email has been requested for your registered address. Check the inbox and spam folder.");
    } catch (error) {
      console.error("Password reset request failed:", error);
      setPasswordNotice("Unable to send a password reset email. Check Firebase email/password authentication and your authorized domain.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="rkp-page space-y-7 pb-16">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          <Settings2 size={14}/> Your workspace
        </p>
        <h1 className="mt-3">Settings & Preferences</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
          Personalize your working environment. Everyone can control their own appearance;
          firm-wide management options are available only to the Super Admin.
        </p>
      </div>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><Palette size={22}/></div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Appearance</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              These settings are remembered on this browser and do not change anyone else's workspace.
            </p>
          </div>
        </div>

        <h3 className="mt-7 text-sm font-bold text-slate-800">Theme</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {themeOptions.map(({ id, title, icon: Icon, detail }) => (
            <button key={id} type="button" onClick={() => setTheme(id)}
              aria-pressed={theme === id}
              className={theme === id
                ? "flex items-center gap-3 rounded-2xl border-2 border-blue-600 bg-blue-50 p-4 text-left"
                : "flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-blue-200"}>
              <Icon size={21} className="shrink-0 text-blue-600"/>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-800">{title}</span>
                <span className="mt-1 block text-xs text-slate-500">{detail}</span>
              </span>
              {theme === id && <CheckCircle2 size={16} className="ml-auto shrink-0 text-blue-700"/>}
            </button>
          ))}
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="setting-type" className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
              <Type size={17}/> Text size
            </label>
            <select id="setting-type" value={preferences.textScale}
              onChange={(event) => updatePreferences({ textScale: event.target.value as "standard" | "large" | "extra" })}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-800">
              <option value="standard">Standard</option>
              <option value="large">Large</option>
              <option value="extra">Extra large</option>
            </select>
          </div>
          <div>
            <label htmlFor="setting-density" className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
              <SlidersHorizontal size={17}/> Screen density
            </label>
            <select id="setting-density" value={preferences.density}
              onChange={(event) => updatePreferences({ density: event.target.value as "compact" | "comfortable" })}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-800">
              <option value="comfortable">Comfortable spacing</option>
              <option value="compact">Compact spacing</option>
            </select>
          </div>
        </div>

        <h3 className="mt-7 text-sm font-bold text-slate-800">Accent colour</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {accents.map(({ id, title, color }) => (
            <button key={id} type="button" aria-pressed={preferences.accent === id}
              onClick={() => updatePreferences({ accent: id })}
              className={preferences.accent === id
                ? "flex items-center gap-2 rounded-xl border-2 border-blue-500 bg-blue-50 px-4 py-3 font-semibold text-slate-800"
                : "flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800"}>
              <span className="h-5 w-5 rounded-full" style={{ background: color }}/>
              {title}
            </button>
          ))}
        </div>

        <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
          <input type="checkbox" className="mt-1 h-4 w-4" checked={preferences.reduceMotion}
            onChange={(event) => updatePreferences({ reduceMotion: event.target.checked })}/>
          <span>
            <span className="flex items-center gap-2 font-bold text-slate-800"><Zap size={17}/> Reduce interface motion</span>
            <span className="mt-1 block text-sm text-slate-500">Disable most transitions and decorative motion in the workspace.</span>
          </span>
        </label>

        <button type="button" onClick={() => { resetPreferences(); setTheme("system"); }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCw size={16}/> Restore appearance defaults
        </button>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><UserRound size={22}/></div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">My account</h2>
            <p className="mt-1 text-sm text-slate-500">{user?.email || "Signed-in team member"} · {roleTitle(role)}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" disabled={resetting || !user?.email} onClick={() => void resetOwnPassword()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            {resetting ? <Loader2 size={17} className="animate-spin"/> : <KeyRound size={17}/>}
            Send password reset to me
          </button>
          <p className="text-xs text-slate-500">A password reset email will be sent through Firebase Authentication.</p>
        </div>
        {passwordNotice && <p role="status" className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{passwordNotice}</p>}
      </section>

      {role === "super_admin" && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><ShieldCheck size={22}/></div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Firm administration</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Firm-wide settings. Only Super Admin can edit these controls.
              </p>
            </div>
          </div>

          {serverError && (
            <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
              <div className="flex items-start gap-2 font-bold"><LockKeyhole size={18} className="mt-1 shrink-0"/> Server setup required</div>
              <p className="mt-2">{serverError}</p>
              <p className="mt-2">
                Configure the Firebase service account securely in Netlify Functions, then refresh this page.
                Do not enter a private key into this form.
              </p>
            </div>
          )}

          <form onSubmit={(event) => void handleSaveFirm(event)} className="mt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="firm-name" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Building2 size={16}/> Firm name
                </label>
                <input id="firm-name" required maxLength={90} minLength={2} value={firmForm.firmName}
                  onChange={(event) => setFirmForm((previous) => ({ ...previous, firmName: event.target.value }))}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-800"/>
                <p className="mt-1 text-xs text-slate-500">Used in workspace branding.</p>
              </div>
              <div>
                <label htmlFor="firm-email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Administration contact email (optional)
                </label>
                <input id="firm-email" type="email" maxLength={254} value={firmForm.contactEmail}
                  onChange={(event) => setFirmForm((previous) => ({ ...previous, contactEmail: event.target.value }))}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-800"/>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4" checked={firmForm.managerMayShare}
                  onChange={(event) => setFirmForm((previous) => ({ ...previous, managerMayShare: event.target.checked }))}/>
                <span>
                  <span className="font-bold text-slate-800">Allow managers to share existing assignments</span>
                  <span className="mt-1 block text-sm text-slate-500">
                    When disabled, managers cannot delegate existing engagements; Super Admin retains full authority.
                  </span>
                </span>
              </label>
            </div>

            <div>
              <label htmlFor="narration-min" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ClipboardCheck size={17}/> Minimum work narration length
              </label>
              <input id="narration-min" type="number" min={5} max={80} step={1} required
                value={firmForm.minimumNarrationChars}
                onChange={(event) => setFirmForm((previous) => ({
                  ...previous,
                  minimumNarrationChars: Number(event.target.value),
                }))}
                className="h-12 w-full max-w-44 rounded-xl border border-slate-200 bg-white px-4 text-slate-800"/>
              <p className="mt-1 text-xs text-slate-500">
                The server checks this when an employee stops or completes task work. Range: 5–80 characters.
              </p>
            </div>

            {firmError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{firmError}</p>}
            {saved && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{saved}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={saving || firmLoading || Boolean(serverError)}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? <Loader2 size={17} className="animate-spin"/> : <ShieldCheck size={17}/>}
                {saving ? "Saving..." : "Save firm settings"}
              </button>
              <button type="button" disabled={firmLoading} onClick={() => void reload()}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 font-semibold text-slate-700">
                <RefreshCw size={17}/> Reload server settings
              </button>
            </div>
          </form>
        </section>
      )}

      {role !== "super_admin" && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-blue-900">
          <Eye size={21} className="mt-1 shrink-0"/>
          <p className="text-sm leading-7">
            Your team role is <strong>{roleTitle(role)}</strong>. Personal appearance settings
            are yours to change. Only Super Admin can change firm-wide access and workflow policy.
          </p>
        </div>
      )}
    </div>
  );
}
