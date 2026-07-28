// ═════════════════════════════════════════════════════════════════════════
// The Thursday Brief — the collector (v0.6.30)
//
// TWO PROPERTIES THIS FILE EXISTS TO GUARANTEE:
//
//   1. ONE SECTION FAILING NEVER KILLS THE BRIEF. Sections run in parallel
//      and settle independently. A module that is down produces a section
//      carrying a warning; every other section still reports. A report that
//      does not arrive teaches the team to stop expecting it.
//
//   2. THE OUTPUT IS PURE DATA. No HTML, no prose, no formatting. The
//      renderer and the commentary model both consume this and neither can
//      reach past it to the database.
// ═════════════════════════════════════════════════════════════════════════

import type { BriefFacts, BriefSection } from '@/lib/brief/types'
import { briefWindows } from '@/lib/brief/window'
import { collectCandidates } from '@/lib/brief/sections/candidates'
import { collectCarematch } from '@/lib/brief/sections/carematch'
import { collectLeads, collectMarketing } from '@/lib/brief/sections/pipeline'
import {
  collectCompliance,
  collectAssessments,
  collectTraining,
  collectPolicies,
} from '@/lib/brief/sections/operations'

/** Sections in reading order.
 *
 *  The order is an editorial choice, not an alphabetical one: people first
 *  (who is stuck), then demand (where the work comes from), then obligations
 *  (what we owe as a licensed agency). Adding a module means adding one line
 *  here and one function — nothing else in the pipeline changes. */
type SectionFn = (
  closedSince: Date,
  closedUntil: Date,
  aheadSince: Date,
  aheadUntil: Date
) => Promise<BriefSection>

const SECTIONS: Array<{ key: string; title: string; run: SectionFn }> = [
  { key: 'candidates',   title: 'Candidates',          run: function (cs, cu, as_, au) { return collectCandidates(cs, cu) } },
  { key: 'leads',        title: 'Leads and pipeline',  run: function (cs, cu, as_, au) { return collectLeads(cs, cu, as_, au) } },
  { key: 'carematch360', title: 'CareMatch360',        run: function (cs, cu) { return collectCarematch(cs, cu) } },
  { key: 'marketing',    title: 'Marketing',           run: function (cs, cu) { return collectMarketing(cs, cu) } },
  { key: 'assessments',  title: 'Assessments',         run: function (cs, cu, as_, au) { return collectAssessments(cs, cu, as_, au) } },
  { key: 'compliance',   title: 'Compliance',          run: function (cs, cu, as_, au) { return collectCompliance(cs, cu, as_, au) } },
  { key: 'training',     title: 'Training',            run: function (cs, cu) { return collectTraining(cs, cu) } },
  { key: 'policies',     title: 'Policies',            run: function (cs, cu) { return collectPolicies(cs, cu) } },
]

export async function collectFacts(at: Date): Promise<BriefFacts> {
  const w = briefWindows(at)
  const warnings: string[] = []

  const settled = await Promise.all(
    SECTIONS.map(function (s) {
      return s
        .run(w.closed.since, w.closed.until, w.ahead.since, w.ahead.until)
        .then(function (section) { return { ok: true as const, section: section } })
        .catch(function (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e)
          return { ok: false as const, key: s.key, title: s.title, msg: msg }
        })
    })
  )

  const sections: BriefSection[] = []
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i]
    if (r.ok) {
      sections.push(r.section)
    } else {
      // A section that threw rather than returning a warning is a bug, not a
      // data problem. Say so plainly instead of printing an empty table.
      warnings.push(r.title + ' section failed: ' + r.msg)
      sections.push({
        key: r.key,
        title: r.title,
        headline: [{ label: r.title, value: null, hint: 'section failed' }],
        moved: [],
        stalled: [],
        orphaned: [],
        upcoming: [],
        note: null,
        warnings: [r.msg],
      })
    }
  }

  return {
    generated_at: new Date().toISOString(),
    week_key: w.weekKey,
    closed: { since: w.closed.since.toISOString(), until: w.closed.until.toISOString() },
    ahead: { since: w.ahead.since.toISOString(), until: w.ahead.until.toISOString() },
    window_label: w.label,
    sections: sections,
    warnings: warnings,
  }
}
