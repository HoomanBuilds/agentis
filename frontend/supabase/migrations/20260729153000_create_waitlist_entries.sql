create table if not exists public.waitlist_entries (
  id bigint generated always as identity primary key,
  email text not null,
  source text not null default 'irai-protocol-waitlist',
  created_at timestamptz not null default now(),
  constraint waitlist_entries_email_unique unique (email),
  constraint waitlist_entries_email_length
    check (char_length(email) between 3 and 254),
  constraint waitlist_entries_email_lowercase
    check (email = lower(email)),
  constraint waitlist_entries_source_length
    check (char_length(source) between 1 and 64)
);

alter table public.waitlist_entries enable row level security;

revoke all on table public.waitlist_entries from anon, authenticated;
revoke all on sequence public.waitlist_entries_id_seq from anon, authenticated;
