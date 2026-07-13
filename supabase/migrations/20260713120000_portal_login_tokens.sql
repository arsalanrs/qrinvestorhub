-- One-time portal sign-in tokens (Zapier/Outlook sends the link; not Supabase Auth)

create table if not exists public.portal_login_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists portal_login_tokens_email_idx on public.portal_login_tokens (email);
create index if not exists portal_login_tokens_expires_idx on public.portal_login_tokens (expires_at);

alter table public.portal_login_tokens enable row level security;
