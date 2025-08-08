create table if not exists invites (
  code text primary key,
  is_active boolean default true,
  created_at timestamptz default now()
);
insert into invites(code, is_active) values ('toxic-od-2025', true)
on conflict (code) do nothing;
-- RLS example policies are documented in README.
