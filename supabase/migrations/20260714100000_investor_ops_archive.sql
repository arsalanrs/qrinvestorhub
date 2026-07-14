-- Ops: soft-archive investor applications (hidden from default ops list)

alter table public.investor_applications
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz;

create index if not exists investor_applications_archived_idx
  on public.investor_applications (archived, submitted_at desc);
