-- AI-generated property hero images for investor portal

alter table public.investor_properties
  add column if not exists ai_hero_path text,
  add column if not exists ai_hero_generated_at timestamptz;
