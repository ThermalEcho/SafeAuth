import { pool } from "./db.ts";

const CREATE_OTP_ACCOUNT_TABLE_SQL = `
create table if not exists public.otp_account (
  id bigint generated always as identity primary key,
  user_id text not null,
  issuer text not null,
  account_name text not null,
  label_hash text not null,
  secret_ciphertext text not null,
  secret_iv text not null,
  secret_auth_tag text not null,
  secret_fingerprint text not null,
  algorithm text not null default 'SHA1',
  digits integer not null default 6,
  period integer not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint otp_account_digits_check check (digits between 6 and 8),
  constraint otp_account_period_check check (period between 15 and 120),
  constraint otp_account_algorithm_check check (algorithm = 'SHA1'),
  constraint otp_account_user_secret_unique unique (user_id, secret_fingerprint)
);

alter table public.otp_account enable row level security;

create index if not exists otp_account_user_sort_idx
  on public.otp_account (user_id, issuer, account_name);

create index if not exists otp_account_user_label_idx
  on public.otp_account (user_id, label_hash);
`;

const CREATE_UPDATED_AT_TRIGGER_SQL = `
create or replace function public.set_otp_account_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_otp_account_updated_at on public.otp_account;

create trigger set_otp_account_updated_at
before update on public.otp_account
for each row
execute function public.set_otp_account_updated_at();
`;

export async function ensureOtpSchema(): Promise<void> {
  await pool.query(CREATE_OTP_ACCOUNT_TABLE_SQL);
  await pool.query(CREATE_UPDATED_AT_TRIGGER_SQL);
}
