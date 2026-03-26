-- Migration 019 — P&P D7 Emergency & Business Continuity (v2.0, March 2026 triennial)
-- Run AFTER 012_pp_v2_schema.sql

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D7-001', 'D7', 1, 'Disaster &amp; Emergency Preparedness Plan', 'Okezie Ofeogbu — Administrator', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Personnel'],
  ARRAY['10.07.11.12'],
  ARRAY['emergency', 'disaster', 'Level I', 'Level II', 'priority', 'command structure', 'OHCQ', 'snow', 'power outage', 'evacuation', 'AxisCare'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);}
.breadcrumb a{color:var(--teal);text-decoration:none;}.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.sub-heading{font-size:15px;font-weight:700;color:var(--navy);margin:24px 0 10px;padding-left:14px;border-left:3px solid var(--teal-mid);}
.body-text p{margin-bottom:14px;color:var(--slate);}.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}.data-table tr:nth-child(even) td{background:var(--bg);}.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.command-chain{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.command-row{display:flex;align-items:center;gap:0;border-bottom:1px solid var(--border);}
.command-row:last-child{border-bottom:none;}
.command-role{background:var(--navy-light);color:var(--navy);font-size:11px;font-weight:800;padding:12px 16px;min-width:200px;flex-shrink:0;text-transform:uppercase;letter-spacing:0.4px;}
.command-name{padding:12px 16px;font-size:13px;color:var(--slate);font-weight:500;}
.contact-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:16px 0;}
.contact-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px;border-top:3px solid var(--teal-mid);}
.contact-label{font-size:11px;font-weight:700;color:var(--navy);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;}
.contact-number{font-size:14px;font-weight:800;color:var(--teal);}
.contact-sub{font-size:11px;color:var(--muted);margin-top:2px;}
.priority-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;}
.priority-card{border-radius:var(--radius-md);padding:18px 20px;border:1px solid;}
.priority-i{background:#FFF1F0;border-color:var(--rose);}
.priority-ii{background:var(--teal-light);border-color:var(--teal-mid);}
.priority-badge{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;}
.priority-i .priority-badge{color:var(--rose);}
.priority-ii .priority-badge{color:var(--teal);}
.priority-title{font-size:14px;font-weight:800;color:var(--navy);margin-bottom:6px;}
.priority-body{font-size:13px;color:var(--slate);line-height:1.6;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}.src-cfr{background:#DBEAFE;color:#1E3A5F;}.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}.version-table tr.current td{background:#F0FDF4;}
.version-badge{display:inline-block;padding:3px 9px;background:var(--teal);color:#fff;border-radius:20px;font-size:11px;font-weight:700;}
.approval-block{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0;}
.approval-item{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:18px;}
.approval-role{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:5px;}
.approval-name{font-size:14px;font-weight:800;color:var(--navy);margin-bottom:14px;}
.approval-sig-line{border-bottom:1.5px solid var(--border);margin-bottom:6px;height:28px;}
.approval-sig-label{font-size:11px;color:var(--muted);}
.review-notice{grid-column:1/-1;background:var(--amber-light);border:1px solid var(--amber);border-radius:var(--radius-md);padding:12px 16px;font-size:13px;color:#5C3A00;}
.related-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:16px 0;}
.related-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px 16px;text-decoration:none;transition:all 0.2s;display:block;}
.related-card:hover{border-color:var(--teal-mid);box-shadow:0 2px 8px rgba(11,107,92,0.1);transform:translateY(-1px);}
.related-card-id{font-family:var(--font-mono);font-size:11px;color:var(--teal-mid);font-weight:700;margin-bottom:4px;}
.related-card-title{font-size:13px;font-weight:700;color:var(--navy);margin-bottom:3px;}
.related-card-domain{font-size:11px;color:var(--muted);}
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}.priority-grid{grid-template-columns:1fr;}.contact-grid{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D7">D7 · Emergency &amp; Business Continuity</a><span>›</span><span>VHS-D7-001</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D7 · Emergency &amp; Business Continuity</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Okezie Ofeogbu — Administrator</span>
    <span class="pill pill-version">VHS-D7-001 · v2.0</span>
  </div>
  <h1 class="doc-title">Disaster &amp; Emergency Preparedness Plan</h1>
  <div class="doc-id-line">VHS-D7-001 · Applies to: All Personnel</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.11.12</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">If a disaster or emergency affects your ability to reach a client, call your supervisor immediately — do not wait to see how things develop.</li><li class="wmfy-item">Know your client's priority level (Level I or Level II). Level I clients need contact or a visit within 24 hours of any declared emergency.</li><li class="wmfy-item">Keep your personal contact information current in AxisCare. During an emergency, the on-call supervisor will reach you by phone or text.</li><li class="wmfy-item">If you cannot reach the office and a client is in immediate danger, call 911 first — then call your supervisor.</li><li class="wmfy-item">After an emergency, do not resume regular scheduling until you receive the all-clear from the Administrator or Director of Nursing.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>This plan describes how Vitalis Healthcare Services, LLC prepares for, responds to, and recovers from disasters and emergencies that could disrupt the delivery of care to clients or the operation of the agency. The goal is simple: keep clients safe and keep services running for the clients who need us most.</p></div></section>

<section class="policy-section" id="command"><h2 class="section-heading">Emergency Command Structure</h2>
<div class="command-chain">
  <div class="command-row"><div class="command-role">Incident Commander</div><div class="command-name">Okezie Ofeogbu — Administrator · (240) 618-3184</div></div>
  <div class="command-row"><div class="command-role">Clinical Lead</div><div class="command-name">Marie Epah — Director of Nursing (Acting)</div></div>
  <div class="command-row"><div class="command-role">Care Coordination</div><div class="command-name">Happiness Samuel / Peace Enoch</div></div>
  <div class="command-row"><div class="command-role">Finance &amp; Billing</div><div class="command-name">Jay Jelenke / Somto Illomuanya</div></div>
  <div class="command-row"><div class="command-role">If Administrator unreachable</div><div class="command-name">Director of Nursing assumes command</div></div>
  <div class="command-row"><div class="command-role">If both unreachable</div><div class="command-name">Senior on-duty RN assumes command and contacts Governing Body</div></div>
</div></section>

<section class="policy-section" id="priority"><h2 class="section-heading">Client Priority Levels</h2>
<div class="body-text"><p>At admission and at each reassessment, every client is assigned a priority level that drives the response sequence during an emergency.</p></div>
<div class="priority-grid">
  <div class="priority-card priority-i">
    <div class="priority-badge">⚠ Level I — High Priority</div>
    <div class="priority-title">Contact or visit required within 24 hours</div>
    <div class="priority-body">Clients requiring daily or more frequent skilled nursing visits; clients with very limited or no mobility; clients who live alone with no available caregiver; and clients dependent on electricity-powered medical equipment (e.g., oxygen concentrators, suction machines, feeding pumps).</div>
  </div>
  <div class="priority-card priority-ii">
    <div class="priority-badge">✓ Level II — Standard Priority</div>
    <div class="priority-title">Telephone contact within 48 hours</div>
    <div class="priority-body">All other active clients. The agency will attempt telephone contact within 48 hours of emergency activation. Visits are rescheduled or reassigned as staffing allows.</div>
  </div>
</div>
<div class="body-text"><p>The care coordinator maintains the current priority roster in AxisCare (Agency ID: 14356). The roster is reviewed weekly and updated at every client reassessment.</p></div></section>

<section class="policy-section" id="hazards"><h2 class="section-heading">Hazard Assessment — Maryland / Prince George's County</h2>
<table class="data-table"><thead><tr><th>Hazard</th><th>Probability</th><th>Impact</th></tr></thead><tbody>
<tr><td>Severe winter weather — ice storms, heavy snow</td><td>High</td><td>Moderate-to-high impact on access and staffing</td></tr>
<tr><td>Tropical storm / high wind / flooding</td><td>Moderate</td><td>Moderate impact</td></tr>
<tr><td>Extended power outage</td><td>Moderate</td><td>High impact for Level I clients on powered equipment</td></tr>
<tr><td>Public health emergency / infectious disease outbreak</td><td>Moderate</td><td>Potentially high impact</td></tr>
<tr><td>Cyber incident / electronic system failure</td><td>Low-to-moderate</td><td>Moderate operational impact</td></tr>
<tr><td>Fire at agency office</td><td>Low</td><td>Moderate impact — operations shift to remote immediately</td></tr>
</tbody></table>
<div class="body-text"><p>This hazard assessment is reviewed and documented biennially by the Administrator and Director of Nursing. <strong>Next review due: March 15, 2028.</strong></p></div></section>

<section class="policy-section" id="procedures"><h2 class="section-heading">Procedures</h2>

<h3 class="sub-heading">A. Activation</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Administrator / Director of Nursing</span> Declare an emergency when a situation poses a significant risk to client safety or continuity of care. Notify all care coordinators and on-duty staff by phone or group text within <strong>1 hour</strong> of declaration.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Care Coordinators</span> Pull the current Level I and Level II client rosters from AxisCare. Begin outreach to Level I clients immediately. Document all contact attempts and outcomes in AxisCare.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">All Personnel</span> Check in with the agency within <strong>4 hours</strong> of any declared emergency during a scheduled work period. Off-duty staff check in within <strong>8 hours</strong> if contacted.</div></li></ol>

<h3 class="sub-heading">B. Client Triage &amp; Service Continuity</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Director of Nursing</span> Triage all active clients into Level I and Level II based on the current roster. Prioritize scheduling for Level I clients. Assign available RNs and aides accordingly.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Director of Nursing</span> For Level I clients who cannot receive a home visit due to staff unavailability or access issues: attempt telephone contact, coordinate with family or emergency contacts, and arrange transfer to an emergency shelter or acute care facility if the client cannot safely remain at home.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Care Coordinators</span> Contact physicians and case managers for any Level I client whose service will be delayed more than 24 hours. Document all notifications.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Administrator</span> If in-house and contracted staff are insufficient, activate backup staffing options (see <a href="/pp/VHS-D7-004">VHS-D7-004</a>). If services cannot be maintained, initiate referral or transfer per the client's emergency plan.</div></li></ol>

<h3 class="sub-heading">C. Communication During an Emergency</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Administrator / Director of Nursing</span> Primary communication method: phone and SMS text to all staff. If cellular networks are overloaded, use AxisCare messaging as backup.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Administrator</span> Notify the Maryland Office of Health Care Quality (OHCQ) of any significant disruption to client services as required. Contact: OHCQ duty line <strong>(410) 402-8201</strong>.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Director of Nursing</span> If a client must be transferred to another care setting, provide the receiving facility with: client name, date of birth, primary diagnosis, current medications, allergies, advance directive status, and emergency contact. Comply with HIPAA throughout.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">All Personnel</span> Do not share client information with media or unauthorized individuals. All external communications about the emergency go through the Administrator only.</div></li></ol>

<h3 class="sub-heading">D. Specific Hazard Responses</h3>
<table class="data-table"><thead><tr><th>Hazard</th><th>Response</th></tr></thead><tbody>
<tr><td>Severe Weather / Snow &amp; Ice</td><td>Administrator determines office closure and remote-work activation. Care coordinators contact all scheduled clients to confirm visit status. Level I visits proceed if staff can safely travel; staff report inability to travel immediately. Clients advised to call 911 for medical emergencies during severe weather.</td></tr>
<tr><td>Extended Power Outage</td><td>Care coordinators immediately identify all Level I clients on powered medical equipment. DON coordinates with equipment suppliers and initiates transfer to a facility with power if client cannot safely remain home without electricity.</td></tr>
<tr><td>Public Health Emergency / Outbreak</td><td>Follow current guidance from Maryland Department of Health and OHCQ. PPE requirements elevated per VHS-D6-004. DON determines which visits are modified, suspended, or converted to telehealth check-ins. Admissions may be suspended at the Administrator's direction.</td></tr>
<tr><td>Cyber Incident / System Failure</td><td>AxisCare access is lost — staff revert to paper scheduling and printed on-call client roster. Administrator contacts AxisCare support. Critical records backed up on agency's secure cloud drive.</td></tr>
<tr><td>Fire at Agency Office</td><td>All office personnel evacuate. Operations immediately shift to remote work. Administrator activates the phone tree. Client care continues without interruption via staff working from home.</td></tr>
</tbody></table>

<h3 class="sub-heading">E. Staff Responsibilities During an Emergency</h3>
<ul class="bullet-list"><li>Ensure your own safety and the safety of your family first — you cannot care for clients if you are unsafe.</li><li>Carry your agency ID badge at all times when providing care during a declared emergency.</li><li>Document all client contacts, visit outcomes, and communications during the emergency in AxisCare (or on paper if systems are down). Submit paper documentation to the office within 24 hours of system restoration.</li><li>Do not make promises to clients about service timelines you cannot keep. Refer scheduling questions to the care coordinator.</li><li>Report any client safety concern — a client who cannot be reached, who appears unsafe, or who has been left without a caregiver — to the Director of Nursing immediately.</li></ul>

<h3 class="sub-heading">F. Recovery</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Administrator</span> Declares end of emergency status. Notifies all staff that normal operations resume. Issues written summary of the event and any lessons learned within <strong>5 business days</strong>.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Director of Nursing</span> Restores full scheduling. Reviews all Level I clients for any care gaps during the emergency. Completes a clinical reassessment for any client whose service was interrupted for more than <strong>48 hours</strong>.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Care Coordinators</span> Restore normal visit schedules in AxisCare. Resume accepting new admissions at the Administrator's direction. Verify that all client emergency plans are current.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Administrator</span> Evaluates the agency's emergency response. Updates this plan and related procedures as needed. Documents the review with signature and date on the plan.</div></li></ol>

<h3 class="sub-heading">G. Training &amp; Plan Review</h3>
<div class="body-text"><p>All personnel receive orientation to this plan at hire. The plan is reviewed in its entirety at least every two years, and more frequently following any significant change in client population, service area, or actual emergency event. <strong>Next biennial review due: March 15, 2028.</strong></p>
<p>The agency participates in community emergency planning with Prince George's County Office of Emergency Management and the Maryland Institute for Emergency Medical Services Systems (MIEMSS) as requested.</p></div>

</section>

<section class="policy-section" id="contacts"><h2 class="section-heading">Key Emergency Contacts</h2>
<div class="contact-grid">
  <div class="contact-card"><div class="contact-label">OHCQ Duty Line</div><div class="contact-number">(410) 402-8201</div></div>
  <div class="contact-card"><div class="contact-label">Prince George's County OEM</div><div class="contact-number">(301) 583-0909</div></div>
  <div class="contact-card"><div class="contact-label">American Red Cross (Greater Chesapeake)</div><div class="contact-number">1-800-RED-CROSS</div></div>
  <div class="contact-card"><div class="contact-label">Vitalis Main Line — 24/7</div><div class="contact-number">(240) 618-3184</div></div>
</div></section>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.11.12" target="_blank">COMAR 10.07.11.12</a> — Emergency preparedness requirements for RSAs.</div></div></div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">CMS 484.102</span> — Conditions of participation — emergency preparedness.</div></div></div><div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">MD Emergency Management</span> — Prince George's County OEM coordination.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>New policy — no legacy equivalent. Establishes full emergency command structure, Level I/II priority system, hazard assessment for Prince George's County service area, specific hazard response protocols, and biennial review schedule.</td></tr><tr><td>v1.0</td><td>—</td><td>No prior version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D7-002"><div class="related-card-id">VHS-D7-002</div><div class="related-card-title">Client Individual Emergency Preparedness Plan</div><div class="related-card-domain">D7 · Emergency &amp; Business Continuity</div></a><a class="related-card" href="/pp/VHS-D7-004"><div class="related-card-id">VHS-D7-004</div><div class="related-card-title">Backup Coverage of Services</div><div class="related-card-domain">D7 · Emergency &amp; Business Continuity</div></a><a class="related-card" href="/pp/VHS-D7-003"><div class="related-card-id">VHS-D7-003</div><div class="related-card-title">After-Hours Care & On-Call Coverage</div><div class="related-card-domain">D7 · Emergency &amp; Business Continuity</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D7-Emergency-Business-Continuity.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content=EXCLUDED.html_content, title=EXCLUDED.title, version=EXCLUDED.version,
  effective_date=EXCLUDED.effective_date, review_date=EXCLUDED.review_date,
  applicable_roles=EXCLUDED.applicable_roles, comar_refs=EXCLUDED.comar_refs,
  keywords=EXCLUDED.keywords, status=EXCLUDED.status, updated_at=NOW();

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D7-002', 'D7', 1, 'Client Individual Emergency Preparedness Plan', 'Okezie Ofeogbu — Administrator', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Clinical Personnel'],
  ARRAY['10.07.11.12'],
  ARRAY['IEPP', 'individual emergency plan', 'priority level', 'on-call book', 'medical equipment', 'admission', 'advance directive'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);}
.breadcrumb a{color:var(--teal);text-decoration:none;}.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.sub-heading{font-size:15px;font-weight:700;color:var(--navy);margin:24px 0 10px;padding-left:14px;border-left:3px solid var(--teal-mid);}
.body-text p{margin-bottom:14px;color:var(--slate);}.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}.data-table tr:nth-child(even) td{background:var(--bg);}.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.command-chain{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.command-row{display:flex;align-items:center;gap:0;border-bottom:1px solid var(--border);}
.command-row:last-child{border-bottom:none;}
.command-role{background:var(--navy-light);color:var(--navy);font-size:11px;font-weight:800;padding:12px 16px;min-width:200px;flex-shrink:0;text-transform:uppercase;letter-spacing:0.4px;}
.command-name{padding:12px 16px;font-size:13px;color:var(--slate);font-weight:500;}
.contact-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:16px 0;}
.contact-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px;border-top:3px solid var(--teal-mid);}
.contact-label{font-size:11px;font-weight:700;color:var(--navy);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;}
.contact-number{font-size:14px;font-weight:800;color:var(--teal);}
.contact-sub{font-size:11px;color:var(--muted);margin-top:2px;}
.priority-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;}
.priority-card{border-radius:var(--radius-md);padding:18px 20px;border:1px solid;}
.priority-i{background:#FFF1F0;border-color:var(--rose);}
.priority-ii{background:var(--teal-light);border-color:var(--teal-mid);}
.priority-badge{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;}
.priority-i .priority-badge{color:var(--rose);}
.priority-ii .priority-badge{color:var(--teal);}
.priority-title{font-size:14px;font-weight:800;color:var(--navy);margin-bottom:6px;}
.priority-body{font-size:13px;color:var(--slate);line-height:1.6;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}.src-cfr{background:#DBEAFE;color:#1E3A5F;}.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}.version-table tr.current td{background:#F0FDF4;}
.version-badge{display:inline-block;padding:3px 9px;background:var(--teal);color:#fff;border-radius:20px;font-size:11px;font-weight:700;}
.approval-block{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0;}
.approval-item{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:18px;}
.approval-role{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:5px;}
.approval-name{font-size:14px;font-weight:800;color:var(--navy);margin-bottom:14px;}
.approval-sig-line{border-bottom:1.5px solid var(--border);margin-bottom:6px;height:28px;}
.approval-sig-label{font-size:11px;color:var(--muted);}
.review-notice{grid-column:1/-1;background:var(--amber-light);border:1px solid var(--amber);border-radius:var(--radius-md);padding:12px 16px;font-size:13px;color:#5C3A00;}
.related-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:16px 0;}
.related-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px 16px;text-decoration:none;transition:all 0.2s;display:block;}
.related-card:hover{border-color:var(--teal-mid);box-shadow:0 2px 8px rgba(11,107,92,0.1);transform:translateY(-1px);}
.related-card-id{font-family:var(--font-mono);font-size:11px;color:var(--teal-mid);font-weight:700;margin-bottom:4px;}
.related-card-title{font-size:13px;font-weight:700;color:var(--navy);margin-bottom:3px;}
.related-card-domain{font-size:11px;color:var(--muted);}
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}.priority-grid{grid-template-columns:1fr;}.contact-grid{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D7">D7 · Emergency &amp; Business Continuity</a><span>›</span><span>VHS-D7-002</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D7 · Emergency &amp; Business Continuity</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Okezie Ofeogbu — Administrator</span>
    <span class="pill pill-version">VHS-D7-002 · v2.0</span>
  </div>
  <h1 class="doc-title">Client Individual Emergency Preparedness Plan</h1>
  <div class="doc-id-line">VHS-D7-002 · Applies to: All Clinical Personnel</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.11.12</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Every client gets their own emergency plan — you complete it at admission and update it at every reassessment.</li><li class="wmfy-item">The plan identifies the client's priority level, who can help them in an emergency, and what special needs (medical equipment, mobility, language) they have.</li><li class="wmfy-item">A copy of the plan stays in the client's clinical record and a printed copy is left in the home.</li><li class="wmfy-item">If a client's situation changes — new equipment, moved to a new address, caregiver changes — update the plan immediately and notify the care coordinator.</li><li class="wmfy-item">During an emergency, the on-call supervisor uses these plans to decide who gets called first.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>This policy requires that an Individual Emergency Preparedness Plan (IEPP) be developed for every active client of Vitalis Healthcare Services, LLC, so that each client's specific needs, vulnerabilities, and resources are documented and available when an emergency occurs.</p></div></section>

<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Vitalis Healthcare Services, LLC develops an Individual Emergency Preparedness Plan for every client at the time of admission, as part of the comprehensive assessment. The plan is reviewed and updated at every reassessment, after any significant change in the client's condition or living situation, and following any actual emergency in which the client was involved.</p></div></section>

<section class="policy-section" id="procedures"><h2 class="section-heading">Procedures</h2>

<h3 class="sub-heading">A. Plan Development at Admission</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Admitting RN</span> Complete the Individual Emergency Preparedness Plan form (available at <a href="https://www.vitalishealthcare.com/forms" target="_blank">www.vitalishealthcare.com/forms</a>) during the initial comprehensive assessment visit. Do not defer this to a later visit.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Admitting RN</span> Assign the client a priority level based on the criteria in <a href="/pp/VHS-D7-001">VHS-D7-001</a>: <strong>Level I:</strong> daily skilled nursing visits required; limited/no mobility; lives alone; dependent on powered medical equipment. <strong>Level II:</strong> all other clients.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Admitting RN</span> Document in the plan: client's full name, address, phone, date of birth; preferred language and any communication barriers; mobility status and transportation resources; primary diagnosis and relevant medical conditions; names and phone numbers of emergency contacts and any available caregiver; all electricity-dependent medical equipment in the home (model, purpose, supplier name and phone); any special needs (dietary, psychiatric, cognitive); and the client's advance directive status.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Admitting RN</span> Educate the client and household members on how to contact the agency after hours (see <a href="/pp/VHS-D7-003">VHS-D7-003</a>), when to call 911, and how to prepare a personal go-bag for evacuation (medications, ID, insurance cards, a 72-hour supply of essential supplies).</div></li><li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">Admitting RN</span> Leave a printed copy of the completed IEPP in the home. Place the original in the client's clinical record in AxisCare. Notify the care coordinator that the plan has been completed and the client's priority level.</div></li></ol>

<h3 class="sub-heading">B. Plan Updates</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Supervising RN / Visiting Clinician</span> Review and update the IEPP at every formal reassessment. Confirm that contact numbers, equipment, and living situation are still accurate.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Any Personnel</span> Notify the care coordinator immediately of any change that affects the client's priority level or emergency resources — new medical equipment in the home, caregiver no longer available, client relocated, new advance directive.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Care Coordinator</span> Updates the priority roster in AxisCare within 24 hours of receiving notification of any change. Confirms the on-call book reflects the updated information.</div></li></ol>

<h3 class="sub-heading">C. On-Call Book</h3>
<div class="body-text"><p>The care coordinator maintains a current on-call book that contains, for each active client: full name and address, phone number, priority level, emergency contact name and phone, primary diagnosis, active medications list, advance directive status, and a copy of the IEPP. The on-call book is updated at the start of each week and is transferred to the on-call supervisor at the start of after-hours coverage each day. See <a href="/pp/VHS-D7-003">VHS-D7-003</a> for on-call procedures.</p></div>

</section>

<section class="policy-section" id="iepp-contents"><h2 class="section-heading">Required IEPP Contents</h2>
<table class="data-table"><thead><tr><th>Field</th><th>What to Document</th></tr></thead><tbody>
<tr><td>Client demographics</td><td>Name, DOB, address, phone, preferred language</td></tr>
<tr><td>Priority level</td><td>Level I or Level II — assigned at admission</td></tr>
<tr><td>Mobility &amp; transportation</td><td>Can evacuate independently? Needs assist? Has transportation?</td></tr>
<tr><td>Emergency contacts</td><td>At least 2 contacts with phone numbers</td></tr>
<tr><td>Caregiver information</td><td>Name, phone, availability</td></tr>
<tr><td>Medical equipment</td><td>All electricity-dependent equipment: device, supplier, phone</td></tr>
<tr><td>Special needs</td><td>Dietary, cognitive, psychiatric, communication barriers</td></tr>
<tr><td>Advance directives</td><td>DNR, MOLST, or other — location of document noted</td></tr>
<tr><td>Plan education given</td><td>Date and clinician signature</td></tr>
<tr><td>Priority level review date</td><td>Date last reviewed / updated</td></tr>
</tbody></table>
<div class="callout callout-ai"><div class="callout-label">⚠ Compliance Note</div><div class="callout-body">OHCQ surveyors review IEPPs during site visits. Missing or outdated plans are a common deficiency citation. Every active client must have a current, signed plan on file. "Current" means reviewed within the past 12 months or since the last material change in condition.</div></div>
</section>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.11.12" target="_blank">COMAR 10.07.11.12</a> — Emergency preparedness — individual client planning.</div></div></div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">CMS 484.102</span> — Client-level emergency planning requirements.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>New policy — no legacy equivalent. Establishes IEPP requirement at admission, required content table, update triggers, and on-call book requirements.</td></tr><tr><td>v1.0</td><td>—</td><td>No prior version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D7-001"><div class="related-card-id">VHS-D7-001</div><div class="related-card-title">Disaster & Emergency Preparedness Plan</div><div class="related-card-domain">D7 · Emergency &amp; Business Continuity</div></a><a class="related-card" href="/pp/VHS-D7-003"><div class="related-card-id">VHS-D7-003</div><div class="related-card-title">After-Hours Care & On-Call Coverage</div><div class="related-card-domain">D7 · Emergency &amp; Business Continuity</div></a><a class="related-card" href="/pp/VHS-D4-016"><div class="related-card-id">VHS-D4-016</div><div class="related-card-title">Comprehensive Assessment & Clinical Supervision</div><div class="related-card-domain">D4 · Clinical Operations</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D7-Emergency-Business-Continuity.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content=EXCLUDED.html_content, title=EXCLUDED.title, version=EXCLUDED.version,
  effective_date=EXCLUDED.effective_date, review_date=EXCLUDED.review_date,
  applicable_roles=EXCLUDED.applicable_roles, comar_refs=EXCLUDED.comar_refs,
  keywords=EXCLUDED.keywords, status=EXCLUDED.status, updated_at=NOW();

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D7-003', 'D7', 1, 'After-Hours Care &amp; On-Call Coverage', 'Okezie Ofeogbu — Administrator', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Personnel', 'Clients'],
  ARRAY['10.07.11.09'],
  ARRAY['after hours', 'on-call', '24/7', '1 hour response', 'answering service', 'Ngozi Ahatanke', 'Divine Fube', 'Marie Epah', 'on-call log'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);}
.breadcrumb a{color:var(--teal);text-decoration:none;}.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.sub-heading{font-size:15px;font-weight:700;color:var(--navy);margin:24px 0 10px;padding-left:14px;border-left:3px solid var(--teal-mid);}
.body-text p{margin-bottom:14px;color:var(--slate);}.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}.data-table tr:nth-child(even) td{background:var(--bg);}.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.command-chain{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.command-row{display:flex;align-items:center;gap:0;border-bottom:1px solid var(--border);}
.command-row:last-child{border-bottom:none;}
.command-role{background:var(--navy-light);color:var(--navy);font-size:11px;font-weight:800;padding:12px 16px;min-width:200px;flex-shrink:0;text-transform:uppercase;letter-spacing:0.4px;}
.command-name{padding:12px 16px;font-size:13px;color:var(--slate);font-weight:500;}
.contact-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:16px 0;}
.contact-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px;border-top:3px solid var(--teal-mid);}
.contact-label{font-size:11px;font-weight:700;color:var(--navy);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;}
.contact-number{font-size:14px;font-weight:800;color:var(--teal);}
.contact-sub{font-size:11px;color:var(--muted);margin-top:2px;}
.priority-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;}
.priority-card{border-radius:var(--radius-md);padding:18px 20px;border:1px solid;}
.priority-i{background:#FFF1F0;border-color:var(--rose);}
.priority-ii{background:var(--teal-light);border-color:var(--teal-mid);}
.priority-badge{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;}
.priority-i .priority-badge{color:var(--rose);}
.priority-ii .priority-badge{color:var(--teal);}
.priority-title{font-size:14px;font-weight:800;color:var(--navy);margin-bottom:6px;}
.priority-body{font-size:13px;color:var(--slate);line-height:1.6;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}.src-cfr{background:#DBEAFE;color:#1E3A5F;}.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}.version-table tr.current td{background:#F0FDF4;}
.version-badge{display:inline-block;padding:3px 9px;background:var(--teal);color:#fff;border-radius:20px;font-size:11px;font-weight:700;}
.approval-block{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0;}
.approval-item{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:18px;}
.approval-role{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:5px;}
.approval-name{font-size:14px;font-weight:800;color:var(--navy);margin-bottom:14px;}
.approval-sig-line{border-bottom:1.5px solid var(--border);margin-bottom:6px;height:28px;}
.approval-sig-label{font-size:11px;color:var(--muted);}
.review-notice{grid-column:1/-1;background:var(--amber-light);border:1px solid var(--amber);border-radius:var(--radius-md);padding:12px 16px;font-size:13px;color:#5C3A00;}
.related-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:16px 0;}
.related-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px 16px;text-decoration:none;transition:all 0.2s;display:block;}
.related-card:hover{border-color:var(--teal-mid);box-shadow:0 2px 8px rgba(11,107,92,0.1);transform:translateY(-1px);}
.related-card-id{font-family:var(--font-mono);font-size:11px;color:var(--teal-mid);font-weight:700;margin-bottom:4px;}
.related-card-title{font-size:13px;font-weight:700;color:var(--navy);margin-bottom:3px;}
.related-card-domain{font-size:11px;color:var(--muted);}
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}.priority-grid{grid-template-columns:1fr;}.contact-grid{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D7">D7 · Emergency &amp; Business Continuity</a><span>›</span><span>VHS-D7-003</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D7 · Emergency &amp; Business Continuity</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Okezie Ofeogbu — Administrator</span>
    <span class="pill pill-version">VHS-D7-003 · v2.0</span>
  </div>
  <h1 class="doc-title">After-Hours Care &amp; On-Call Coverage</h1>
  <div class="doc-id-line">VHS-D7-003 · Applies to: All Personnel and Clients</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.11.09</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Vitalis is available to clients 24 hours a day, 7 days a week — even when the office is closed.</li><li class="wmfy-item">After 5:30 PM and on weekends, clients call the main number: (240) 618-3184. The answering service routes the call to the on-call RN.</li><li class="wmfy-item">If you are the on-call RN, you must respond to any call within 1 hour. For urgent clinical situations, respond sooner.</li><li class="wmfy-item">If you are assigned to on-call duty, carry your phone, keep it charged, and do not turn it off.</li><li class="wmfy-item">All after-hours calls must be logged in the on-call log. Bring the log book to the office on the next business day.</li><li class="wmfy-item">Tell your clients at admission: for life-threatening emergencies, always call 911 first.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>This policy ensures that every Vitalis Healthcare Services, LLC client has access to clinical support and guidance at all times — including evenings, weekends, and holidays — and that the agency's on-call system operates reliably and is clearly communicated to all clients and staff.</p></div></section>

<section class="policy-section" id="hours"><h2 class="section-heading">Office Hours &amp; After-Hours Access</h2>
<div class="body-text"><p>Regular business hours are <strong>Monday through Friday, 8:30 AM to 5:30 PM</strong>. Outside of these hours, clients and caregivers access the agency through the main phone number: <strong>(240) 618-3184</strong>. Callers are answered by the agency's answering service, which routes clinical calls to the on-call RN.</p>
<p>Clients are instructed at admission: for any life-threatening emergency, call <strong>911 immediately</strong>. Do not call the agency first in a life-threatening emergency.</p></div></section>

<section class="policy-section" id="rotation"><h2 class="section-heading">On-Call Rotation</h2>
<div class="body-text"><p>The Director of Nursing maintains the on-call schedule. The rotation follows this escalation order:</p></div>
<div class="command-chain">
  <div class="command-row"><div class="command-role">1st — On-Call RN</div><div class="command-name">Rotates per schedule — Ngozi Ahatanke / Divine Fube</div></div>
  <div class="command-row"><div class="command-role">2nd — Alternate On-Call RN</div><div class="command-name">Per schedule</div></div>
  <div class="command-row"><div class="command-role">3rd — Director of Nursing</div><div class="command-name">Marie Epah (Acting)</div></div>
</div>
<div class="body-text" style="margin-top:12px"><p>The current on-call schedule is posted in AxisCare and communicated to the answering service by <strong>4:00 PM each Friday</strong> for the upcoming week. Any change to the on-call rotation must be communicated to the answering service immediately.</p></div></section>

<section class="policy-section" id="procedures"><h2 class="section-heading">Procedures</h2>

<h3 class="sub-heading">A. Client Notification at Admission</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Admitting Staff</span> Inform every new client and their household at admission: the agency main number is (240) 618-3184; calls are answered 24/7; after-hours calls are routed to the on-call nurse; clients should call 911 for any life-threatening emergency.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Admitting Staff</span> Provide this information in writing. The agency's after-hours contact number appears on the client's welcome letter and plan of care document.</div></li></ol>

<h3 class="sub-heading">B. On-Call RN Responsibilities</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">On-Call RN</span> Receive all after-hours clinical calls routed by the answering service. Respond to each call within <strong>1 hour</strong> of receipt. If a clinical situation requires an urgent response, respond immediately.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">On-Call RN</span> Assess the caller's concern. Provide clinical guidance within your scope of practice. Determine if a home visit is required, if 911 should be called, or if the matter can be managed by telephone until the next business day.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">On-Call RN</span> Log every after-hours call in the on-call log book, recording: date and time of call; client name; nature of inquiry or concern; guidance or action taken; any follow-up required.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">On-Call RN</span> If a home visit is made after hours, document it in AxisCare as a visit note within 24 hours. Notify the care coordinator at the start of the next business day.</div></li><li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">On-Call RN</span> Return the on-call log book to the office at the start of the next business day so the data entry team can update AxisCare records.</div></li></ol>

<h3 class="sub-heading">C. On-Call Book Contents</h3>
<div class="body-text"><p>The on-call book is prepared by the care coordinator and contains the following for each active client: full name and address; phone number; priority level; primary diagnosis; current medications; known allergies; attending physician name and phone; emergency contacts; and advance directive status. The on-call book is updated weekly at the start of each week and verified against AxisCare records.</p></div>

<h3 class="sub-heading">D. Escalation &amp; Emergency Visits</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">On-Call RN</span> If a client situation requires immediate in-person assessment and no visit can be arranged within 1 hour, direct the client or caregiver to call 911 and go to the nearest emergency department. Notify the Director of Nursing.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">On-Call RN</span> If a client death occurs after hours, follow the RN Pronouncement policy (VHS-D4-017) and notify the Administrator and Director of Nursing immediately.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Director of Nursing</span> Reviews all after-hours call logs at the start of each week. Identifies any patterns requiring clinical follow-up or care plan revision. Ensures all visits and calls are documented in AxisCare.</div></li></ol>

</section>

<div class="callout callout-warning"><div class="callout-label">⚠ Response Time Requirement — 1 Hour</div><div class="callout-body">The agency is required to respond to any client inquiry within 1 hour of receipt — this is a regulatory standard. An on-call RN who fails to respond within 1 hour, or who is unreachable, must be reported to the Director of Nursing immediately so the escalation list can be activated.</div></div>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.11.09" target="_blank">COMAR 10.07.11.09</a> — Availability of services — 24-hour access requirement.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Named on-call RNs (Ngozi Ahatanke / Divine Fube), updated escalation chain, added on-call book requirements. Supersedes legacy 3.013.1.</td></tr><tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 3.013.1). OHCQ license submission version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D7-001"><div class="related-card-id">VHS-D7-001</div><div class="related-card-title">Disaster & Emergency Preparedness Plan</div><div class="related-card-domain">D7 · Emergency &amp; Business Continuity</div></a><a class="related-card" href="/pp/VHS-D7-002"><div class="related-card-id">VHS-D7-002</div><div class="related-card-title">Client Individual Emergency Preparedness Plan</div><div class="related-card-domain">D7 · Emergency &amp; Business Continuity</div></a><a class="related-card" href="/pp/VHS-D7-004"><div class="related-card-id">VHS-D7-004</div><div class="related-card-title">Backup Coverage of Services</div><div class="related-card-domain">D7 · Emergency &amp; Business Continuity</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D7-Emergency-Business-Continuity.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content=EXCLUDED.html_content, title=EXCLUDED.title, version=EXCLUDED.version,
  effective_date=EXCLUDED.effective_date, review_date=EXCLUDED.review_date,
  applicable_roles=EXCLUDED.applicable_roles, comar_refs=EXCLUDED.comar_refs,
  keywords=EXCLUDED.keywords, status=EXCLUDED.status, updated_at=NOW();

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D7-004', 'D7', 1, 'Backup Coverage of Services', 'Okezie Ofeogbu — Administrator', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Personnel'],
  ARRAY['10.07.11.09'],
  ARRAY['backup coverage', 'missed visit', 'PRN', 'staffing', 'Level I', 'continuity of care', 'AxisCare documentation'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);}
.breadcrumb a{color:var(--teal);text-decoration:none;}.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.sub-heading{font-size:15px;font-weight:700;color:var(--navy);margin:24px 0 10px;padding-left:14px;border-left:3px solid var(--teal-mid);}
.body-text p{margin-bottom:14px;color:var(--slate);}.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}.data-table tr:nth-child(even) td{background:var(--bg);}.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.command-chain{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.command-row{display:flex;align-items:center;gap:0;border-bottom:1px solid var(--border);}
.command-row:last-child{border-bottom:none;}
.command-role{background:var(--navy-light);color:var(--navy);font-size:11px;font-weight:800;padding:12px 16px;min-width:200px;flex-shrink:0;text-transform:uppercase;letter-spacing:0.4px;}
.command-name{padding:12px 16px;font-size:13px;color:var(--slate);font-weight:500;}
.contact-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:16px 0;}
.contact-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px;border-top:3px solid var(--teal-mid);}
.contact-label{font-size:11px;font-weight:700;color:var(--navy);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;}
.contact-number{font-size:14px;font-weight:800;color:var(--teal);}
.contact-sub{font-size:11px;color:var(--muted);margin-top:2px;}
.priority-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;}
.priority-card{border-radius:var(--radius-md);padding:18px 20px;border:1px solid;}
.priority-i{background:#FFF1F0;border-color:var(--rose);}
.priority-ii{background:var(--teal-light);border-color:var(--teal-mid);}
.priority-badge{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;}
.priority-i .priority-badge{color:var(--rose);}
.priority-ii .priority-badge{color:var(--teal);}
.priority-title{font-size:14px;font-weight:800;color:var(--navy);margin-bottom:6px;}
.priority-body{font-size:13px;color:var(--slate);line-height:1.6;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}.src-cfr{background:#DBEAFE;color:#1E3A5F;}.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}.version-table tr.current td{background:#F0FDF4;}
.version-badge{display:inline-block;padding:3px 9px;background:var(--teal);color:#fff;border-radius:20px;font-size:11px;font-weight:700;}
.approval-block{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0;}
.approval-item{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:18px;}
.approval-role{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:5px;}
.approval-name{font-size:14px;font-weight:800;color:var(--navy);margin-bottom:14px;}
.approval-sig-line{border-bottom:1.5px solid var(--border);margin-bottom:6px;height:28px;}
.approval-sig-label{font-size:11px;color:var(--muted);}
.review-notice{grid-column:1/-1;background:var(--amber-light);border:1px solid var(--amber);border-radius:var(--radius-md);padding:12px 16px;font-size:13px;color:#5C3A00;}
.related-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:16px 0;}
.related-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px 16px;text-decoration:none;transition:all 0.2s;display:block;}
.related-card:hover{border-color:var(--teal-mid);box-shadow:0 2px 8px rgba(11,107,92,0.1);transform:translateY(-1px);}
.related-card-id{font-family:var(--font-mono);font-size:11px;color:var(--teal-mid);font-weight:700;margin-bottom:4px;}
.related-card-title{font-size:13px;font-weight:700;color:var(--navy);margin-bottom:3px;}
.related-card-domain{font-size:11px;color:var(--muted);}
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}.priority-grid{grid-template-columns:1fr;}.contact-grid{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D7">D7 · Emergency &amp; Business Continuity</a><span>›</span><span>VHS-D7-004</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D7 · Emergency &amp; Business Continuity</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Okezie Ofeogbu — Administrator</span>
    <span class="pill pill-version">VHS-D7-004 · v2.0</span>
  </div>
  <h1 class="doc-title">Backup Coverage of Services</h1>
  <div class="doc-id-line">VHS-D7-004 · Applies to: All Personnel</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.11.09</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">If you cannot make a scheduled visit for any reason — illness, car trouble, family emergency — call your supervisor as early as possible. Do not wait until visit time.</li><li class="wmfy-item">Give as much advance notice as you can. Last-minute call-outs make it much harder to find a replacement for your client.</li><li class="wmfy-item">You are responsible for notifying us, not for finding your own replacement. We handle scheduling coverage.</li><li class="wmfy-item">Clients count on their visits. Every time we provide backup coverage, we protect a vulnerable person who is depending on us.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>This policy ensures that clients of Vitalis Healthcare Services, LLC receive all services ordered in their plan of care, even when a scheduled staff member is unable to provide a visit. Continuity of care is a clinical and regulatory obligation.</p></div></section>

<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Vitalis Healthcare Services, LLC maintains a reliable system of backup staffing to ensure no client visit is missed due to staff unavailability. The agency uses a multi-tier backup approach, escalating until coverage is secured or the physician and client are notified of an unavoidable delay.</p></div></section>

<section class="policy-section" id="procedures"><h2 class="section-heading">Backup Coverage Procedure</h2>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Staff Member</span> Notify the supervisor or care coordinator as soon as you know you cannot make a scheduled visit. Early notice is critical — call or text the care coordinator at <strong>(240) 618-3184</strong>. Do not leave a message and assume coverage will happen; confirm by speaking to someone.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Care Coordinator</span> Assess the urgency of the missed visit based on the client's priority level and plan of care. Attempt to reschedule with another qualified in-house staff member first.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Care Coordinator</span> If no in-house staff member is available, contact the agency's pool of qualified contracted PRN employees. Maintain a current PRN contact list in AxisCare.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Care Coordinator</span> If contracted PRN staff are unavailable, contact the designated backup staffing agency. The current backup agency is on file with the Administrator and updated annually.</div></li><li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">Care Coordinator / Director of Nursing</span> If coverage cannot be secured through the above steps, notify the attending physician and the client (or client representative) of the delay. Document the notification. Determine with the physician whether and where services will be transferred if the visit cannot be completed.</div></li><li class="step"><span class="step-num">6</span><div class="step-body"><span class="role-tag">Care Coordinator</span> Document all backup coverage actions in AxisCare, including: reason for original staff absence, all coverage attempts made, outcome, and any physician or client notifications.</div></li></ol>
</section>

<section class="policy-section" id="priority"><h2 class="section-heading">Priority Visits</h2>
<div class="body-text"><p>Level I clients (as defined in <a href="/pp/VHS-D7-001">VHS-D7-001</a>) receive priority in backup scheduling. A Level I visit that cannot be covered by in-house staff escalates immediately to the contracted PRN pool and backup agency — there is no waiting period. The Director of Nursing is notified of any Level I visit that cannot be covered within <strong>2 hours</strong> of the original scheduled time.</p></div></section>

<div class="callout callout-axiscare"><div class="callout-label">📱 Documentation Requirement</div><div class="callout-body">All missed visits, coverage attempts, and outcomes must be documented in AxisCare within 24 hours. Undocumented missed visits are a survey deficiency. If the system is unavailable, document on paper and enter into AxisCare when access is restored.</div></div>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.11.09" target="_blank">COMAR 10.07.11.09</a> — Continuity and availability of services.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added Level I priority escalation rule (2-hour threshold), multi-tier backup sequence, AxisCare documentation callout. Supersedes legacy 1.012.1.</td></tr><tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 1.012.1). OHCQ license submission version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D7-001"><div class="related-card-id">VHS-D7-001</div><div class="related-card-title">Disaster & Emergency Preparedness Plan</div><div class="related-card-domain">D7 · Emergency &amp; Business Continuity</div></a><a class="related-card" href="/pp/VHS-D7-003"><div class="related-card-id">VHS-D7-003</div><div class="related-card-title">After-Hours Care & On-Call Coverage</div><div class="related-card-domain">D7 · Emergency &amp; Business Continuity</div></a><a class="related-card" href="/pp/VHS-D5-003"><div class="related-card-id">VHS-D5-003</div><div class="related-card-title">Staffing & Scheduling</div><div class="related-card-domain">D5 · Business Operations</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D7-Emergency-Business-Continuity.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content=EXCLUDED.html_content, title=EXCLUDED.title, version=EXCLUDED.version,
  effective_date=EXCLUDED.effective_date, review_date=EXCLUDED.review_date,
  applicable_roles=EXCLUDED.applicable_roles, comar_refs=EXCLUDED.comar_refs,
  keywords=EXCLUDED.keywords, status=EXCLUDED.status, updated_at=NOW();

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D7-005', 'D7', 1, 'Agency Closure Procedures', 'Okezie Ofeogbu — Administrator', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['Administrator', 'Governing Body'],
  ARRAY['10.07.11.03'],
  ARRAY['closure', '45 days', 'OHCQ', 'records custodian', '5 years', 'change of ownership', 'license surrender', 'client transition'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);}
.breadcrumb a{color:var(--teal);text-decoration:none;}.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.sub-heading{font-size:15px;font-weight:700;color:var(--navy);margin:24px 0 10px;padding-left:14px;border-left:3px solid var(--teal-mid);}
.body-text p{margin-bottom:14px;color:var(--slate);}.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}.data-table tr:nth-child(even) td{background:var(--bg);}.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.command-chain{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.command-row{display:flex;align-items:center;gap:0;border-bottom:1px solid var(--border);}
.command-row:last-child{border-bottom:none;}
.command-role{background:var(--navy-light);color:var(--navy);font-size:11px;font-weight:800;padding:12px 16px;min-width:200px;flex-shrink:0;text-transform:uppercase;letter-spacing:0.4px;}
.command-name{padding:12px 16px;font-size:13px;color:var(--slate);font-weight:500;}
.contact-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:16px 0;}
.contact-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px;border-top:3px solid var(--teal-mid);}
.contact-label{font-size:11px;font-weight:700;color:var(--navy);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;}
.contact-number{font-size:14px;font-weight:800;color:var(--teal);}
.contact-sub{font-size:11px;color:var(--muted);margin-top:2px;}
.priority-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;}
.priority-card{border-radius:var(--radius-md);padding:18px 20px;border:1px solid;}
.priority-i{background:#FFF1F0;border-color:var(--rose);}
.priority-ii{background:var(--teal-light);border-color:var(--teal-mid);}
.priority-badge{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;}
.priority-i .priority-badge{color:var(--rose);}
.priority-ii .priority-badge{color:var(--teal);}
.priority-title{font-size:14px;font-weight:800;color:var(--navy);margin-bottom:6px;}
.priority-body{font-size:13px;color:var(--slate);line-height:1.6;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}.src-cfr{background:#DBEAFE;color:#1E3A5F;}.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}.version-table tr.current td{background:#F0FDF4;}
.version-badge{display:inline-block;padding:3px 9px;background:var(--teal);color:#fff;border-radius:20px;font-size:11px;font-weight:700;}
.approval-block{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0;}
.approval-item{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:18px;}
.approval-role{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:5px;}
.approval-name{font-size:14px;font-weight:800;color:var(--navy);margin-bottom:14px;}
.approval-sig-line{border-bottom:1.5px solid var(--border);margin-bottom:6px;height:28px;}
.approval-sig-label{font-size:11px;color:var(--muted);}
.review-notice{grid-column:1/-1;background:var(--amber-light);border:1px solid var(--amber);border-radius:var(--radius-md);padding:12px 16px;font-size:13px;color:#5C3A00;}
.related-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:16px 0;}
.related-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px 16px;text-decoration:none;transition:all 0.2s;display:block;}
.related-card:hover{border-color:var(--teal-mid);box-shadow:0 2px 8px rgba(11,107,92,0.1);transform:translateY(-1px);}
.related-card-id{font-family:var(--font-mono);font-size:11px;color:var(--teal-mid);font-weight:700;margin-bottom:4px;}
.related-card-title{font-size:13px;font-weight:700;color:var(--navy);margin-bottom:3px;}
.related-card-domain{font-size:11px;color:var(--muted);}
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}.priority-grid{grid-template-columns:1fr;}.contact-grid{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D7">D7 · Emergency &amp; Business Continuity</a><span>›</span><span>VHS-D7-005</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D7 · Emergency &amp; Business Continuity</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Okezie Ofeogbu — Administrator</span>
    <span class="pill pill-version">VHS-D7-005 · v2.0</span>
  </div>
  <h1 class="doc-title">Agency Closure Procedures</h1>
  <div class="doc-id-line">VHS-D7-005 · Applies to: Administrator · Governing Body</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.11.03</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Agency closure is a rare event managed entirely by the Administrator and Governing Body — this policy tells you what the agency is required to do legally if it ever closes.</li><li class="wmfy-item">If you receive any notice related to agency closure, refer it immediately to the Administrator. Do not discuss it with clients.</li><li class="wmfy-item">Client records are protected for 5 years after closure — clients will always be able to access their records.</li><li class="wmfy-item">Every active client will be helped to find new services before the agency closes. No client will be left without a plan.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>This policy establishes the legal obligations and procedural steps that Vitalis Healthcare Services, LLC must follow in the event of voluntary agency closure, change of ownership, or transfer of licensure, in order to protect clients, personnel, and the public record.</p></div></section>

<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Vitalis Healthcare Services, LLC complies with all Maryland regulations governing agency closure and ownership transfer. The Governing Body bears ultimate responsibility for an orderly closure process that protects client welfare, preserves records, and satisfies all regulatory obligations.</p></div></section>

<section class="policy-section" id="procedures"><h2 class="section-heading">Procedures</h2>

<h3 class="sub-heading">A. Advance Notice Requirements</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Administrator / Governing Body</span> Provide written notice to the Maryland Department of Health (OHCQ) no later than <strong>45 calendar days</strong> before the effective date of: (a) cessation of operations; (b) change of ownership; or (c) sale of the agency.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Administrator</span> Simultaneously provide written notice to: each active client or their authorized representative; the client's attending physician; and any third-party payers (Medicaid, insurance carriers, etc.).</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Administrator</span> The written notice to OHCQ must include: (a) the method for informing clients of the intent to close or transfer; (b) the actions the agency will take to assist clients in securing comparable services; (c) the reason for closing; (d) the location of client records (active and inactive); and (e) the name and address of the designated records custodian.</div></li></ol>

<h3 class="sub-heading">B. Client Transition</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Director of Nursing / Care Coordinators</span> Immediately begin assisting all active clients in identifying and transitioning to a comparable home health or residential service agency. Document all transition activities in each client's record.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Director of Nursing</span> Transfer a copy of each active client's complete clinical record to the receiving agency to ensure continuity of care. Obtain written acknowledgment of receipt from the receiving agency.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Care Coordinators</span> Notify each client's case manager and care management team (where applicable) of the pending closure and coordinate the transition to a new provider.</div></li></ol>

<h3 class="sub-heading">C. Change of Ownership</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Administrator / Governing Body</span> Notify OHCQ and all parties (clients, physicians, payers) at least <strong>45 days</strong> prior to any transfer of ownership. The future owner must apply for a new RSA license at least 45 days before the transfer.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Current Licensee</span> Remains fully responsible for the operation of the agency, correction of all outstanding deficiencies, and compliance with all impending sanctions until a new license is issued to the new owner.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">New Owner</span> Upon issuance of the new license, assumes all responsibility for outstanding deficiencies and impending sanctions.</div></li></ol>

<h3 class="sub-heading">D. License Surrender</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Administrator</span> On the final day of agency operations, mail or return all agency licenses to OHCQ via certified mail, accompanied by written notification of the official closure date.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Administrator</span> The agency license is void upon cessation of operations. The agency may not continue to provide services after the declared closure date.</div></li></ol>

<h3 class="sub-heading">E. Records Retention After Closure</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Governing Body</span> Regardless of the reason for closure, maintain all client and personnel records in a format compliant with HIPAA regulations for a minimum of <strong>5 years</strong> after the date of closure.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Governing Body</span> Designate a records custodian — a named individual or organization — who is responsible for responding to requests for records after the agency closes. Communicate the custodian's name and contact information to OHCQ in the closure notice.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Records Custodian</span> Ensure that former clients can obtain copies of their clinical records upon request throughout the 5-year retention period.</div></li></ol>

</section>

<div class="callout callout-warning"><div class="callout-label">⚠ Regulatory Reminder</div><div class="callout-body">Operating after the declared closure date, or failing to provide the required 45-day advance notice to OHCQ, may result in enforcement action, license revocation, and civil penalties under Maryland law. Governing Body members may be held personally liable for non-compliance.</div></div>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.11.03" target="_blank">COMAR 10.07.11.03</a> — Licensure — closure and ownership transfer requirements.</div></div></div><div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">MD Health-Gen. § 19-1606</span> — Home health agency record retention and closure.</div></div></div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">HIPAA 45 CFR Part 164</span> — Record security and retention standards.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Restructured into labelled sections, added records custodian requirement, 45-day notice checklist, change-of-ownership responsibility chain. Supersedes legacy 1.011.2.</td></tr><tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 1.011.2). OHCQ license submission version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D1-003"><div class="related-card-id">VHS-D1-003</div><div class="related-card-title">Change of Ownership or Administrative Control</div><div class="related-card-domain">D1 · Governance &amp; Compliance</div></a><a class="related-card" href="/pp/VHS-D4-002"><div class="related-card-id">VHS-D4-002</div><div class="related-card-title">Retention of Clinical Records</div><div class="related-card-domain">D4 · Clinical Operations</div></a><a class="related-card" href="/pp/VHS-D7-001"><div class="related-card-id">VHS-D7-001</div><div class="related-card-title">Disaster & Emergency Preparedness Plan</div><div class="related-card-domain">D7 · Emergency &amp; Business Continuity</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D7-Emergency-Business-Continuity.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content=EXCLUDED.html_content, title=EXCLUDED.title, version=EXCLUDED.version,
  effective_date=EXCLUDED.effective_date, review_date=EXCLUDED.review_date,
  applicable_roles=EXCLUDED.applicable_roles, comar_refs=EXCLUDED.comar_refs,
  keywords=EXCLUDED.keywords, status=EXCLUDED.status, updated_at=NOW();
