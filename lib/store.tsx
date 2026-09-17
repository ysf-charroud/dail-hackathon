"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ApplicationRecord,
  EvidenceItem,
  ReviewStatus,
  StoredAnalysis,
} from "./types";
import { SEED_APPLICATIONS } from "./data";

export interface AppState extends ApplicationRecord {
  /** Effective reviewer-facing status (analysis_required until analyzed). */
  status: ReviewStatus;
  lastAnalysis: StoredAnalysis | null;
  dirty: boolean;
}

const KEY = "c07-apps-v1";

interface Persisted {
  evidence: EvidenceItem[];
  lastAnalysis: StoredAnalysis | null;
  dirty: boolean;
}

function load(): Record<string, Persisted> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<
      string,
      Persisted
    >;
  } catch {
    return {};
  }
}

const Ctx = createContext<{
  apps: AppState[];
  get: (id: string) => AppState | undefined;
  updateEvidence: (id: string, evidence: EvidenceItem[]) => void;
  setAnalysis: (id: string, analysis: StoredAnalysis) => void;
  reset: (id: string) => void;
} | null>(null);

function merge(): AppState[] {
  const saved = load();
  return SEED_APPLICATIONS.map((seed) => {
    const s = saved[seed.id];
    const evidence = s?.evidence ?? seed.evidence;
    const lastAnalysis = s?.lastAnalysis ?? null;
    const dirty = s?.dirty ?? lastAnalysis === null;
    const status: ReviewStatus = dirty
      ? "analysis_required"
      : (lastAnalysis?.status ?? "analysis_required");
    return { ...seed, evidence, lastAnalysis, dirty, status };
  });
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<AppState[]>(() => merge());

  useEffect(() => {
    const persist: Record<string, Persisted> = {};
    for (const a of apps) {
      persist[a.id] = {
        evidence: a.evidence,
        lastAnalysis: a.lastAnalysis,
        dirty: a.dirty,
      };
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(persist));
    } catch {
      /* storage full/blocked — demo continues in memory */
    }
  }, [apps]);

  const updateEvidence = useCallback((id: string, evidence: EvidenceItem[]) => {
    setApps((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, evidence, dirty: true, status: "analysis_required" as const }
          : a,
      ),
    );
  }, []);

  const setAnalysis = useCallback((id: string, analysis: StoredAnalysis) => {
    setApps((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, lastAnalysis: analysis, dirty: false, status: analysis.status }
          : a,
      ),
    );
  }, []);

  const reset = useCallback((id: string) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const seed = SEED_APPLICATIONS.find((s) => s.id === id);
        if (!seed) return a;
        return {
          ...seed,
          evidence: seed.evidence,
          lastAnalysis: null,
          dirty: true,
          status: "analysis_required" as const,
        };
      }),
    );
  }, []);

  const get = useCallback(
    (id: string) => apps.find((a) => a.id === id),
    [apps],
  );

  const value = useMemo(
    () => ({ apps, get, updateEvidence, setAnalysis, reset }),
    [apps, get, updateEvidence, setAnalysis, reset],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function issueCount(app: AppState): number {
  return app.lastAnalysis?.issues.length ?? 0;
}
