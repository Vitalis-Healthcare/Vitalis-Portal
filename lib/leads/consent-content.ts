// lib/leads/consent-content.ts
// ═════════════════════════════════════════════════════════════════════════
// Ship 5b (v0.6.46) — the Home Care Service Agreement / Consent Form.
//
// THE CARECLUB RULE, ADOPTED: this file is the ONLY place the agreement
// text lives. The wording below is transcribed VERBATIM from the agency's
// paper form (Vitalis_Service_Agreement-Consent_Form_032025.pdf). ANY
// wording change — even one word — bumps AGREEMENT_VERSION, and every
// signed snapshot records the version it was signed under.
//
// Rulings (Okezie, 6 Aug 2026):
//   • The agreement's own termination language (14-day notice) stands
//     unchanged. The reassurance copy is written to be CONSISTENT with
//     it: end anytime, we just ask for enough notice.
//   • Private Pay shows the staff-entered agreed rate on the form.
//   • The Vitalis representative signs at Prepare time (typed name).
// ═════════════════════════════════════════════════════════════════════════

export const AGREEMENT_VERSION = '2025-03'

export const AGENCY = {
  name: 'Vitalis HealthCare Services LLC',
  legalName: 'Vitalis Healthcare, LLC',
  address: '8757 Georgia Avenue, Suite 440, Silver Spring, MD 20910',
  phone: '240.716.6874',
  phoneDisplay: '(240) 716-6874',
  fax: '240.266.0650',
  license: 'Maryland-licensed Residential Service Agency · License #3879R',
  medicaidProviderNumber: '630016200',
}

export const INTRO_TEXT =
  'It is important that our client and families are involved with and informed about their care. Therefore we ask that you sign this form as documentation of your receipt and understanding of services provided, your rights and responsibilities and financial obligation if any.'

/** The agreement sections, in reading order, verbatim from the 032025 form. */
export const AGREEMENT_SECTIONS: { title: string; text: string }[] = [
  {
    title: 'Authorization for Treatment / Release of Information',
    text: 'I give my permission for authorized personnel of Vitalis Healthcare, LLC to perform all necessary procedures and treatments as prescribed by my physician. The healthcare providers responsible for my care may receive information regarding my diagnosis and/or condition. Although I understand that all information is confidential, I consent to record reviews by authorized representatives, including local and state agencies, Medicaid, private insurance companies, utilization review and licensing/accrediting bodies. Vitalis Healthcare, LLC has my permission to make photographic copies of my record when necessary. I understand that I have the legal right to refuse the release of this information and that I am waiving this legal right by signing this consent.',
  },
  {
    title: 'Receipt of Rights and Responsibilities',
    text: 'Vitalis will be providing me a copy of my rights and responsibilities as a Home Care Client and it is my responsibility to understand this.',
  },
  {
    title: 'Receipt of Advanced Directive Information',
    text: 'I will receive written information to understand my rights under state law to make decisions regarding medical care, including my right to accept or refuse life-sustaining medical or surgical treatment and my right to formulate Advance Directives. I understand that if Vitalis Healthcare, LLC can no longer meet my care or service needs because of its mission, philosophy or limitations in scope of care or services that I can participate in the transfer process to another organization or level of care.',
  },
]

/** Sections that follow the advance-directive checklist, verbatim. */
export const AGREEMENT_SECTIONS_AFTER_DIRECTIVES: { title: string; text: string }[] = [
  {
    title: 'Receipt of Emergency Plan',
    text: "I will receive the Agency's emergency preparedness plan and it is my responsibility to understand it and abide by it.",
  },
  {
    title: 'Receipt of Infection Control and Safety Measures',
    text: "I will receive the Agency's infection control and safety manual and it is my responsibility to read and understand it.",
  },
  {
    title: 'Notification of Services Provided',
    text: 'I understand that the following services will be provided in accordance with all applicable state and federal regulations. I understand that services and frequencies may change during the course of treatment and that I will be informed of such changes.',
  },
  {
    title: 'Service Agreement',
    text: 'I have voluntarily agreed to have the services provided by Vitalis Healthcare, LLC. I am aware that I have a choice of home care agencies and prefer to use Vitalis Healthcare, LLC. The services to be provided will be determined by me, my physician and the home health care team. I consent to have the home care team provide me with some home health care services according to the home health care team\u2019s policies and procedures.',
  },
  {
    title: 'Notification of Insurance Coverage and Financial Liability',
    text: 'I understand that Vitalis Healthcare, LLC will present claims for the payment of my home health care services to my insurance company or any other payment fiscal intermediary I qualify for. I also understand that I am responsible for the entire bill or balance of the same bill, if submitted claim(s) or any part of them is denied for payment. If applicable, I will be provided with an estimate for my anticipated financial liability.',
  },
  {
    title: 'Liability for Payment',
    text: 'I certify that all the information given by me to Vitalis Healthcare, LLC is correct for requesting and applying for payment under any third-party payer. I understand and agree to pay deductibles, co-payments, spend downs and any amount due after payment of benefits on my behalf by any and all third-party payers.',
  },
]

export const COMPLAINT_SECTION = {
  title: 'Notification of Complaint Procedure and Hotline Number',
  text: 'I will receive information on the Agency\u2019s complaint resolution procedure and the State Hotline number to call. Should I be dissatisfied with service, I can terminate this consent with a 14-day notice to the Agency.',
}

/** Advance-directive checklist, verbatim options. */
export const DIRECTIVE_OPTIONS = [
  { key: 'no_advance_directive', label: 'No Advanced Directive' },
  { key: 'ad_home_record', label: 'Copy of Advance Directive in Client Home Record' },
  { key: 'ad_medical_record', label: 'Copy of Advance Directive in Medical Record' },
  { key: 'living_will', label: 'Living Will' },
  { key: 'dpoa', label: 'Durable Power of Attorney' },
  { key: 'dnr', label: 'DNR ordered' },
] as const

export type DirectiveKey = (typeof DIRECTIVE_OPTIONS)[number]['key']

export const BILLING_METHODS = [
  {
    key: 'medicaid_waiver',
    label: 'Medicaid Waiver Program',
    detail: `Vitalis Provider Number: ${AGENCY.medicaidProviderNumber}`,
  },
  {
    key: 'insurance',
    label: 'Insurance',
    detail:
      'Coverage varies with individual policy. The client\u2019s anticipated payment amounts per visit will be provided in writing when the insurance company informs the organization of the client\u2019s financial eligibility. See Agency\u2019s separate visit rate information.',
  },
  {
    key: 'private_pay',
    label: 'Private Pay',
    detail:
      'See separate Private Pay Rate Sheet for fees for other services. Client is responsible for timely payment of all charges.',
  },
] as const

export type BillingMethodKey = (typeof BILLING_METHODS)[number]['key']

/** Agency Service Rate & Terms of Service — verbatim bullets from page 4. */
export const TERMS_INTRO =
  'Thank you for choosing Vitalis Healthcare, LLC as your home care provider. Please find below our company billing information. If you have any questions, please do not hesitate to contact our Administrator.'

export const TERMS_BULLETS: string[] = [
  'If you currently are approved on MD Medicaid Waiver program, all applicable services will be billed through your local health department or governing agency as soon we are approved to bill MD Medicaid Waiver.',
  'If you currently have your own private insurance, your insurance information will be collected and verified at the start of care. All applicable services (under your member eligibility) will be sent to your insurance company for re-imbursement.',
  'Vitalis Healthcare will require a refundable deposit equal to one week of agreed number of hours of services to be provided by the agency. This refundable deposit will be applied to your final invoice or refunded if all invoices have been paid. Only the Agency Administrator can waive the refundable deposit in writing.',
  'As a private pay client, the billing cycle is weekly, and the acceptable payment should be in the form of a check or money order or online payment using bank ACH transfer or any of the common debit or credit cards. Payment on the invoice is due 7 days from the date of invoice.',
  'The Client is liable for all payments. Any modification to the billing cycle will be communicated in writing by the Agency Administrator.',
  'All approved Client payor information, including those with power of attorney to make payment on behalf of client\u2019s estate will be kept in the client file.',
  'You will be billed only for services which you have received. You are required to give the Agency a one-week notice in writing to cancel scheduled visits. For cancellation notices received in less than one week, there will be billed a minimum of 2 hours or 50% of the scheduled time (whichever is higher) (\u201cthe Late Cancellation Rate\u201d). This Late Cancellation Rate can only be waived with a written letter from the Agency Administrator.',
  'Please note that late payments will be assessed at a 3% late fee after 10 days from the initial payment due date.',
  'If payment has not been received after two billing cycles, services will be stopped, and your account will be sent to collections.',
]

// ── The reassurance copy (LOCKED, Okezie 6 Aug 2026) ─────────────────────
// Written to be CONSISTENT with the agreement's own 14-day-notice text:
// end whenever you choose; we ask for enough notice to wind down smoothly.

export const REASSURANCE_TITLE = 'Before you sign \u2014 you stay in control.'
export const REASSURANCE_BODY =
  'This agreement doesn\u2019t bind you to Vitalis long-term. Maryland regulations protect your right to end services whenever you choose \u2014 we simply ask for enough notice to wind down care smoothly. Signing confirms two things: that you\u2019ve given us permission to send our caregivers to the home, and that we\u2019ve discussed and agreed on a rate together.'

export const EMAIL_REASSURANCE_PARAGRAPH =
  'One thing worth saying plainly: signing this does not lock you in. Under Maryland regulations you are always free to end services \u2014 the agreement simply confirms your permission for our caregivers to come to the home, and records the rate we discussed together. If your circumstances ever change, you can end services whenever you choose; we just ask for enough notice so we can wind down care smoothly.'

export const ESIGN_NOTE =
  'By selecting \u201cSign the Agreement,\u201d you agree that your electronic signature is the legal equivalent of your handwritten signature on this agreement. A signed copy will be emailed to you for your records.'

// ── The staff-entered prefill shape (stored jsonb on lead_consents) ──────

export interface ConsentPrefill {
  client_name: string
  dob: string | null            // date-only string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  start_of_care: string | null  // date-only string
  ltc_insurer: string | null
  ltc_claim: string | null
  billing_method: BillingMethodKey
  private_pay_rate: string | null   // display string, e.g. "$34.00/hour"
  insurance_projected: string | null // e.g. "80% of charges after deductible met"
}

export function isValidBillingMethod(k: string): k is BillingMethodKey {
  return BILLING_METHODS.some(b => b.key === k)
}

export function isValidDirectiveKey(k: string): k is DirectiveKey {
  return DIRECTIVE_OPTIONS.some(d => d.key === k)
}
