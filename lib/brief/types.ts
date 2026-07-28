// ═════════════════════════════════════════════════════════════════════════
// The Thursday Brief — shared vocabulary (v0.6.28)
//
// Every module in the portal answers the SAME four questions in the SAME
// words: what moved, what is on track, what is stalled, what has no owner.
// That is the whole idea. A reader learns the shape once and can then read
// any section, including sections that did not exist when they learned it.
//
// This file is types only — no I/O, no Supabase, no imports from the app.
// Sections depend on it; it depends on nothing.
// ═════════════════════════════════════════════════════════════════════════

/** A single number with a label. The Brief prints these as the section's
 *  headline row.
 *
 *  `value` is deliberately `number | string | null`, and `null` is NOT the
 *  same as `0`. Null means "we could not work this out", zero means "we
 *  worked it out and the answer is none". The renderer prints null as an
 *  em dash with the reason attached, because a zero that secretly means
 *  "the query failed" is the single most dangerous thing this report could
 *  do — nobody ever goes looking for a number that appears to be fine. */
export interface Metric {
  label: string
  value: number | string | null
  /** Shown small, beneath the number. Use it for the denominator, the
   *  comparison, or the reason a value is null. */
  hint?: string | null
}

/** Whose move it is. Borrowed verbatim from the candidate track board
 *  (`lib/onboarding/track-board.ts`) so the two never drift apart — if the
 *  board says a candidate is waiting on admin, the Brief says the same. */
export type Owner = 'candidate' | 'staff' | 'admin' | 'client' | 'external' | 'done' | 'closed'

/** One line item inside a section. */
export interface Item {
  /** Who or what this is. A person's name, a client, a campaign. */
  label: string
  /** Why it is in this list. Never blank — an unexplained entry is worse
   *  than no entry, because the reader has to go and find out, and mostly
   *  will not. */
  detail: string
  /** How long it has been sitting. Null where the concept does not apply. */
  days?: number | null
  /** Whose move it is, in plain words for the reader ("Marie", "the
   *  candidate", "nobody"). Literally "nobody" is what makes something an
   *  orphan. */
  owner?: string | null
  /** Deep link into the portal, relative. Lets a reader act rather than
   *  go hunting. */
  href?: string | null
}

/** One module's contribution. Sections are uniform on purpose. */
export interface BriefSection {
  key: string
  title: string
  /** The numbers. Printed as a row across the top of the section. */
  headline: Metric[]
  /** Finished or progressed inside the closed week. Credit where due —
   *  a report that only lists failures gets ignored by the third edition. */
  moved: Item[]
  /** Sitting too long with somebody. */
  stalled: Item[]
  /** Work outstanding and NOBODY assigned. The section that should drive
   *  the Friday meeting. */
  orphaned: Item[]
  /** Due inside the coming week. */
  upcoming: Item[]
  /** Set when the section has genuinely nothing to say, so the renderer
   *  prints one honest line instead of four empty tables. */
  note?: string | null
  /** Anything that could not be computed, in words a reader can act on. */
  warnings: string[]
}

/** A half-open interval, `[since, until)`. Half-open throughout so the
 *  closed week and the coming week share a boundary instant without any
 *  day being counted twice or dropped. */
export interface Window {
  since: string
  until: string
}

/** The complete deterministic fact block.
 *
 *  THE CONTRACT THAT MAKES THE AI SAFE: the model that writes the
 *  commentary receives this object and NOTHING ELSE. It has no database
 *  access and no tools. Every number it can put in a sentence is a number
 *  that is already printed in a table below that sentence, so a reader can
 *  always check the prose against the figures. */
export interface BriefFacts {
  generated_at: string
  /** e.g. "2026-W30-THU" — stable, sortable, one per edition, and the
   *  uniqueness key that stops a double cron firing sending twice. */
  week_key: string
  /** Thursday to Wednesday, just ended. */
  closed: Window
  /** Thursday to Wednesday, about to start. */
  ahead: Window
  /** Human label, e.g. "23 July – 29 July 2026". */
  window_label: string
  sections: BriefSection[]
  /** Collector-level problems, as opposed to section-level ones. */
  warnings: string[]
}

/** Convenience for sections that find nothing at all. */
export function emptySection(key: string, title: string, note: string): BriefSection {
  return {
    key: key,
    title: title,
    headline: [],
    moved: [],
    stalled: [],
    orphaned: [],
    upcoming: [],
    note: note,
    warnings: [],
  }
}
