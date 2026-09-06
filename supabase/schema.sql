create table if not exists public.patients (
  id text primary key,
  sex text,
  birth_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null references public.patients(id) on delete cascade,
  created_at timestamptz not null default now(),
  age numeric,
  weight numeric,
  waist numeric,
  body_fat_pct numeric,
  visceral_fat numeric,
  muscle_mass_pct numeric,
  grip_strength numeric,
  vo2_est numeric,
  hrv numeric,
  sleep_hours numeric,
  activity_minutes_week numeric,
  hba1c numeric,
  fasting_glucose numeric,
  fasting_insulin numeric,
  ldl numeric,
  hdl numeric,
  triglycerides numeric,
  apob numeric,
  lpa numeric,
  hs_crp numeric,
  ast numeric,
  alt numeric,
  ggt numeric,
  liver_fat_grade numeric,
  systolic_bp numeric,
  diastolic_bp numeric,
  carotid_plaque numeric,
  notes text,
  vli_global numeric,
  vli_completeness numeric,
  vli_version text,
  vli_components jsonb
);

alter table public.consultations add column if not exists body_fat_pct numeric;
alter table public.consultations add column if not exists visceral_fat numeric;
alter table public.consultations add column if not exists muscle_mass_pct numeric;
alter table public.consultations add column if not exists grip_strength numeric;
alter table public.consultations add column if not exists vo2_est numeric;
alter table public.consultations add column if not exists hrv numeric;
alter table public.consultations add column if not exists sleep_hours numeric;
alter table public.consultations add column if not exists activity_minutes_week numeric;
alter table public.consultations add column if not exists fasting_glucose numeric;
alter table public.consultations add column if not exists fasting_insulin numeric;
alter table public.consultations add column if not exists hdl numeric;
alter table public.consultations add column if not exists apob numeric;
alter table public.consultations add column if not exists lpa numeric;
alter table public.consultations add column if not exists hs_crp numeric;
alter table public.consultations add column if not exists ggt numeric;
alter table public.consultations add column if not exists liver_fat_grade numeric;
alter table public.consultations add column if not exists carotid_plaque numeric;
alter table public.consultations add column if not exists vli_completeness numeric;
alter table public.consultations add column if not exists vli_version text;
alter table public.consultations add column if not exists vli_components jsonb;

create index if not exists consultations_patient_id_created_at_idx
  on public.consultations(patient_id, created_at desc);

alter table public.patients enable row level security;
alter table public.consultations enable row level security;

-- MVP policies. Replace with authenticated-user policies before clinical production use.
drop policy if exists "mvp read patients" on public.patients;
create policy "mvp read patients" on public.patients for select using (true);
drop policy if exists "mvp insert patients" on public.patients;
create policy "mvp insert patients" on public.patients for insert with check (true);
drop policy if exists "mvp read consultations" on public.consultations;
create policy "mvp read consultations" on public.consultations for select using (true);
drop policy if exists "mvp insert consultations" on public.consultations;
create policy "mvp insert consultations" on public.consultations for insert with check (true);
