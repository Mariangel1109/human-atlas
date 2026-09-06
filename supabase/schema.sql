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
  hba1c numeric,
  ldl numeric,
  triglycerides numeric,
  ast numeric,
  alt numeric,
  systolic_bp numeric,
  diastolic_bp numeric,
  notes text,
  vli_global numeric,
  vli_completeness numeric,
  vli_version text,
  vli_components jsonb
);

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
