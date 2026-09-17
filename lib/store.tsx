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
import { createClient, supabaseConfigured } from "./supabase/client";

export interface AppState extends ApplicationRecord {
  /** Effective reviewer-facing status (analysis_required until analyzed). */
  status: ReviewStatus;
  lastAnalysis: StoredAnalysis | null;
  dirty: boolean;
}

const KEY = "c07-apps-v2";

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

interface DbAnalysis {
  application_id: string;
  status: StoredAnalysis["status"];
  summary: string;
  issues: AnalysisIssue[];
  source: "llm" | "deterministic";
  analyzed_at: string;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<AppState[]>(() => merge());
  const [remote, setRemote] = useState(false);
  const [role, setRole] = useState<"reviewer" | "applicant" | null>(null);
  const remoteRef = useRef(false);

  // When signed in (and Supabase configured), the database is the source of
  // truth. Otherwise the seeded localStorage demo store is used.
  useEffect(() => {
    if (!supabaseConfigured()) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      const { data: dbApps } = await supabase
        .from("applications")
        .select(
          "id, applicant_name, programme, submitted_at, contact, summary, evidence_items(*)",
        )
        .order("id");
      const { data: dbAnalyses } = await supabase
        .from("analyses")
        .select("application_id, status, summary, issues, source, analyzed_at")
        .order("analyzed_at", { ascending: false });
      if (cancelled || !dbApps) return;

      const latest = new Map<string, DbAnalysis>();
      for (const a of (dbAnalyses ?? []) as DbAnalysis[]) {
        if (!latest.has(a.application_id)) latest.set(a.application_id, a);
      }
      const mapped: AppState[] = dbApps.map((row) => {
        const evidence: EvidenceItem[] = (row.evidence_items ?? []).map(
          (e: {
            kind: EvidenceItem["kind"];
            label: string;
            status: "provided" | "missing";
            document_id: string | null;
            file_name: string | null;
            submitted_at: string | null;
            organisation_name: string | null;
            signatory: string | null;
            content: string;
            updated_at: string;
          }) => ({
            kind: e.kind,
            label: e.label,
            status: e.status,
            documentId: e.document_id ?? undefined,
            fileName: e.file_name ?? undefined,
            submittedAt: e.submitted_at ?? undefined,
            organisationName: e.organisation_name ?? undefined,
            signatory: e.signatory ?? undefined,
            content: e.content,
          }),
        );
        const la = latest.get(row.id);
        const lastAnalysis: StoredAnalysis | null = la
          ? {
              status: la.status,
              summary: la.summary,
              issues: la.issues ?? [],
              source: la.source,
              analyzedAt: la.analyzed_at,
            }
          : null;
        const dirty =
          !lastAnalysis ||
          (row.evidence_items ?? []).some(
            (e: { updated_at: string }) =>
              lastAnalysis && e.updated_at > lastAnalysis.analyzedAt,
          );
        return {
          id: row.id,
          applicantName: row.applicant_name,
          programme: row.programme,
          submittedAt: row.submitted_at,
          contact: row.contact,
          summary: row.summary,
          evidence,
          reviewerNotes: SEED_APPLICATIONS.find((s) => s.id === row.id)
            ?.reviewerNotes,
          lastAnalysis: dirty ? null : lastAnalysis,
          dirty,
          status: dirty
            ? ("analysis_required" as const)
            : (lastAnalysis?.status ?? "analysis_required"),
        };
      });
      remoteRef.current = true;
      setRemote(true);
      setRole(profile?.role === "reviewer" ? "reviewer" : "applicant");
      setApps(mapped);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (remoteRef.current) return; // database owns persistence when signed in
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
      if (!remoteRef.current || !supabaseConfigured()) return;
      void (async () => {
        const supabase = createClient();
        for (const e of evidence) {
          await supabase.from("evidence_items").upsert(
            {
              application_id: id,
              kind: e.kind,
              label: e.label,
              status: e.status,
              document_id: e.documentId ?? null,
              file_name: e.fileName ?? null,
              submitted_at: e.submittedAt ?? null,
              organisation_name: e.organisationName ?? null,
              signatory: e.signatory ?? null,
              content: e.content ?? "",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "application_id,kind" },
          );
        }
        await supabase.from("analyses").delete().eq("application_id", id);
      })();
    },
    [],
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
    if (!remoteRef.current || !supabaseConfigured()) return;
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from("analyses").insert({
        application_id: id,
        status: analysis.status,
        summary: analysis.summary,
        issues: analysis.issues,
        source: analysis.source,
        analyzed_at: analysis.analyzedAt,
        created_by: user?.id ?? null,
      });
    })();
  }, []);

  const saveRequest = useCallback(
    (id: string, message: string, source: "llm" | "deterministic") => {
      if (!remoteRef.current || !supabaseConfigured()) return;
      void (async () => {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        await supabase.from("applicant_requests").insert({
          application_id: id,
          message,
          source,
          created_by: user?.id ?? null,
        });
      })();
    },
    [],
  );

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
    if (!remoteRef.current || !supabaseConfigured()) return;
    const seed = SEED_APPLICATIONS.find((s) => s.id === id);
    if (seed) updateEvidence(id, seed.evidence);
  }, [updateEvidence]);

  const get = useCallback(
    (id: string) => apps.find((a) => a.id === id),
    [apps],
  );

  const value = useMemo(
    () => ({
      apps,
      remote,
      role,
      get,
      updateEvidence,
      setAnalysis,
      saveRequest,
      reset,
    }),
    [apps, remote, role, get, updateEvidence, setAnalysis, saveRequest, reset],
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
