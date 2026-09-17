-- C07 evidence-review: full data model (reviewers + applicants).
-- Run in Supabase SQL editor (or via migration). Idempotent seeds included.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('reviewer', 'applicant')),
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id text primary key,
  applicant_name text not null,
  programme text not null,
  submitted_at date not null,
  contact text not null default '',
  summary text not null default '',
  owner_id uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists evidence_items (
  id uuid primary key default gen_random_uuid(),
  application_id text not null references applications (id) on delete cascade,
  kind text not null check (kind in ('registration_record', 'activity_plan', 'responsible_person_signoff')),
  label text not null,
  status text not null default 'missing' check (status in ('provided', 'missing')),
  file_name text,
  submitted_at date,
  organisation_name text,
  signatory text,
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (application_id, kind)
);

create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  application_id text not null references applications (id) on delete cascade,
  status text not null check (status in ('missing_evidence', 'needs_clarification', 'review_ready')),
  summary text not null,
  issues jsonb not null default '[]',
  source text not null default 'deterministic' check (source in ('llm', 'deterministic')),
  analyzed_at timestamptz not null default now(),
  created_by uuid references profiles (id)
);

create table if not exists applicant_requests (
  id uuid primary key default gen_random_uuid(),
  application_id text not null references applications (id) on delete cascade,
  message text not null,
  source text not null default 'deterministic' check (source in ('llm', 'deterministic')),
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table applications enable row level security;
alter table evidence_items enable row level security;
alter table analyses enable row level security;
alter table applicant_requests enable row level security;

-- Reviewers: full access. Applicants: own rows only.
create policy "reviewers_all_profiles" on profiles for all to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'reviewer'));
create policy "own_profile" on profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "reviewers_all_applications" on applications for all to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'reviewer'));
create policy "applicant_own_applications" on applications for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "reviewers_all_evidence" on evidence_items for all to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'reviewer'));
create policy "applicant_own_evidence" on evidence_items for all to authenticated
  using (exists (select 1 from applications a where a.id = application_id and a.owner_id = auth.uid()))
  with check (exists (select 1 from applications a where a.id = application_id and a.owner_id = auth.uid()));

create policy "reviewers_all_analyses" on analyses for all to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'reviewer'));
create policy "applicant_read_own_analyses" on analyses for select to authenticated
  using (exists (select 1 from applications a where a.id = application_id and a.owner_id = auth.uid()));

create policy "reviewers_all_requests" on applicant_requests for all to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'reviewer'));
create policy "applicant_read_own_requests" on applicant_requests for select to authenticated
  using (exists (select 1 from applications a where a.id = application_id and a.owner_id = auth.uid()));

-- Synthetic seeds (reviewer-owned demo data, fictional).
insert into applications (id, applicant_name, programme, submitted_at, contact, summary) values
  ('APP-101', 'Learning Workshop A', 'Vocational pilot', '2026-09-02', 'coordinator@example.org', 'Six-week vocational pilot: workshop safety, tool handling and supervised practice sessions for 24 learners.'),
  ('APP-102', 'Community Workshop B', 'Trainer development', '2026-09-05', 'hello@example.org', 'Trainer development pathway: mentoring, observed delivery and peer review for 8 trainee trainers.'),
  ('APP-103', 'Northgate Skills Collective', 'Vocational pilot', '2026-09-08', 'admin@example.org', 'Weekend vocational taster series: three cohorts, introductory bench skills and progression advice.')
on conflict (id) do update set applicant_name = excluded.applicant_name;

insert into evidence_items (application_id, kind, label, status, file_name, submitted_at, organisation_name, signatory, content) values
  ('APP-101', 'registration_record', 'Registration record', 'provided', 'registration-record_LWA.pdf', '2026-09-02', 'Learning Workshop A', null, 'REGISTRATION RECORD — Learning Workshop A. Status: active. Valid through 2027-03-31.'),
  ('APP-101', 'activity_plan', 'Activity plan', 'provided', 'activity-plan_LWA.pdf', '2026-09-02', 'Learning Workshop A', null, 'ACTIVITY PLAN — Learning Workshop A (Vocational pilot). 6 weekly sessions, max 24 learners. Planned start: 2026-10-06.'),
  ('APP-101', 'responsible_person_signoff', 'Responsible-person signoff', 'missing', null, null, null, null, ''),
  ('APP-102', 'registration_record', 'Registration record', 'provided', 'registration-record_CWB.pdf', '2026-09-05', 'Community Workshop C', null, 'REGISTRATION RECORD — Community Workshop C. Status: active. Valid through 2026-12-31.'),
  ('APP-102', 'activity_plan', 'Activity plan', 'provided', 'activity-plan_CWB.pdf', '2026-09-05', 'Community Workshop B', null, 'ACTIVITY PLAN — Community Workshop B (Trainer development). 8 trainee trainers, 10 weeks. Planned start: 2026-10-13.'),
  ('APP-102', 'responsible_person_signoff', 'Responsible-person signoff', 'provided', 'signoff_CWB.pdf', '2026-09-05', 'Community Workshop B', 'R. Okafor, Programme Lead', 'RESPONSIBLE-PERSON SIGNOFF — Community Workshop B. Signed: R. Okafor, Programme Lead, 2026-09-04.'),
  ('APP-103', 'registration_record', 'Registration record', 'provided', 'registration-record_NSC.pdf', '2026-09-08', 'Northgate Skills Collective', null, 'REGISTRATION RECORD — Northgate Skills Collective. Status: active. Valid through 2027-06-30.'),
  ('APP-103', 'activity_plan', 'Activity plan', 'provided', 'activity-plan_NSC.pdf', '2026-09-08', 'Northgate Skills Collective', null, 'ACTIVITY PLAN — Northgate Skills Collective (Vocational pilot). 3 weekend cohorts of 16 learners. Planned start: 2026-10-18.'),
  ('APP-103', 'responsible_person_signoff', 'Responsible-person signoff', 'provided', 'signoff_NSC.pdf', '2026-09-08', 'Northgate Skills Collective', 'J. Whitfield, Responsible Person', 'RESPONSIBLE-PERSON SIGNOFF — Northgate Skills Collective. Signed: J. Whitfield, Responsible Person, 2026-09-07.')
on conflict (application_id, kind) do nothing;
