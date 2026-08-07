'use client'
// app/(dashboard)/candidates/[id]/contract/ContractSendClient.tsx
// Inline styles only — no Tailwind on onboarding surfaces.

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CONTRACT_TEMPLATE_CHOICES, type ContractTemplateKey } from '@/lib/onboarding/contract-templates'
import type { Blocker } from '@/lib/onboarding/gates'

const TEAL = '#0E7C7B'
const NAVY = '#1A2E44'
const MUTED = '#4A6070'
const LINE = '#E2E8F0'

type Candidate = {
  id: string
  first_name: string
  last_name: string
  email: string
  status: string
}

type Contract = {
  id: string
  template_key: string
  position_title: string
  pay_rate: string
  sent_at: string
  token_expires_at: string
  signed_at: string | null
  signature_name: string | null
}

function fmt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function statusOf(c: Contract): { label: string; bg: string; color: string } {
  if (c.signed_at) return { label: 'Signed', bg: '#F0FDF4', color: '#15803D' }
  if (new Date(c.token_expires_at).getTime() < Date.now()) {
    return { label: 'Superseded / expired', bg: '#F8FAFC', color: '#8FA0B0' }
  }
  return { label: 'Awaiting signature', bg: '#FFFBEB', color: '#B45309' }
}

export default function ContractSendClient({
  candidate,
  contracts,
  blockers,
  gateOk,
}: {
  candidate: Candidate
  contracts: Contract[]
  blockers: Blocker[]
  gateOk: boolean
}) {
  const router = useRouter()
  const [templateKey, setTemplateKey] = useState<ContractTemplateKey | ''>('')
  const [payRate, setPayRate] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<{ email: string; emailed: boolean } | null>(null)

  const outstanding = contracts.find(
    (c) => !c.signed_at && new Date(c.token_expires_at).getTime() >= Date.now(),
  )

  const send = async () => {
    setSending(true); setError(null); setSent(null)
    try {
      const res = await fetch('/api/onboarding/contract/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidate.id,
          template_key: templateKey,
          pay_rate: payRate.trim(),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'The agreement could not be sent.')
      setSent({ email: json.email, emailed: !!json.emailed })
      if (json.error) setError(json.error)
      setPayRate('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSending(false)
    }
  }

  const canSend = gateOk && !!templateKey && payRate.trim().length > 0 && !sending

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 860, margin: '0 auto' }}>

      <div style={{ marginBottom: 26 }}>
        <Link href={`/candidates/${candidate.id}`} style={{ color: TEAL, textDecoration: 'none', fontSize: 13 }}>
          ← {candidate.first_name} {candidate.last_name}
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY, margin: '8px 0 4px' }}>
          Agreement
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
          Send the job description and terms of engagement for {candidate.first_name} to
          read and sign. It goes to {candidate.email}.
        </p>
      </div>

      {outstanding && (
        <div style={{
          background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10,
          padding: '12px 16px', fontSize: 13, color: '#92400E', marginBottom: 20, lineHeight: 1.6,
        }}>
          An agreement sent {fmt(outstanding.sent_at)} is still awaiting signature.
          Sending a new one will expire that link immediately.
        </div>
      )}

      {!gateOk && (
        <div style={{
          background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12,
          padding: '18px 22px', marginBottom: 22,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
            Sending is blocked until credentialing is complete
          </div>
          <div style={{ fontSize: 12.5, color: '#A16207', marginBottom: 14, lineHeight: 1.6 }}>
            {blockers.length === 1
              ? 'One thing is outstanding:'
              : `${blockers.length} things are outstanding:`}
          </div>
          {blockers.map((b) => (
            <div key={b.code} style={{
              background: '#fff', border: '1px solid #FDE68A', borderRadius: 8,
              padding: '12px 15px', marginBottom: 10,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>
                {b.label}
              </div>
              <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.65 }}>{b.detail}</div>
              {b.fixHref && (
                <Link href={b.fixHref} style={{
                  display: 'inline-block', marginTop: 9, fontSize: 12.5,
                  color: TEAL, textDecoration: 'none', fontWeight: 600,
                }}>
                  {b.fixLabel || 'Fix this'} →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{
        background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12,
        padding: '24px 26px', marginBottom: 26,
        opacity: gateOk ? 1 : 0.6,
      }}>
        <label style={{
          display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
          textTransform: 'uppercase', color: MUTED, marginBottom: 7,
        }}>
          Position
        </label>
        <select
          value={templateKey}
          onChange={(e) => setTemplateKey(e.target.value as ContractTemplateKey | '')}
          style={{
            width: '100%', padding: '10px 12px', border: `1px solid #D1D9E0`,
            borderRadius: 8, fontSize: 14, color: NAVY, background: '#fff', marginBottom: 18,
          }}
        >
          <option value="">Choose a position…</option>
          {CONTRACT_TEMPLATE_CHOICES.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>

        <label style={{
          display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
          textTransform: 'uppercase', color: MUTED, marginBottom: 7,
        }}>
          Pay rate
        </label>
        <input
          type="text"
          value={payRate}
          onChange={(e) => setPayRate(e.target.value)}
          placeholder="$18.00 per hour"
          style={{
            width: '100%', padding: '10px 12px', border: '1px solid #D1D9E0',
            borderRadius: 8, fontSize: 14, color: NAVY, marginBottom: 6,
          }}
        />
        <div style={{ fontSize: 12, color: '#8FA0B0', marginBottom: 20, lineHeight: 1.6 }}>
          Appears on the agreement exactly as typed. This is the only figure in the
          document, so check it before sending.
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
            padding: '11px 15px', color: '#B91C1C', fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {sent && !error && (
          <div style={{
            background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8,
            padding: '11px 15px', color: '#065F46', fontSize: 13, marginBottom: 16,
          }}>
            {sent.emailed
              ? `Sent to ${sent.email}. They will get a link to read and sign.`
              : `Agreement created, but the email did not send. Check Resend, then send again.`}
          </div>
        )}

        <button
          onClick={send}
          disabled={!canSend}
          style={{
            padding: '11px 26px', background: canSend ? TEAL : '#9DBDBD', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: canSend ? 'pointer' : 'not-allowed',
          }}
        >
          {sending ? 'Sending…' : 'Send for signature'}
        </button>
      </div>

      <h2 style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: '0 0 12px' }}>
        History
      </h2>

      {contracts.length === 0 ? (
        <div style={{
          background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12,
          padding: '32px 24px', textAlign: 'center', fontSize: 13, color: MUTED,
        }}>
          No agreement has been sent to this candidate yet.
        </div>
      ) : (
        <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Position', 'Rate', 'Sent', 'Status', 'Signed by', ''].map((h) => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                    color: MUTED, textTransform: 'uppercase', letterSpacing: '.6px',
                    borderBottom: `1px solid ${LINE}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contracts.map((c, idx) => {
                const s = statusOf(c)
                return (
                  <tr key={c.id} style={{
                    borderBottom: idx < contracts.length - 1 ? '1px solid #F1F5F9' : 'none',
                  }}>
                    <td style={{ padding: '12px 16px', color: NAVY, fontWeight: 600 }}>{c.position_title}</td>
                    <td style={{ padding: '12px 16px', color: MUTED }}>{c.pay_rate}</td>
                    <td style={{ padding: '12px 16px', color: MUTED }}>{fmt(c.sent_at)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 12,
                        fontSize: 11, fontWeight: 600, background: s.bg, color: s.color,
                      }}>{s.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: MUTED }}>
                      {c.signature_name || '—'}
                      {c.signed_at && (
                        <div style={{ fontSize: 11, color: '#8FA0B0' }}>{fmt(c.signed_at)}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <a
                        href={`/api/onboarding/contract/${c.id}/document`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, color: TEAL, textDecoration: 'none', fontWeight: 600 }}
                      >
                        {c.signed_at ? 'View signed copy ↗' : 'Preview ↗'}
                      </a>
                      {/* Only a signed agreement has a filing copy. An unsigned
                          one has nothing worth putting in a personnel file. */}
                      {c.signed_at && (
                        <>
                          <span style={{ color: '#CBD5E1', margin: '0 8px' }}>·</span>
                          <a
                            href={`/api/onboarding/contract/${c.id}/pdf`}
                            style={{ fontSize: 12, color: TEAL, textDecoration: 'none', fontWeight: 600 }}
                          >
                            PDF ↓
                          </a>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
