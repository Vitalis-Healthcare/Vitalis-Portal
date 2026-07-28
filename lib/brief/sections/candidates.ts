// ═════════════════════════════════════════════════════════════════════════
// The Thursday Brief — Candidates section (v0.6.28)
//
// This section deliberately computes almost nothing. `loadTrackBoard()`
// already works out, for every candidate, whose move it is, how long it has
// been waiting, whether that counts as stalled, and what the next action is
// — and it derives the next action from `evaluateConvertGate`, the same
// evaluator the convert route enforces with.
//
// So the Brief reuses it wholesale. If the board and the Brief ever
// disagreed about whether somebody is stuck, one of them would be lying to
// the team, and there would be no way to tell which.
//
// The one judgement made here is the split between "stalled" and "orphaned",
// and it follows the board's own `owner` field:
//
//   waiting on the CANDIDATE, too long  -> stalled  (somebody should chase)
//   waiting on US, too long             -> orphaned (nobody picked it up)
//
// That second list is the one worth reading first.
// ═════════════════════════════════════════════════════════════════════════

import { loadTrackBoard, type TrackRow } from '@/lib/onboarding/track-board'
import { createServiceClient } from '@/lib/supabase/service'
import type { BriefSection, Item, Metric } from '@/lib/brief/types'

const KEY = 'candidates'
const TITLE = 'Candidates'

/** An independent count of `onb_candidates`, used ONLY to corroborate the
 *  board.
 *
 *  This exists because `loadTrackBoard()` catches its own database errors
 *  and returns `[]`. That is reasonable for a page — an empty board is
 *  survivable — but it is dangerous here: an unreachable database and a
 *  genuinely empty pipeline produce byte-identical output, and the Brief
 *  would cheerfully tell the whole team that nothing is stalled and nothing
 *  is waiting on anybody.
 *
 *  So we ask a second, simpler question. If this count disagrees with the
 *  board, we report neither number and say why.
 *
 *  Returns null if the probe itself cannot run. */
async function probeCandidateCount(): Promise<number | null> {
  try {
    const svc = createServiceClient()
    const { count, error } = await svc
      .from('onb_candidates')
      .select('id', { count: 'exact', head: true })
    if (error) return null
    return typeof count === 'number' ? count : null
  } catch {
    return null
  }
}

function unreadable(reason: string): BriefSection {
  return {
    key: KEY,
    title: TITLE,
    headline: [
      { label: 'In progress', value: null, hint: 'could not be read' },
      { label: 'Moved this week', value: null, hint: 'could not be read' },
      { label: 'Completed this week', value: null, hint: 'could not be read' },
      { label: 'Waiting on us', value: null, hint: 'could not be read' },
    ],
    moved: [],
    stalled: [],
    orphaned: [],
    upcoming: [],
    note: null,
    warnings: [reason],
  }
}

/** How the board's `owner` reads to somebody who has never seen the board. */
function ownerWords(o: TrackRow['owner']): string {
  if (o === 'candidate') return 'the candidate'
  if (o === 'staff') return 'staff'
  if (o === 'admin') return 'an administrator'
  if (o === 'done') return 'nobody — complete'
  if (o === 'closed') return 'nobody — closed'
  return 'unassigned'
}

function fullName(r: TrackRow): string {
  const n = ((r.firstName || '') + ' ' + (r.lastName || '')).trim()
  return n.length > 0 ? n : (r.email || 'Unnamed candidate')
}

function toItem(r: TrackRow): Item {
  return {
    label: fullName(r),
    detail: r.nextAction,
    days: r.daysSinceMovement,
    owner: ownerWords(r.owner),
    href: '/candidates/' + r.id,
  }
}

/** Newest first for things that moved, longest-waiting first for things that
 *  did not. A reader scanning a stalled list wants the worst case at the top. */
function byDaysDesc(a: Item, b: Item): number {
  return (b.days || 0) - (a.days || 0)
}

export async function collectCandidates(
  closedSince: Date,
  closedUntil: Date
): Promise<BriefSection> {
  const warnings: string[] = []
  let rows: TrackRow[] = []

  const probed = await probeCandidateCount()
  if (probed === null) {
    return unreadable(
      'Candidate figures unavailable: the candidate table could not be reached.'
    )
  }

  try {
    rows = await loadTrackBoard()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return unreadable('Candidate board unavailable: ' + msg)
  }

  // The corroboration. `loadTrackBoard()` swallows its own errors and
  // returns an empty array, so an empty board against a non-empty table
  // means the load failed silently — NOT that there are no candidates.
  if (rows.length === 0 && probed > 0) {
    return unreadable(
      'Candidate figures suppressed: the track board returned nothing while ' +
        probed +
        ' candidate records exist. Reporting zero here would be wrong, so nothing is reported.'
    )
  }

  const sinceMs = closedSince.getTime()
  const untilMs = closedUntil.getTime()

  const live: TrackRow[] = []
  const moved: Item[] = []
  const stalled: Item[] = []
  const orphaned: Item[] = []
  let completedInWindow = 0

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    if (r.isClosed) continue
    if (!r.isComplete) live.push(r)

    const movedAt = r.lastMovementAt ? Date.parse(r.lastMovementAt) : NaN
    const movedInWindow = !isNaN(movedAt) && movedAt >= sinceMs && movedAt < untilMs

    if (movedInWindow) {
      moved.push(toItem(r))
      if (r.isComplete) completedInWindow++
    }

    if (r.stalled && !r.isComplete) {
      if (r.owner === 'staff' || r.owner === 'admin') {
        orphaned.push(toItem(r))
      } else {
        stalled.push(toItem(r))
      }
    }
  }

  stalled.sort(byDaysDesc)
  orphaned.sort(byDaysDesc)
  moved.sort(function (a, b) { return (a.days || 0) - (b.days || 0) })

  const headline: Metric[] = [
    { label: 'In progress', value: live.length, hint: 'not yet converted or closed' },
    { label: 'Moved this week', value: moved.length, hint: null },
    { label: 'Completed this week', value: completedInWindow, hint: null },
    {
      label: 'Waiting on us',
      value: orphaned.length,
      hint: orphaned.length > 0 ? 'past the stall threshold' : null,
    },
  ]

  const nothingHappening =
    moved.length === 0 && stalled.length === 0 && orphaned.length === 0

  return {
    key: KEY,
    title: TITLE,
    headline: headline,
    moved: moved,
    stalled: stalled,
    orphaned: orphaned,
    upcoming: [],
    note: nothingHappening
      ? 'No candidate moved this week and nothing is past its stall threshold.'
      : null,
    warnings: warnings,
  }
}
