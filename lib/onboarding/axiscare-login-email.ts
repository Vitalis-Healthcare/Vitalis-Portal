// lib/onboarding/axiscare-login-email.ts
//
// The "your profile is now in AxisCare" instructions, sent once a candidate has
// been converted to a caregiver AND pushed to AxisCare.
//
// Two things govern the design:
//
// 1. Most mail clients block remote images by default. The numbered steps
//    therefore have to work with every image suppressed — the screenshots are
//    support, never the instruction itself. Alt text carries the operative
//    detail so a blocked image still tells you what to type.
//
// 2. AxisCare issues a predictable default password (Lastname!23). The email
//    says so, because the caregiver needs it to get in — and immediately tells
//    them to change it, because a password that can be guessed from a surname
//    should not survive first contact.

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'

export const AXISCARE_SITE = '14356.axiscare.com'
export const AXISCARE_IOS = 'https://apps.apple.com/us/app/axiscare-mobile/id1081635097'
export const AXISCARE_ANDROID = 'https://play.google.com/store/apps/details?id=com.axiscare'

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function shot(file: string, alt: string): string {
  return `<tr><td style="padding:14px 0 4px;">
    <img src="${PORTAL_URL}/axiscare/${file}" alt="${esc(alt)}" width="270"
      style="display:block;width:270px;max-width:100%;height:auto;border:1px solid #E2E8F0;border-radius:8px;">
  </td></tr>`
}

function step(n: number, html: string): string {
  return `<tr><td style="padding:9px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="top" style="width:26px;">
        <div style="width:20px;height:20px;line-height:20px;text-align:center;border-radius:50%;background:#0E7C7B;color:#fff;font-size:11px;font-weight:700;">${n}</div>
      </td>
      <td valign="top" style="font-size:14px;color:#4A6070;line-height:1.65;">${html}</td>
    </tr></table>
  </td></tr>`
}

export interface AxisCareLoginEmailOptions {
  firstName: string
  /** The caregiver's AxisCare username — their email address. */
  loginEmail: string
  /** Surname, used to spell out the default password pattern. */
  lastName: string
}

export function buildAxisCareLoginEmail(o: AxisCareLoginEmailOptions): string {
  const firstName = esc(o.firstName)
  const loginEmail = esc(o.loginEmail)
  const defaultPassword = `${esc(o.lastName.trim())}!23`

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your profile is now in AxisCare</title></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">

  <div style="background:linear-gradient(135deg,#1A2E44,#0E4A4A);padding:26px 32px;border-radius:12px 12px 0 0;">
    <div style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;border-radius:9px;background:linear-gradient(135deg,#0E7C7B,#F4A261);color:#fff;font-weight:800;font-size:15px;margin-bottom:12px;">V+</div>
    <h1 style="color:#fff;margin:0;font-size:19px;font-weight:800;">Your profile is now in AxisCare</h1>
  </div>

  <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">

    <p style="color:#4A6070;font-size:14px;margin:0 0 14px;line-height:1.65;">Hello ${firstName},</p>
    <p style="color:#4A6070;font-size:14px;margin:0 0 20px;line-height:1.65;">
      Welcome to the team. Your profile is now set up in <strong>AxisCare</strong>, the
      software we use for schedules and visits. Once you are signed in you will be able
      to see the cases assigned to you, clock in and out, and record your visit notes.
    </p>

    <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:10px;padding:16px 18px;margin-bottom:22px;">
      <div style="font-size:11px;font-weight:700;color:#8FA0B0;text-transform:uppercase;letter-spacing:.6px;margin-bottom:9px;">Your sign-in details</div>
      <div style="font-size:14px;color:#1A2E44;line-height:1.9;">
        <strong>Server:</strong> ${AXISCARE_SITE}<br>
        <strong>Username:</strong> ${loginEmail}<br>
        <strong>Temporary password:</strong> ${defaultPassword}
      </div>
    </div>

    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <div style="font-size:13.5px;color:#92400E;line-height:1.65;">
        <strong>Please change this password once you are signed in.</strong>
        It follows a pattern anyone could guess from your surname, so it is only meant to
        get you through the door the first time. In AxisCare, open the menu and choose
        <em>My Profile</em> to set your own.
      </div>
    </div>

    <h2 style="font-size:13px;font-weight:800;color:#1A2E44;margin:0 0 4px;text-transform:uppercase;letter-spacing:.6px;">Getting set up</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">

      ${step(1, `Install the AxisCare Mobile app on your phone:<br>
        <a href="${AXISCARE_IOS}" style="color:#0E7C7B;font-weight:600;">iPhone</a>
        &nbsp;·&nbsp;
        <a href="${AXISCARE_ANDROID}" style="color:#0E7C7B;font-weight:600;">Android</a>`)}

      ${step(2, `Open the app. When it asks about location, choose
        <strong>&ldquo;Use Location Services WHILE using the App&rdquo;</strong> &mdash; this is
        how the app confirms you are at the client&rsquo;s home when you clock in.`)}

      ${step(3, `Enter <strong>${AXISCARE_SITE}</strong> as the server, then tap
        <strong>NEXT</strong>.`)}
      ${shot('1-server.jpg', `Type 14356 into the Server box so it reads ${AXISCARE_SITE}, then tap NEXT`)}

      ${step(4, `Tap <strong>SIGN IN</strong> and enter the username and temporary password
        above.`)}
      ${shot('2-signin.jpg', 'The Vitalis Healthcare Services screen with SIGN IN and ACTIVATE ACCOUNT buttons — tap SIGN IN')}

      ${step(5, `Choose a <strong>4-digit PIN</strong> and confirm it. You will use this PIN to
        reopen the app, so you do not have to type your password every time.`)}
      ${shot('3-pin.jpg', 'Enter a 4-digit PIN, confirm it in the second box, then tap SUBMIT')}

      ${step(6, `Open <strong>Schedule</strong> to see the visits assigned to you, along with any
        case history and notes. While you are there, set your communication preferences so
        the office can reach you by text and email.`)}

      ${step(7, `On the day of your shift, tap the schedule and choose <strong>Clock In</strong>
        at the client&rsquo;s home &mdash; make sure location services are on. At the end, record
        your visit notes and the activities you carried out, then <strong>Clock Out</strong>.`)}

    </table>

    <div style="border-top:1px solid #E2E8F0;margin-top:24px;padding-top:18px;">
      <p style="color:#4A6070;font-size:13.5px;margin:0;line-height:1.7;">
        If you have any trouble getting in or seeing your schedule, contact
        <strong>Ms Happiness</strong> or the office on <strong>240.716.6874</strong> and we
        will sort it out with you.
      </p>
    </div>
  </div>

  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94A3B8;line-height:1.8;">
    Vitalis Healthcare Services, LLC &middot; 8757 Georgia Avenue, Suite 440 &middot; Silver Spring, MD 20910<br>
    For reliable and compassionate care.
  </div>
</div>
</body></html>`
}
