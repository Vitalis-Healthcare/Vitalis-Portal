# Vitalis Portal — Staff & Compliance Hub

> **Vitalis Healthcare Services** · Baltimore, Maryland  
> Internal staff portal for training, compliance, credentials, and policy management.

---

## What This Is

A full-stack web application built for Vitalis Healthcare Services to manage:

| Module | Description |
|---|---|
| 🎓 **Training & LMS** | Build courses (text, video, PDF, quiz), assign to staff, track completions |
| 📋 **Policies & Procedures** | Publish policies, collect timestamped digital sign-offs, version control |
| 🪪 **Credentials** | Track CPR, TB tests, background checks, CNA licenses with expiry alerts |
| 👤 **Staff Portal** | Each caregiver sees their own compliance to-do list |
| 📊 **Reports** | BCHD-ready compliance reports across all modules |

**Stack:** Next.js 15 · TypeScript · Supabase (Postgres + Auth + RLS) · Vercel

---

## Quick Start (Local Development)

### 1. Clone the repo
```bash
git clone https://github.com/Vitalis-Healthcare/Vitalis-Portal.git
cd Vitalis-Portal
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it `vitalis-portal`
3. Copy your **Project URL** and **anon public key** from:  
   `Project Settings → API`

### 3. Configure environment
```bash
cp .env.local.example .env.local
# Edit .env.local and paste in your Supabase URL + anon key
```

### 4. Run database migrations

In your Supabase dashboard → **SQL Editor**, run these files in order:

```
supabase/migrations/001_initial_schema.sql   ← All tables, RLS, triggers, views
supabase/migrations/002_seed_data.sql        ← Default credential types
```

> **Tip:** Paste the full contents of each file and click Run.

### 5. Create your admin account

In Supabase → **Authentication → Users → Invite User**:
- Email: your email
- After sign-in, go to **Table Editor → profiles** and set your `role` to `admin`

### 6. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Or connect your GitHub repo directly in the [Vercel dashboard](https://vercel.com) for auto-deploys on every push.

---

## Project Structure

```
vitalis-portal/
├── app/
│   ├── (dashboard)/          # Protected routes (require login)
│   │   ├── layout.tsx        # Sidebar + Topbar layout
│   │   ├── dashboard/        # Overview & quick stats
│   │   ├── lms/              # Training & course management
│   │   │   └── courses/
│   │   │       ├── new/      # Course builder
│   │   │       └── [id]/     # Course detail + enrollment
│   │   ├── policies/         # Policy library + sign-off
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── credentials/      # Staff credential matrix
│   │   ├── staff/            # Admin: directory | Caregiver: my dashboard
│   │   ├── reports/          # Compliance reports
│   │   └── settings/         # Profile + credential types + org
│   ├── login/                # Login page
│   └── auth/callback/        # Supabase auth callback
├── components/
│   └── layout/               # Sidebar, Topbar
├── lib/supabase/             # Browser, server, middleware clients
├── types/                    # TypeScript interfaces for all entities
├── supabase/migrations/      # SQL files — run in Supabase SQL Editor
└── middleware.ts             # Auth guard — redirects to /login if not authenticated
```

---

## User Roles

| Role | Access |
|---|---|
| `admin` | Full access — all modules, staff management, reports |
| `supervisor` | Same as admin except cannot change roles |
| `caregiver` | Personal dashboard only — their own training, policies to sign, credentials |

---

## Database Tables

| Table | Purpose |
|---|---|
| `profiles` | All users (linked to Supabase auth) |
| `courses` | Training courses |
| `course_sections` | Sections within a course (text/video/PDF/quiz) |
| `quiz_questions` | Questions within quiz sections |
| `course_enrollments` | Staff assignments to courses |
| `section_progress` | Per-section completion tracking |
| `policies` | Policy documents with version control |
| `policy_acknowledgements` | Timestamped sign-offs |
| `credential_types` | Types of credentials (CPR, TB, etc.) |
| `staff_credentials` | Individual staff credential records |
| `audit_log` | Full audit trail of all actions |

---

## Build Phases

- [x] **Phase 1** — Authentication, LMS (course builder + tracking)
- [x] **Phase 2** — Policy library + digital sign-off
- [x] **Phase 3** — Credentials matrix + expiry alerts
- [x] **Phase 4** — Staff portal (admin directory + caregiver self-service)
- [ ] **Phase 5** — Email notifications for expiring credentials (Supabase Edge Functions)
- [ ] **Phase 6** — Mobile-responsive caregiver PWA
- [ ] **Phase 7** — EVV compliance integration, BCHD export templates
- [ ] **Phase 8** — Course completion certificates (PDF generation)

---

## Contributing / Development Notes

- All Supabase queries use **Row Level Security (RLS)** — staff can only see their own data
- Every admin action is recorded in `audit_log` with user ID and timestamp
- Credential status (`current` / `expiring` / `expired`) is computed automatically by a Postgres trigger
- The `staff_compliance_summary` view aggregates per-staff compliance for dashboards

---

*Built for Vitalis Healthcare Services · Maryland · 2026*
