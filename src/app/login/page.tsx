"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Loader2,
  ChartNoAxesCombined,
  CalendarCheck2,
  Fingerprint,
} from "lucide-react";

import { loginWithEmail } from "@/lib/auth/login";
import { useAuth } from "@/providers/auth-provider";

const highlights = [
  { icon: BriefcaseBusiness, title: "Assignments", detail: "Stay organized" },
  { icon: CalendarCheck2, title: "Time & teams", detail: "Stay in sync" },
  { icon: ChartNoAxesCombined, title: "Insights", detail: "Stay informed" },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const reducedMotion = useReducedMotion();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [authLoading, user, router]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email address and password.");
      return;
    }

    try {
      setSubmitting(true);
      await loginWithEmail(email.trim(), password);
      router.replace("/dashboard");
    } catch {
      setError("We couldn't sign you in. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-3 bg-[#0b1935] text-white">
        <Loader2 size={20} className="animate-spin text-cyan-300" />
        <span className="text-sm">Preparing your workspace...</span>
      </div>
    );
  }

  return (
    <main className="grid min-h-dvh overflow-hidden bg-[#f7f9fc] font-sans text-slate-900 lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden min-h-dvh flex-col overflow-hidden bg-[#0b1935] px-10 py-9 text-white lg:flex xl:px-16 xl:py-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_48%_at_78%_42%,rgba(43,119,226,.24),transparent),radial-gradient(ellipse_58%_50%_at_0%_100%,rgba(13,181,179,.12),transparent)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.075] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:66px_66px]" />
        <div aria-hidden="true" className="pointer-events-none absolute right-[-26%] top-[11%] h-[640px] w-[640px] rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute right-[-17%] top-[20%] h-[490px] w-[490px] rounded-full border border-white/10" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-bold">
            R<span className="text-cyan-300">.</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">RKP Associates</h1>
            <p className="text-xs font-medium tracking-wide text-white/55">PRACTICE MANAGEMENT</p>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-[610px] pt-20">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .65 }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold tracking-wider text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              YOUR PRACTICE, SIMPLIFIED
            </div>

            <h2 className="max-w-xl text-[clamp(2.7rem,4.3vw,4.8rem)] font-bold leading-[1.08] tracking-[-.055em]">
              Focus on the work.
              <br />
              <span className="text-cyan-300">We'll help organize the rest.</span>
            </h2>

            <p className="mt-7 max-w-[490px] text-[16px] leading-8 text-slate-300">
              One considered workspace for your people, assignments,
              working hours, reports and practice operations.
            </p>
          </motion.div>

          <motion.div
            aria-hidden="true"
            className="pointer-events-none relative mx-auto mt-8 h-[150px] w-[260px] xl:mt-12 xl:h-[195px] xl:w-[330px]"
            initial={reducedMotion ? false : { opacity: 0, scale: .92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: .25, duration: .8 }}
          >
            <motion.div
              className="absolute inset-x-[14%] top-0 aspect-square rounded-full bg-gradient-to-br from-cyan-300/40 via-blue-600/35 to-violet-500/20 blur-[2px]"
              animate={reducedMotion ? undefined : { y: [0, -13, 0], rotate: [0, 7, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-x-[14%] top-0 aspect-square rounded-full border border-white/20 shadow-[inset_0_0_80px_rgba(124,211,252,.12),0_0_70px_rgba(59,130,246,.18)]" />
            <div className="absolute inset-x-[28%] top-[21%] aspect-square rounded-full border border-white/20 bg-white/5 backdrop-blur-md" />
            <motion.div
              className="absolute left-[8%] top-[16%] h-[74px] w-[140px] rotate-[-11deg] rounded-2xl border border-white/25 bg-white/10 p-3 shadow-2xl backdrop-blur-xl"
              animate={reducedMotion ? undefined : { y: [0, 8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="mb-3 h-2 w-12 rounded-full bg-cyan-200/80" />
              <div className="h-1.5 w-full rounded-full bg-white/15" />
              <div className="mt-2 h-1.5 w-4/5 rounded-full bg-white/15" />
            </motion.div>
            <motion.div
              className="absolute right-[0%] top-[41%] h-[78px] w-[146px] rotate-[9deg] rounded-2xl border border-white/25 bg-slate-900/60 p-3 shadow-2xl backdrop-blur-xl"
              animate={reducedMotion ? undefined : { y: [0, -9, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-end gap-2">
                {[18, 34, 25, 47, 36].map((height, index) => (
                  <div key={index} style={{ height }} className="w-3 rounded-t-md bg-gradient-to-t from-blue-500 to-cyan-300" />
                ))}
              </div>
            </motion.div>
          </motion.div>

          <div className="mt-7 grid grid-cols-3 gap-3">
            {highlights.map(({ icon: Icon, title, detail }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
                <Icon size={19} className="mb-3 text-cyan-300" />
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs text-white/50">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} RKP Associates · Built for focused work
        </p>
      </section>

      <section className="relative flex min-h-dvh items-center justify-center px-5 py-9 sm:px-10 xl:px-16">
        <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-blue-200/20 blur-[100px] lg:hidden" />
        <div className="relative w-full max-w-[430px]">
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0b1935] text-xl font-bold text-white">
              R<span className="text-cyan-300">.</span>
            </div>
            <div>
              <h1 className="font-bold tracking-tight">RKP Associates</h1>
              <p className="text-xs text-slate-500">Practice management</p>
            </div>
          </div>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .6 }}
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700">
              <Fingerprint size={15} />
              Team sign in
            </div>

            <h2 className="text-[clamp(2.25rem,3vw,3rem)] font-bold leading-[1.12] tracking-[-.05em] text-[#102340]">
              Welcome back.
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-slate-500">
              Sign in to continue to your RKP workspace.
            </p>

            <form onSubmit={handleLogin} className="mt-9 space-y-5">
              {error && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="rkp-email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <div className="flex h-[54px] items-center gap-3 rounded-[13px] border border-slate-200 bg-white px-4 shadow-[0_2px_4px_rgba(16,35,64,.02)] transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10">
                  <Mail size={18} className="shrink-0 text-slate-400" />
                  <input
                    id="rkp-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(event) => { setEmail(event.target.value); setError(""); }}
                    required
                    disabled={submitting}
                    className="w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="rkp-password" className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="flex h-[54px] items-center gap-3 rounded-[13px] border border-slate-200 bg-white px-4 shadow-[0_2px_4px_rgba(16,35,64,.02)] transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10">
                  <LockKeyhole size={18} className="shrink-0 text-slate-400" />
                  <input
                    id="rkp-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); setError(""); }}
                    required
                    disabled={submitting}
                    className="w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-500"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-3 flex h-[54px] w-full items-center justify-center gap-3 rounded-[13px] bg-[#275bd3] px-5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(39,91,211,.2)] transition hover:bg-[#1949b5] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                {submitting ? "Signing in..." : "Sign in to workspace"}
                {!submitting && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="mt-9 flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white/80 p-4">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-600" />
              <div>
                <p className="text-[13px] font-semibold text-slate-700">For authorized team members</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Need an account or having trouble signing in? Contact your firm administrator.
                </p>
              </div>
            </div>
          </motion.div>

          <p className="mt-10 text-center text-xs text-slate-400">
            RKP Associates · Practice Management System
          </p>
        </div>
      </section>
    </main>
  );
}
