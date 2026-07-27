// lib/assessments/discharged.ts
//
// Single source of truth for excluding discharged (archived) clients from
// assessment read paths. Introduced in v0.6.14.
//
// Why this exists:
//   Archiving a client sets assessment_clients.status = 'discharged', but the
//   assessments table has no status column of its own. Five read paths query
//   `assessments` joined to the client and never filtered on client status, so
//   discharged clients kept appearing in the overview counts, the upcoming
//   table, the calendar, and — worst — the weekly/monthly reminder emails.
//
// Approach:
//   Fetch the (small) set of discharged client ids and exclude them by
//   client_id. We deliberately avoid PostgREST embedded-resource filtering
//   (!inner + client.status=neq) because that can't be verified here and would
//   fail at runtime rather than build time. An explicit id list is plain and
//   certain. Client counts are small (tens), so the extra query is negligible.
//
// IMPORTANT (empty-list trap):
//   PostgREST rejects `.in('col','()')` / `.not('col','in','()')` when the list
//   is empty. Always route filtering through applyDischargedFilter(), which
//   no-ops when there are no discharged clients instead of emitting `in.()`.
//
// Typing note:
//   The Supabase query builders carry deep internal generics that are not
//   meant to be reconstructed by hand (doing so trips TS2589 "excessively
//   deep"). We accept the client and the builder loosely on purpose — this is
//   a tiny cross-cutting helper, not a place to re-derive the SDK's types.

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Returns the ids of all clients whose status is 'discharged'.
 * Returns [] on error or when there are none — callers must treat [] as
 * "no filtering needed" (see applyDischargedFilter).
 *
 * Accepts either createClient() (RLS) or createServiceClient(); both expose
 * the same `.from().select().eq()` surface used here.
 */
export async function getDischargedClientIds(db: any): Promise<string[]> {
  try {
    const { data, error } = await db
      .from('assessment_clients')
      .select('id')
      .eq('status', 'discharged')

    if (error || !data || !Array.isArray(data)) return []
    return (data as { id: string }[])
      .map((r) => r.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
  } catch {
    // Never let this optional exclusion break a page render or a cron.
    return []
  }
}

/**
 * Applies "exclude discharged clients" to a query builder by client_id.
 * No-ops safely when the id list is empty (avoids the PostgREST in.() error).
 * Returns the same builder type it was given.
 *
 *   let q = db.from('assessments').select(...)...
 *   q = applyDischargedFilter(q, dischargedIds)
 */
export function applyDischargedFilter<T>(query: T, dischargedIds: string[]): T {
  if (!dischargedIds || dischargedIds.length === 0) return query
  // PostgREST list literal: (id1,id2,id3)
  return (query as any).not('client_id', 'in', `(${dischargedIds.join(',')})`) as T
}
