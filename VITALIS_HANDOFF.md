# Vitalis Portal — Development Handoff
**Last updated:** March 26, 2026
**Stable version:** v2.9.1-stable (post-RLS fix)
**Live:** https://vitalis-portal.vercel.app
**GitHub:** https://github.com/Vitalis-Healthcare/Vitalis-Portal
**Supabase:** https://ttojfvyfxqyzwvuzhvtd.supabase.co
**Stack:** Next.js 16.2 + Supabase + Vercel

---

## CRITICAL — READ BEFORE TOUCHING ANY CODE

### The RLS Problem (resolved — do not reintroduce)
Supabase RLS on the `profiles` table blocks the anon key from reading other users' rows.
This means any server component that calls `supabase.from('profiles')` with the regular
client will return null for any user other than the logged-in user themselves.

**The fix is in `lib/supabase/service.ts`:**
```typescript
import { createServiceClient } from '@/lib/supabase/service'
const svc = createServiceClient()
const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
```

**Rule:** Every server-side page.tsx that reads `profiles` for a role check MUST use `createServiceClient()`.
Client components (mutations, writes, CoursePlayer, forms) correctly use the anon client — leave those alone.

### Next.js 16.2 — params must be awaited
Dynamic route params are a Promise in Next.js 16.2+:
```typescript
// WRONG — returns undefined
export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id

// CORRECT
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
```
This is already fixed in `staff/[id]/page.tsx`. Apply to any new dynamic routes.

---

## WHAT IS LIVE AND WORKING (v2.9.1-stable)

| Module | Status | Notes |
|---|---|---|
| Dashboard | ✅ | Admin view with stats, caregiver personal view |
| Training (LMS) | ✅ | Course builder, course player, assign to staff |
| Policies & Procedures | ✅ | 70 P&P docs D1–D7, acknowledgement, AI sidebar |
| Emergency Preparedness | ✅ | 12 tabs, Living Plan, Vercel cron email reminders |
| Credentials | ✅ | Matrix (caregivers only), upload, does_not_expire, expiry alerts |
| Staff Portal | ✅ | Caregiver directory, individual profile with training/creds/policies |
| User Management | ✅ | Invite, edit roles, delete (service role API) |
| Reports | ✅ | Summary stats, training completion, credential alerts, policy sign-offs |
| Settings | ✅ | My Profile, Credential Types, Positions (12 seeded), Organisation |
| Credential Expiry Alerts | ✅ | Vercel cron 9am UTC, per-type thresholds, admin digest |

### 4-tier role system
- `caregiver` — sees My Training, Policies, My Credentials only
- `staff` — back-office, sees all modules except admin panel
- `supervisor` — same as admin
- `admin` — full access including User Management, Reports, Settings

### Role badge in sidebar
Shows "Admin", "Supervisor", "Staff", or "Caregiver" at bottom of sidebar.
Role is passed from `layout.tsx` (server-side, service client) → Sidebar (client component).
Sidebar does NOT fetch role independently.

---

## INFRASTRUCTURE

### Vercel Environment Variables (all set)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `CRON_SECRET` = vitalis-ep-cron-2026

### Vercel Crons
- `/api/ep-reminders` → `0 8 * * *` (EP compliance reminders)
- `/api/credential-alerts` → `0 9 * * *` (credential expiry alerts)

### Supabase Migrations run (001–027)
001 initial schema, 002 seed, 003 RLS fix, 004 trigger fix,
005–009 LMS/email/credentials, 010–019 P&P tables + D1–D7 seeds,
020 PP link fix, 021–024 EP tables + reminder log,
025 role system update, 026 positions table, 027 credential fixes

### Key RLS policy on profiles
```sql
-- profiles_select_all_authenticated (migration 003)
-- Allows any authenticated user to SELECT any profile row
-- This is intentional — role enforcement is done in code, not RLS
CREATE POLICY "profiles_select_all_authenticated" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');
```
If this policy is missing or broken, ALL role-based navigation breaks.
Check with: SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

---

## PENDING / STILL TO BUILD
1. Reports — caregiver-by-caregiver compliance matrix + CSV export for BCHD
2. Credential expiry alerts — cron is wired, needs Resend domain verification
3. Google OAuth — redirect URI: https://ttojfvyfxqyzwvuzhvtd.supabase.co/auth/v1/callback
4. EP Security Gaps — Safety Officer, Maintenance Director, Staff Dev. Coordinator "[TO BE DESIGNATED]"
5. Caregiver mobile experience optimisation
6. BCHD-specific exports and reporting

---

## HOW TO DEPLOY AN UPDATE
```bash
# In every release zip there is a deploy.sh — just run:
unzip -o ~/Downloads/vitalis-portal-vX.X.X.zip -d ~/Downloads/
bash ~/Downloads/vitalis-portal-vX.X.X/deploy.sh
```

## HOW TO RESUME DEVELOPMENT
Start new conversation with:
> "I am continuing development of the Vitalis Portal. I am uploading the session transcript
> and current codebase zip. Please read both before we begin."
> Upload: this handoff zip + session transcript

## ADMIN CREDENTIALS
- Portal: https://vitalis-portal.vercel.app
- Admin email: oxofoegbu@gmail.com
- GitHub org: Vitalis-Healthcare / Vitalis-Portal
- Supabase project: ttojfvyfxqyzwvuzhvtd
