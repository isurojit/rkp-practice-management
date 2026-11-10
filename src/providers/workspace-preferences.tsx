"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type TextScale = "standard" | "large" | "extra";
export type WorkspaceDensity = "comfortable" | "compact";
export type Accent = "blue" | "teal" | "violet";

export interface WorkspacePreferences {
  textScale: TextScale;
  density: WorkspaceDensity;
  accent: Accent;
  reduceMotion: boolean;
}

const STORAGE_KEY = "rkp.workspace.preferences.v1";

export const defaultPreferences: WorkspacePreferences = {
  textScale: "standard",
  density: "comfortable",
  accent: "blue",
  reduceMotion: false,
};

interface ContextValue {
  preferences: WorkspacePreferences;
  updatePreferences: (update: Partial<WorkspacePreferences>) => void;
  resetPreferences: () => void;
}

const PreferencesContext = createContext<ContextValue | null>(null);

function validPreferences(source: unknown): WorkspacePreferences {
  if (!source || typeof source !== "object") return defaultPreferences;
  const value = source as Partial<WorkspacePreferences>;
  return {
    textScale: value.textScale === "large" || value.textScale === "extra" ? value.textScale : "standard",
    density: value.density === "compact" ? "compact" : "comfortable",
    accent: value.accent === "teal" || value.accent === "violet" ? value.accent : "blue",
    reduceMotion: value.reduceMotion === true,
  };
}

export function WorkspacePreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<WorkspacePreferences>(defaultPreferences);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      if (value) setPreferences(validPreferences(JSON.parse(value)));
    } catch {
      // Storage can be disabled in some browsers; settings still work for this session.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.dataset.rkpText = preferences.textScale;
    root.dataset.rkpDensity = preferences.density;
    root.dataset.rkpAccent = preferences.accent;
    root.dataset.rkpMotion = preferences.reduceMotion ? "reduced" : "normal";

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Do not block the workspace when local storage is unavailable.
    }
  }, [preferences, hydrated]);

  const value = useMemo<ContextValue>(
    () => ({
      preferences,
      updatePreferences: (update) =>
        setPreferences((previous) => validPreferences({ ...previous, ...update })),
      resetPreferences: () => setPreferences(defaultPreferences),
    }),
    [preferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useWorkspacePreferences(): ContextValue {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("WorkspacePreferencesProvider is missing");
  return value;
}
