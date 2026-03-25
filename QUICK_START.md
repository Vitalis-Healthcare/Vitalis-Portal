# Vitalis Portal v1.0 — Quick Start

## One-time setup (takes ~5 minutes)

### Step 1 — Open Terminal
On your Mac: press `Cmd + Space`, type **Terminal**, press Enter.

### Step 2 — Navigate to this folder
```bash
cd ~/Downloads/vitalis-portal-v1.0
```

### Step 3 — Run the setup script
```bash
bash setup.sh
```
The script will:
- ✅ Check Node.js is installed
- ✅ Install all dependencies
- ✅ Ask for your Supabase credentials and create `.env.local`
- ✅ Open the app in your browser at http://localhost:3000

---

## Before running the script — set up Supabase (free)

1. Go to **https://supabase.com** → Sign Up (free account)
2. Click **New Project** → name it `vitalis-portal`
3. Go to **Project Settings → API**
4. Copy your **Project URL** (looks like `https://abc123.supabase.co`)
5. Copy your **anon public key** (long string starting with `eyJ...`)

Then go to **SQL Editor** and run the two SQL blocks inside:
`supabase/migrations/VITALIS_SQL_COMMANDS.txt`

---

## After setup — make yourself Admin

1. Sign up at http://localhost:3000
2. Go to Supabase → **Table Editor** → `profiles`
3. Find your row, click the `role` cell, change it to `admin`
4. Reload the portal — full admin access unlocked

---

## Node.js not installed?

Download from: **https://nodejs.org** (choose LTS version)
Or with Homebrew: `brew install node`

---

## Every subsequent launch

```bash
cd ~/Downloads/vitalis-portal-v1.0
npm run dev
```
Then open **http://localhost:3000**

---

## Deploy to the web (Vercel — free tier)

```bash
npm install -g vercel
vercel
```
Add your two env vars in the Vercel dashboard when prompted.
Then every `git push` auto-deploys.

---

*Vitalis Healthcare Services · Baltimore, Maryland · v1.1*

---

## Upgrading from v1.0

If you already have v1.0 running, just replace these two files in your existing project:

1. **Delete** `middleware.ts`
2. **Add** `proxy.ts` (included in this zip)

No database changes needed — your Supabase data is untouched.

