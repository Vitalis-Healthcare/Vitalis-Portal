// lib/onboarding/contract.ts
//
// Token handling and lookup for candidate contracts.
//
// Tokens follow the same rule as the candidate magic link (pitfalls #15): the
// RAW token only ever exists in the URL we email. What we store is its sha256
// hash, so a leaked database row cannot be replayed as a signing link.

import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import type { ContractTemplateKey } from '@/lib/onboarding/contract-templates'

export const CONTRACT_TOKEN_TTL_DAYS = 21

export interface ContractRow {
  id: string
  candidate_id: string
  template_key: ContractTemplateKey
  template_version: string
  position_title: string
  pay_rate: string
  token_expires_at: string
  sent_at: string
  signed_at: string | null
  signature_name: string | null
  signature_ip: string | null
  rendered_html: string | null
}

export function newRawToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export function tokenExpiry(): string {
  return new Date(Date.now() + CONTRACT_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * Look a contract up by its RAW token. Returns null when the token does not
 * match anything — callers must not distinguish "no such token" from "expired"
 * in anything shown to the public, to avoid confirming which tokens exist.
 */
export async function findContractByRawToken(raw: string): Promise<ContractRow | null> {
  if (!raw) return null
  const svc = createServiceClient()
  try {
    const { data, error } = await svc
      .from('onb_contracts')
      .select('id, candidate_id, template_key, template_version, position_title, pay_rate, token_expires_at, sent_at, signed_at, signature_name, signature_ip, rendered_html')
      .eq('sign_token', hashToken(raw))
      .maybeSingle()
    if (error || !data) return null
    return data as ContractRow
  } catch {
    return null
  }
}

export function isExpired(row: ContractRow): boolean {
  return new Date(row.token_expires_at).getTime() < Date.now()
}

/** Long-form date used on the document face, e.g. "July 28, 2026". */
export function documentDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date()
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York',
  })
}

/**
 * Best-effort originating IP. Vercel populates x-forwarded-for; the left-most
 * entry is the client. Stored for the audit trail only — never used for auth.
 */
export function clientIp(headers: Headers): string | null {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) {
    const first = fwd.split(',')[0].trim()
    if (first) return first
  }
  return headers.get('x-real-ip')
}
