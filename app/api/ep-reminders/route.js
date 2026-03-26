// app/api/ep-reminders/route.js
// Called daily by Vercel Cron at 08:00 UTC.
// Checks all 15 EP compliance items, sends email reminders at
// 60, 30, 15, 7, and 3 days before each item's due date.
// Uses Resend for email delivery and Supabase to prevent duplicates.

import { createClient } from "@supabase/supabase-js";

// ── CONFIG ────────────────────────────────────────────────────────
const REMINDER_DAYS = [60, 30, 15, 7, 3];
const RECIPIENT = "team@vitalishealthcare.com";
const FROM =
  process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = "https://vitalis-portal.vercel.app/ep";

// All 15 compliance schedule items with their frequencies (months)
const SCHEDULE = [
  { id: "ep_plan",       label: "Master Emergency Preparedness Plan",   months: 24, responsible: "Administrator" },
  { id: "contacts",      label: "Key Contacts Table",                   months: 12, responsible: "Administrator" },
  { id: "med_supply",    label: "Medical Supply Inventory",             months: 3,  responsible: "Clinical Manager" },
  { id: "equip_inv",     label: "Equipment Inventory",                  months: 3,  responsible: "Office Manager" },
  { id: "go_box",        label: "Emergency Go-Box Check",               months: 3,  responsible: "Administrator" },
  { id: "priority_list", label: "Patient Priority List",                months: 0.23, responsible: "Clinical Manager" },
  { id: "hva",           label: "Hazard Vulnerability Analysis",        months: 24, responsible: "Administrator" },
  { id: "security",      label: "Security Vulnerability Assessment",    months: 12, responsible: "Administrator" },
  { id: "emp_forms",     label: "Employee Emergency Prep Forms",        months: 12, responsible: "HR Director" },
  { id: "patient_forms", label: "Individual Patient Prep Forms",        months: 12, responsible: "Dir. Clinical Svcs" },
  { id: "transfers",     label: "Transfer Agreements",                  months: 12, responsible: "Administrator" },
  { id: "drill",         label: "Emergency Drill / Tabletop Exercise",  months: 12, responsible: "Administrator" },
  { id: "ics_training",  label: "NIMS / ICS Training — All Staff",      months: 24, responsible: "Staff Dev. Coord." },
  { id: "fire_ext",      label: "Fire Extinguisher Inspection",         months: 12, responsible: "Maintenance Director" },
  { id: "cyber",         label: "Cyber Preparedness Checklist",         months: 12, responsible: "Admin / IT" },
];

// ── HELPERS ───────────────────────────────────────────────────────
function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + Math.round(months * 30.44));
  return d.toISOString().split("T")[0];
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}

function urgencyColor(days) {
  if (days <= 7)  return "#B91C1C";  // red
  if (days <= 15) return "#C96B15";  // amber
  if (days <= 30) return "#92400E";  // dark amber
  return "#15803D";                   // green
}

function urgencyLabel(days) {
  if (days <= 3)  return "⚠️ URGENT — Due in 3 days";
  if (days <= 7)  return "🔴 Due in 1 week";
  if (days <= 15) return "🟠 Due in 15 days";
  if (days <= 30) return "🟡 Due in 30 days";
  return "📅 Due in 60 days";
}

// ── EMAIL HTML BUILDER ────────────────────────────────────────────
function buildEmailHTML(reminders) {
  const overdueItems  = reminders.filter(r => r.days <= 0);
  const urgentItems   = reminders.filter(r => r.days > 0 && r.days <= 7);
  const upcomingItems = reminders.filter(r => r.days > 7);

  const itemRow = (r) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;">
        <div style="font-weight:600;color:#0F172A;font-size:14px;">${r.label}</div>
        <div style="font-size:12px;color:#64748B;margin-top:2px;">Responsible: ${r.responsible}</div>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;text-align:center;white-space:nowrap;">
        <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;color:${urgencyColor(r.days)};background:${r.days <= 7 ? "#FEF2F2" : r.days <= 15 ? "#FEF3E2" : r.days <= 30 ? "#FEF3C7" : "#F0FDF4"};">
          ${r.days <= 0 ? `OVERDUE ${Math.abs(r.days)}d` : `${r.days} days`}
        </span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;font-size:13px;color:#475569;">
        ${formatDate(r.dueDate)}
      </td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Vitalis EP Compliance Reminder</title></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;padding:32px 16px;">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#0D1E35 0%,#1E3A5F 100%);border-radius:12px 12px 0 0;padding:28px 32px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
      <div style="width:36px;height:36px;border-radius:8px;background:#0B8A82;display:flex;align-items:center;justify-content:center;">
        <span style="color:#fff;font-weight:700;font-size:16px;">V+</span>
      </div>
      <div>
        <div style="color:#fff;font-weight:700;font-size:16px;">Vitalis Healthcare Services</div>
        <div style="color:rgba(255,255,255,0.55);font-size:12px;">Emergency Preparedness Portal</div>
      </div>
    </div>
    <div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">
      📋 CMS CoP 484.102 Compliance Reminder · ${new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
    </div>
  </div>

  <!-- BODY -->
  <div style="background:#fff;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;padding:28px 32px;">

    <h2 style="font-size:20px;font-weight:700;color:#0D1E35;margin:0 0 8px;">
      ${reminders.length} EP Compliance Item${reminders.length > 1 ? "s" : ""} Require${reminders.length === 1 ? "s" : ""} Attention
    </h2>
    <p style="font-size:14px;color:#475569;margin:0 0 24px;">
      The following items from your Emergency Preparedness compliance calendar are due soon or overdue. 
      Log into the <a href="${PORTAL_URL}" style="color:#0B8A82;font-weight:600;">Vitalis EP Portal</a> to complete and document each activity.
    </p>

    ${overdueItems.length > 0 ? `
    <!-- OVERDUE -->
    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
      <div style="font-weight:700;color:#B91C1C;font-size:13px;margin-bottom:4px;">⚠️ OVERDUE — Immediate Action Required</div>
      <div style="font-size:12px;color:#7B241C;">These items are past their due date. OHCQ surveyors may request evidence of completion.</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead><tr style="background:#FEF2F2;">
        <th style="padding:8px 16px;text-align:left;font-size:11px;font-weight:700;color:#B91C1C;text-transform:uppercase;border-bottom:2px solid #FECACA;">Item</th>
        <th style="padding:8px 16px;text-align:center;font-size:11px;font-weight:700;color:#B91C1C;text-transform:uppercase;border-bottom:2px solid #FECACA;">Status</th>
        <th style="padding:8px 16px;text-align:left;font-size:11px;font-weight:700;color:#B91C1C;text-transform:uppercase;border-bottom:2px solid #FECACA;">Was Due</th>
      </tr></thead>
      <tbody>${overdueItems.map(itemRow).join("")}</tbody>
    </table>` : ""}

    ${urgentItems.length > 0 ? `
    <!-- URGENT (≤7 days) -->
    <div style="font-size:13px;font-weight:700;color:#B91C1C;margin-bottom:8px;">🔴 Due Within 7 Days</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead><tr style="background:#FEF2F2;">
        <th style="padding:8px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Item</th>
        <th style="padding:8px 16px;text-align:center;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Days Left</th>
        <th style="padding:8px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Due Date</th>
      </tr></thead>
      <tbody>${urgentItems.map(itemRow).join("")}</tbody>
    </table>` : ""}

    ${upcomingItems.length > 0 ? `
    <!-- UPCOMING -->
    <div style="font-size:13px;font-weight:700;color:#0D1E35;margin-bottom:8px;">📅 Upcoming</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead><tr style="background:#F8FAFC;">
        <th style="padding:8px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Item</th>
        <th style="padding:8px 16px;text-align:center;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Days Left</th>
        <th style="padding:8px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Due Date</th>
      </tr></thead>
      <tbody>${upcomingItems.map(itemRow).join("")}</tbody>
    </table>` : ""}

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0 16px;">
      <a href="${PORTAL_URL}" style="display:inline-block;padding:13px 32px;background:#0B8A82;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
        Open EP Portal → Complete Items
      </a>
    </div>

    <div style="font-size:12px;color:#94A3B8;text-align:center;">
      After completing each item, click <strong>"✓ Done"</strong> on the Dashboard, then save a new version of the Live Plan Document.
    </div>
  </div>

  <!-- FOOTER -->
  <div style="padding:20px 0;text-align:center;font-size:11px;color:#94A3B8;">
    Vitalis Healthcare Services, LLC · 8757 Georgia Avenue, Suite 440, Silver Spring, MD 20910<br>
    CMS CoP 484.102 · This is an automated reminder from the Vitalis EP Portal<br>
    <a href="${PORTAL_URL}" style="color:#0B8A82;">Manage in portal</a>
  </div>

</div>
</body>
</html>`;
}

// ── MAIN HANDLER ──────────────────────────────────────────────────
export async function GET(request) {
  // Verify the cron secret so only Vercel can trigger this
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY  // service role for server-side
  );

  const results = { checked: 0, sent: 0, skipped: 0, errors: [] };

  try {
    // 1. Load all last-completed dates from the database
    const { data: datesData, error: datesError } = await supabase
      .from("ep_compliance_dates")
      .select("item_id, last_completed");

    if (datesError) throw new Error(`Supabase dates error: ${datesError.message}`);

    const datesMap = {};
    (datesData || []).forEach(r => { datesMap[r.item_id] = r.last_completed; });

    // 2. Load already-sent reminders to avoid duplicates
    const { data: sentData } = await supabase
      .from("ep_reminder_log")
      .select("item_id, due_date, days_before");

    const sentSet = new Set(
      (sentData || []).map(r => `${r.item_id}|${r.due_date}|${r.days_before}`)
    );

    // 3. Calculate which reminders need to be sent today
    const toSend = [];

    for (const item of SCHEDULE) {
      const lastCompleted = datesMap[item.id];
      if (!lastCompleted) continue; // skip items with no date set — no due date to remind about

      const dueDate = addMonths(lastCompleted, item.months);
      const days = daysUntil(dueDate);

      for (const threshold of REMINDER_DAYS) {
        results.checked++;
        const key = `${item.id}|${dueDate}|${threshold}`;

        // Send if today's days-until matches this threshold (within 1 day window)
        // Also send for overdue items at the 3-day threshold (catch-all for overdue)
        const shouldSend = (days === threshold) || (days < 0 && threshold === 3 && !sentSet.has(key));

        if (shouldSend && !sentSet.has(key)) {
          toSend.push({
            id: item.id,
            label: item.label,
            responsible: item.responsible,
            dueDate,
            days,
            threshold,
            key,
          });
        } else {
          results.skipped++;
        }
      }
    }

    if (toSend.length === 0) {
      return Response.json({
        message: "No reminders to send today",
        ...results
      });
    }

    // 4. Build and send ONE email with all due items grouped
    const emailHTML = buildEmailHTML(toSend);
    const subjectItems = toSend.map(r => r.label).join(", ");
    const subject = toSend.length === 1
      ? `EP Reminder: ${toSend[0].label} due in ${toSend[0].days} days`
      : `EP Reminder: ${toSend.length} compliance items require attention`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [RECIPIENT],
        subject,
        html: emailHTML,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      throw new Error(`Resend API error: ${emailRes.status} — ${errBody}`);
    }

    // 5. Log all sent reminders to prevent future duplicates
    const logRows = toSend.map(r => ({
      item_id: r.id,
      item_label: r.label,
      due_date: r.dueDate,
      days_before: r.threshold,
      sent_to: RECIPIENT,
    }));

    const { error: logError } = await supabase
      .from("ep_reminder_log")
      .insert(logRows);

    if (logError) {
      // Non-fatal — email was sent, just log the error
      results.errors.push(`Log error: ${logError.message}`);
    }

    results.sent = toSend.length;

    return Response.json({
      message: `Reminder email sent for ${toSend.length} item(s)`,
      items: toSend.map(r => ({ label: r.label, daysUntil: r.days, dueDate: r.dueDate, threshold: r.threshold })),
      ...results,
    });

  } catch (err) {
    console.error("EP reminder error:", err);
    return Response.json({ error: err.message, ...results }, { status: 500 });
  }
}
