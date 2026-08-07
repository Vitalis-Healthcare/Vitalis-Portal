// lib/onboarding/overdue-cjis.ts
//
// WHO is overdue on a CJIS result, right now.
//
// One loader, two consumers: the daily sweep that emails, and the banner every
// member of staff sees on sign-in. If those two read different queries they
// would eventually disagree, and the moment staff notice the banner and the
// email telling different stories is the moment both stop being believed.
//
// Deliberately does NOT re-run the full gate. The gate answers "may this
// candidate proceed"; this answers "is anybody sitting on an unresolved CJIS
// promise". A converted caregiver is past the gate entirely and is exactly the
// person we must keep chasing — dropping them here would recreate the hole
// this whole feature exists to close.

import { createServiceClient } from '@/lib/supabase/service'
import { escalationTier, fingerprintStatus, todayISO } from '@/lib/onboarding/fingerprint'

export interface OverdueCjis {
  candidateId: string
  firstName: string
  lastName: string
  status: string | null
  /** 'YYYY-MM-DD' */
  sentAt: string
  expectedBy: string
  note: string | null
  /** How many times the date has already been pushed out. */
  extensionCount: number
  daysOverdue: number
  tier: 0 | 1 | 2 | 3
  /** Set once the candidate became a caregiver — they are still chased. */
  convertedProfileId: string | null
}

interface AttRow {
  id: string
  candidate_id: string
  sent_at: string
  expected_by: string
  note: string | null
  supersedes_id: string | null
}

/**
 * Every live attestation whose expected date has passed, worst first.
 *
 * Returns [] on any failure rather than throwing. A sweep that cannot read is
 * a sweep that sends nothing, which is quiet — but a banner that throws would
 * take down every dashboard in the agency, and a chased CJIS is not worth
 * that.
 */
export async function loadOverdueCjis(today: string = todayISO()): Promise<OverdueCjis[]> {
  const svc = createServiceClient()

  let rows: AttRow[] = []
  try {
    const { data, error } = await svc
      .from('onb_fingerprint_attestations')
      .select('id, candidate_id, sent_at, expected_by, note, supersedes_id')
      .is('cleared_at', null)
      .is('superseded_at', null)
      .lt('expected_by', today)
      .order('expected_by', { ascending: true })
      .limit(200)
    if (error || !Array.isArray(data)) return []
    rows = data as AttRow[]
  } catch {
    return []
  }
  if (rows.length === 0) return []

  const candidateIds = Array.from(new Set(rows.map((r) => r.candidate_id)))

  // The candidates themselves.
  let candidates: Record<string, { first_name: string; last_name: string; status: string | null; converted_to_profile_id: string | null }> = {}
  try {
    const { data } = await svc
      .from('onb_candidates')
      .select('id, first_name, last_name, status, converted_to_profile_id')
      .in('id', candidateIds)
    for (const c of Array.isArray(data) ? data : []) {
      candidates[String(c.id)] = {
        first_name: c.first_name || '',
        last_name: c.last_name || '',
        status: c.status ?? null,
        converted_to_profile_id: c.converted_to_profile_id ?? null,
      }
    }
  } catch {
    candidates = {}
  }

  // How many times each candidate's date has already been pushed. A repeat
  // extender is the pattern worth seeing, so it goes in the email.
  const extensionCount: Record<string, number> = {}
  try {
    const { data } = await svc
      .from('onb_fingerprint_attestations')
      .select('candidate_id')
      .in('candidate_id', candidateIds)
      .not('supersedes_id', 'is', null)
    for (const r of Array.isArray(data) ? data : []) {
      const k = String(r.candidate_id)
      extensionCount[k] = (extensionCount[k] || 0) + 1
    }
  } catch {
    // Absent counts are shown as zero — never a reason to drop the row.
  }

  const out: OverdueCjis[] = []
  for (const r of rows) {
    const s = fingerprintStatus({ sentAt: r.sent_at, expectedBy: r.expected_by }, today)
    if (s.state !== 'overdue') continue
    const c = candidates[String(r.candidate_id)]
    // A candidate row that has vanished (deleted mid-flight) is skipped rather
    // than emailed as a blank name.
    if (!c) continue
    // A withdrawn candidate is not going anywhere near a client, so chasing
    // their background check is noise. Everyone else — including converted
    // caregivers — stays on the list.
    if (c.status === 'withdrawn') continue
    out.push({
      candidateId: r.candidate_id,
      firstName: c.first_name,
      lastName: c.last_name,
      status: c.status,
      sentAt: r.sent_at,
      expectedBy: r.expected_by,
      note: r.note,
      extensionCount: extensionCount[String(r.candidate_id)] || 0,
      daysOverdue: s.daysOverdue,
      tier: escalationTier(s.daysOverdue),
      convertedProfileId: c.converted_to_profile_id,
    })
  }

  // Worst first — the reader should meet the most overdue person immediately.
  out.sort((a, b) => b.daysOverdue - a.daysOverdue)
  return out
}

/** The loudest tier present, or 0 when the list is empty. */
export function worstTier(list: OverdueCjis[]): 0 | 1 | 2 | 3 {
  let worst: 0 | 1 | 2 | 3 = 0
  for (const o of list) if (o.tier > worst) worst = o.tier
  return worst
}
