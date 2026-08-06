// lib/payers.ts — the canonical Vitalis payer list (v0.6.43).
//
// Single source of truth for payer types across modules. Introduced with
// the lead-to-client conversion; the assessments module's two legacy
// payer dropdowns (clients/new and ClientDetailView) migrate onto this
// constant in a follow-up ship. Existing free-text payer values in
// assessment_clients.payer_type remain valid — the column has no CHECK.

export const PAYER_TYPES = [
  'Medicaid',
  'Private Pay',
  'Genworth',
  'BCHD / Contract',
  'LTC',
  'Other',
] as const

export type PayerType = typeof PAYER_TYPES[number]

export function isValidPayerType(v: unknown): v is PayerType {
  return typeof v === 'string' && (PAYER_TYPES as readonly string[]).includes(v)
}
