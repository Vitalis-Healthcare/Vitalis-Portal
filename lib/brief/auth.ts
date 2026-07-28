// ═════════════════════════════════════════════════════════════════════════
// The Thursday Brief — authorization (v0.6.29)
//
// Brief routes have two legitimate callers with nothing in common:
//
//   THE SCHEDULER, which is a machine, has no cookies, and carries a bearer
//   token. Vercel cron, unattended, once a week.
//
//   A PERSON, who is signed into the portal in a browser, has a session
//   cookie, and has no idea what a bearer token is.
//
// Before this file existed, only the first was allowed, which meant reading
// your own Brief required finding the right secret out of two similarly
// named ones and pasting it into a terminal. That is not a workflow anybody
// should have to repeat weekly, and the friction was entirely self-inflicted.
//
// So: either credential is accepted, and each is checked independently. The
// bearer path never touches the database; the session path never looks at
// the token.
//
// ON ROLES — reading the fact block means reading, in one place, the state
// of every module in the agency including who is behind on what. That is
// leadership information, so it is limited to admin and supervisor. A
// caregiver with a valid session gets 403, not 401: they are correctly
// signed in, they simply may not read this.
// ═════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { UserRole } from '@/types'

/** Roles permitted to read Brief internals. */
const ALLOWED_ROLES: UserRole[] = ['admin', 'supervisor']

export type Caller =
  | { kind: 'cron' }
  | { kind: 'session'; userId: string; role: UserRole }

export interface AuthResult {
  caller: Caller | null
  /** Populated only when `caller` is null — return it directly. */
  response: NextResponse | null
}

function deny(status: number, message: string): AuthResult {
  return { caller: null, response: NextResponse.json({ error: message }, { status: status }) }
}

/** Constant-time-ish comparison. Not a hard requirement over the public
 *  internet at this length, but it costs nothing and removes the question. */
function tokenMatches(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

export async function authorizeBriefRequest(req: NextRequest): Promise<AuthResult> {
  // ── Path 1: the scheduler ────────────────────────────────────────────
  const header = req.headers.get('authorization') || ''
  if (header.startsWith('Bearer ')) {
    const provided = header.slice(7)
    const expected = process.env.CRON_SECRET
    if (!expected) {
      return deny(503, 'CRON_SECRET is not configured on this deployment')
    }
    if (tokenMatches(provided, expected)) {
      return { caller: { kind: 'cron' }, response: null }
    }
    // A wrong bearer token is a wrong bearer token. Do NOT fall through to
    // the session check — a caller who presented a credential and got it
    // wrong deserves to be told that, not to be silently reconsidered under
    // different rules and handed a confusing second answer.
    return deny(401, 'Unauthorized: bearer token did not match CRON_SECRET')
  }

  // ── Path 2: a signed-in person ───────────────────────────────────────
  let userId = ''
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    if (!data || !data.user) {
      return deny(
        401,
        'Not signed in. Open this URL in a browser where you are signed into the portal, or call it with an Authorization: Bearer header.'
      )
    }
    userId = data.user.id
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return deny(500, 'Could not verify session: ' + msg)
  }

  let role: UserRole = 'caregiver'
  try {
    const db = createServiceClient()
    const { data: profile, error } = await db
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    if (error) {
      return deny(500, 'Could not read your profile: ' + error.message)
    }
    role = ((profile && profile.role) || 'caregiver') as UserRole
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return deny(500, 'Could not read your profile: ' + msg)
  }

  if (ALLOWED_ROLES.indexOf(role) === -1) {
    return deny(
      403,
      'Your account does not have access to the Brief. This is limited to administrators and supervisors.'
    )
  }

  return { caller: { kind: 'session', userId: userId, role: role }, response: null }
}
