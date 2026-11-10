"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";

export interface FirmSettings {
  firmName: string;
  contactEmail: string;
  managerMayShare: boolean;
  minimumNarrationChars: number;
}

export const DEFAULT_FIRM_SETTINGS: FirmSettings = {
  firmName: "RKP Associates",
  contactEmail: "",
  managerMayShare: true,
  minimumNarrationChars: 5,
};

interface FirmContextValue {
  settings: FirmSettings;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  save: (changes: FirmSettings) => Promise<void>;
}

const FirmContext = createContext<FirmContextValue | null>(null);

export function FirmSettingsProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [settings, setSettings] = useState<FirmSettings>(DEFAULT_FIRM_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!user || !role) {
      setSettings(DEFAULT_FIRM_SETTINGS);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/settings", {
        headers: { Authorization: "Bearer " + token },
        cache: "no-store",
      });
      const result = (await response.json()) as { settings?: FirmSettings; error?: string };
      if (!response.ok || !result.settings) throw new Error(result.error || "Unable to load firm settings.");
      setSettings(result.settings);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to retrieve firm settings.");
      setSettings(DEFAULT_FIRM_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(async (next: FirmSettings) => {
    if (!user || role !== "super_admin") throw new Error("Only Super Admin can update firm settings.");
    const token = await user.getIdToken();
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(next),
      cache: "no-store",
    });
    const result = (await response.json()) as { settings?: FirmSettings; error?: string };
    if (!response.ok || !result.settings) throw new Error(result.error || "Unable to save firm settings.");
    setSettings(result.settings);
    setError("");
  }, [user, role]);

  const value = useMemo<FirmContextValue>(
    () => ({ settings, loading, error, reload, save }),
    [settings, loading, error, reload, save],
  );

  return <FirmContext.Provider value={value}>{children}</FirmContext.Provider>;
}

export function useFirmSettings(): FirmContextValue {
  const value = useContext(FirmContext);
  if (!value) throw new Error("FirmSettingsProvider is missing");
  return value;
}
