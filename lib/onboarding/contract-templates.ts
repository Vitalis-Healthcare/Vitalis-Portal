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

export type ContractTemplateKey = 'companion-care' | 'cna-gna'

export interface ContractTemplate {
  key: ContractTemplateKey
  docTitle: string
  positionTitle: string
  summary: string
  extraQualification: string | null
  dutiesIntro: string
  dutyAdl: string
  dutyCarePlan: string
  dutyCommunicates: string
  roleNoun: string
  roleNounLeading: string
  acknowledgment: string
  signatureLabel: string
}

const REPORTS_TO = 'DON/RN Supervisor'

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
}

export const CONTRACT_TEMPLATE_CHOICES: { key: ContractTemplateKey; label: string }[] = [
  { key: 'companion-care', label: 'Companion Care Aide (Unlicensed / PRN)' },
  { key: 'cna-gna', label: 'CNA / CMT / GNA (PRN)' },
]

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
}

export function renderContractHtml(opts: RenderContractOptions): string {
  const t = CONTRACT_TEMPLATES[opts.templateKey]
  const name = esc(opts.candidateName)
  const rate = esc(opts.payRate)
  const date = esc(opts.issuedDate)

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

  const auditLine = opts.signed
    ? `Signed electronically in the Vitalis Portal on ${esc(opts.signed.signedAt)}${
        opts.signed.ip ? ` from ${esc(opts.signed.ip)}` : ''
      }. This copy records the typed name above and the exact template text presented at signing. &nbsp;&middot;&nbsp; Template <strong>${t.key} ${CONTRACT_TEMPLATE_VERSION}</strong>`
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
  .term dd { margin: 0; font-size: 14px; font-weight: 500; color: var(--ink); line-height: 1.4; }
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
    <div class="term"><dt>Reports to</dt><dd>${REPORTS_TO}</dd></div>
    <div class="term"><dt>Pay rate</dt><dd>${rate}</dd></div>
  </dl>

  <h2>Position summary</h2>
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

  <div class="ack">
    <p class="ack-statement">${t.acknowledgment}</p>
    <div class="siglines">
      <div class="sigline">
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
