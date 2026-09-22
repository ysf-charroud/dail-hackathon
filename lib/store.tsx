"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AnalysisIssue,
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

const KEY = "c07-apps-v2";
const TRAIL_KEY = "c07-trail-v1";

export interface TrailEvent {
  at: string;
  label: string;
  detail?: string;
}

function loadTrail(): Record<string, TrailEvent[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(TRAIL_KEY) ?? "{}") as Record<
      string,
      TrailEvent[]
    >;
  } catch {
    return {};
  }
}

function receivedEvent(seed: ApplicationRecord): TrailEvent {
  return {
    at: new Date(seed.submittedAt).toISOString(),
    label: "Application received",
    detail: `${seed.applicantName}, ${seed.programme}`,
  };
}

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
  remote: boolean;
  role: "reviewer" | "applicant" | null;
  trail: Record<string, TrailEvent[]>;
  get: (id: string) => AppState | undefined;
  updateEvidence: (id: string, evidence: EvidenceItem[]) => void;
  setAnalysis: (id: string, analysis: StoredAnalysis) => void;
  saveRequest: (
    id: string,
    message: string,
    source: "llm" | "deterministic",
  ) => void;
  reset: (id: string) => void;
} | null>(null);

function merge(saved: Record<string, Persisted> = {}): AppState[] {
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

interface ApiEvidence {
  kind: EvidenceItem["kind"];
  label: string;
  status: "provided" | "missing";
  document_id: string | null;
  file_name: string | null;
  submitted_at: string | null;
  organisation_name: string | null;
  signatory: string | null;
  content: string;
}

interface ApiApp {
  id: string;
  applicant_name: string;
  programme: string;
  submitted_at: string;
  contact: string;
  summary: string;
  theme: string | null;
  country: string | null;
  purpose: string | null;
  target_group: string | null;
  evidence: ApiEvidence[];
  latestAnalysis: {
    status: StoredAnalysis["status"];
    summary: string;
    issues: AnalysisIssue[];
    source: "llm" | "deterministic";
    analyzedAt: string;
  } | null;
}

function toEvidence(e: ApiEvidence): EvidenceItem {
  return {
    kind: e.kind,
    label: e.label,
    status: e.status,
    documentId: e.document_id ?? undefined,
    fileName: e.file_name ?? undefined,
    submittedAt: e.submitted_at ?? undefined,
    organisationName: e.organisation_name ?? undefined,
    signatory: e.signatory ?? undefined,
    content: e.content,
  };
}

function toApp(a: ApiApp): AppState {
  const evidence = a.evidence.map(toEvidence);
  const lastAnalysis = a.latestAnalysis
    ? {
        status: a.latestAnalysis.status,
        summary: a.latestAnalysis.summary,
        issues: a.latestAnalysis.issues ?? [],
        source: a.latestAnalysis.source,
        analyzedAt: a.latestAnalysis.analyzedAt,
      }
    : null;
  const dirty = lastAnalysis === null;
  return {
    id: a.id,
    applicantName: a.applicant_name,
    programme: a.programme,
    submittedAt: a.submitted_at,
    contact: a.contact,
    summary: a.summary,
    theme: a.theme ?? undefined,
    country: a.country ?? undefined,
    purpose: a.purpose ?? undefined,
    targetGroup: a.target_group ?? undefined,
    evidence,
    reviewerNotes: SEED_APPLICATIONS.find((s) => s.id === a.id)?.reviewerNotes,
    lastAnalysis,
    dirty,
    status: dirty
      ? ("analysis_required" as const)
      : (lastAnalysis?.status ?? "analysis_required"),
  };
}

function toApiEvidence(e: EvidenceItem) {
  return {
    kind: e.kind,
    label: e.label,
    status: e.status,
    document_id: e.documentId ?? null,
    file_name: e.fileName ?? null,
    submitted_at: e.submittedAt ?? null,
    organisation_name: e.organisationName ?? null,
    signatory: e.signatory ?? null,
    content: e.content ?? "",
  };
}

async function silently(promise: Promise<unknown>) {
  try {
    await promise;
  } catch {
    /* database unreachable — local state remains the demo truth */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<AppState[]>(() => merge());
  const [remote, setRemote] = useState(false);
  const [role, setRole] = useState<"reviewer" | "applicant" | null>(null);
  const [trail, setTrail] = useState<Record<string, TrailEvent[]>>(() => {
    const next: Record<string, TrailEvent[]> = {};
    for (const seed of SEED_APPLICATIONS) {
      next[seed.id] = [receivedEvent(seed)];
    }
    return next;
  });
  const [hydrated, setHydrated] = useState(false);
  const remoteRef = useRef(false);

  const appendTrail = useCallback((id: string, event: TrailEvent) => {
    setTrail((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), event] }));
  }, []);

  // Keep the server render and first client render deterministic, then restore
  // browser-only demo state after hydration.
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setApps(merge(load()));
      const loaded = loadTrail();
      setTrail(() => {
        const next = { ...loaded };
        for (const seed of SEED_APPLICATIONS) {
          if (!next[seed.id] || next[seed.id].length === 0) {
            next[seed.id] = [receivedEvent(seed)];
          }
        }
        return next;
      });
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Signed-in sessions use the local SQLite database; otherwise the seeded
  // localStorage demo store is used (e.g. preview deployments).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetch("/api/auth/me");
        if (!me.ok) return;
        const { user } = (await me.json()) as {
          user: { role: "reviewer" | "applicant" };
        };
        const res = await fetch("/api/apps");
        if (!res.ok) return;
        const { applications } = (await res.json()) as {
          applications: ApiApp[];
        };
        if (cancelled) return;
        remoteRef.current = true;
        setRemote(true);
        setRole(user.role);
        setApps(applications.map(toApp));
      } catch {
        /* fall back to local demo store */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || remoteRef.current) return; // database owns persistence when signed in
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
  }, [apps, hydrated]);

  // Review activity journal (local session record, both modes).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(TRAIL_KEY, JSON.stringify(trail));
    } catch {
      /* storage full/blocked — demo continues in memory */
    }
  }, [hydrated, trail]);

  const updateEvidence = useCallback(
    (id: string, evidence: EvidenceItem[]) => {
      setApps((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                evidence,
                dirty: true,
                status: "analysis_required" as const,
                lastAnalysis: null,
              }
            : a,
        ),
      );
      appendTrail(id, {
        at: new Date().toISOString(),
        label: "Evidence updated",
        detail: "Re-analysis required before programme review.",
      });
      if (!remoteRef.current) return;
      void silently(
        fetch(`/api/apps/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ evidence: evidence.map(toApiEvidence) }),
        }),
      );
    },
    [appendTrail],
  );

  const setAnalysis = useCallback((id: string, analysis: StoredAnalysis) => {
    setApps((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              lastAnalysis: analysis,
              dirty: false,
              status: analysis.status,
            }
          : a,
      ),
    );
    appendTrail(id, {
      at: new Date().toISOString(),
      label:
        analysis.status === "review_ready"
          ? "Marked ready for programme review"
          : "Evidence review run",
      detail:
        analysis.status === "review_ready"
          ? "Evidence complete and consistent. Human programme decision: not yet made."
          : `${analysis.issues.length} issue(s) identified (${analysis.source === "llm" ? "AI-assisted review" : "fallback review mode"}).`,
    });
    if (!remoteRef.current) return;
    void silently(
      fetch(`/api/apps/${id}/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysis),
      }),
    );
  }, [appendTrail]);

  const saveRequest = useCallback(
    (id: string, message: string, source: "llm" | "deterministic") => {
      appendTrail(id, {
        at: new Date().toISOString(),
        label: "Applicant request prepared",
        detail: "Simulated send — no message was actually sent.",
      });
      if (!remoteRef.current) return;
      void silently(
        fetch(`/api/apps/${id}/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, source }),
        }),
      );
    },
    [appendTrail],
  );

  const reset = useCallback(
    (id: string) => {
      const seed = SEED_APPLICATIONS.find((s) => s.id === id);
      if (!seed) return;
      setApps((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...seed,
                evidence: seed.evidence,
                lastAnalysis: null,
                dirty: true,
                status: "analysis_required" as const,
              }
            : a,
        ),
      );
      setTrail((prev) => ({ ...prev, [id]: [receivedEvent(seed)] }));
      if (remoteRef.current) updateEvidence(id, seed.evidence);
    },
    [updateEvidence],
  );

  const get = useCallback(
    (id: string) => apps.find((a) => a.id === id),
    [apps],
  );

  const value = useMemo(
    () => ({
      apps,
      remote,
      role,
      trail,
      get,
      updateEvidence,
      setAnalysis,
      saveRequest,
      reset,
    }),
    [
      apps,
      remote,
      role,
      trail,
      get,
      updateEvidence,
      setAnalysis,
      saveRequest,
      reset,
    ],
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
