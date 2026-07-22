-- Ausgaben-Tabelle für den Tour-de-France-Trip (Carl & Paul)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  spent_on date not null default current_date,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null check (currency in ('EUR','CHF')),
  paid_by text not null check (paid_by in ('Carl','Paul')),
  split_for text not null default 'both' check (split_for in ('both','Carl','Paul')),
  category text not null default 'Sonstiges'
);

create index if not exists expenses_created_at_idx on public.expenses (created_at desc);

-- Row Level Security aktivieren, aber offener Zugriff über den anon/publishable Key,
-- da dies eine private App nur für Carl & Paul ist (kein Login gewünscht).
alter table public.expenses enable row level security;

drop policy if exists "public read"   on public.expenses;
drop policy if exists "public insert" on public.expenses;
drop policy if exists "public update" on public.expenses;
drop policy if exists "public delete" on public.expenses;

create policy "public read"   on public.expenses for select using (true);
create policy "public insert" on public.expenses for insert with check (true);
create policy "public update" on public.expenses for update using (true) with check (true);
create policy "public delete" on public.expenses for delete using (true);

-- Realtime aktivieren
alter publication supabase_realtime add table public.expenses;
