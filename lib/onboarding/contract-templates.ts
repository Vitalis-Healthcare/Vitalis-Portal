// lib/onboarding/contract-templates.ts
//
// The caregiver agreement templates (job description + acknowledgment).
//
// These live in CODE, not the database, deliberately: they are legal text, so
// every change should arrive through a reviewed pull request with a version
// bump, not an untracked UPDATE in the SQL Editor. What goes in the database is
// the RENDERED SNAPSHOT of what a given person actually signed
// (onb_contracts.rendered_html), so amending a template can never retroactively
// change the wording someone already agreed to.
//
// The two source documents share a skeleton but differ in nine places: scope of
// services, governing procedures, who directs the work, the reporting line, the
// in-home supervision line (twice), ADL wording, care plan type, one extra
// licensure qualification, and the acknowledgment/signature labels. Those
// differences are declared explicitly per position so they cannot be quietly
// collapsed into one parameterised template.
//
// Approved by Okezie on 2026-07-27, including two corrections to the CNA source
// document: the position abbreviation in the job duties line was transposed,
// and the slash run in that same line was doubled. Both are corrected below.
// (Deliberately described rather than quoted — the deploy script greps this
// file for the malformed forms, and a quoted example would trip its own guard.)

export const CONTRACT_TEMPLATE_VERSION = 'v1'

export type ContractTemplateKey = 'companion-care' | 'cna-gna' | 'rn' | 'lpn'

/**
 * Which body the document uses.
 *
 *   'aide'     — the two source documents this file was built from. They share
 *                a fixed skeleton: a 16-item duties tail, a knowledge/skills
 *                block, and the shift-commitment and penalty clause.
 *   'clinical' — the RN and LPN documents (v0.6.64). Different shape entirely:
 *                an essential-function convention, a work-environment section
 *                split into physical and environmental elements, and a scope
 *                disclaimer. They carry NO shift-penalty clause, because their
 *                source documents do not contain one and terms are not invented
 *                for a legal document (Okezie, 6 August 2026: aide only).
 *
 * The two bodies are separate functions rather than one parameterised body.
 * Forcing the nurse documents through the aide skeleton would either drop the
 * text Okezie supplied or bolt aide clauses onto a nurse, and both are worse
 * than thirty lines of shared chrome.
 */
export type ContractLayout = 'aide' | 'clinical'

interface BaseTemplate {
  key: ContractTemplateKey
  layout: ContractLayout
  docTitle: string
  positionTitle: string
  /** Per template since v0.6.64 — the nurse documents report elsewhere. */
  reportsTo: string
  summary: string
  acknowledgment: string
  signatureLabel: string
}

export interface AideTemplate extends BaseTemplate {
  layout: 'aide'
  extraQualification: string | null
  dutiesIntro: string
  dutyAdl: string
  dutyCarePlan: string
  dutyCommunicates: string
  roleNoun: string
  roleNounLeading: string
}

export interface ClinicalTemplate extends BaseTemplate {
  layout: 'clinical'
  /** Position-specific; the shared documentation block is appended. */
  qualifications: string[]
  /** A trailing '*' marks an essential job function. */
  duties: string[]
}

export type ContractTemplate = AideTemplate | ClinicalTemplate

const REPORTS_TO = 'DON/RN Supervisor'

// ── Clinical-layout shared text (v0.6.64) ───────────────────────────────────
// The documentation block is appended to BOTH nurse qualification lists so all
// four agreements ask for the same health and identity evidence. Okezie,
// 6 August 2026: the gate demands photo ID, CPR and TB of every candidate
// regardless of position, so a nurse should be able to read that on the
// document they sign rather than discover it at the gate.
const QUALIFICATIONS_DOCUMENTATION = [
  'Current First Aid and CPR',
  'Current: Health Certificate (within the past 12 months)',
  'MMR (immunization record or current titer level)',
  'PPD/C chest X-ray (within the past 12 months)',
  'Current government-issued photo identification',
  'Criminal history record check (CJIS) obtained through the Agency',
]

const CLINICAL_DUTIES_INTRO =
  'The person in this position must be able to perform the following essential job functions, with or without reasonable accommodation.'

const CLINICAL_ENVIRONMENT_INTRO =
  'The work environment and physical demands described here are representative of those required of an employee to perform the essential functions of this job, with or without reasonable accommodation.'

const CLINICAL_PHYSICAL = [
  'Sufficient clarity of speech and hearing or other communication capabilities, with or without reasonable accommodation, to enable the employee to communicate effectively',
  'Sufficient vision or other powers of observation, with or without reasonable accommodation, to enable the employee to review a wide variety of materials in electronic or hard copy form',
  'Sufficient manual dexterity, with or without reasonable accommodation, to enable the employee to operate a personal computer, telephone, and other related equipment',
  'Sufficient personal mobility and physical reflexes, with or without reasonable accommodation, to enable the employee to safely lift, move, or maneuver whatever may be necessary to successfully perform the duties of the position',
  'Sufficient personal mobility and physical reflexes, with or without reasonable accommodation, to enable the employee to function efficiently in a general office environment, with frequent travel to a variety of field sites',
]

const CLINICAL_ENVIRONMENTAL = [
  'The employee works in an office environment, sometimes with moderate noise levels and controlled temperature conditions, and travels to patients&rsquo; homes where there may be direct exposure to hazardous substances. The employee may interact with upset staff and with public and private representatives in interpreting and enforcing agency policies and procedures.',
  'The employee travels to a variety of patients&rsquo; homes and works in conditions that vary greatly depending on the client&rsquo;s home environment. Some homes are clean, neat, and maintained at a comfortable temperature. Other homes may be cluttered or dirty, or kept at an uncomfortable temperature.',
]

const CLINICAL_SCOPE =
  'The list above reflects the essential functions and other job functions considered necessary to the job identified, and shall not be construed as a detailed description of all work requirements inherent in the job or assigned by supervisory personnel. This job description is a guide only and is not inclusive of all responsibilities and job duties.'

const ACK_CLINICAL =
  'By my signature, I acknowledge that I have read and understand this job description and its requirements, and that I am expected to complete all duties as assigned. I understand that the job functions may be altered from time to time.'

const QUALIFICATIONS_TOP = [
  'High school graduate or GED equivalent',
  'Minimum of one (1) year recent experience in a homecare setting within a period of two (2) years.',
]

const QUALIFICATIONS_BOTTOM = [
  'Proficient in the English Language',
  'Good verbal and written skills',
  'Current First Aid and CPR',
  'Current: Health Certificate (within the past 12 months)',
  'MMR (immunization record or current titer level)',
  'PPD/C chest X-ray (within the past 12 months)',
]

const DUTIES_TAIL = [
  'On-going assessment or observing, reporting, and recording or document over changes in client&rsquo;s condition such as experiencing withdrawal, and implements nurse and physician orders and reporting problems in a timely manner to the appropriate person',
  'Takes and records temperature, pulse, respiration and blood pressure with appropriate skills and competency',
  'Maintaining cleanliness of assigned client and work area',
  'Functioning in an effective manner in emergency situations',
  'Carrying out basic patient care procedures safely, accurately and according to agency protocol',
  'Report all complaints and grievances made by the client',
  'Report and document all incidents report in a timely manner',
  'Use only authorized abbreviations established by the family/ facility when recording information',
  'Supporting health teaching and patient care delivered by licensed nursing personnel',
  'Performing tasks and/ or interacting with client, families, staff and other personnel in a courteous, honest and compassionate manner',
  'Documenting accurate basic information and date on appropriate forms',
  'Running errands and driving client to doctor&rsquo;s appointment',
  'Works effectively with the nursing team to assure they have adequate information to provide appropriate care',
  'Attends and participates in regularly scheduled meetings and in-service training.',
  'Pursues continuing educational opportunities',
  'Responsible for participation in Quality Management Plan to assist in identifying and correcting problem areas, and/or the improvement of services',
]

const KSA = [
  'Comprehensive knowledge of nursing care',
  'Ability to maintain detailed records',
  'Ability to establish and maintain positive, professional relationships',
  'Ability to collect laboratory specimen if necessary and needed',
]

const PHYSICAL = [
  'Must be able to move intermittently or documentation of good physical condition to allow standing, bending, stretching, walking, pulling, pushing, and lifting, able to lift a minimum of 50 lbs., push, and pull light to moderate loads throughout the workday',
  'Must be able to speak the English language in an understandable manner',
  'Must be able to cope with the mental and emotional stress of the position',
  'Must be able to see and hear, or use prosthetics that will enable these senses to function adequately to assure that the requirements of this position can be fully met',
  'Must function independently, have flexibility, personal integrity, and the ability to work effective with client, personnel, and support agencies',
  'Must be in good general health and demonstrate emotional stability',
  'Must be able to relate to and work with the ill, disabled, elderly, emotionally upset, and at times hostile people within the facility or home visit',
  'Must be able to function in a practice environment with minimal direct supervision',
]

export const CONTRACT_TEMPLATES: Record<ContractTemplateKey, ContractTemplate> = {
  'companion-care': {
    key: 'companion-care',
    layout: 'aide',
    reportsTo: REPORTS_TO,
    docTitle: 'Companion Care Aide',
    positionTitle: 'COMPANION CARE (Unlicensed / PRN)',
    summary:
      'Responsible for providing routine daily personal care services to clients, according to the Companion Care Aide assignment and in accordance with our established companion care procedures, and as may be directed by the Agency. The Companion Care Aide is responsible to the Director of Nursing/Agency Supervisor. In being assigned to a home, the Companion Care Aide is responsible to the assigned home under the direct supervision of the RN or Agency Supervisor, for providing quality care. This is a Pro Re Nata (PRN) position and aide will be staffed on cases as they are available and as there is a fit between the aide and the prospective client.',
    extraQualification: null,
    dutiesIntro:
      'The Companion Care Aide is responsible to the family member and client. The Companion Care Aide is under the direct supervision of the RN or Agency Supervisor for providing quality care by:',
    dutyAdl:
      'Assisting with activities of daily living such as meal preparations, and light housekeeping',
    dutyCarePlan: 'Rendering patient care based on the developed home care plan',
    dutyCommunicates: 'Communicates effectively and professionally.',
    roleNoun: 'the Companion Care Aide',
    roleNounLeading: 'The Companion Care Aide',
    acknowledgment:
      'I have read and understand the above job description of the Companion Care Aide (Unlicensed).',
    signatureLabel: 'Companion Care Aide Name &amp; Signature',
  },
  'cna-gna': {
    key: 'cna-gna',
    layout: 'aide',
    reportsTo: REPORTS_TO,
    docTitle: 'CNA / CMT / GNA',
    positionTitle: 'CNA/CMT/GNA (PRN)',
    summary:
      'Responsible for providing routine daily nursing and personal care services to clients, according to the Certified Nursing Aide assignment and in accordance with our established nursing care procedures, and as may be directed by the Registered Nurse. The CNA/CMT/GNA is responsible to the Director of Nursing/RN Supervisor. In being assigned to a home, the CNA/CMT/GNA is responsible to the assigned home under the direct supervision of the RN, for providing quality care. This is a Pro Re Nata (PRN) position and aide will be staffed on cases as they are available and as there is a fit between the aide and the prospective client.',
    extraQualification: 'CNA /GNA Certificate in the <strong>State of MD</strong>',
    dutiesIntro:
      'The CNA/GNA is responsible to the family member and client. The CNA/CMT/GNA is under the direct supervision of the RN for providing quality care by:',
    dutyAdl:
      'Assisting with all activities of daily living such as meal preparations, and light housekeeping',
    dutyCarePlan: 'Rendering patient care based on the developed nursing care plan',
    dutyCommunicates: 'Communicates effectively and professionally',
    roleNoun: 'CNA/CMT/GNA',
    roleNounLeading: 'CNA/CMT/GNA',
    acknowledgment: 'I have read and understand the above job description of the CNA/GNA',
    signatureLabel: 'CNA/GNA Name &amp; Signature',
  },

  // ── The nurse documents (v0.6.64) ────────────────────────────────────────
  // Transcribed from the RN and LPN job descriptions Okezie supplied on
  // 6 August 2026, with the typographical corrections he approved: apostrophes
  // used as plurals, a misspelled Administrator, a pluralised preposition in
  // the RN summary, a bullet carrying a heading style, and several agreement
  // and duplication errors. Deliberately described rather than quoted — the
  // deploy script greps this file for the malformed forms, and a quoted
  // example would trip its own guard (the same convention as the header).
  // A trailing '*' on a duty marks an essential job function.
  'rn': {
    key: 'rn',
    layout: 'clinical',
    reportsTo: 'Administrator / DON',
    docTitle: 'Registered Nurse',
    positionTitle: 'REGISTERED NURSE (PRN)',
    summary:
      'Demonstrate proficient skills using assessments to admit, transfer, re-certify, and discharge home health patients in regard to physician orders. Coordinate and supervise LPNs and HHAs in the delivery of patient care. Maintain compliance with agency policy and procedures. Follow state regulations.',
    qualifications: [
      'Be a registered nurse (R.N.) with a current license.',
      'Minimum of one (1) year of nursing experience as an R.N.',
      'Work positively and favorably with patients, families, and staff.',
    ],
    duties: [
      'Perform the initial home care patient visit and re-evaluate the patient&rsquo;s needs and progress on a regular basis. *',
      'Initiate the plan of care under the physician&rsquo;s orders. *',
      'Perform assessments for the home care patient. *',
      'Observe, assess, and document symptoms. *',
      'Monitor reactions and patient progress. *',
      'Educate patients and caregivers on the disease process, medications, plan of care, and individualized treatment plans. *',
      'Educate patients and caregivers on techniques for in-home health care. *',
      'Coordinate patient services. *',
      'Supervise LPNs and HHAs. *',
      'Notify the physician and other personnel (DON, PT, Case Manager) of any change in the patient&rsquo;s condition. *',
      'Perform the skills outlined in the agency&rsquo;s approved policy and procedure manual. *',
      'Discharge the patient from skilled nursing services when the discharge criteria have been met. *',
      'Case conference with clinicians providing care to ensure coordination of care. *',
      'Update clinical records according to policy and procedures. *',
      'Update knowledge and skills by attending in-service programs, continuing education programs, seminars, and self-study programs annually. *',
      'Provide onsite supervision of the LPN and HHA. *',
      'Adhere to state regulations. *',
    ],
    acknowledgment: ACK_CLINICAL,
    signatureLabel: 'Registered Nurse Name &amp; Signature',
  },

  'lpn': {
    key: 'lpn',
    layout: 'clinical',
    reportsTo: 'RN / Administrator',
    docTitle: 'Licensed Practical Nurse',
    positionTitle: 'LICENSED PRACTICAL NURSE (PRN)',
    summary:
      'Provide nursing care to patients in the home setting. Observe and assess the client and caregiver to enhance the quality of life. Demonstrate individualized creativity in educating the patient and caregiver. Follow nursing policy and procedure per agency standards. Follow the plan of care according to physician orders. Demonstrate understanding of state regulations.',
    qualifications: [
      'Be a licensed practical nurse (L.P.N.) with a current license.',
      'Minimum of two (2) years of experience in a healthcare setting.',
      'Excellent oral and written communication skills.',
    ],
    duties: [
      'Demonstrate efficient teamwork with the staff.',
      'Demonstrate organizational and time management skills.',
      'Support quality improvement practices. *',
      'Perform nursing procedures according to agency policy and procedures. *',
      'Work under the direction of an RN.',
      'Monitor reactions and patient progress using observation, assessment, and evaluation skills.',
      'Educate patients and family members on the disease process, medications, treatment options, and home care procedures according to the plan of care. *',
      'Report adverse findings to the physician and the RN. *',
      'Follow state regulations. *',
      'Coordinate and monitor patient care and services. *',
      'Comply with HIPAA regulations in and out of the office. *',
      'Follow infection control policy in and out of the office. *',
      'Document skilled visits according to guidelines. *',
      'Maintain patient records according to policy and procedures. *',
      'Participate in in-services, workshops, seminars, and self-study courses annually. *',
    ],
    acknowledgment: ACK_CLINICAL,
    signatureLabel: 'Licensed Practical Nurse Name &amp; Signature',
  },
}

export const CONTRACT_TEMPLATE_CHOICES: { key: ContractTemplateKey; label: string }[] = [
  { key: 'companion-care', label: 'Companion Care Aide (Unlicensed / PRN)' },
  { key: 'cna-gna', label: 'CNA / CMT / GNA (PRN)' },
  { key: 'lpn', label: 'Licensed Practical Nurse (PRN)' },
  { key: 'rn', label: 'Registered Nurse (PRN)' },
]

/** Positions that require an MBON license. A waiver can never apply to these. */
export const LICENSED_TEMPLATE_KEYS: ContractTemplateKey[] = ['rn', 'lpn']

export function isLicensedTemplate(key: string): boolean {
  return (LICENSED_TEMPLATE_KEYS as string[]).includes(key)
}

// Escape anything that came from a person. Template copy above is trusted
// author-controlled HTML; candidate names and pay rates are not.
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function li(items: string[]): string {
  return items.map((i) => `      <li>${i}</li>`).join('\n')
}

export interface RenderContractOptions {
  templateKey: ContractTemplateKey
  candidateName: string
  payRate: string
  issuedDate: string
  /** Present once signed — stamps the audit line onto the document face. */
  signed?: { signedAt: string; ip: string | null }
  /**
   * PNG data URL of a drawn signature (v0.6.65). Embedded INLINE rather than
   * linked, because rendered_html is the legal record and must prove itself
   * without depending on a column, a bucket or a route still being there years
   * from now. Absent when the person signed by typed name alone, which stays a
   * valid electronic signature and a necessary fallback.
   */
  signatureImage?: string | null
}

const SIGNATURE_CSS = `
  .drawnsig {
    display: block; max-width: 100%; max-height: 68px; width: auto;
    margin: 0 0 2px; object-fit: contain; object-position: left bottom;
  }`

const CLINICAL_CSS = `
  .essential { color: var(--green-dark); font-weight: 700; }
  .footnote {
    font-size: 10.5px; color: #7A8875; letter-spacing: .03em;
    margin: 4px 0 14px; padding-left: 3px;
  }
  .envnote {
    border-left: 3px solid var(--rule); background: #FAFBF9;
    padding: 16px 22px 4px; margin: 4px 0 14px;
  }
  .scope { font-size: 12.5px; color: #6B7A66; }`

function aideBody(t: AideTemplate): string {
  const qualifications = [
    ...QUALIFICATIONS_TOP,
    ...(t.extraQualification ? [t.extraQualification] : []),
    ...QUALIFICATIONS_BOTTOM,
  ]

  const duties = [
    'Providing personal care and assisting with hygiene, including necessary baths, oral hygiene, and shampoo and changing bed lines.',
    t.dutyAdl,
    t.dutyCarePlan,
    ...DUTIES_TAIL,
    t.dutyCommunicates,
    'Performs related duties as assigned',
  ]

  return `  <h2>Position summary</h2>
  <p>${t.summary}</p>

  <h2>Qualifications</h2>
  <ul>
${li(qualifications)}
  </ul>

  <h2>Job duties</h2>
  <p>${t.dutiesIntro}</p>
  <ul>
${li(duties)}
  </ul>

  <h2>Knowledge, skills and abilities</h2>
  <ul>
${li(KSA)}
  </ul>

  <h2>Physical requirements</h2>
  <ul>
${li(PHYSICAL)}
  </ul>

  <h2>Other requirements</h2>
  <div class="attendance">
    <ul>
      <li>${t.roleNounLeading} must only pick up shifts that they are willing and able to be committed to both in time and work requirement.</li>
      <li>Unless in the case of an emergency, once ${t.roleNoun} has accepted a shift, he or she must inform the office about their inability to cover any shift they have accepted <strong>48 hours</strong> before the start of the shift.</li>
      <li>A penalty of <strong>$50</strong> shall be deducted from the paycheck of ${t.roleNoun} that gives less than 48 hours&rsquo; notice to call out of any shift. In the event of a no-call, no-show, ${t.roleNoun} shall receive a <strong>warning letter</strong> in addition to the <strong>$50 penalty</strong>.</li>
      <li>Only the Agency Administrator can waive this penalty or warning letter.</li>
    </ul>
  </div>

`
}

/**
 * The RN and LPN body. A different document, not a variation on the aide one:
 * an essential-function convention, work environment split into physical and
 * environmental elements, and a scope disclaimer. No shift-penalty clause —
 * their source documents do not contain one.
 */
function clinicalBody(t: ClinicalTemplate): string {
  const qualifications = [...t.qualifications, ...QUALIFICATIONS_DOCUMENTATION]
  const duties = t.duties.map((d) =>
    d.endsWith('*') ? `${d.slice(0, -1).trim()}<span class="essential">&nbsp;*</span>` : d,
  )

  return `  <h2>Position summary</h2>
  <p>${t.summary}</p>

  <h2>Qualifications and educational requirements</h2>
  <ul>
${li(qualifications)}
  </ul>

  <h2>Responsibilities and essential functions</h2>
  <p>${CLINICAL_DUTIES_INTRO}</p>
  <ul>
${li(duties)}
  </ul>
  <p class="footnote"><span class="essential">*</span> Essential job function</p>

  <h2>Work environment and physical requirements</h2>
  <p>${CLINICAL_ENVIRONMENT_INTRO}</p>

  <h2>Physical elements</h2>
  <ul>
${li(CLINICAL_PHYSICAL)}
  </ul>

  <h2>Environmental elements</h2>
  <div class="envnote">
${CLINICAL_ENVIRONMENTAL.map((para) => `    <p>${para}</p>`).join('\n')}
  </div>

  <h2>Scope of this description</h2>
  <p class="scope">${CLINICAL_SCOPE}</p>

`
}

export function renderContractHtml(opts: RenderContractOptions): string {
  const t = CONTRACT_TEMPLATES[opts.templateKey]
  const name = esc(opts.candidateName)
  const rate = esc(opts.payRate)
  const date = esc(opts.issuedDate)

  // One entry point, two bodies. Every consumer keeps calling this function.
  const body = t.layout === 'clinical' ? clinicalBody(t) : aideBody(t)

  // Only a PNG data URL is ever emitted here. Anything else is dropped rather
  // than trusted: this string goes into a stored document, and a src the
  // renderer did not recognise has no business inside a legal record.
  const img = typeof opts.signatureImage === 'string' && opts.signatureImage.startsWith('data:image/png;base64,')
    ? opts.signatureImage
    : ''
  const drawnMark = img
    ? `\n        <img class="drawnsig" src="${img}" alt="Signature of ${name}">`
    : ''
  const signatureCss = img ? SIGNATURE_CSS : ''
  // Emitted only for the clinical layout, so an aide document's stored
  // snapshot carries exactly the rules it uses and not a byte more.
  const clinicalCss = t.layout === 'clinical' ? CLINICAL_CSS : ''

  const auditLine = opts.signed
    ? `Signed electronically in the Vitalis Portal on ${esc(opts.signed.signedAt)}${
        opts.signed.ip ? ` from ${esc(opts.signed.ip)}` : ''
      }, ${img ? 'by drawn signature and typed name' : 'by typed name'}. This copy records the signature above and the exact template text presented at signing. &nbsp;&middot;&nbsp; Template <strong>${t.key} ${CONTRACT_TEMPLATE_VERSION}</strong>`
    : `To be signed electronically in the Vitalis Portal. The signed copy records the typed name, the exact template text presented, the template version, the signing timestamp and the originating IP address. &nbsp;&middot;&nbsp; Template <strong>${t.key} ${CONTRACT_TEMPLATE_VERSION}</strong>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t.docTitle} &mdash; Job Description &amp; Acknowledgment | Vitalis Healthcare Services</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  :root {
    --green-dark: #2D5A1B; --green-bright: #7AB52A;
    --ink: #1C2A18; --body: #333B31; --rule: #D8DFD3;
  }
  body {
    margin: 0; padding: 0;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    font-size: 14px; line-height: 1.62; color: var(--body);
    -webkit-font-smoothing: antialiased;
  }
  .sheet { max-width: 8.5in; margin: 0 auto; background: #fff; padding: 8px 0 32px; }
  .masthead {
    border-top: 3px solid var(--green-dark); padding-top: 20px;
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 24px; flex-wrap: wrap;
  }
  .agency {
    font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
    font-size: 23px; font-weight: 700; color: var(--green-dark);
    letter-spacing: .01em; line-height: 1.2;
  }
  .agency small {
    display: block; font-family: 'DM Sans', Arial, sans-serif; font-size: 11px;
    font-weight: 400; color: #6B7A66; letter-spacing: .04em; margin-top: 5px;
  }
  .docmeta {
    text-align: right; font-size: 11px; color: #6B7A66; letter-spacing: .05em;
    text-transform: uppercase; line-height: 1.8; padding-top: 4px;
  }
  h1 {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 34px;
    font-weight: 600; color: var(--ink); margin: 34px 0 4px;
    line-height: 1.15; letter-spacing: -.01em;
  }
  .subtitle { font-size: 13px; color: #6B7A66; margin: 0 0 30px; }
  .terms {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
    background: var(--rule); border: 1px solid var(--rule); margin-bottom: 34px;
  }
  .term { background: #FAFBF9; padding: 14px 18px; }
  .term dt {
    font-size: 10px; font-weight: 700; letter-spacing: .09em;
    text-transform: uppercase; color: #7A8875; margin-bottom: 5px;
  }
  .term dd { margin: 0; font-size: 14px; font-weight: 500; color: var(--ink); line-height: 1.4; }${signatureCss}${clinicalCss}
  h2 {
    font-size: 11px; font-weight: 700; letter-spacing: .11em; text-transform: uppercase;
    color: var(--green-dark); margin: 32px 0 12px; padding-bottom: 7px;
    border-bottom: 1px solid var(--rule);
  }
  p { margin: 0 0 14px; }
  ul { margin: 0 0 14px; padding-left: 0; list-style: none; }
  li { position: relative; padding-left: 20px; margin-bottom: 7px; }
  li::before {
    content: ''; position: absolute; left: 3px; top: .62em; width: 5px; height: 5px;
    background: var(--green-bright); border-radius: 50%;
  }
  .attendance {
    border-left: 3px solid var(--green-bright); background: #F7FAF4;
    padding: 18px 22px 6px; margin: 4px 0 14px;
  }
  .attendance li::before { background: var(--green-dark); }
  .attendance strong { color: var(--ink); }
  .ack { margin-top: 40px; padding-top: 26px; border-top: 2px solid var(--green-dark); }
  .ack-statement { font-size: 15px; color: var(--ink); font-weight: 500; margin-bottom: 26px; }
  .siglines { display: grid; grid-template-columns: 1fr 200px; gap: 20px 32px; }
  .sigline { margin-bottom: 20px; }
  .sigvalue {
    min-height: 34px; border-bottom: 1px solid #9DA89A; padding-bottom: 5px;
    font-size: 16px; color: var(--ink);
  }
  .siglabel {
    font-size: 10px; letter-spacing: .07em; text-transform: uppercase;
    color: #7A8875; margin-top: 6px;
  }
  .typed { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 600; color: var(--ink); }
  .audit {
    margin-top: 22px; padding: 12px 16px; background: #FAFBF9; border: 1px solid var(--rule);
    font-size: 10.5px; color: #7A8875; line-height: 1.75; letter-spacing: .02em;
  }
  footer {
    margin-top: 34px; padding-top: 16px; border-top: 1px solid var(--rule);
    font-size: 10.5px; color: #8A9686; text-align: center; line-height: 1.8;
  }
  @media (max-width: 720px) {
    .sheet { padding: 8px 0 32px; }
    h1 { font-size: 27px; }
    .terms { grid-template-columns: 1fr; }
    .siglines { grid-template-columns: 1fr; }
  }
  @media print {
    @page { size: letter portrait; margin: 0.6in; }
    body { font-size: 10.5pt; line-height: 1.5; }
    .sheet { padding: 0; max-width: none; }
    /* A Letter page less its margins is about 700 CSS pixels, which trips the
       720px narrow-screen rule above and collapses these two grids into a
       single column on every printed or PDF copy. Paper is not a phone, so
       print restores the columns explicitly. Latent since the printable
       agreement shipped in v0.6.56; found when the PDF made it visible. */
    .terms { grid-template-columns: repeat(3, 1fr); }
    .siglines { grid-template-columns: 1fr 200px; }
    h2 { margin-top: 20px; break-after: avoid; }
    li { break-inside: avoid; }
    .ack, .attendance { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="sheet">

  <div class="masthead">
    <div class="agency">
      Vitalis Healthcare Services, LLC
      <small>For reliable and compassionate care</small>
    </div>
    <div class="docmeta">
      Job description<br>&amp; acknowledgment<br>
      OHCQ Lic. #3879R
    </div>
  </div>

  <h1>${t.docTitle}</h1>
  <p class="subtitle">Position description and terms of engagement</p>

  <dl class="terms">
    <div class="term"><dt>Position title</dt><dd>${t.positionTitle}</dd></div>
    <div class="term"><dt>Reports to</dt><dd>${t.reportsTo}</dd></div>
    <div class="term"><dt>Pay rate</dt><dd>${rate}</dd></div>
  </dl>

${body}  <div class="ack">
    <p class="ack-statement">${t.acknowledgment}</p>
    <div class="siglines">
      <div class="sigline">${drawnMark}
        <div class="sigvalue typed">${name}</div>
        <div class="siglabel">${t.signatureLabel}</div>
      </div>
      <div class="sigline">
        <div class="sigvalue">${date}</div>
        <div class="siglabel">Date</div>
      </div>
      <div class="sigline">
        <div class="sigvalue typed">Okezie Ofoegbu</div>
        <div class="siglabel">Agency representative</div>
      </div>
      <div class="sigline">
        <div class="sigvalue">${date}</div>
        <div class="siglabel">Date</div>
      </div>
    </div>
    <div class="audit">${auditLine}</div>
  </div>

  <footer>
    Vitalis Healthcare Services, LLC &middot; 8757 Georgia Avenue, Suite 440 &middot; Silver Spring, MD 20910<br>
    Office 240.716.6874 &middot; Fax 240.266.0650
  </footer>

</div>
</body>
</html>`
}
