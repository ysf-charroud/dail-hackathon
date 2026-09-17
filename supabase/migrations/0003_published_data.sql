-- Align with published C07 starting data (initial.json):
-- APP-1 + APP-2 with document IDs; APP-2 has no plan/signoff (both missing).
-- APP-3 is an extra synthetic fixture (complete + consistent).
alter table evidence_items add column if not exists document_id text;

delete from applications where id in ('APP-101', 'APP-102', 'APP-103');

insert into applications (id, applicant_name, programme, submitted_at, contact, summary) values
  ('APP-1', 'Learning Workshop A', 'Vocational pilot', '2026-09-02', 'coordinator@example.org', 'Six-week vocational pilot: workshop safety, tool handling and supervised practice sessions for 24 learners.'),
  ('APP-2', 'Community Workshop B', 'Trainer development', '2026-09-05', 'hello@example.org', 'Trainer development pathway: mentoring, observed delivery and peer review for 8 trainee trainers.'),
  ('APP-3', 'Northgate Skills Collective', 'Vocational pilot', '2026-09-08', 'admin@example.org', 'Weekend vocational taster series: three cohorts, introductory bench skills and progression advice.')
on conflict (id) do update set applicant_name = excluded.applicant_name;

insert into evidence_items (application_id, kind, label, status, document_id, file_name, submitted_at, organisation_name, signatory, content) values
  ('APP-1', 'registration_record', 'Registration record', 'provided', 'REG-1', 'REG-1_registration-record.pdf', '2026-09-02', 'Learning Workshop A', null, 'REGISTRATION RECORD — Learning Workshop A (REG-1). Status: active. Valid through 2027-03-31.'),
  ('APP-1', 'activity_plan', 'Activity plan', 'provided', 'PLAN-1', 'PLAN-1_activity-plan.pdf', '2026-09-02', 'Learning Workshop A', null, 'ACTIVITY PLAN — Learning Workshop A (PLAN-1, Vocational pilot). 6 weekly sessions, max 24 learners. Planned start: 2026-10-06.'),
  ('APP-1', 'responsible_person_signoff', 'Responsible-person signoff', 'missing', 'CONSENT-1', null, null, null, null, ''),
  ('APP-2', 'registration_record', 'Registration record', 'provided', 'REG-2', 'REG-2_registration-record.pdf', '2026-09-05', 'Community Workshop C', null, 'REGISTRATION RECORD — Community Workshop C (REG-2). Status: active. Valid through 2026-12-31.'),
  ('APP-2', 'activity_plan', 'Activity plan', 'missing', null, null, null, null, null, ''),
  ('APP-2', 'responsible_person_signoff', 'Responsible-person signoff', 'missing', null, null, null, null, null, ''),
  ('APP-3', 'registration_record', 'Registration record', 'provided', 'REG-3', 'REG-3_registration-record.pdf', '2026-09-08', 'Northgate Skills Collective', null, 'REGISTRATION RECORD — Northgate Skills Collective (REG-3). Status: active. Valid through 2027-06-30.'),
  ('APP-3', 'activity_plan', 'Activity plan', 'provided', 'PLAN-3', 'PLAN-3_activity-plan.pdf', '2026-09-08', 'Northgate Skills Collective', null, 'ACTIVITY PLAN — Northgate Skills Collective (PLAN-3, Vocational pilot). 3 weekend cohorts of 16 learners. Planned start: 2026-10-18.'),
  ('APP-3', 'responsible_person_signoff', 'Responsible-person signoff', 'provided', 'CONSENT-3', 'CONSENT-3_signoff.pdf', '2026-09-08', 'Northgate Skills Collective', 'J. Whitfield, Responsible Person', 'RESPONSIBLE-PERSON SIGNOFF — Northgate Skills Collective (CONSENT-3). Signed: J. Whitfield, Responsible Person, 2026-09-07.')
on conflict (application_id, kind) do update set
  status = excluded.status,
  document_id = excluded.document_id,
  file_name = excluded.file_name,
  submitted_at = excluded.submitted_at,
  organisation_name = excluded.organisation_name,
  signatory = excluded.signatory,
  content = excluded.content;
