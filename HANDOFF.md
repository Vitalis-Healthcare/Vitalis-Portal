# Vitalis Portal — Development Handoff Document
**Last updated:** March 25, 2026  
**Current version:** v1.2 (live at vitalis-portal.vercel.app)  
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
| Policies & Procedures | ✅ Live | `/policies` |
| Credentials | ✅ Live | `/credentials` |
| Staff Portal | ✅ Live | `/staff` |
| User Management | ✅ Live | `/users` |
| Reports | ✅ Live | `/reports` |
| Settings | ✅ Live | `/settings` |

### Key Features
- **LMS:** Course builder (text, video, PDF, quiz sections), assign to staff, track completions
- **Policies:** Create/publish policies, timestamped digital sign-off, version control, searchable
- **Credentials:** CPR, TB, Background Check etc. matrix, expiry alerts, auto-status trigger
- **User Management:** Invite staff by email (magic link), edit roles, activate/deactivate
- **Google Workspace SSO:** Button is on login page, needs Google Cloud OAuth app setup (see /users page for guide)
- **Audit log:** Every action recorded with user ID and timestamp

### Database Tables
`profiles`, `courses`, `course_sections`, `quiz_questions`, `course_enrollments`, `section_progress`, `policies`, `policy_acknowledgements`, `credential_types`, `staff_credentials`, `audit_log`

### Default Credential Types (already seeded)
CPR Certification, First Aid Certificate, Background Check, TB Test/Screening, CNA License, Driver's License, I-9 Work Authorization, HIPAA Training Certificate

---

## 2. INFRASTRUCTURE

### Vercel Settings (IMPORTANT)
- **Framework Preset:** Next.js ← must stay as this
- **Root Directory:** blank/empty ← must stay blank
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://ttojfvyfxqyzwvuzhvtd.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0b2pmdnlmeHF5end2dXpodnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTM2MTIsImV4cCI6MjA4OTk2OTYxMn0.Lgw5wNIIPVCGqe9lisQqMEO3S63eQZwXyAFD-l5VBUA`

### Supabase Fixes Applied (all already run)
- Migration 001: Full schema
- Migration 002: Seed credential types
- Migration 003: RLS policy fix (profiles readable by authenticated users)
- Migration 004: Bulletproof trigger (never blocks user creation)

### No middleware.ts or proxy.ts
Auth is handled server-side in `app/(dashboard)/layout.tsx` — no middleware needed.

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

---

## 4. WHAT TO BUILD NEXT (Priority Order)

### Phase 5 — Email Notifications (High Priority)
- Automated emails when credentials expire (30/14/7 days before)
- Email when assigned new training course
- Email when new policy published requiring sign-off
- **Implementation:** Supabase Edge Functions + cron job

### Phase 6 — Course Player (High Priority)  
- Staff can actually take courses inside the portal
- Section-by-section navigation with progress saving
- Quiz taking with score calculation
- Completion certificate (PDF) generation
- Currently courses can be built but not taken

### Phase 7 — Mobile Responsive Caregiver View
- Caregivers primarily use phones
- All pages need mobile-optimised layouts
- PWA capability (add to home screen)

### Phase 8 — Google Workspace SSO Activation
- Complete the Google Cloud OAuth setup
- Test with @vitalis.care accounts
- Staff can sign in with one click

### Phase 9 — BCHD Compliance Export
- Generate PDF/Excel compliance reports formatted for BCHD submissions
- Show EVV compliance data
- Staff training completion certificates

### Phase 10 — Document Storage
- Upload actual credential documents (PDFs, images)
- Supabase Storage bucket
- Staff can upload their own CPR cards, TB results etc.

---

## 5. OWNER PREFERENCES FOR DEVELOPMENT

### Delivery Format
- **Always produce a versioned zip file** named `vitalis-portal-vX.X.zip`
- Zip extracts to folder named to match zip (e.g. `vitalis-portal-v1.3/`)
- Include `setup.sh` automated setup script (Mac compatible)
- SQL changes go in `supabase/migrations/` as numbered files AND in a clean text block in the response
- Never put decoration lines (===, ---) in SQL files — pure SQL only

### Update Application Instructions
- Provide explicit line-by-line Terminal commands, one per code block
- Never combine multiple commands in one block that requires copy-paste from a formatted response
- Always specify which files changed so partial updates can be applied
- Git commit messages use format: `vX.X — description`

### SQL Instructions  
- Always provide SQL as clean copy-pasteable blocks with no surrounding text inside the block
- Separate each logical group into its own block (DROP block, CREATE block, INSERT block)
- Never combine DROP + CREATE in same block

### Deployment
- All development targets `vitalis-portal.vercel.app`
- Push to GitHub main branch triggers auto-deploy
- Local dev: `cd ~/Downloads/vitalis-portal && npm run dev`

### Technology Preferences
- Same stack as Transworld Accounting: Next.js + Supabase + Vercel
- Google Workspace SSO preferred over separate auth
- User management inside the portal (not via Supabase dashboard)
- No middleware.ts (causes Vercel Edge Runtime issues)

---

## 6. HOW TO RESUME DEVELOPMENT

### Start new conversation with:
> "I am continuing development of the Vitalis Portal. Please read the HANDOFF.md file context below and continue from where we left off."
> Then paste this entire document.

### Local development
```bash
cd ~/Downloads/vitalis-portal
npm run dev
# Opens at http://localhost:3000
```

### Deploy update
```bash
cd ~/Downloads/vitalis-portal
git add .
git commit -m "vX.X — description of changes"
git push origin main
# Vercel auto-deploys in ~90 seconds
```

### Apply new SQL migration
1. Go to supabase.com → vitalis-portal project → SQL Editor
2. New Query → paste SQL → Run
3. Save SQL as new numbered file in `supabase/migrations/`

---

## 7. ADMIN CREDENTIALS
- **Portal URL:** https://vitalis-portal.vercel.app
- **Admin email:** oxofoegbu@gmail.com
- **GitHub org:** Vitalis-Healthcare
- **GitHub repo:** Vitalis-Portal

