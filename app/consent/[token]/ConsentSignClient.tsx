'use client'
// app/consent/[token]/ConsentSignClient.tsx
// ═════════════════════════════════════════════════════════════════════════
// Ship 5b (v0.6.46) — the signing experience, per the approved 6 Aug
// mockup: prefilled client card (read-only), the agreement VERBATIM from
// lib/leads/consent-content.ts, the advance-directive checklist (the
// client's part), the billing method as staff set it (Private Pay shows
// the agreed rate), the LOCKED reassurance panel above the signature,
// type-or-draw signature, and the pre-signed agency block.
//
// Inline styles only; fluid-responsive (no media queries possible
// inline). Mobile-first — families sign on phones.
// ═════════════════════════════════════════════════════════════════════════
import { useRef, useState } from 'react'
import {
  AGENCY, INTRO_TEXT, AGREEMENT_SECTIONS, AGREEMENT_SECTIONS_AFTER_DIRECTIVES,
  COMPLAINT_SECTION, DIRECTIVE_OPTIONS, BILLING_METHODS, TERMS_INTRO,
  TERMS_BULLETS, REASSURANCE_TITLE, REASSURANCE_BODY, ESIGN_NOTE,
  type ConsentPrefill,
} from '@/lib/leads/consent-content'
import { fmtDateOnly } from '@/lib/leads/consent-render'

interface Props {
  token: string
  prefill: ConsentPrefill
  repName: string
  repSignedAt: string
  agreementVersion: string
}

const SEC: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#2D5A1B', margin: '26px 0 8px' }
const P: React.CSSProperties = { margin: '0 0 14px', fontSize: 14.5, lineHeight: 1.65, color: '#2A2A26' }
const LBL: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 700, color: '#55554E', marginBottom: 5 }

export default function ConsentSignClient({ token, prefill: p, repName, repSignedAt, agreementVersion }: Props) {
  const [directives, setDirectives] = useState<string[]>([])
  const [acknowledged, setAcknowledged] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [signerRole, setSignerRole] = useState<'client' | 'representative'>('client')
  const [sigMode, setSigMode] = useState<'typed' | 'drawn'>('typed')
  const [hasDrawn, setHasDrawn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  const toggleDirective = (key: string) =>
    setDirectives(d => d.includes(key) ? d.filter(x => x !== key) : [...d, key])

  // ── Canvas drawing (pointer events cover mouse + touch + pen) ────────
  const ctxOf = () => canvasRef.current?.getContext('2d') || null
  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }
  }
  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const ctx = ctxOf(); if (!ctx) return
    drawing.current = true
    canvasRef.current!.setPointerCapture(e.pointerId)
    const { x, y } = pos(e)
    ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1F3F13'
    ctx.beginPath(); ctx.moveTo(x, y)
  }
  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = ctxOf(); if (!ctx) return
    const { x, y } = pos(e)
    ctx.lineTo(x, y); ctx.stroke()
    if (!hasDrawn) setHasDrawn(true)
  }
  const endDraw = () => { drawing.current = false }
  const clearCanvas = () => {
    const c = canvasRef.current; const ctx = ctxOf()
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height)
    setHasDrawn(false)
  }

  const canSign = acknowledged && signerName.trim().length > 1 &&
    (sigMode === 'typed' ? signerName.trim().length > 1 : hasDrawn) && !submitting

  async function handleSign() {
    setError(null); setSubmitting(true)
    try {
      const signature_data = sigMode === 'typed'
        ? signerName.trim()
        : (canvasRef.current?.toDataURL('image/png') || '')
      const res = await fetch(`/api/consent/${token}/sign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer_name: signerName.trim(), signer_role: signerRole,
          signature_kind: sigMode, signature_data,
          directives, acknowledged,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || `Signing failed (HTTP ${res.status})`); return }
      setDone(true)
      window.scrollTo({ top: 0 })
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', background: '#FFF', borderRadius: 10, padding: '40px 32px', textAlign: 'center', boxShadow: '0 3px 20px rgba(45,90,27,0.12)' }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>✓</div>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, color: '#2D5A1B', marginBottom: 10 }}>Thank you — you&rsquo;re all set.</div>
        <p style={{ fontSize: 14.5, color: '#55554E', lineHeight: 1.65 }}>
          The agreement is signed, and a copy is on its way to your email for your records.
          We&rsquo;re looking forward to caring for {p.client_name}.
        </p>
        <p style={{ fontSize: 13, color: '#8A8A80', marginTop: 14 }}>Questions any time: {AGENCY.phoneDisplay}</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', background: '#FFF', borderRadius: 10, overflow: 'hidden', boxShadow: '0 3px 20px rgba(45,90,27,0.12)' }}>
      {/* Header */}
      <div style={{ background: '#2D5A1B', padding: '28px 28px 24px' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#FFF', fontSize: 28, fontWeight: 600 }}>Vitalis <span style={{ color: '#7AB52A' }}>HealthCare</span></div>
        <div style={{ color: '#CBDDBF', fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>{AGENCY.address}<br />Tel: {AGENCY.phone} · Fax: {AGENCY.fax}</div>
      </div>

      <div style={{ padding: '26px 24px 40px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#A8863F', fontWeight: 700 }}>For {p.client_name}</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 29, fontWeight: 600, color: '#2D5A1B', margin: '8px 0 8px', lineHeight: 1.2 }}>Home Care Service Agreement<br />&amp; Consent Form</h1>
          <p style={{ color: '#55554E', fontSize: 14, margin: '0 auto', maxWidth: 540, lineHeight: 1.6 }}>Please review this agreement carefully. It describes the services Vitalis will provide, your rights and responsibilities, and how billing works. Signing takes about five minutes.</p>
        </div>

        {/* Client card */}
        <div style={{ background: '#F6F8F2', border: '1px solid #DCE5D2', borderRadius: 8, padding: '18px 20px', margin: '18px 0 22px' }}>
          <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: '#2D5A1B', fontWeight: 700, marginBottom: 10 }}>Client information</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px', fontSize: 14 }}>
            <div><span style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', color: '#8A8A80' }}>Client name</span>{p.client_name}</div>
            <div><span style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', color: '#8A8A80' }}>Date of birth</span>{fmtDateOnly(p.dob)}</div>
            <div style={{ flexBasis: '100%' }}><span style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', color: '#8A8A80' }}>Address</span>{[p.address, p.city, p.state, p.zip].filter(Boolean).join(', ') || '—'}</div>
            <div><span style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', color: '#8A8A80' }}>Start of care date</span>{fmtDateOnly(p.start_of_care)}</div>
            <div><span style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', color: '#8A8A80' }}>LTC insurer / claim #</span>{[p.ltc_insurer, p.ltc_claim].filter(Boolean).join(' / ') || '—'}</div>
          </div>
          <div style={{ fontSize: 11.5, color: '#8A8A80', marginTop: 10 }}>Prepared by Vitalis HealthCare. If anything above is incorrect, please call {AGENCY.phoneDisplay} before signing.</div>
        </div>

        <p style={P}>{INTRO_TEXT}</p>
        {AGREEMENT_SECTIONS.map(s => (<div key={s.title}><h2 style={SEC}>{s.title}</h2><p style={P}>{s.text}</p></div>))}

        {/* Directive checklist — the client's part */}
        <div style={{ border: '1px solid #DCE5D2', borderRadius: 8, padding: '14px 18px', margin: '12px 0', background: '#FCFCF9' }}>
          <div style={{ fontSize: 12.5, color: '#A8863F', fontWeight: 700, marginBottom: 8 }}>Please tick each that applies — I will be providing the following documents to Vitalis:</div>
          {DIRECTIVE_OPTIONS.map(d => (
            <label key={d.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', cursor: 'pointer', fontSize: 14.5 }}>
              <input type="checkbox" checked={directives.includes(d.key)} onChange={() => toggleDirective(d.key)}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: '#2D5A1B', cursor: 'pointer' }} />
              {d.label}
            </label>
          ))}
        </div>

        {AGREEMENT_SECTIONS_AFTER_DIRECTIVES.map(s => (<div key={s.title}><h2 style={SEC}>{s.title}</h2><p style={P}>{s.text}</p></div>))}

        {/* Billing method — staff-set, read-only */}
        <p style={{ ...P, marginBottom: 6 }}>I understand that services provided to me by <b>{AGENCY.legalName}</b> will be billed as follows:</p>
        <div style={{ border: '1px solid #DCE5D2', borderRadius: 8, overflow: 'hidden', margin: '10px 0 4px' }}>
          {BILLING_METHODS.map(b => {
            const sel = b.key === p.billing_method
            let detail: string = b.detail
            if (b.key === 'private_pay' && sel && p.private_pay_rate) detail = `At the agreed rate of ${p.private_pay_rate}. ${b.detail}`
            if (b.key === 'insurance' && sel && p.insurance_projected) detail = `${b.detail} When known at the time of admission: ${p.insurance_projected}.`
            return (
              <div key={b.key} style={{ display: 'flex', gap: 12, padding: sel ? '13px 18px 13px 14px' : '13px 18px', borderBottom: '1px solid #ECEAE0', background: sel ? '#F0F6E9' : '#FFF', borderLeft: sel ? '4px solid #7AB52A' : 'none' }}>
                <div style={{ width: 18, fontSize: 16, color: sel ? '#2D5A1B' : '#B9B9AF', fontWeight: sel ? 700 : 400 }}>{sel ? '☑' : '☐'}</div>
                <div><b style={{ fontSize: 14 }}>{b.label}</b><div style={{ fontSize: 12.5, color: '#6B6B62', lineHeight: 1.55 }}>{detail}</div></div>
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: 11.5, color: '#8A8A80', margin: '4px 0 0' }}>The billing method was set by Vitalis when this agreement was prepared. If it looks wrong, call us before signing.</p>

        <h2 style={SEC}>{COMPLAINT_SECTION.title}</h2>
        <p style={P}>{COMPLAINT_SECTION.text}</p>

        <h2 style={SEC}>Agency Service Rate &amp; Terms of Service</h2>
        <div style={{ background: '#FAFAF6', border: '1px solid #E4E2D8', borderRadius: 8, padding: '6px 20px 12px', margin: '10px 0 4px' }}>
          <p style={{ ...P, marginTop: 12 }}><i>{TERMS_INTRO}</i></p>
          <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
            {TERMS_BULLETS.map((b, i) => (<li key={i} style={{ margin: '6px 0', fontSize: 13.5, color: '#3B3B34', lineHeight: 1.6 }}>{b}</li>))}
          </ul>
        </div>

        {/* THE REASSURANCE PANEL (locked copy) */}
        <div style={{ background: '#F0F6E9', border: '1px solid #C9DDB8', borderRadius: 8, padding: '16px 20px', margin: '24px 0 8px' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#2D5A1B', marginBottom: 5 }}>{REASSURANCE_TITLE}</div>
          <div style={{ fontSize: 13.5, color: '#3B3B34', lineHeight: 1.65 }}>{REASSURANCE_BODY}</div>
        </div>

        {/* Acknowledgment */}
        <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: acknowledged ? '#F0F6E9' : '#FCFCF9', border: `1px solid ${acknowledged ? '#C9DDB8' : '#E4E2D8'}`, borderRadius: 8, padding: '15px 18px', margin: '14px 0 8px', fontWeight: 600, fontSize: 14.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)}
            style={{ width: 19, height: 19, marginTop: 1, accentColor: '#2D5A1B' }} />
          I have read and understand all of the above.
        </label>

        {error && (
          <div style={{ fontSize: 13, color: '#B91C1C', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', margin: '10px 0', fontWeight: 600 }}>{error}</div>
        )}

        {/* Signature zone */}
        <div style={{ border: '2px solid #2D5A1B', borderRadius: 10, padding: '20px 20px', margin: '18px 0 10px' }}>
          <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: '#2D5A1B', fontWeight: 700, marginBottom: 12 }}>Sign here — Client or Client&rsquo;s Representative</div>

          <div style={{ marginBottom: 12 }}>
            <label style={LBL}>Your full name</label>
            <input type="text" value={signerName} onChange={e => setSignerName(e.target.value)} placeholder="e.g., Sarah Thompson"
              style={{ width: '100%', padding: '11px 13px', border: '1px solid #C9C7BB', borderRadius: 6, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: 18, fontSize: 14, margin: '2px 0 12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: 7, alignItems: 'center', fontWeight: 500, cursor: 'pointer' }}>
              <input type="radio" name="who" checked={signerRole === 'client'} onChange={() => setSignerRole('client')} style={{ accentColor: '#2D5A1B', width: 16, height: 16 }} /> I am the client
            </label>
            <label style={{ display: 'flex', gap: 7, alignItems: 'center', fontWeight: 500, cursor: 'pointer' }}>
              <input type="radio" name="who" checked={signerRole === 'representative'} onChange={() => setSignerRole('representative')} style={{ accentColor: '#2D5A1B', width: 16, height: 16 }} /> I am the client&rsquo;s representative
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button type="button" onClick={() => setSigMode('typed')}
              style={{ padding: '8px 18px', border: `1px solid ${sigMode === 'typed' ? '#2D5A1B' : '#C9C7BB'}`, borderRadius: 6, background: sigMode === 'typed' ? '#FFF' : '#F4F3EC', fontSize: 13, fontWeight: 700, color: sigMode === 'typed' ? '#2D5A1B' : '#6B6B62', cursor: 'pointer' }}>Sign by name</button>
            <button type="button" onClick={() => setSigMode('drawn')}
              style={{ padding: '8px 18px', border: `1px solid ${sigMode === 'drawn' ? '#2D5A1B' : '#C9C7BB'}`, borderRadius: 6, background: sigMode === 'drawn' ? '#FFF' : '#F4F3EC', fontSize: 13, fontWeight: 700, color: sigMode === 'drawn' ? '#2D5A1B' : '#6B6B62', cursor: 'pointer' }}>Draw signature</button>
          </div>

          {sigMode === 'typed' ? (
            <div style={{ border: '1.5px dashed #A8A69A', borderRadius: 8, minHeight: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDFDFB', padding: '8px 12px' }}>
              {signerName.trim()
                ? <span style={{ fontFamily: "'Great Vibes', 'Brush Script MT', cursive", fontSize: 40, color: '#1F3F13', textAlign: 'center', lineHeight: 1.2 }}>{signerName.trim()}</span>
                : <span style={{ color: '#B9B9AF', fontSize: 13.5, textAlign: 'center' }}>Your signature will appear here as you type your name above</span>}
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <canvas ref={canvasRef} width={640} height={180}
                onPointerDown={startDraw} onPointerMove={moveDraw} onPointerUp={endDraw} onPointerLeave={endDraw}
                style={{ border: '1.5px dashed #A8A69A', borderRadius: 8, background: '#FDFDFB', width: '100%', height: 140, touchAction: 'none', display: 'block' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ fontSize: 12, color: '#8A8A80' }}>Draw with your finger or mouse</span>
                <button type="button" onClick={clearCanvas} style={{ fontSize: 12, color: '#8A8A80', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>clear</button>
              </div>
            </div>
          )}

          <div style={{ fontSize: 13, color: '#55554E', marginTop: 10 }}>Date: <b>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</b> (recorded automatically when you sign)</div>
        </div>

        {/* Agency pre-signed */}
        <div style={{ background: '#F6F8F2', border: '1px solid #DCE5D2', borderRadius: 10, padding: '16px 20px', margin: '10px 0 22px' }}>
          <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: '#2D5A1B', fontWeight: 700, marginBottom: 6 }}>
            Signed for {AGENCY.legalName} <span style={{ background: '#2D5A1B', color: '#FFF', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700, padding: '3px 10px', borderRadius: 20, marginLeft: 8, verticalAlign: 'middle' }}>Signed</span>
          </div>
          <div style={{ fontFamily: "'Great Vibes', 'Brush Script MT', cursive", fontSize: 32, color: '#1F3F13', margin: '2px 0' }}>{repName}</div>
          <div style={{ fontSize: 12.5, color: '#6B6B62' }}>{repName} · Signed {fmtDateOnly(repSignedAt ? repSignedAt.slice(0, 10) : null)}</div>
        </div>

        <button onClick={handleSign} disabled={!canSign}
          style={{ display: 'block', width: '100%', background: '#2D5A1B', color: '#FFF', border: 'none', fontFamily: 'inherit', fontSize: 16.5, fontWeight: 700, padding: 16, borderRadius: 8, cursor: canSign ? 'pointer' : 'default', opacity: canSign ? 1 : 0.55 }}>
          {submitting ? 'Signing…' : 'Sign the Agreement'}
        </button>
        <p style={{ fontSize: 12, color: '#8A8A80', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
          {ESIGN_NOTE}<br />Questions before signing? Call {AGENCY.phoneDisplay} — we&rsquo;re happy to walk through it with you.
        </p>
      </div>

      <div style={{ background: '#F4F3EC', borderTop: '1px solid #E4E2D8', padding: '16px 24px', fontSize: 11, color: '#8A8A80', textAlign: 'center', lineHeight: 1.7 }}>
        {AGENCY.name} · {AGENCY.address}<br />{AGENCY.license} · Agreement version {agreementVersion}
      </div>
    </div>
  )
}
