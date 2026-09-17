import type { ApplicationRecord } from "./types";

/**
 * Synthetic seed data only. No real personal data.
 * - APP-101 Learning Workshop A: signoff missing
 * - APP-102 Community Workshop B: registration org-name mismatch
 * - APP-103 Northgate Skills Collective: complete + consistent (Review Ready path)
 */
export const SEED_APPLICATIONS: ApplicationRecord[] = [
  {
    id: "APP-101",
    applicantName: "Learning Workshop A",
    programme: "Vocational pilot",
    submittedAt: "2026-09-02",
    contact: "coordinator@example.org",
    summary:
      "Six-week vocational pilot: workshop safety, tool handling and supervised practice sessions for 24 learners.",
    evidence: [
      {
        kind: "registration_record",
        label: "Registration record",
        status: "provided",
        fileName: "registration-record_LWA.pdf",
        submittedAt: "2026-09-02",
        organisationName: "Learning Workshop A",
        content:
          "REGISTRATION RECORD — Learning Workshop A\nRegistered training provider no. LWA-2024-118.\nOrganisation name on record: Learning Workshop A.\nStatus: active. Valid through 2027-03-31.",
      },
      {
        kind: "activity_plan",
        label: "Activity plan",
        status: "provided",
        fileName: "activity-plan_LWA.pdf",
        submittedAt: "2026-09-02",
        organisationName: "Learning Workshop A",
        content:
          "ACTIVITY PLAN — Learning Workshop A (Vocational pilot)\n6 weekly sessions, max 24 learners, 2 trainers.\nVenue: Unit 4, Foundry Lane. Risk assessment attached.\nPlanned start: 2026-10-06.",
      },
      {
        kind: "responsible_person_signoff",
        label: "Responsible-person signoff",
        status: "missing",
        content: "",
      },
    ],
  },
  {
    id: "APP-102",
    applicantName: "Community Workshop B",
    programme: "Trainer development",
    submittedAt: "2026-09-05",
    contact: "hello@example.org",
    summary:
      "Trainer development pathway: mentoring, observed delivery and peer review for 8 trainee trainers.",
    evidence: [
      {
        kind: "registration_record",
        label: "Registration record",
        status: "provided",
        fileName: "registration-record_CWB.pdf",
        submittedAt: "2026-09-05",
        organisationName: "Community Workshop C",
        content:
          "REGISTRATION RECORD — Community Workshop C\nRegistered community provider no. CWC-2023-042.\nOrganisation name on record: Community Workshop C.\nStatus: active. Valid through 2026-12-31.",
      },
      {
        kind: "activity_plan",
        label: "Activity plan",
        status: "provided",
        fileName: "activity-plan_CWB.pdf",
        submittedAt: "2026-09-05",
        organisationName: "Community Workshop B",
        content:
          "ACTIVITY PLAN — Community Workshop B (Trainer development)\n8 trainee trainers, 10 weeks, observed delivery x3.\nLead mentor named. Planned start: 2026-10-13.",
      },
      {
        kind: "responsible_person_signoff",
        label: "Responsible-person signoff",
        status: "provided",
        fileName: "signoff_CWB.pdf",
        submittedAt: "2026-09-05",
        organisationName: "Community Workshop B",
        signatory: "R. Okafor, Programme Lead",
        content:
          "RESPONSIBLE-PERSON SIGNOFF — Community Workshop B\nI confirm the trainer development plan is accurate and delivery capacity is in place.\nSigned: R. Okafor, Programme Lead, 2026-09-04.",
      },
    ],
  },
  {
    id: "APP-103",
    applicantName: "Northgate Skills Collective",
    programme: "Vocational pilot",
    submittedAt: "2026-09-08",
    contact: "admin@example.org",
    summary:
      "Weekend vocational taster series: three cohorts, introductory bench skills and progression advice.",
    evidence: [
      {
        kind: "registration_record",
        label: "Registration record",
        status: "provided",
        fileName: "registration-record_NSC.pdf",
        submittedAt: "2026-09-08",
        organisationName: "Northgate Skills Collective",
        content:
          "REGISTRATION RECORD — Northgate Skills Collective\nRegistered training provider no. NSC-2025-009.\nOrganisation name on record: Northgate Skills Collective.\nStatus: active. Valid through 2027-06-30.",
      },
      {
        kind: "activity_plan",
        label: "Activity plan",
        status: "provided",
        fileName: "activity-plan_NSC.pdf",
        submittedAt: "2026-09-08",
        organisationName: "Northgate Skills Collective",
        content:
          "ACTIVITY PLAN — Northgate Skills Collective (Vocational pilot)\n3 weekend cohorts of 16 learners. Staffing 1:8.\nVenue booked. Planned start: 2026-10-18.",
      },
      {
        kind: "responsible_person_signoff",
        label: "Responsible-person signoff",
        status: "provided",
        fileName: "signoff_NSC.pdf",
        submittedAt: "2026-09-08",
        organisationName: "Northgate Skills Collective",
        signatory: "J. Whitfield, Responsible Person",
        content:
          "RESPONSIBLE-PERSON SIGNOFF — Northgate Skills Collective\nI confirm the activity plan and staffing for the vocational pilot.\nSigned: J. Whitfield, Responsible Person, 2026-09-07.",
      },
    ],
  },
];
