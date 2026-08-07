'use client'
// app/onboarding/contract/ContractSignClient.tsx
//
// Inline styles only — no Tailwind on onboarding surfaces.
//
// The signature control stays disabled until the person has confirmed they
// read the agreement and ticked the acknowledgment. That is not decoration:
// "I have read and understand" should have some basis in fact before we record
// it against their name.
//
// v0.6.22-a — the confirmation used to be INFERRED, from a 1px sentinel below
// the document frame scrolling into the parent viewport. The frame is 78vh and
// carries its own scrollbar, so a reader scrolling the document scrolls the
// FRAME and never the parent; Chrome does not chain that scroll outward. The
// sentinel never fired and the Sign button could never go green. Opening the
// document in a new tab — which this page invites — made it certain.
//
// The signal is now EXPLICIT: an affirmative click, which is better evidence
// than a scroll position anyway. The sentinel is kept as a second path in, not
// as the only one.

import { useEffect, useRef, useState } from 'react'
import SignaturePad from '@/components/onboarding/SignaturePad'

const GREEN_DARK = '#2D5A1B'
const GREEN_BRIGHT = '#7AB52A'
const INK = '#1C2A18'
const MUTED = '#5A6656'
const RULE = '#D8DFD3'

export default function ContractSignClient({
  token,
  docTitle,
  positionTitle,
  payRate,
  acknowledgment,
  alreadySigned,
  signatureName,
  signedOn,
}: {
  token: string
  docTitle: string
  positionTitle: string
  payRate: string
  acknowledgment: string
  alreadySigned: boolean
  signatureName: string | null
  signedOn: string | null
}) {
  const [name, setName] = useState('')
  const [signatureImage, setSignatureImage] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [reachedEnd, setReachedEnd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(alreadySigned)

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const signCardRef = useRef<HTMLDivElement | null>(null)
  const documentUrl = `/api/onboarding/contract/document?token=${encodeURIComponent(token)}`

  // Any of the three routes through the document count. Idempotent, so the
  // sentinel firing after a click is harmless.
  const markRead = () => setReachedEnd(true)

  const confirmRead = () => {
    setReachedEnd(true)
    // Bring the signing card into view — on a tall frame it sits below the
    // fold, which is half of why this felt like a dead end.
    window.setTimeout(() => {
      signCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
  }

  // The frame is same-origin but its internal scroll is not observable from
  // here in every browser, so the page itself carries the frame at full height
  // and we watch a sentinel below it. Reaching the sentinel means the reader
  // has passed the end of the document.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || done) return
    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) setReachedEnd(true) },
      { threshold: 0.1 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [done])

  const submit = async () => {
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/onboarding/contract/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, signature_name: name, agreed, signature_image: signatureImage }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Your signature could not be saved.')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const canSign = reachedEnd && agreed && name.trim().length >= 3 && !submitting

  return (
    <div style={{
      minHeight: '100vh', background: '#EEF1EC', padding: '28px 16px 64px',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
      color: MUTED,
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24,
            fontWeight: 700, color: GREEN_DARK,
          }}>
            Vitalis Healthcare Services
          </div>
          <div style={{ fontSize: 12, color: '#7A8875', letterSpacing: '.04em', marginTop: 4 }}>
            For reliable and compassionate care
          </div>
        </div>

        {done ? (
          <div style={{
            background: '#fff', border: `1px solid ${RULE}`, borderRadius: 12,
            padding: '40px 36px', textAlign: 'center',
          }}>
            <div style={{
              display: 'inline-block', padding: '5px 16px', background: '#F0F7EA',
              border: `1px solid ${GREEN_BRIGHT}`, borderRadius: 20, fontSize: 11,
              fontWeight: 700, color: GREEN_DARK, letterSpacing: '.08em', marginBottom: 18,
            }}>
              ✓ SIGNED
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: INK, margin: '0 0 10px' }}>
              Thank you{signatureName ? `, ${signatureName}` : ''}
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.65, margin: '0 0 6px' }}>
              Your {docTitle} agreement has been signed and sent to the office.
            </p>
            {signedOn && (
              <p style={{ fontSize: 13, color: '#7A8875', margin: '0 0 24px' }}>Signed {signedOn}</p>
            )}
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block', padding: '11px 26px', background: GREEN_DARK,
                color: '#fff', textDecoration: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 600,
              }}
            >
              View and print your signed copy
            </a>
            <p style={{ fontSize: 12, color: '#8A9686', margin: '20px 0 0', lineHeight: 1.7 }}>
              Keep a copy for your records. Use your browser&rsquo;s Print &rarr; Save as PDF.
            </p>
          </div>
        ) : (
          <>
            <div style={{
              background: '#fff', border: `1px solid ${RULE}`, borderRadius: 12,
              padding: '18px 22px', marginBottom: 16, display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>{docTitle}</div>
                <div style={{ fontSize: 12.5, marginTop: 3 }}>
                  {positionTitle} &nbsp;&middot;&nbsp; {payRate}
                </div>
              </div>
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={markRead}
                style={{
                  fontSize: 13, color: GREEN_DARK, textDecoration: 'none',
                  fontWeight: 600, whiteSpace: 'nowrap',
                }}
              >
                Open in a new tab ↗
              </a>
            </div>

            <div style={{
              background: '#fff', border: `1px solid ${RULE}`, borderRadius: 12,
              overflow: 'hidden', marginBottom: 4,
            }}>
              <iframe
                src={documentUrl}
                title={`${docTitle} agreement`}
                style={{ width: '100%', height: '78vh', border: 'none', display: 'block' }}
              />
            </div>

            <div ref={sentinelRef} style={{ height: 1 }} />

            {!reachedEnd && (
              <div style={{
                background: '#fff', border: `1px solid ${RULE}`, borderRadius: 12,
                padding: '18px 22px', marginTop: 12, textAlign: 'center',
              }}>
                <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.65, marginBottom: 12 }}>
                  Read the whole agreement above — scroll inside the document, or open it
                  in a new tab. When you have finished, confirm below.
                </div>
                <button
                  type="button"
                  onClick={confirmRead}
                  style={{
                    padding: '11px 26px', background: GREEN_DARK, color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  I have read the full agreement
                </button>
              </div>
            )}

            <div ref={signCardRef} style={{
              background: '#fff', border: `1px solid ${RULE}`, borderTop: `3px solid ${GREEN_DARK}`,
              borderRadius: 12, padding: '26px 28px', marginTop: 16,
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: INK, margin: '0 0 16px' }}>
                Sign this agreement
              </h2>

              {!reachedEnd && (
                <div style={{
                  background: '#FBF8EC', border: '1px solid #E8DCB0', borderRadius: 8,
                  padding: '10px 14px', fontSize: 12.5, color: '#6B5A16', marginBottom: 18,
                }}>
                  Confirm you have read the agreement above — use the button under the
                  document — and the signature fields will unlock.
                </div>
              )}

              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18,
                fontSize: 13.5, lineHeight: 1.6, cursor: reachedEnd ? 'pointer' : 'not-allowed',
                opacity: reachedEnd ? 1 : 0.55,
              }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  disabled={!reachedEnd}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, cursor: 'inherit' }}
                />
                <span style={{ color: INK }}>{acknowledgment}</span>
              </label>

              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.07em',
                textTransform: 'uppercase', color: '#7A8875', marginBottom: 7,
              }}>
                Type your full legal name to sign
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!agreed}
                placeholder="Your full name"
                autoComplete="name"
                style={{
                  width: '100%', padding: '12px 14px', border: `1px solid ${agreed ? '#9DA89A' : RULE}`,
                  borderRadius: 8, fontSize: 20, color: INK, background: agreed ? '#fff' : '#F7F8F6',
                  fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600,
                  marginBottom: 6,
                }}
              />
              <div style={{ fontSize: 11.5, color: '#8A9686', marginBottom: 20, lineHeight: 1.6 }}>
                This is your printed name, exactly as it will appear on the agreement.
              </div>

              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.07em',
                textTransform: 'uppercase', color: '#7A8875', marginBottom: 7,
              }}>
                Draw your signature <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <SignaturePad disabled={!agreed} onChange={setSignatureImage} />
              <div style={{ fontSize: 11.5, color: '#8A9686', margin: '8px 0 20px', lineHeight: 1.6 }}>
                {signatureImage
                  ? 'Your signature will appear on the agreement above your printed name. Clear it and draw again if you are not happy with it.'
                  : 'On a phone or tablet, sign with your finger. If drawing is difficult, leave this blank — your typed name above is a valid signature on its own.'}
                {' '}We record your name, the date and time, and the document exactly as shown above.
              </div>

              {error && (
                <div style={{
                  background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
                  padding: '11px 15px', color: '#B91C1C', fontSize: 13, marginBottom: 16,
                }}>
                  {error}
                </div>
              )}

              <button
                onClick={submit}
                disabled={!canSign}
                style={{
                  padding: '13px 32px',
                  background: canSign ? GREEN_DARK : '#B9C4B4',
                  color: '#fff', border: 'none', borderRadius: 8, fontSize: 15,
                  fontWeight: 700, cursor: canSign ? 'pointer' : 'not-allowed',
                }}
              >
                {submitting ? 'Signing…' : 'Sign agreement'}
              </button>
            </div>
          </>
        )}

        <div style={{
          textAlign: 'center', fontSize: 11, color: '#8A9686',
          marginTop: 26, lineHeight: 1.8,
        }}>
          Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910
        </div>
      </div>
    </div>
  )
}
