// lib/leads/email-templates.ts
// ═════════════════════════════════════════════════════════════════════════
// Ship 5a (v0.6.45) — the outbound lead email templates.
//
// Templates are PURE functions: (lead fields, sender name) → draft
// { subject, body }. The body is plain text — paragraphs separated by
// blank lines — because the composer lets staff edit it in a textarea
// before sending; the server wraps the final text in the branded HTML
// shell (lib/leads/outbound.ts). Templates never produce HTML.
//
// Every template has two automatic variants, chosen by the lead's
// relationship field:
//   • relationship === 'self' → second person ("your care")
//   • anything else           → third person ("care for Margaret")
// The care recipient's name is client_name || full_name (the same rule
// the conversion RPC and the assessment modal use). Design signed off
// 6 Aug 2026 (mockups reviewed).
//
// Template 3 (the Service Agreement / Consent Form signing link) ships
// with the consent module in v0.6.46 — it needs a live signing link to
// carry, and a placeholder email would be worse than none.
// ═════════════════════════════════════════════════════════════════════════

export interface TemplateLeadFields {
  full_name: string
  client_name?: string | null
  relationship?: string | null
}

export interface EmailDraft {
  subject: string
  body: string
}

export interface LeadEmailTemplate {
  key: string
  label: string
  build: (lead: TemplateLeadFields, senderFirstName: string) => EmailDraft
}

/** First token of a full name — "Sarah Thompson" → "Sarah". */
export function firstNameOf(name: string | null | undefined): string {
  return (name || '').trim().split(/\s+/)[0] || ''
}

/** The care recipient's display name: client_name wins, else the contact. */
export function recipientNameOf(lead: TemplateLeadFields): string {
  return (lead.client_name || '').trim() || (lead.full_name || '').trim()
}

/** True when the contact is inquiring for themselves. */
export function isSelfLead(lead: TemplateLeadFields): boolean {
  return (lead.relationship || '').toLowerCase() === 'self'
}

const AGENCY_PHONE = '(240) 716-6874'

export const LEAD_EMAIL_TEMPLATES: LeadEmailTemplate[] = [
  {
    key: 'introduction',
    label: 'Introduction',
    build(lead) {
      const contact = firstNameOf(lead.full_name)
      const self = isSelfLead(lead)
      const who = firstNameOf(recipientNameOf(lead))
      if (self) {
        return {
          subject: 'Home care with Vitalis HealthCare',
          body:
`Dear ${contact},

Thank you for reaching out about home care. I know choosing an agency is a decision people take seriously, and we're glad you're considering Vitalis.

We're a Maryland-licensed residential service agency based in Silver Spring, and our caregivers support families across Montgomery and Howard Counties with dependable, compassionate in-home care — from a few hours a week to daily support.

Here's what happens next: we'll schedule a free in-home assessment with our Director of Nursing, walk through your needs together, and build a care plan around what actually helps — no obligation at any step.

If you have any questions in the meantime, just reply to this email or call us at ${AGENCY_PHONE} — I'm happy to help.`,
        }
      }
      return {
        subject: `Home care for ${who} — Vitalis HealthCare`,
        body:
`Dear ${contact},

It was good to connect with you about care for ${who}. I know choosing a home care agency is a decision families take seriously, and we're glad you're considering Vitalis.

We're a Maryland-licensed residential service agency based in Silver Spring, and our caregivers support families across Montgomery and Howard Counties with dependable, compassionate in-home care — from a few hours a week to daily support.

Here's what happens next: we'll schedule a free in-home assessment with our Director of Nursing, walk through ${who}'s needs together, and build a care plan around what actually helps — no obligation at any step.

If you have any questions in the meantime, just reply to this email or call us at ${AGENCY_PHONE} — I'm happy to help.`,
      }
    },
  },
  {
    key: 'assessment_confirmation',
    label: 'Assessment confirmation',
    build(lead) {
      const contact = firstNameOf(lead.full_name)
      const self = isSelfLead(lead)
      const who = firstNameOf(recipientNameOf(lead))
      const whose = self ? 'your' : `${who}'s`
      return {
        subject: self
          ? 'Your home assessment is scheduled'
          : `The home assessment for ${who} is scheduled`,
        body:
`Dear ${contact},

We've scheduled ${self ? 'your in-home assessment' : `the in-home assessment for ${who}`}. Here are the details:

When: [date and time]
Where: [address]
Who's coming: [nurse name], RN — Director of Nursing

What to expect: the visit usually takes about an hour. Our nurse will talk through daily routines, health needs, and the home itself, then recommend a care plan and schedule. It's a conversation, not a test — and there's no cost and no obligation.

Helpful to have on hand: a current medication list, and any questions you'd like to ask.${self ? '' : ' Family members are welcome to join.'}

If this time no longer works, reply to this email or call ${AGENCY_PHONE} and we'll find a better one.`,
      }
    },
  },
  {
    key: 'follow_up',
    label: 'General follow-up',
    build(lead) {
      const contact = firstNameOf(lead.full_name)
      const self = isSelfLead(lead)
      const who = firstNameOf(recipientNameOf(lead))
      if (self) {
        return {
          subject: 'Checking in — Vitalis HealthCare',
          body:
`Dear ${contact},

I wanted to follow up on our conversation about home care. There's no rush on our end — decisions like this take the time they take — but I didn't want you to feel we'd forgotten about you, because we haven't.

If it would help to talk anything through — schedules, costs, what a first week of care actually looks like — I'm just a reply or a phone call away. And if circumstances have changed and now isn't the right time, that's completely okay too; just let me know and I'll make sure we don't bother you.

Wishing you well either way.`,
        }
      }
      return {
        subject: `Checking in — home care for ${who}`,
        body:
`Dear ${contact},

I wanted to follow up on our conversation about care for ${who}. There's no rush on our end — decisions like this take the time they take — but I didn't want you to feel we'd forgotten about you, because we haven't.

If it would help to talk anything through — schedules, costs, what a first week of care actually looks like — I'm just a reply or a phone call away. And if circumstances have changed and now isn't the right time, that's completely okay too; just let me know and I'll make sure we don't bother you.

Whatever you decide, we're wishing ${who} well.`,
      }
    },
  },
]

export function templateByKey(key: string): LeadEmailTemplate | null {
  return LEAD_EMAIL_TEMPLATES.find(t => t.key === key) || null
}
