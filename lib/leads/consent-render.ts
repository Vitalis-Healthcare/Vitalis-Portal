// lib/leads/consent-render.ts
// ═════════════════════════════════════════════════════════════════════════
// Ship 5b (v0.6.46) — server-side rendering for the consent flow.
//
// Two renderers:
//   • renderSignedSnapshot — the IMMUTABLE HTML of the agreement exactly
//     as signed (both signatures, ticked directives, prefill, version).
//     Stored on lead_consents.signed_html; also the emailed signed copy
//     and the "already signed" revisit view.
//   • renderConsentRequestEmail — the signing-link email (template 3),
//     branded like lib/leads/outbound.ts but with a CTA button, carrying
//     the LOCKED reassurance paragraph.
//
// Date fields in the prefill are DATE-ONLY strings — formatted with the
// T12:00:00 normalization (pitfall #72: never feed these to a timestamp
// path or vice versa).
// ═════════════════════════════════════════════════════════════════════════
import {
  AGENCY, AGREEMENT_VERSION, INTRO_TEXT, AGREEMENT_SECTIONS,
  AGREEMENT_SECTIONS_AFTER_DIRECTIVES, COMPLAINT_SECTION, DIRECTIVE_OPTIONS,
  BILLING_METHODS, TERMS_INTRO, TERMS_BULLETS, ESIGN_NOTE,
  type ConsentPrefill,
} from './consent-content'
import { escapeHtml } from './outbound'

export function fmtDateOnly(d: string | null | undefined): string {
  if (!d) return '\u2014'
  const dt = new Date(`${d}T12:00:00`)
  if (isNaN(dt.getTime())) return '\u2014'
  return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function fmtStampLong(iso: string): string {
  const dt = new Date(iso)
  if (isNaN(dt.getTime())) return '\u2014'
  return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const SEC_TITLE = `font-family:'Cormorant Garamond',Georgia,serif;font-size:19px;font-weight:700;color:#2D5A1B;margin:26px 0 8px;`
const BODY_P = `margin:0 0 14px;font-size:14.5px;line-height:1.65;color:#2A2A26;`
const SCRIPT_SIG = `font-family:'Great Vibes','Brush Script MT',cursive;font-size:34px;color:#1F3F13;margin:2px 0;`

export interface SignedSnapshotArgs {
  prefill: ConsentPrefill
  directives: string[]
  signerName: string
  signerRole: 'client' | 'representative'
  signatureKind: 'typed' | 'drawn'
  signatureData: string
  signedAtIso: string
  repName: string
  repSignedAtIso: string
}

export function renderSignedSnapshot(a: SignedSnapshotArgs): string {
  const p = a.prefill

  const billingRows = BILLING_METHODS.map(b => {
    const selected = b.key === p.billing_method
    let detail: string = b.detail
    if (b.key === 'private_pay' && selected && p.private_pay_rate) {
      detail = `At the agreed rate of ${p.private_pay_rate}. ${b.detail}`
    }
    if (b.key === 'insurance' && selected && p.insurance_projected) {
      detail = `${b.detail} When known at the time of admission: ${p.insurance_projected}.`
    }
    return (
      `<div style="display:flex;gap:12px;padding:13px 18px;border-bottom:1px solid #ECEAE0;${selected ? 'background:#F0F6E9;border-left:4px solid #7AB52A;padding-left:14px;' : ''}">` +
      `<div style="width:18px;font-size:16px;color:${selected ? '#2D5A1B;font-weight:700' : '#B9B9AF'};">${selected ? '\u2611' : '\u2610'}</div>` +
      `<div><b style="font-size:14px;">${escapeHtml(b.label)}</b><div style="font-size:12.5px;color:#6B6B62;line-height:1.55;">${escapeHtml(detail)}</div></div>` +
      `</div>`
    )
  }).join('')

  const directiveRows = DIRECTIVE_OPTIONS.map(d => {
    const on = a.directives.includes(d.key)
    return `<div style="padding:5px 0;font-size:14px;"><span style="color:${on ? '#2D5A1B' : '#B9B9AF'};font-weight:${on ? '700' : '400'};">${on ? '\u2611' : '\u2610'}</span> ${escapeHtml(d.label)}</div>`
  }).join('')

  const clientSig = a.signatureKind === 'drawn'
    ? `<img src="${a.signatureData}" alt="Signature of ${escapeHtml(a.signerName)}" style="max-height:80px;max-width:340px;"/>`
    : `<div style="${SCRIPT_SIG}">${escapeHtml(a.signatureData)}</div>`

  const sections = (list: { title: string; text: string }[]) =>
    list.map(s => `<h2 style="${SEC_TITLE}">${escapeHtml(s.title)}</h2><p style="${BODY_P}">${escapeHtml(s.text)}</p>`).join('')

  return (
`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;700&family=Great+Vibes&display=swap" rel="stylesheet">
<title>Home Care Service Agreement \u2014 Signed</title></head>
<body style="margin:0;background:#F4F3EC;font-family:'DM Sans',Arial,sans-serif;">
<div style="max-width:760px;margin:0 auto;background:#FFFFFF;">
  <div style="background:#2D5A1B;padding:28px 36px 24px;">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;color:#FFF;font-size:28px;font-weight:600;">Vitalis <span style="color:#7AB52A;">HealthCare</span></div>
    <div style="color:#CBDDBF;font-size:12px;margin-top:8px;line-height:1.6;">${escapeHtml(AGENCY.address)}<br>Tel: ${escapeHtml(AGENCY.phone)} \u00b7 Fax: ${escapeHtml(AGENCY.fax)}</div>
  </div>
  <div style="padding:28px 36px 40px;">
    <div style="text-align:center;margin-bottom:8px;">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#A8863F;font-weight:700;">Signed Agreement</div>
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:#2D5A1B;margin:8px 0 4px;line-height:1.2;">Home Care Service Agreement<br>&amp; Consent Form</h1>
    </div>

    <div style="background:#F6F8F2;border:1px solid #DCE5D2;border-radius:8px;padding:18px 22px;margin:16px 0 22px;">
      <div style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#2D5A1B;font-weight:700;margin-bottom:10px;">Client information</div>
      <table style="width:100%;font-size:13.5px;border-collapse:collapse;">
        <tr><td style="padding:3px 0;color:#8A8A80;width:44%;">Client name</td><td style="padding:3px 0;">${escapeHtml(p.client_name)}</td></tr>
        <tr><td style="padding:3px 0;color:#8A8A80;">Date of birth</td><td style="padding:3px 0;">${fmtDateOnly(p.dob)}</td></tr>
        <tr><td style="padding:3px 0;color:#8A8A80;">Address</td><td style="padding:3px 0;">${escapeHtml([p.address, p.city, p.state, p.zip].filter(Boolean).join(', ') || '\u2014')}</td></tr>
        <tr><td style="padding:3px 0;color:#8A8A80;">Start of care date</td><td style="padding:3px 0;">${fmtDateOnly(p.start_of_care)}</td></tr>
        <tr><td style="padding:3px 0;color:#8A8A80;">Long term care insurer / claim #</td><td style="padding:3px 0;">${escapeHtml([p.ltc_insurer, p.ltc_claim].filter(Boolean).join(' / ') || '\u2014')}</td></tr>
      </table>
    </div>

    <p style="${BODY_P}">${escapeHtml(INTRO_TEXT)}</p>
    ${sections(AGREEMENT_SECTIONS)}

    <div style="border:1px solid #DCE5D2;border-radius:8px;padding:14px 20px;margin:12px 0;background:#FCFCF9;">
      <div style="font-size:12px;color:#A8863F;font-weight:700;margin-bottom:6px;">I will be providing the following documents to Vitalis:</div>
      ${directiveRows}
    </div>

    ${sections(AGREEMENT_SECTIONS_AFTER_DIRECTIVES)}
    <p style="${BODY_P};margin-bottom:6px;">I understand that services provided to me by ${escapeHtml(AGENCY.legalName)} will be billed as follows:</p>
    <div style="border:1px solid #DCE5D2;border-radius:8px;overflow:hidden;margin:10px 0 16px;">${billingRows}</div>

    <h2 style="${SEC_TITLE}">${escapeHtml(COMPLAINT_SECTION.title)}</h2>
    <p style="${BODY_P}">${escapeHtml(COMPLAINT_SECTION.text)}</p>

    <h2 style="${SEC_TITLE}">Agency Service Rate &amp; Terms of Service</h2>
    <div style="background:#FAFAF6;border:1px solid #E4E2D8;border-radius:8px;padding:14px 20px;margin:10px 0 22px;">
      <p style="${BODY_P}"><i>${escapeHtml(TERMS_INTRO)}</i></p>
      <ul style="padding-left:18px;margin:6px 0;">${TERMS_BULLETS.map(b => `<li style="margin:6px 0;font-size:13px;color:#3B3B34;line-height:1.6;">${escapeHtml(b)}</li>`).join('')}</ul>
    </div>

    <p style="${BODY_P};font-weight:700;">I have read and understand all of the above.</p>

    <div style="border:2px solid #2D5A1B;border-radius:10px;padding:18px 22px;margin:18px 0 12px;">
      <div style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#2D5A1B;font-weight:700;margin-bottom:8px;">Client or Client\u2019s Representative <span style="background:#2D5A1B;color:#FFF;font-size:10px;padding:2px 9px;border-radius:12px;margin-left:8px;">Signed</span></div>
      ${clientSig}
      <div style="font-size:13px;color:#3B3B34;margin-top:4px;">${escapeHtml(a.signerName)} \u00b7 ${a.signerRole === 'representative' ? 'Client\u2019s Representative' : 'Client'}</div>
      <div style="font-size:12px;color:#6B6B62;">Signed ${fmtStampLong(a.signedAtIso)} \u00b7 ${a.signatureKind === 'drawn' ? 'Hand-drawn signature' : 'Signed by typed name'}</div>
    </div>

    <div style="background:#F6F8F2;border:1px solid #DCE5D2;border-radius:10px;padding:18px 22px;margin:0 0 22px;">
      <div style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#2D5A1B;font-weight:700;margin-bottom:8px;">Signed for ${escapeHtml(AGENCY.legalName)}</div>
      <div style="${SCRIPT_SIG}">${escapeHtml(a.repName)}</div>
      <div style="font-size:12px;color:#6B6B62;">${escapeHtml(a.repName)} \u00b7 Signed ${fmtStampLong(a.repSignedAtIso)}</div>
    </div>

    <p style="font-size:11.5px;color:#8A8A80;line-height:1.6;">${escapeHtml(ESIGN_NOTE)}</p>
  </div>
  <div style="background:#F4F3EC;border-top:1px solid #E4E2D8;padding:16px 36px;font-size:11px;color:#8A8A80;text-align:center;line-height:1.7;">
    ${escapeHtml(AGENCY.name)} \u00b7 ${escapeHtml(AGENCY.address)}<br>
    ${escapeHtml(AGENCY.license)} \u00b7 Agreement version ${AGREEMENT_VERSION}
  </div>
</div>
</body></html>`
  )
}

/** The signing-link email (branded, CTA button, LOCKED reassurance copy). */
export function renderConsentRequestEmail(args: {
  paragraphsBefore: string[]   // greeting + intro + reassurance, plain text
  paragraphsAfter: string[]    // closing help paragraph, plain text
  signUrl: string
  senderName: string
}): string {
  const para = (t: string) => `<p style="margin:0 0 15px;">${escapeHtml(t)}</p>`
  return (
`<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F4F3EC;">
<div style="max-width:640px;margin:0 auto;background:#FFFFFF;font-family:'DM Sans',Arial,sans-serif;color:#2A2A26;">
  <div style="background:#2D5A1B;padding:26px 28px 22px;">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;color:#FFFFFF;font-size:26px;font-weight:600;letter-spacing:0.4px;">Vitalis <span style="color:#7AB52A;">HealthCare</span></div>
    <div style="height:3px;width:52px;background:#7AB52A;margin-top:10px;border-radius:2px;"></div>
  </div>
  <div style="padding:30px 32px 8px;font-size:15px;line-height:1.65;">
    ${args.paragraphsBefore.map(para).join('')}
    <div style="text-align:center;padding:8px 0 14px;">
      <a href="${args.signUrl}" style="display:inline-block;background:#2D5A1B;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:14px 34px;border-radius:6px;">Review &amp; Sign the Agreement</a>
      <div style="font-size:12px;color:#8A8A80;margin-top:10px;">This secure link is personal to you \u2014 please don\u2019t forward it.</div>
    </div>
    ${args.paragraphsAfter.map(para).join('')}
  </div>
  <div style="padding:2px 32px 26px;font-size:15px;line-height:1.55;">
    Warm regards,<br>
    <span style="font-weight:700;color:#2D5A1B;">${escapeHtml(args.senderName)}</span><br>
    <span style="font-size:13px;color:#6B6B62;">Vitalis HealthCare \u00b7 ${escapeHtml(AGENCY.phoneDisplay)}</span>
  </div>
  <div style="background:#F4F3EC;border-top:1px solid #E4E2D8;padding:18px 28px 20px;font-size:11.5px;color:#8A8A80;line-height:1.7;text-align:center;">
    <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;color:#2D5A1B;font-weight:600;">${escapeHtml(AGENCY.name)}</span><br>
    ${escapeHtml(AGENCY.address)} \u00b7 Tel ${escapeHtml(AGENCY.phoneDisplay)} \u00b7 Fax (240) 266-0650<br>
    ${escapeHtml(AGENCY.license)}
  </div>
</div>
</body></html>`
  )
}
