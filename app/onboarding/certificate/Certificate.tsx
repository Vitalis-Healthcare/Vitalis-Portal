'use client'
// app/onboarding/certificate/Certificate.tsx
// Branded, printable certificate. Public Vitalis green brand (Cormorant
// Garamond + DM Sans). "Print / Save as PDF" uses the browser print dialog;
// print CSS strips the chrome so it lays out as a clean single page.
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif"
const SANS = "'DM Sans', 'Segoe UI', Arial, sans-serif"
const GREEN_DARK = '#2D5A1B'
const GREEN_BRIGHT = '#7AB52A'

export default function Certificate({ name, certNo, issuedDate }: { name: string; certNo: string; issuedDate: string }) {
  return (
    <>
      <style>{`
        @media print {
          @page { size: landscape; margin: 12mm; }
          .cert-noprint { display: none !important; }
          .cert-page { background: #fff !important; padding: 0 !important; min-height: 0 !important; }
          .cert-card { box-shadow: none !important; margin: 0 auto !important; }
        }
      `}</style>

      <div className="cert-page" style={{ minHeight: '100vh', background: '#EEF2EC', padding: '36px 16px', fontFamily: SANS, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="cert-card" style={{ width: '100%', maxWidth: 880, background: '#fff', border: `2px solid ${GREEN_DARK}`, borderRadius: 8, padding: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.12)' }}>
          <div style={{ border: `1px solid ${GREEN_BRIGHT}`, borderRadius: 4, padding: '52px 56px', textAlign: 'center', position: 'relative' }}>

            {/* wordmark */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 38, height: 38, borderRadius: 9, background: `linear-gradient(135deg,${GREEN_DARK},${GREEN_BRIGHT})`, color: '#fff', fontWeight: 900, fontSize: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS }}>V+</span>
              <span style={{ fontSize: 15, letterSpacing: 3, color: GREEN_DARK, fontWeight: 700, textTransform: 'uppercase' }}>Vitalis HealthCare</span>
            </div>

            <div style={{ fontFamily: SERIF, fontSize: 42, color: GREEN_DARK, fontWeight: 700, marginTop: 14, lineHeight: 1.1 }}>
              Certificate of Completion
            </div>
            <div style={{ width: 84, height: 3, background: GREEN_BRIGHT, margin: '16px auto 30px', borderRadius: 2 }} />

            <div style={{ fontSize: 13, color: '#6b7a64', letterSpacing: 2, textTransform: 'uppercase' }}>This is to certify that</div>
            <div style={{ fontFamily: SERIF, fontSize: 50, color: '#1f3d14', fontWeight: 700, margin: '12px 0 14px', lineHeight: 1.1 }}>{name}</div>

            <div style={{ fontSize: 16, color: '#41503a', lineHeight: 1.7, maxWidth: 580, margin: '0 auto' }}>
              has successfully completed the <strong>Vitalis Caregiver Basic Competency Test</strong>,
              demonstrating the knowledge and professional judgment expected of a Vitalis caregiver.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 52, gap: 24 }}>
              <div style={{ textAlign: 'left', minWidth: 150 }}>
                <div style={{ fontSize: 12, color: '#9aa595', textTransform: 'uppercase', letterSpacing: 1 }}>Date issued</div>
                <div style={{ fontWeight: 600, color: GREEN_DARK, fontSize: 15, marginTop: 3 }}>{issuedDate}</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ borderTop: `1.5px solid ${GREEN_DARK}`, paddingTop: 7, fontSize: 13, color: '#555', maxWidth: 240, margin: '0 auto' }}>
                  Vitalis HealthCare Services, LLC
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 150 }}>
                <div style={{ fontSize: 12, color: '#9aa595', textTransform: 'uppercase', letterSpacing: 1 }}>Certificate No.</div>
                <div style={{ fontWeight: 600, color: GREEN_DARK, fontSize: 15, marginTop: 3, fontVariantNumeric: 'tabular-nums', letterSpacing: 1 }}>{certNo}</div>
              </div>
            </div>

            <div style={{ marginTop: 30, fontSize: 11, color: '#9aa595' }}>
              RSA License #3879R · 8757 Georgia Avenue, Suite 440, Silver Spring, MD 20910
            </div>
          </div>
        </div>

        <button
          className="cert-noprint"
          onClick={() => window.print()}
          style={{ marginTop: 26, padding: '13px 30px', background: `linear-gradient(135deg,${GREEN_DARK},#5A9E2F)`, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>
          Print / Save as PDF
        </button>
        <div className="cert-noprint" style={{ marginTop: 14, fontSize: 12, color: '#8a9684', fontFamily: SANS }}>
          Tip: in the print dialog, choose “Save as PDF” to keep a copy.
        </div>
      </div>
    </>
  )
}
