-- Run this in Supabase Dashboard → SQL Editor
-- CGS ESG Momentum Engine — Investor Forum

create table if not exists forum_comments (
  id          text primary key,
  ticker      text not null,
  author      text not null default 'anonymous',
  text        text not null,
  sentiment   jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists forum_comments_ticker_idx on forum_comments (ticker);
create index if not exists forum_comments_created_at_idx on forum_comments (created_at desc);

-- Row Level Security (optional — backend uses service role key)
alter table forum_comments enable row level security;

create policy "Public read forum comments"
  on forum_comments for select
  using (true);

create policy "Service role insert forum comments"
  on forum_comments for insert
  with check (true);
