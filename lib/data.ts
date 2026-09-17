import type { ApplicationRecord } from "./types";

/**
 * Seeds mirror the published C07 starting data (initial.json):
 * APP-1 + APP-2 with document IDs REG-1, PLAN-1, CONSENT-1 (missing), REG-2.
 * APP-2 has no activity plan or signoff in the published data — both missing.
 * APP-3 is an additional synthetic fixture (complete + consistent) for the
 * review-ready contrast. Everything is fictional; no real personal data.
 */
export const EXERCISE_RULES = [
  {
    id: "RULE-1",
    text: "Review-ready requires a registration record, activity plan and named responsible-person signoff.",
  },
  {
    id: "RULE-2",
    text: "A name mismatch requires clarification, never automatic rejection.",
  },
  { id: "RULE-3", text: "A human reviewer alone decides the application." },
];

export const SEED_APPLICATIONS: ApplicationRecord[] = [
  {
    id: "APP-1",
    applicantName: "Learning Workshop A",
    programme: "Vocational pilot",
    submittedAt: "2026-09-02",
    contact: "coordinator@example.org",
    summary:
      "Six-week vocational pilot: workshop safety, tool handling and supervised practice sessions for 24 learners.",
    theme: "Education / vocational training",
    country: "Peru",
    purpose:
      "Provide practical vocational training for young adults in a rural community.",
    targetGroup: "60 young adults seeking employment skills.",
    reviewerNotes: [
      {
        id: "NOTE-1",
        text: "Keep the supplied organisation spelling. Earlier extraction shortened it incorrectly.",
        locked: true,
      },
    ],
    evidence: [
      {
        kind: "registration_record",
        label: "Registration record",
        status: "provided",
        documentId: "REG-1",
        fileName: "REG-1_registration-record.pdf",
        submittedAt: "2026-09-02",
        organisationName: "Learning Workshop A",
        content:
          "REGISTRATION RECORD — Learning Workshop A (REG-1)\nRegistered training provider no. LWA-2024-118.\nOrganisation name on record: Learning Workshop A.\nStatus: active. Valid through 2027-03-31.",
      },
      {
        kind: "activity_plan",
        label: "Activity plan",
        status: "provided",
        documentId: "PLAN-1",
        fileName: "PLAN-1_activity-plan.pdf",
        submittedAt: "2026-09-02",
        organisationName: "Learning Workshop A",
        content:
          "ACTIVITY PLAN — Learning Workshop A (PLAN-1, Vocational pilot)\n6 weekly sessions, max 24 learners, 2 trainers.\nVenue: Unit 4, Foundry Lane. Risk assessment attached.\nPlanned start: 2026-10-06.",
      },
      {
        kind: "responsible_person_signoff",
        label: "Responsible-person signoff",
        status: "missing",
        documentId: "CONSENT-1",
        content: "",
      },
    ],
  },
  {
    id: "APP-2",
    applicantName: "Community Workshop B",
    programme: "Trainer development",
    submittedAt: "2026-09-05",
    contact: "hello@example.org",
    summary:
      "Trainer development pathway: mentoring, observed delivery and peer review for 8 trainee trainers.",
    theme: "Education / local capacity building",
    country: "Vietnam",
    purpose:
      "Strengthen local training capacity through mentoring and peer-reviewed practice.",
    targetGroup: "8 trainee trainers from partner organisations.",
    evidence: [
      {
        kind: "registration_record",
        label: "Registration record",
        status: "provided",
        documentId: "REG-2",
        fileName: "REG-2_registration-record.pdf",
        submittedAt: "2026-09-05",
        organisationName: "Community Workshop C",
        content:
          "REGISTRATION RECORD — Community Workshop C (REG-2)\nRegistered community provider no. CWC-2023-042.\nOrganisation name on record: Community Workshop C.\nStatus: active. Valid through 2026-12-31.",
      },
      {
        kind: "activity_plan",
        label: "Activity plan",
        status: "missing",
        content: "",
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
    id: "APP-3",
    applicantName: "Northgate Skills Collective",
    programme: "Vocational pilot",
    submittedAt: "2026-09-08",
    contact: "admin@example.org",
    summary:
      "Weekend vocational taster series: three cohorts, introductory bench skills and progression advice.",
    theme: "Education / community learning",
    country: "Cambodia",
    purpose:
      "Offer accessible weekend taster courses that lead learners toward full vocational training.",
    targetGroup: "48 learners across three weekend cohorts.",
    evidence: [
      {
        kind: "registration_record",
        label: "Registration record",
        status: "provided",
        documentId: "REG-3",
        fileName: "REG-3_registration-record.pdf",
        submittedAt: "2026-09-08",
        organisationName: "Northgate Skills Collective",
        content:
          "REGISTRATION RECORD — Northgate Skills Collective (REG-3)\nRegistered training provider no. NSC-2025-009.\nOrganisation name on record: Northgate Skills Collective.\nStatus: active. Valid through 2027-06-30.",
      },
      {
        kind: "activity_plan",
        label: "Activity plan",
        status: "provided",
        documentId: "PLAN-3",
        fileName: "PLAN-3_activity-plan.pdf",
        submittedAt: "2026-09-08",
        organisationName: "Northgate Skills Collective",
        content:
          "ACTIVITY PLAN — Northgate Skills Collective (PLAN-3, Vocational pilot)\n3 weekend cohorts of 16 learners. Staffing 1:8.\nVenue booked. Planned start: 2026-10-18.",
      },
      {
        kind: "responsible_person_signoff",
        label: "Responsible-person signoff",
        status: "provided",
        documentId: "CONSENT-3",
        fileName: "CONSENT-3_signoff.pdf",
        submittedAt: "2026-09-08",
        organisationName: "Northgate Skills Collective",
        signatory: "J. Whitfield, Responsible Person",
        content:
          "RESPONSIBLE-PERSON SIGNOFF — Northgate Skills Collective (CONSENT-3)\nI confirm the activity plan and staffing for the vocational pilot.\nSigned: J. Whitfield, Responsible Person, 2026-09-07.",
      },
    ],
  },
];
