// app/api/credential-alerts/route.js
// Called daily by Vercel Cron at 09:00 UTC.
// Queries staff_credentials for upcoming expirations.
// Respects per-credential-type reminder_days config.
// Sends one email per staff member listing all their expiring credentials.
// Sends a digest to team@vitalishealthcare.com.
// Uses email_log table to prevent duplicate sends.

import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "team@vitalishealthcare.com";
const FROM        = "Vitalis Healthcare <reminders@vitalishealthcare.com>";
const PORTAL_URL  = "https://vitalis-portal.vercel.app";

// ── HELPERS ───────────────────────────────────────────────────────

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86_400_000);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function urgencyColor(days) {
  if (days <= 7)  return "#B91C1C";
  if (days <= 14) return "#C96B15";
  return "#15803D";
}

function urgencyBg(days) {
  if (days <= 7)  return "#FEF2F2";
  if (days <= 14) return "#FEF3E2";
  return "#F0FDF4";
}

function urgencyLabel(days) {
  if (days <= 7)  return "URGENT";
  if (days <= 14) return "ACTION NEEDED";
  return "REMINDER";
}

// ── EMAIL BUILDERS ─────────────────────────────────────────────────

function buildStaffEmail(staffName, credentials) {
  const rows = credentials.map(c => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;">
        <div style="font-weight:600;color:#0F172A;font-size:14px;">${c.credName}</div>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;text-align:center;white-space:nowrap;">
        <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;
          color:${urgencyColor(c.days)};background:${urgencyBg(c.days)};">
          ${urgencyLabel(c.days)} · ${c.days} day${c.days !== 1 ? "s" : ""}
        </span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;font-size:13px;color:#475569;">
        ${formatDate(c.expiryDate)}
      </td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Credential Expiry Notice</title></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#0D4A47 0%,#0E7C7B 100%);border-radius:12px 12px 0 0;padding:28px 32px;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,0.2);
        display:flex;align-items:center;justify-content:center;">
        <span style="color:#fff;font-weight:800;font-size:16px;">V+</span>
      </div>
      <div>
        <div style="color:#fff;font-weight:700;font-size:16px;">Vitalis Healthcare Services</div>
        <div style="color:rgba(255,255,255,0.65);font-size:12px;">Staff Compliance Portal</div>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div style="background:#fff;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;padding:28px 32px;">
    <h2 style="font-size:19px;font-weight:700;color:#0D1E35;margin:0 0 8px;">
      Credential Expiry Notice
    </h2>
    <p style="font-size:14px;color:#475569;margin:0 0 20px;">
      Hi <strong>${staffName}</strong>, the following credential${credentials.length > 1 ? "s" : ""} 
      on your file ${credentials.length > 1 ? "are" : "is"} expiring soon. 
      Please renew and upload updated documentation to the portal before the expiry date.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr style="background:#F8FAFC;">
          <th style="padding:8px 16px;text-align:left;font-size:11px;font-weight:700;
            color:#64748B;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E2E8F0;">
            Credential
          </th>
          <th style="padding:8px 16px;text-align:center;font-size:11px;font-weight:700;
            color:#64748B;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E2E8F0;">
            Status
          </th>
          <th style="padding:8px 16px;text-align:left;font-size:11px;font-weight:700;
            color:#64748B;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E2E8F0;">
            Expiry Date
          </th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <!-- CTA -->
    <div style="text-align:center;margin:24px 0 16px;">
      <a href="${PORTAL_URL}/credentials"
        style="display:inline-block;padding:12px 28px;background:#0E7C7B;color:#fff;
          text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
        Update My Credentials ↗
      </a>
    </div>

    <p style="font-size:12px;color:#94A3B8;margin-top:24px;border-top:1px solid #EFF2F5;padding-top:16px;">
      This is an automated alert from the Vitalis Healthcare staff portal. 
      Contact your supervisor if you need assistance renewing a credential.
    </p>
  </div>

  <!-- FOOTER -->
  <div style="padding:20px 0;text-align:center;font-size:11px;color:#94A3B8;">
    Vitalis Healthcare Services, LLC · Silver Spring, MD<br>
    <a href="${PORTAL_URL}" style="color:#0E7C7B;">Open Portal</a>
  </div>

</div>
</body>
</html>`;
}

function buildAdminDigest(alerts, date) {
  const byPerson = {};
  for (const a of alerts) {
    if (!byPerson[a.staffName]) byPerson[a.staffName] = [];
    byPerson[a.staffName].push(a);
  }

  const personRows = Object.entries(byPerson).map(([name, creds]) => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #E2E8F0;font-weight:600;color:#0F172A;font-size:13px;">
        ${name}
      </td>
      <td style="padding:10px 16px;border-bottom:1px solid #E2E8F0;font-size:13px;color:#475569;">
        ${creds.map(c =>
          `<span style="display:inline-block;margin:2px 4px 2px 0;padding:2px 8px;border-radius:12px;
            font-size:12px;background:${urgencyBg(c.days)};color:${urgencyColor(c.days)};font-weight:600;">
            ${c.credName} — ${c.days}d
          </span>`
        ).join("")}
      </td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Credential Alert Digest</title></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;padding:32px 16px;">

  <div style="background:linear-gradient(135deg,#1A2E44 0%,#2D4A6B 100%);border-radius:12px 12px 0 0;padding:24px 32px;">
    <div style="color:#fff;font-weight:700;font-size:16px;">Vitalis Healthcare Services</div>
    <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:4px;">
      Daily Credential Alert Digest · ${date}
    </div>
  </div>

  <div style="background:#fff;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;padding:24px 32px;">
    <h2 style="font-size:18px;font-weight:700;color:#0D1E35;margin:0 0 8px;">
      ${alerts.length} credential alert${alerts.length !== 1 ? "s" : ""} sent today
    </h2>
    <p style="font-size:14px;color:#475569;margin:0 0 20px;">
      Individual reminder emails were sent to each staff member listed below.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr style="background:#F8FAFC;">
          <th style="padding:8px 16px;text-align:left;font-size:11px;font-weight:700;
            color:#64748B;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Staff Member</th>
          <th style="padding:8px 16px;text-align:left;font-size:11px;font-weight:700;
            color:#64748B;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Credentials</th>
        </tr>
      </thead>
      <tbody>${personRows}</tbody>
    </table>

    <a href="${PORTAL_URL}/credentials"
      style="display:inline-block;padding:11px 24px;background:#1A2E44;color:#fff;
        text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">
      Open Credentials Dashboard ↗
    </a>
  </div>

</div>
</body>
</html>`;
}

// ── MAIN HANDLER ──────────────────────────────────────────────────

export async function GET(request) {
  // Verify Vercel cron secret
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return Response.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const results = { checked: 0, sent: 0, skipped: 0, errors: [] };
  const digestAlerts = []; // for admin digest

  try {
    // 1. Load all non-expired credentials that have expiry dates
    //    Join credential_type to get per-type reminder_days
    const { data: credentials, error: credError } = await supabase
      .from("staff_credentials")
      .select(`
        id,
        expiry_date,
        does_not_expire,
        status,
        credential_type:credential_types ( id, name, reminder_days ),
        staff:profiles!staff_credentials_user_id_fkey ( id, full_name, email, status )
      `)
      .neq("status", "expired")
      .eq("does_not_expire", false)
      .not("expiry_date", "is", null);

    if (credError) throw new Error(`Credentials query error: ${credError.message}`);

    // 2. Load today's already-sent alerts to skip duplicates
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: sentToday } = await supabase
      .from("email_log")
      .select("entity_id, type")
      .gte("sent_at", todayStart.toISOString())
      .like("type", "credential_expiry_%");

    const sentSet = new Set(
      (sentToday || []).map(r => `${r.entity_id}|${r.type}`)
    );

    // 3. Group credentials by staff member, filtered to those hitting a threshold today
    //    Each credential type has its own reminder_days array
    const staffAlerts = {}; // keyed by staff id

    for (const cred of credentials || []) {
      results.checked++;

      // Skip inactive staff
      if (cred.staff?.status !== "active") { results.skipped++; continue; }
      if (!cred.staff?.email)               { results.skipped++; continue; }

      const days = daysUntil(cred.expiry_date);
      const reminderDays = cred.credential_type?.reminder_days ?? [30, 14, 7];

      // Check if today is exactly one of the reminder thresholds for this credential
      const matchedThreshold = reminderDays.find(d => d === days);
      if (matchedThreshold === undefined) { results.skipped++; continue; }

      const alertType = `credential_expiry_${matchedThreshold}d`;
      const dedupKey  = `${cred.id}|${alertType}`;

      if (sentSet.has(dedupKey)) { results.skipped++; continue; }

      const staffId = cred.staff.id;
      if (!staffAlerts[staffId]) {
        staffAlerts[staffId] = {
          staffId,
          staffName:  cred.staff.full_name  ?? "Team Member",
          staffEmail: cred.staff.email,
          credentials: [],
        };
      }

      staffAlerts[staffId].credentials.push({
        credId:     cred.id,
        credName:   cred.credential_type?.name ?? "Credential",
        expiryDate: cred.expiry_date,
        days,
        alertType,
        dedupKey,
      });
    }

    // 4. Send one email per staff member
    for (const person of Object.values(staffAlerts)) {
      const emailHtml = buildStaffEmail(person.staffName, person.credentials);
      const credNames = person.credentials.map(c => c.credName).join(", ");
      const subject = person.credentials.length === 1
        ? `Action required: ${person.credentials[0].credName} expires in ${person.credentials[0].days} days`
        : `Action required: ${person.credentials.length} credentials expiring soon`;

      const res = await fetch("https://api.resend.com/emails", {
        method:  "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          from:    FROM,
          to:      [person.staffEmail],
          subject,
          html:    emailHtml,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        results.errors.push(`Failed to email ${person.staffEmail}: ${err}`);
        continue;
      }

      // Log all sent alerts for this person
      const logRows = person.credentials.map(c => ({
        recipient_email: person.staffEmail,
        subject,
        type:       c.alertType,
        entity_id:  c.credId,
      }));

      const { error: logError } = await supabase.from("email_log").insert(logRows);
      if (logError) {
        results.errors.push(`Log error for ${person.staffEmail}: ${logError.message}`);
      }

      // Collect for digest
      for (const c of person.credentials) {
        digestAlerts.push({
          staffName: person.staffName,
          credName:  c.credName,
          days:      c.days,
          expiryDate: c.expiryDate,
        });
      }

      results.sent++;
    }

    // 5. Send admin digest if any alerts went out
    if (digestAlerts.length > 0) {
      const dateStr = new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
      const digestHtml = buildAdminDigest(digestAlerts, dateStr);
      const digestSubject = `[Vitalis] ${digestAlerts.length} credential alert${digestAlerts.length !== 1 ? "s" : ""} sent — ${new Date().toLocaleDateString()}`;

      const digestRes = await fetch("https://api.resend.com/emails", {
        method:  "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          from:    FROM,
          to:      [ADMIN_EMAIL],
          subject: digestSubject,
          html:    digestHtml,
        }),
      });

      if (!digestRes.ok) {
        results.errors.push(`Digest email failed: ${await digestRes.text()}`);
      }
    }

    return Response.json({
      message: results.sent > 0
        ? `Sent alerts to ${results.sent} staff member(s) covering ${digestAlerts.length} credential(s)`
        : "No credential alerts to send today",
      ...results,
      alerts: digestAlerts,
    });

  } catch (err) {
    console.error("Credential alert error:", err);
    return Response.json({ error: err.message, ...results }, { status: 500 });
  }
}
