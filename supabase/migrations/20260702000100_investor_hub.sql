-- Investor Hub tables

create table if not exists public.investor_applications (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'draft' check (status in ('draft','submitted','needs_review','sent_to_lendingpad','closed')),
  source text not null default 'investor_hub',
  loan_program text,
  deal_stage text,
  borrower jsonb,
  entity jsonb,
  experience jsonb,
  liquidity jsonb,
  loan_request jsonb,
  calculations jsonb,
  guideline_warnings jsonb,
  missing_fields jsonb,
  missing_documents jsonb,
  ai_summary text,
  shape_lead_id text,
  lendingpad_file_id text,
  additional_notes text,
  consents jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz
);

create table if not exists public.investor_properties (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.investor_applications(id) on delete cascade,
  is_main boolean default false,
  property_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investor_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.investor_applications(id) on delete cascade,
  property_id uuid references public.investor_properties(id) on delete set null,
  document_type text,
  file_name text,
  file_url text,
  status text default 'missing' check (status in ('uploaded','missing','requested','reviewed')),
  required boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.investor_application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.investor_applications(id) on delete cascade,
  event_type text,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger investor_applications_updated_at before update on public.investor_applications
  for each row execute function public.set_updated_at();
create trigger investor_properties_updated_at before update on public.investor_properties
  for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.investor_applications enable row level security;
alter table public.investor_properties enable row level security;
alter table public.investor_documents enable row level security;
alter table public.investor_application_events enable row level security;

create policy "allow_anon_insert_applications" on public.investor_applications for insert with check (true);
create policy "allow_anon_update_draft" on public.investor_applications for update using (status = 'draft');
create policy "allow_anon_select_own" on public.investor_applications for select using (true);

create policy "allow_anon_insert_properties" on public.investor_properties for insert with check (true);
create policy "allow_anon_update_properties" on public.investor_properties for update using (true);
create policy "allow_anon_select_properties" on public.investor_properties for select using (true);

create policy "allow_anon_insert_documents" on public.investor_documents for insert with check (true);
create policy "allow_anon_update_documents" on public.investor_documents for update using (true);
create policy "allow_anon_select_documents" on public.investor_documents for select using (true);
