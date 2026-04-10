-- Vitalis Cashflow Planner — migration 0003
create extension if not exists "pgcrypto";

create table if not exists cf_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text,
  opening_cash numeric(14,2) not null default 0,
  opening_date date not null default current_date,
  week_start_dow smallint not null default 1,
  min_cash_alert numeric(14,2) not null default 10000,
  updated_at timestamptz not null default now()
);

create table if not exists cf_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('income','expense')),
  sort_order int not null default 0,
  unique(name, kind)
);

create table if not exists cf_recurring_rules (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references cf_categories(id) on delete restrict,
  label text not null,
  amount numeric(14,2) not null,
  frequency text not null check (frequency in ('weekly','biweekly','semimonthly','monthly','quarterly','annual','one_time')),
  start_date date not null,
  end_date date,
  day_of_month int,
  day_of_week int,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists cf_transactions (
  id uuid primary key default gen_random_uuid(),
  txn_date date not null,
  category_id uuid not null references cf_categories(id) on delete restrict,
  amount numeric(14,2) not null,
  description text,
  reference text,
  created_at timestamptz not null default now()
);
create index if not exists cf_txn_date_idx on cf_transactions(txn_date);

create table if not exists cf_weekly_actuals (
  id uuid primary key default gen_random_uuid(),
  week_ending date not null unique,
  actual_cash numeric(14,2) not null,
  note text,
  updated_at timestamptz not null default now()
);

create table if not exists cf_scenarios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists cf_scenario_overrides (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references cf_scenarios(id) on delete cascade,
  rule_id uuid references cf_recurring_rules(id) on delete cascade,
  amount_delta numeric(14,2) not null default 0,
  note text
);

-- Seed 36 categories (Vitalis Excel mapping)
insert into cf_categories (name, kind, sort_order) values
  ('Medicaid Waiver Revenue','income',10),
  ('Private Pay Revenue','income',20),
  ('VA Benefits Revenue','income',30),
  ('LTC Insurance Revenue','income',40),
  ('Other Revenue','income',50),
  ('Payroll — Caregivers','expense',100),
  ('Payroll — Office Staff','expense',110),
  ('Payroll Taxes','expense',120),
  ('Workers Comp Insurance','expense',130),
  ('General Liability Insurance','expense',140),
  ('Health Insurance','expense',150),
  ('Office Rent','expense',160),
  ('Utilities','expense',170),
  ('Internet & Phone','expense',180),
  ('Software Subscriptions','expense',190),
  ('Google Ads','expense',200),
  ('Other Marketing','expense',210),
  ('Office Supplies','expense',220),
  ('Caregiver Supplies & PPE','expense',230),
  ('Licensing & Permits','expense',240),
  ('Accounting & Bookkeeping','expense',250),
  ('Legal Fees','expense',260),
  ('Payroll Processing Fees','expense',270),
  ('Bank Fees','expense',280),
  ('Credit Card Fees','expense',290),
  ('Background Checks','expense',300),
  ('Training & CEUs','expense',310),
  ('Mileage Reimbursement','expense',320),
  ('Vehicle Expenses','expense',330),
  ('Travel','expense',340),
  ('Meals & Entertainment','expense',350),
  ('Dues & Subscriptions','expense',360),
  ('Loan Repayments','expense',370),
  ('Owner Draw','expense',380),
  ('Taxes — Federal/State','expense',390),
  ('Miscellaneous','expense',400)
on conflict (name, kind) do nothing;
