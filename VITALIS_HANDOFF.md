# VITALIS PORTAL — HANDOFF v2.9.50
**Date:** March 27, 2026  
**Live URL:** https://vitalis-portal.vercel.app  
**GitHub:** Vitalis-Healthcare/Vitalis-Portal (branch: main)  
**Supabase:** ttojfvyfxqyzwvuzhvtd.supabase.co  
**Stack:** Next.js 16.2.1 · Supabase · Vercel · TypeScript · Resend  
**Admin login:** oxofoegbu@gmail.com  
**Local repo:** ~/Documents/Vitalis-Portal  

---

## CRITICAL ARCHITECTURAL RULES (read before touching any file)

- **Never** use `middleware.ts` — causes Vercel Edge Runtime errors
- **Never** use `.catch()` on Supabase builders — always wrap in `try/catch`
- **Never** use `/gs` or `/s` regex flags — tsconfig targets ES2017
- **Always** type Supabase joined relations as `T | T[]` with `Array.isArray()` guard
- **Always** use `createServiceClient()` for ALL server-side DB queries — anon client is blocked by RLS on virtually every table
- **Never** add `updated_at` to courses table updates — column does not exist
- Supabase `audit_log` inserts must be wrapped in `try/catch`, never `.catch()`
- Delivery: every change committed and pushed to main → Vercel auto-deploys in ~90s

---

## MIGRATIONS RUN (all confirmed in Supabase)

| # | File | What it does |
|---|------|-------------|
| 031 | compliance_snapshots.sql | Reports snapshots table |
| 032 | handle_new_user_trigger.sql | Auto-creates profiles row on every auth.users insert |
| 033 | profiles_status_pending.sql | Adds pending/rejected to profiles status constraint |
| 034 | module_2_1_FINAL_v2.sql | Module 2.1 Infection Control published |
| 035 | module_2_2_home_safety.sql | Module 2.2 Home Safety published |
| 036 | module_3_1_adls.sql | Module 3.1 ADLs published |

---

## AUTH FLOWS (fully working as of today)

### Flow 1 — Admin invites user
- User Management → Invite Staff → enter name + email + role
- Server: `POST /api/staff/invite` → `svc.auth.admin.createUser()` → trigger creates profile → `generateLink({ type: 'recovery' })` → Resend branded email
- User clicks "Set My Password" → `/auth/confirm?token_hash=XXX&type=recovery` (server route) → `verifyOtp()` → session cookie set → redirect to `/update-password`
- `/update-password` is a simple form — no token handling needed, session already set

### Flow 2 — Forgot password
- Login page → "Forgot password?" → `POST /api/auth/send-reset` → same hashed_token flow → same `/auth/confirm` → `/update-password`

### Flow 3 — Self-registration (Create Account tab REMOVED)
- Login page has no Create Account tab — access by invitation only

### Key auth files
- `app/auth/confirm/route.ts` — server-side token verification (THE critical file)
- `app/api/staff/invite/route.ts` — admin invite
- `app/api/auth/send-reset/route.ts` — forgot password via Resend
- `app/update-password/page.tsx` — simple password form (no token logic)

---

## USER MANAGEMENT (fully working)

- `app/(dashboard)/users/UsersClient.tsx` — main UI
- `app/api/staff/invite/route.ts` — creates auth user + profile + sends invite email
- `app/api/admin/update-profile/route.ts` — profile edits via service client
- `app/api/admin/delete-user/route.ts` — deletes from both auth.users AND profiles
- `app/api/auth/approve/route.ts` — approves pending account, sends email
- `app/api/auth/reject/route.ts` — rejects pending account, notifies user
- Pending approvals banner shown at top of User Management page when accounts are waiting

---

## LMS — STATUS

### Programmes
- PROG-001 Annual Caregiver Training (12 modules) — IN PRODUCTION
- PROG-002 Alzheimer's & Dementia (7 modules) — NOT STARTED
- PROG-003 Autism Specialist (6 modules) — NOT STARTED  
- PROG-004 Developmental Disability (6 modules) — NOT STARTED

### Published modules (PROG-001)
| Module | Title | Track | Status |
|--------|-------|-------|--------|
| PROG001-MOD-001 | Maryland RSA Regulations | Track 1 | ✅ Published |
| PROG001-MOD-002 | HIPAA & Client Confidentiality | Track 1 | ✅ Published |
| PROG001-MOD-003 | Abuse, Neglect & Exploitation | Track 1 | ✅ Published |
| PROG001-MOD-004 | Infection Control & Universal Precautions | Track 2 | ✅ Published |
| PROG001-MOD-005 | Home Safety & Emergency Preparedness | Track 2 | ✅ Published |
| PROG001-MOD-006 | Activities of Daily Living (ADLs) | Track 3 | ✅ Published |
| PROG001-MOD-007 | Nutrition, Meal Prep & Feeding | Track 3 | ⬜ Draft |
| PROG001-MOD-008 | EVV with AxisCare | Track 4 | ⬜ Draft |
| PROG001-MOD-009 | Visit Documentation & Incident Reporting | Track 4 | ⬜ Draft |
| PROG001-MOD-010 | Communication, Dignity & Cultural Competency | Track 5 | ⬜ Draft |
| PROG001-MOD-011 | Dementia & Behavioural Support | Track 5 | ⬜ Draft |
| PROG001-MOD-012 | Professionalism, Boundaries & Self-Care | Track 6 | ⬜ Draft |

### LMS key files
- `app/(dashboard)/lms/page.tsx` — main LMS page (programmes list)
- `app/(dashboard)/lms/programmes/[slug]/page.tsx` — programme detail, module list, enroll button
- `app/(dashboard)/lms/programmes/[slug]/RequestEnrollmentButton.tsx` — caregiver enroll button
- `app/(dashboard)/lms/courses/[id]/page.tsx` — course detail, Assign Staff button
- `app/(dashboard)/lms/courses/[id]/take/CoursePlayer.tsx` — course player (video/text/quiz)
- `app/(dashboard)/lms/courses/[id]/edit/page.tsx` — edit page
- `components/lms/CourseBuilderForm.tsx` — course builder UI
- `app/api/lms/course/save/route.ts` — course save/publish via service client
- `app/api/lms/course/assign/route.ts` — assign staff to course via service client
- `app/api/enrollment-requests/create/route.ts` — caregiver requests enrollment
- `app/api/enrollment-requests/review/route.ts` — admin approves/rejects + creates course_enrollments for ALL published modules

### LMS content format (for new SQL modules)
Each module has 3 sections: video (order 0), text/HTML study guide (order 1), quiz (order 2).
- Track 1 colour: `#A32D2D` | Track 2: `#185FA5` | Track 3: `#3B6D11` | Track 4: `#BA7517` | Track 5: `#534AB7` | Track 6: `#0F6E56`
- Quiz options must use `to_jsonb(ARRAY[...]::text[])` — options column is jsonb not text[]
- Use `lms_module_id` (e.g. `PROG001-MOD-007`) to find the course UUID in migrations
- After inserting, run `UPDATE courses SET status = 'published' WHERE lms_module_id = '...'`

### Pending LMS modules (content ready to build)
Module 3.2 (Nutrition), 4.1 (EVV/AxisCare), 4.2 (Documentation), 5.1 (Communication), 5.2 (Dementia), 6.1 (Professionalism) — all need Synthesia video + study guide PDF + quiz PDF from Okezie before SQL can be built.

---

## POLICIES & PROCEDURES

- Domain 1–5: 60 policies ✅ Complete (v2.0, effective March 15 2026)
- Domain 6: Client Rights & Safety (VHS-D6-001 through VHS-D6-007) — IN PROGRESS
- Format: two-tier ("What This Means For You" + compliance language)
- Key files: `app/(dashboard)/pp/page.tsx`, `app/(dashboard)/pp/[docId]/page.tsx`, `app/(dashboard)/pp/domain/[domain]/page.tsx`
- All PP API routes use service client

---

## REPORTS MODULE

- Phase 1: Compliance Matrix + PDF/CSV export ✅ Built
- Phase 2: Training Gap, Appraisal Heatmap, References Pipeline ✅ Built (confirm tabs visible)
- Phase 3: AI Compliance Analyst tab ✅ Built
- Snapshots table: migration 031 ✅ Run
- Key files: `lib/reports.ts`, `app/(dashboard)/reports/ReportsClient.tsx`, `app/(dashboard)/reports/ReportsAITab.tsx`

---

## MOBILE OPTIMISATION

- Global: `app/mobile.css` (imported in `app/layout.tsx`)
- Layout shell: `components/layout/LayoutShell.tsx` — hamburger drawer on mobile
- Updated: `components/layout/Topbar.tsx`, `components/layout/Sidebar.tsx`
- LMS, course player, PP pages patched March 27 2026
- All grids use `repeat(auto-fit, minmax(...))` pattern for responsiveness

---

## KEY API ROUTES

| Route | Purpose |
|-------|---------|
| `POST /api/staff/invite` | Admin invites user (auth + profile + Resend email) |
| `POST /api/auth/send-reset` | Forgot password via Resend |
| `GET  /auth/confirm` | Server-side token verification (critical auth route) |
| `POST /api/admin/update-profile` | Edit staff profile via service client |
| `POST /api/admin/delete-user` | Delete user from auth + profiles |
| `POST /api/auth/approve` | Approve pending account |
| `POST /api/auth/reject` | Reject pending account |
| `POST /api/lms/course/save` | Save/publish course content |
| `POST /api/lms/course/assign` | Assign staff to course |
| `POST /api/enrollment-requests/create` | Caregiver requests programme enrollment |
| `POST /api/enrollment-requests/review` | Admin approves/rejects + creates course_enrollments |
| `POST /api/notify/welcome` | Welcome email via Resend |
| `POST /api/notify/pending-approval` | Admin notification of new self-registration |
| `POST /api/reports/ai-chat` | AI Compliance Analyst |

---

## ENVIRONMENT VARIABLES (Vercel)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |
| `RESEND_API_KEY` | Resend email API key |
| `NOTIFY_FROM_EMAIL` | From address for all emails |
| `NEXT_PUBLIC_PORTAL_URL` | https://vitalis-portal.vercel.app |
| `ADMIN_ALERT_EMAIL` | oxofoegbu@gmail.com |
| `ANTHROPIC_API_KEY` | For AI Compliance Analyst |

---

## PENDING ITEMS

### Quick (< 1 hour each)
- [ ] Google SSO — add `https://vitalis-portal.vercel.app` to Authorized JavaScript Origins in Google Cloud Console
- [ ] Resend DNS verification — add DNS records for vitalishealthcare.com so emails send from proper domain
- [ ] EP ICS role designations — 3 roles still [TO BE DESIGNATED]
- [ ] Reports Phase 2 — confirm 3 new tabs (Training Gap, Heatmap, Pipeline) visible after deploy

### Medium builds
- [ ] Modules 3.2 through 6.1 — need video + study guide + quiz from Okezie, then SQL build
- [ ] PP Domain 6 completion — 7 policies (VHS-D6-001 through VHS-D6-007)
- [ ] Bulk CSV import — BulkImportModal.tsx exists, /api/staff/invite is fixed, safe to deploy

### Large builds
- [ ] Notification centre — bell icon exists in Topbar but does nothing
- [ ] Reports PDF export for Phase 2 (Training Gap, Heatmap, Pipeline)
- [ ] Automated BCHD narrative report (AI-drafted quarterly compliance narrative)

---

## STAFF

- **Marie Epah** — Director of Nursing
- **Somto Illomuanya** — Compliance & Billing
- **Happiness Samuel** — Caregiver
- **Peace Enoch** — Caregiver

---

## SUPABASE CLIENT PATTERN (copy this every time)

```typescript
// Server component or API route — ALWAYS use service client for DB queries
import { createClient } from '@/lib/supabase/server'      // for auth only
import { createServiceClient } from '@/lib/supabase/service' // for ALL DB queries

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()   // auth via server client
const svc = createServiceClient()                           // DB via service client
const { data } = await svc.from('table').select('*')        // always svc for data
```

---

## LMS SQL TEMPLATE (for new modules)

```sql
DO $$
DECLARE
  v_course_id UUID;
  v_section_vid UUID;
  v_section_txt UUID;
  v_section_qz  UUID;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE lms_module_id = 'PROG001-MOD-XXX';
  IF v_course_id IS NULL THEN RAISE EXCEPTION 'Course not found'; END IF;

  -- Clean existing content
  DELETE FROM quiz_questions WHERE section_id IN (SELECT id FROM course_sections WHERE course_id = v_course_id);
  DELETE FROM course_sections WHERE course_id = v_course_id;

  -- Section 0: Video
  INSERT INTO course_sections (id, course_id, title, type, content, video_url, pdf_url, order_index)
  VALUES (gen_random_uuid(), v_course_id, 'Introduction Video', 'video', 'Description...', 'SYNTHESIA_URL', NULL, 0)
  RETURNING id INTO v_section_vid;

  -- Section 1: Study Guide (HTML)
  INSERT INTO course_sections (id, course_id, title, type, content, video_url, pdf_url, order_index)
  VALUES (gen_random_uuid(), v_course_id, 'Study Guide — Title', 'text', $HTML$...HTML here...$HTML$, NULL, NULL, 1)
  RETURNING id INTO v_section_txt;

  -- Section 2: Quiz
  INSERT INTO course_sections (id, course_id, title, type, content, video_url, pdf_url, order_index)
  VALUES (gen_random_uuid(), v_course_id, 'Module X.X Knowledge Quiz', 'quiz', NULL, NULL, NULL, 2)
  RETURNING id INTO v_section_qz;

  -- Quiz questions (options MUST use to_jsonb cast)
  INSERT INTO quiz_questions (section_id, question, options, correct_index, order_index) VALUES
  (v_section_qz, 'Question text?',
   to_jsonb(ARRAY['Option A', 'Option B', 'Option C', 'Option D']::text[]),
   1, 0); -- correct_index is 0-based

  UPDATE courses SET status = 'published' WHERE lms_module_id = 'PROG001-MOD-XXX';
  RAISE NOTICE 'Module published. Course ID: %', v_course_id;
END $$;
```
