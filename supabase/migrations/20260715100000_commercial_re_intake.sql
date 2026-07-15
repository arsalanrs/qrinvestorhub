-- Commercial Real Estate loan intake (separate from residential investor programs)

alter table public.investor_applications
  add column if not exists commercial_re jsonb;
