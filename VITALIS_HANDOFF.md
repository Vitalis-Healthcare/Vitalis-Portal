# Vitalis Portal — Development Handoff Document
**Last updated:** March 25, 2026  
**Current version:** v1.3 (live at vitalis-portal.vercel.app)  
**GitHub:** https://github.com/Vitalis-Healthcare/Vitalis-Portal  
**Supabase Project:** https://ttojfvyfxqyzwvuzhvtd.supabase.co

---

## 1. WHAT HAS BEEN BUILT

### Application
A full-stack staff compliance portal for Vitalis Healthcare Services (Baltimore, Maryland) built with:
- **Next.js 16.2** (App Router, TypeScript)
- **Supabase** (Postgres database + Auth)
- **Vercel** (hosting, auto-deploys on git push)

### Modules Complete
| Module | Status | Path |
|---|---|---|
| Dashboard | ✅ Live | `/dashboard` |
| Training & LMS | ✅ Live | `/lms` |
| Course Player | ✅ Live | `/lms/courses/[id]/take` |
| Policies & Procedures | ✅ Live | `/policies` |
| Credentials | ✅ Live | `/credentials` |
| Staff Portal | ✅ Live | `/staff` |
| User Management | ✅ Live | `/users` |
| Reports | ✅ Live | `/reports` |
| Settings | ✅ Live | `/settings` |

### Key Features added in v1.3
- **Course Player:** Staff take courses section-by-section with progress tracking; quiz scoring with pass/fail (70% threshold); completion certificates pending (Phase 9)
- **Assign Staff modal:** Admin assigns staff to courses directly from course detail page; checkbox multi-select, optional due date, optional email notification
- **My Training section:** LMS page shows enrolled staff their in-progress and completed courses with progress bars
- **Email notifications:** Course assignment emails via Resend API; daily credential expiry digest via Supabase Edge Function (cron)
- **email_log table:** All outbound emails logged to avoid duplicates

### Database Tables
`profiles`, `courses`, `course_sections`, `quiz_questions`, `course_enrollments`, `section_progress`, `policies`, `policy_acknowledgements`, `credential_types`, `staff_credentials`, `audit_log`, `email_log`

---

## 2. INFRASTRUCTURE

### Vercel Settings (IMPORTANT)
- **Framework Preset:** Next.js ← must stay as this
- **Root Directory:** blank/empty ← must stay blank
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://ttojfvyfxqyzwvuzhvtd.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0b2pmdnlmeHF5end2dXpodnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTM2MTIsImV4cCI6MjA4OTk2OTYxMn0.Lgw5wNIIPVCGqe9lisQqMEO3S63eQZwXyAFD-l5VBUA`
  - `RESEND_API_KEY` = your Resend API key (get at resend.com — free tier is fine)
  - `NOTIFY_FROM_EMAIL` = `Vitalis Portal <notifications@vitalis.care>`
  - `NEXT_PUBLIC_PORTAL_URL` = `https://vitalis-portal.vercel.app`

### Supabase Fixes Applied (all already run)
- Migration 001: Full schema
- Migration 002: Seed credential types
- Migration 003: RLS policy fix
- Migration 004: Bulletproof trigger
- Migration 005: score + quiz_answers columns on section_progress; last_accessed_at on course_enrollments; unique index on section_progress
- Migration 006: email_log table with RLS

### Edge Functions
- `credential-alerts` — Daily cron, sends expiry alerts at 7/14/30 days; admin digest email

---

## 3. KNOWN ISSUES & DECISIONS

### User Creation
- The Supabase trigger (`handle_new_user`) had issues with the default RLS setup
- Fixed with `EXCEPTION WHEN OTHERS THEN RETURN NEW` — trigger never blocks auth
- RLS fix: `auth.role() = 'authenticated'` policy allows all logged-in users to read profiles
- To manually create admin: create user in Supabase Auth → run `UPDATE profiles SET role = 'admin' WHERE email = 'x'`

### No middleware
- Next.js 16.2 deprecated `middleware.ts` in favour of `proxy.ts` but Vercel Edge Runtime had import issues
- Solution: removed entirely, dashboard layout handles auth redirect server-side

### Google SSO
- Login page has the button and code ready
- `hd` parameter set to `vitalis.care` (change to actual domain)
- Needs Google Cloud Console OAuth app + Supabase Auth provider setup
- Full guide is on the `/users` page in the portal

### Email (Resend)
- Resend free tier: 3,000 emails/month, 100/day — sufficient for current staff count
- Sender domain `vitalis.care` must be verified in Resend dashboard before use
- If RESEND_API_KEY is not set, assignment notifications silently skip (assignment still succeeds)
- Credential alert edge function will return 500 if key not set — safe to deploy and add key later

---

## 4. WHAT TO BUILD NEXT (Priority Order)

### Phase 7 — Mobile Responsive Caregiver View
- Caregivers primarily use phones
- All pages need mobile-optimised layouts
- PWA capability (add to home screen)

### Phase 8 — Google Workspace SSO Activation
- Complete the Google Cloud OAuth setup
- Test with @vitalis.care accounts

### Phase 9 — BCHD Compliance Export
- Generate PDF/Excel compliance reports for BCHD submissions
- Staff training completion certificates (PDF generation)
- EVV compliance data

### Phase 10 — Document Storage
- Upload actual credential documents (PDFs, images) to Supabase Storage
- Staff can upload their own CPR cards, TB results etc.

### Phase 11 — Policy Notifications
- Email when new policy published requiring sign-off
- Currently skipped — assignment emails done in v1.3

---

## 5. OWNER PREFERENCES FOR DEVELOPMENT

### Delivery Format
- **Always produce a versioned zip file** named `vitalis-portal-vX.X.zip`
- Zip extracts to folder named to match zip (e.g. `vitalis-portal-v1.3/`)
- SQL changes go in `supabase/migrations/` as numbered files AND in a clean text block in the response
- Never put decoration lines (===, ---) in SQL files — pure SQL only

### Update Application Instructions
- Provide explicit line-by-line Terminal commands
- Never combine multiple commands in one block that requires copy-paste from a formatted response
- Always specify which files changed
- Git commit messages use format: `vX.X — description`

### SQL Instructions  
- Always provide SQL as clean copy-pasteable blocks with no surrounding text inside the block
- Separate each logical group into its own block
- Never combine DROP + CREATE in same block

### Deployment
- All development targets `vitalis-portal.vercel.app`
- Push to GitHub main branch triggers auto-deploy
- Local dev: `cd ~/Downloads/vitalis-portal && npm run dev`

### Technology Preferences
- Same stack: Next.js + Supabase + Vercel
- No middleware.ts
- User management inside the portal (not via Supabase dashboard)

---

## 6. HOW TO RESUME DEVELOPMENT

### Start new conversation with:
> "I am continuing development of the Vitalis Portal. Please read the HANDOFF.md file context below and continue from where we left off."
> Then paste this entire document.

### Local development
```bash
cd ~/Downloads/vitalis-portal
npm run dev
```

### Deploy update
```bash
cd ~/Downloads/vitalis-portal
git add .
git commit -m "vX.X — description of changes"
git push origin main
```

### Apply new SQL migration
1. Go to supabase.com → vitalis-portal project → SQL Editor
2. New Query → paste SQL → Run
3. Save SQL as new numbered file in `supabase/migrations/`

### Deploy Edge Function
```bash
cd ~/Downloads/vitalis-portal
supabase functions deploy credential-alerts --project-ref ttojfvyfxqyzwvuzhvtd
```
Then in Supabase Dashboard → Edge Functions → credential-alerts → Schedule → Add cron: `0 9 * * *`

---

## 7. ADMIN CREDENTIALS
- **Portal URL:** https://vitalis-portal.vercel.app
- **Admin email:** oxofoegbu@gmail.com
- **GitHub org:** Vitalis-Healthcare
- **GitHub repo:** Vitalis-Portal
