alter table public.investor_applications
  add column if not exists assigned_lo jsonb;
