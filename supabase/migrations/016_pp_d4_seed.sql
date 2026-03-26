-- Migration 016 — P&P D4 Clinical Operations (v2.0, March 2026 triennial)
-- Run AFTER 012_pp_v2_schema.sql

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D4-001', 'D4', 1, 'Security of Clinical Information', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.11'],
  ARRAY['PHI', 'clinical records', 'security', 'HIPAA', 'AxisCare', 'travel file', 'breach'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-001</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-001 · v2.0</span>
      </div>
      <h1 class="doc-title">Security of Clinical Information</h1>
      <div class="doc-id-line">VHS-D4-001 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">10.07.05.11 · 45 CFR Parts 160 & 164</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Client records are private. Only people who need them to do their job may see them.</li>
<li class="wmfy-item">Never discuss a client's health information in public, on the phone in public, or with anyone not involved in their care.</li>
<li class="wmfy-item">Keep travel files for your client in your bag or in hand at all times — never left in plain sight in your car or a waiting area.</li>
<li class="wmfy-item">If you think a privacy breach has happened — even accidentally — tell the DON or Administrator immediately.</li>
<li class="wmfy-item">Only the Administrator, DON, or Office Manager may release a client's health information to anyone outside the agency.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To ensure all patient information held by Vitalis Healthcare Services, LLC is kept confidential, secure, and protected from unauthorized disclosure, alteration, or destruction — in full compliance with HIPAA and applicable Maryland law.</p></div></section>
<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Vitalis will protect the privacy of every patient by maintaining the security and safety of all patient information, whether stored in AxisCare, physical records, or any other medium. Patient health information will not be disclosed without authorization except as permitted by law.</p></div></section>
<section class="policy-section" id="permitted-uses"><h2 class="section-heading">Permitted Uses &amp; Disclosures</h2>
<table class="data-table"><thead><tr><th>Purpose</th><th>Description</th></tr></thead><tbody>
<tr><td>Plan of care &amp; treatment</td><td>Clinical information is shared among the care team to coordinate services and determine appropriate care.</td></tr>
<tr><td>Payment</td><td>Information may be shared with payers (e.g., Medicaid, insurance) as needed to process and receive reimbursement for services.</td></tr>
<tr><td>Healthcare operations</td><td>Staff may use patient information for quality review, training, and compliance purposes.</td></tr>
<tr><td>Emergencies</td><td>In an emergency, Vitalis may notify a family member or authorized representative of a patient's location and general condition.</td></tr>
<tr><td>Legal / public health</td><td>Vitalis will disclose information as required by court order, subpoena, law enforcement, or public health authorities.</td></tr>
</tbody></table></section>
<section class="policy-section" id="security"><h2 class="section-heading">Security Procedures</h2>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body">Only the Administrator, DON, or Office Manager may authorize the release of protected health information (PHI) outside the agency. Release only copies — original records never leave the agency.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body">All staff view the clinical record on a "need to know" basis as determined by their supervisor or the Administrator. Do not access records for clients not assigned to your care.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body">Client information is used only to promote and deliver patient care. Any other use requires express written consent from the client.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body">Keep all files in a secured area. Non-agency personnel (e.g., repair workers) must be accompanied by agency staff at all times when in areas where records are accessible.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body">Discuss patient information only in private with authorized persons. Never discuss patients in public areas, hallways, elevators, or on a phone call where others can hear.</div></li>
<li class="step"><span class="step-num">6</span><div class="step-body">Travel files: Take only the travel file for your specific patient into the home. A travel file not physically on your person must be kept locked and out of public view at all times — including in your car.</div></li>
<li class="step"><span class="step-num">7</span><div class="step-body">All clinical records are maintained in a lockable storage area or locked room. AxisCare serves as the primary electronic record — access is role-based and requires individual login credentials.</div></li>
<li class="step"><span class="step-num">8</span><div class="step-body">Vitalis does not use client information for fundraising or marketing, and will not sell client health information under any circumstance.</div></li>
</ol>
</section>
<section class="policy-section" id="breach"><h2 class="section-heading">PHI Breach Response</h2>
<div class="body-text"><p>If unsecured PHI is breached, the Administrator immediately initiates a PHI Breach Risk Assessment to determine whether patient notification is required. If the breach poses low probability of risk, patient notification may not be required. Any other risk level requires written notification to the affected patient within <strong>15 business days</strong> of the determination. If a business associate is involved, they must participate in the Risk Assessment.</p></div></section>
<section class="policy-section" id="patient-rights"><h2 class="section-heading">Patient Rights Regarding Their Records</h2>
<ul class="bullet-list"><li>Request in writing that Vitalis not use or disclose information for certain purposes — Vitalis will consider the request but is not required to accept all restrictions.</li><li>Request that health information be communicated in a specific way (e.g., to an alternate address).</li><li>Inspect and receive copies of their PHI. Reasonable fees apply as permitted by statute.</li><li>Request amendment to their record if they believe information is incorrect or incomplete.</li><li>Receive an accounting of disclosures for the past six years.</li><li>If paying by cash: instruct Vitalis not to share treatment information with their health plan.</li></ul>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">HIPAA — 45 CFR Parts 160 & 164</span> — Privacy and Security Rules. Establishes standards for protection of PHI, access controls, minimum necessary use, and breach notification.</div></div></div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.11" target="_blank">COMAR 10.07.05.11</a> — Confidentiality of client information. Requires RSAs to maintain confidentiality of all clinical records and to have written policies protecting PHI.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary, AxisCare electronic record reference, travel file security guidance. Supersedes legacy 4.001.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 4.001.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D4-002"><div class="related-card-id">VHS-D4-002</div><div class="related-card-title">Retention of Clinical Records</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-003"><div class="related-card-id">VHS-D4-003</div><div class="related-card-title">Clinical Records — Content, Timeliness & Accuracy</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D2-006"><div class="related-card-id">VHS-D2-006</div><div class="related-card-title">Confidentiality</div><div class="related-card-domain">D2 · Human Resources &amp; Workforce</div></a>
<a class="related-card" href="/pp/VHS-D3-001"><div class="related-card-id">VHS-D3-001</div><div class="related-card-title">Client Rights, Responsibilities & Non-Discrimination</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-002', 'D4', 1, 'Retention of Clinical Records', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.11'],
  ARRAY['retention', 'records', '7 years', 'discharge', 'HIPAA', 'destruction'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-002</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-002 · v2.0</span>
      </div>
      <h1 class="doc-title">Retention of Clinical Records</h1>
      <div class="doc-id-line">VHS-D4-002 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.11</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Clinical records must be kept for 7 years after a client is discharged. For clients under 18, records are kept until the client turns 21 or for 7 years — whichever is longer.</li>
<li class="wmfy-item">If we are involved in a legal case, records related to that case are kept for 5 years after the case ends.</li>
<li class="wmfy-item">Records must stay at the agency unless there is a court order, an emergency, or the record is accompanying a transferred patient.</li>
<li class="wmfy-item">Only the HIPAA officer (Administrator) can authorize the destruction of any patient record. Records must be destroyed in a way that makes them unreadable and unrecoverable.</li>
<li class="wmfy-item">Open records are always available for OHCQ survey inspectors to review during operating hours.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To define the retention schedule for all clinical records maintained by Vitalis Healthcare Services, LLC — protecting patient privacy, meeting Maryland regulatory requirements, and ensuring records are available for survey, care coordination, and legal purposes.</p></div></section>
<section class="policy-section" id="retention"><h2 class="section-heading">Retention Schedule</h2>
<table class="data-table"><thead><tr><th>Record Type</th><th>Retention Period</th></tr></thead><tbody>
<tr><td>Active clients</td><td>Record maintained at the agency, accessible during operating hours.</td></tr>
<tr><td>Discharged clients — adults</td><td>Retained 7 years after date of discharge.</td></tr>
<tr><td>Discharged clients — minors (under 18)</td><td>Retained until the client's 21st birthday OR 7 years after the record is made — whichever is later.</td></tr>
<tr><td>Litigation</td><td>Retained 5 years after the month of litigation conclusion, regardless of other retention periods.</td></tr>
<tr><td>Agency closure</td><td>Records maintained for 7 years past the closure date. Minor records: 7 years after the patient reaches the age of majority. Litigation records: 5 years after litigation conclusion.</td></tr>
</tbody></table></section>
<section class="policy-section" id="procedure"><h2 class="section-heading">Procedure</h2>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body">Open client records are maintained at the agency location providing service. They are made available upon request for survey purposes during operating hours.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body">If a patient is transferred to another health facility, a copy of the record may accompany the patient. Note in AxisCare the name, address, and date the records were sent.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body">Discharge records are completed no later than 30 days after the date of discharge and stored at the parent office.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body">Inactive or discharged records may be preserved electronically (e.g., optical disc, electronic storage) and stored at the agency location, alternate delivery site, or a secure records storage facility. Security must be maintained and records must be readily retrievable.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body">No clinical record or part of a record may be removed from the agency except for: providing direct patient care and treatment; compliance with a court order or subpoena; or to safeguard the record during a physical plant emergency or natural disaster. Any removed record must be returned during the next business day.</div></li>
<li class="step"><span class="step-num">6</span><div class="step-body"><span class="role-tag">Administrator (HIPAA Officer)</span> When records have reached the end of their retention period, authorize destruction using a method that prevents retrieval and subsequent use of any patient information. Document the method used and maintain proof of destruction.</div></li>
</ol>
<div class="callout callout-warning"><div class="callout-label">⚠ Only the Administrator May Authorize Record Destruction</div><div class="callout-body">No staff member may remove, destroy, or request destruction of patient records without explicit written authorization from the Administrator (HIPAA Officer). Unauthorized destruction of clinical records is a HIPAA violation and a patient safety issue.</div></div>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.11" target="_blank">COMAR 10.07.05.11</a> — Client records. Requires RSAs to retain all client records for minimum periods and to maintain records in a manner that protects confidentiality and permits retrieval.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">HIPAA — 45 CFR § 164.530</span> — Documentation requirements. Requires covered entities to maintain records of policies and procedures and related documentation for 6 years.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added retention schedule table, AxisCare electronic record reference, plain-language summary. Supersedes legacy 4.002.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 4.002.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D4-001"><div class="related-card-id">VHS-D4-001</div><div class="related-card-title">Security of Clinical Information</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-003"><div class="related-card-id">VHS-D4-003</div><div class="related-card-title">Clinical Records — Content, Timeliness & Accuracy</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-006"><div class="related-card-id">VHS-D4-006</div><div class="related-card-title">Clinical Record Review</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-003', 'D4', 1, 'Clinical Records — Content, Timeliness & Accuracy', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.11'],
  ARRAY['clinical records', 'documentation', 'AxisCare', '48 hours', '14 days', 'corrections', 'visit notes'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-003</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-003 · v2.0</span>
      </div>
      <h1 class="doc-title">Clinical Records — Content, Timeliness & Accuracy</h1>
      <div class="doc-id-line">VHS-D4-003 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.11</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Every entry you make in AxisCare must be accurate, complete, signed with your name and credentials, and dated.</li>
<li class="wmfy-item">Write your visit notes the same day you provide care. Do not leave notes until the end of the week.</li>
<li class="wmfy-item">Never use correction fluid or correction tape. To fix a mistake, draw a single line through it, add your initials and today's date, then write the correct information.</li>
<li class="wmfy-item">Clinical progress notes must be filed in the record within 14 days. Signed physician orders must be filed within 48 hours.</li>
<li class="wmfy-item">Do not copy-paste or use generic templates without making them specific to the client's actual condition and the actual visit.</li>
<li class="wmfy-item">If something is not documented, it did not happen — from a legal and compliance standpoint.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To ensure that a complete, accurate, and current clinical record exists for every Vitalis client — documenting all care provided, all changes in condition, and all coordination activities in a manner that protects patient safety, satisfies regulatory requirements, and supports continuity of care.</p></div></section>
<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Each entry in the client record must be current, accurate, signed with credentials, legible, and dated with the date of the entry — not the date of filing. All services provided, whether directly or under arrangement, must be documented. Records must be retrievable during operating hours. Vitalis uses AxisCare as its primary electronic record system.</p></div></section>
<section class="policy-section" id="skilled-contents"><h2 class="section-heading">Required Record Contents — Skilled Care Clients</h2>
<ul class="bullet-list"><li>Referral form — full name, sex, date of birth, address, phone, physician name/address/phone, emergency contacts, services requested, payer information</li><li>Client representative name, address, and phone number</li><li>All assessments, including initial comprehensive assessment</li><li>Plan of care — medications, dietary orders, skills, rehab plans, treatment and activity orders</li><li>Clinical progress notes for all disciplines providing services, written the day service is rendered</li><li>Current medication list — dosage, route, and frequency for each medication</li><li>Allergy and sensitivity list</li><li>Nutritional requirements and dietary plans</li><li>Medically necessary equipment and supplies</li><li>Medication Administration Record (MAR), if agency staff administer medications</li><li>Records of all supervisory visits</li><li>Documentation of all significant events</li><li>Acknowledgement that the client received Vitalis abuse/neglect/exploitation reporting policy</li><li>Documentation that the client was informed of the complaint process</li><li>Disaster Plan</li><li>Acknowledgement of receipt of Advance Directives information</li><li>Consent and authorization forms</li><li>Discharge summary — reason for discharge or transfer, documented notice to the client and physician, directions for safe continuation of care</li><li>Lab values (if applicable)</li><li>Documentation of coordination of care between disciplines</li></ul>
</section>
<section class="policy-section" id="nonskilled-contents"><h2 class="section-heading">Required Record Contents — Non-Skilled Care Clients</h2>
<ul class="bullet-list"><li>Referral form with demographic and emergency contact information</li><li>Client representative name, address, and phone number</li><li>Nursing assessment</li><li>Plan of care</li><li>Service notes</li><li>Records of supervisory visits</li><li>Services provided</li><li>Documentation of any significant change in condition</li><li>Discharge Report</li></ul>
</section>
<section class="policy-section" id="standards"><h2 class="section-heading">Documentation Standards — All Entries</h2>
<ul class="bullet-list"><li>Be factual, consistent, and written so the meaning is clear.</li><li>Be recorded as soon as possible after care is provided — same day is the standard.</li><li>Be accurately dated, timed, and signed with the clinician's name and credentials/designation.</li><li>Be legible and readable when photocopied or scanned.</li><li>Identify any risks or problems and document the action taken.</li><li>Provide clear evidence of the care planned, decisions made, care delivered, and information shared.</li></ul>
</section>
<section class="policy-section" id="deadlines"><h2 class="section-heading">Key Filing Deadlines</h2>
<table class="data-table"><thead><tr><th>Document</th><th>Deadline</th></tr></thead><tbody>
<tr><td>Clinical progress notes</td><td>Written the day service is rendered. Filed in the clinical record within 14 days.</td></tr>
<tr><td>Signed physician orders</td><td>Filed in the clinical record within 48 hours of receipt.</td></tr>
<tr><td>Physician orders requiring signature</td><td>Signed by physician within 30 days of the order being sent.</td></tr>
<tr><td>Discharge records</td><td>Completed no later than 30 days after the date of discharge.</td></tr>
<tr><td>Visit notes frequency</td><td>Maintained at minimum: at admission, at least weekly, upon any significant change in condition, and when the care plan is modified.</td></tr>
</tbody></table></section>
<section class="policy-section" id="corrections"><h2 class="section-heading">Corrections</h2>
<ul class="bullet-list"><li>Draw a single line through the error — do not scribble it out or make it unreadable.</li><li>Write your initials, the date of the correction, and the reason for the correction next to the error.</li><li>Write the correct information.</li><li>Never use correction fluid, correction tape, or any method that makes the original entry unreadable.</li><li>Never alter an entry in AxisCare after it has been locked without following the DON's correction procedure.</li></ul>
<div class="callout callout-axiscare"><div class="callout-label">📱 Electronic Signatures — AxisCare</div><div class="callout-body">Electronic signatures in AxisCare are acceptable for visit notes and aide documentation. Stamped physician signatures are NOT acceptable. Aide visit notes may be entered without countersigning. Only authorized individuals may make entries in the medical record — shared logins are prohibited.</div></div>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.11" target="_blank">COMAR 10.07.05.11</a> — Client records. Establishes minimum content requirements for RSA clinical records and documentation timeliness standards.</div></div></div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.12" target="_blank">COMAR 10.07.05.12</a> — Plan of care. Requires care plan documentation to be complete, current, and coordinated among all disciplines.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Merged legacy 4.003.1 (Timeliness and Accuracy) and 4.003.2 (Client Records) into single document. Added AxisCare electronic signature guidance, filing deadline table, plain-language summary. Supersedes legacy 4.003.1 and 4.003.2.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original documents prepared and approved February–March 2023. OHCQ license submission versions.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D4-001"><div class="related-card-id">VHS-D4-001</div><div class="related-card-title">Security of Clinical Information</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-002"><div class="related-card-id">VHS-D4-002</div><div class="related-card-title">Retention of Clinical Records</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-004"><div class="related-card-id">VHS-D4-004</div><div class="related-card-title">Physician Orders & Plan of Care</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-006"><div class="related-card-id">VHS-D4-006</div><div class="related-card-title">Clinical Record Review</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-004', 'D4', 1, 'Physician Orders & Plan of Care', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['Professional Staff'],
  ARRAY['10.07.05.12'],
  ARRAY['physician orders', 'plan of care', 'verbal orders', 'read-back', 'stamped signature', 'delegation'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-004</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-004 · v2.0</span>
      </div>
      <h1 class="doc-title">Physician Orders & Plan of Care</h1>
      <div class="doc-id-line">VHS-D4-004 · Applies to: Professional Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.12</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Every service you provide must be ordered by a physician and documented in the plan of care. Do not perform tasks not in the plan of care.</li>
<li class="wmfy-item">Verbal orders are accepted by RN and LPN — but you must "read it back" to the physician to verify, then document it immediately.</li>
<li class="wmfy-item">LPN: if you receive a verbal order, the RN must review and co-sign it.</li>
<li class="wmfy-item">If a physician sends a stamped signature — it is not valid. Contact the office immediately to get a real signature.</li>
<li class="wmfy-item">Electronic signatures from the physician ARE acceptable. Stamped signatures are NOT.</li>
<li class="wmfy-item">Physician orders must be signed within 30 days. Orders not returned in 30 days must be followed up and documented.</li>
<li class="wmfy-item">Vitalis does NOT participate in physician delegation.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To ensure that every Vitalis client's care is directed by a physician — with all orders documented, properly signed, and filed in the clinical record within required timeframes.</p></div></section>
<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>The physician establishes and reviews a plan of care for each client. The plan is updated as the client's condition changes and is maintained as part of the clinical record in AxisCare. All services and medications must be ordered by the physician. Vitalis does not participate in physician delegation.</p></div></section>
<section class="policy-section" id="poc-contents"><h2 class="section-heading">Plan of Care — Required Contents</h2>
<div class="body-text"><p>The physician's plan of care must include at minimum: diagnosis; prognosis; goals to be accomplished; an order for each service, item, drug, and equipment to be provided by the agency. All orders must be specific to the individual client's condition and needs.</p></div></section>
<section class="policy-section" id="verbal-orders"><h2 class="section-heading">Verbal Orders</h2>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body">Verbal orders may be received by the RN or LPN. Orders received by the LPN must be reviewed and co-signed by the RN.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body">Before acting on any verbal order or verbal report of a critical test result, staff must use the <strong>READ-BACK process</strong>: (a) record the order/report; (b) read it back to the physician to confirm accuracy; (c) document that the read-back was completed.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body">Verbal orders must be signed by the physician within 30 days.</div></li>
</ol>
</section>
<section class="policy-section" id="written-orders"><h2 class="section-heading">Written Orders — Signatures &amp; Filing</h2>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body">Electronic physician signatures ARE acceptable. Stamped signatures are NOT acceptable. If a document arrives with an apparent stamp signature: (1) call the physician's office to confirm; (2) inform the office that stamp signatures are not permitted under CMS regulations; (3) fax or mail the document back for a live or electronic signature.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body">Faxed orders are acceptable provided the original signed order can be obtained for verification. Maintain confidentiality of faxed orders via a fax cover sheet. Obtain a fax verification report.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body">If a fax is determined to be misdirected, contact the recipient immediately and request that the misdirected fax be shredded.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body">File signed physician orders in AxisCare within <strong>48 hours</strong> of receipt.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body">Copies of the plan of care and all orders requiring physician signature must be filed in the client record within <strong>60 days</strong> of receipt.</div></li>
<li class="step"><span class="step-num">6</span><div class="step-body">If a signed order is not received within <strong>30 days</strong> of being sent to the physician, contact the physician's office to obtain the signed document or resend it. Document all follow-up contacts in AxisCare.</div></li>
<li class="step"><span class="step-num">7</span><div class="step-body">Unclear or illegible orders must be clarified with the prescribing physician before any action is taken.</div></li>
</ol>
</section>
<section class="policy-section" id="poc-review"><h2 class="section-heading">Plan of Care Review</h2>
<div class="body-text"><p>The physician and appropriate clinical staff review and recertify the written plan of care at least once per episode and whenever the patient's condition warrants. The agency provides written and oral reports to the physician regarding the client's condition at least every 60 days, or more frequently if there is an emergency, a need to alter the plan of care, or a need to terminate services.</p></div>
<div class="callout callout-warning"><div class="callout-label">⚠ Vitalis Does Not Participate in Physician Delegation</div><div class="callout-body">Vitalis Healthcare Services, LLC does not participate in physician delegation. If a physician delegation arrangement is proposed for any client, refer immediately to the DON and Administrator.</div></div>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.12" target="_blank">COMAR 10.07.05.12</a> — Plan of care. Requires a physician-authorized plan of care for all services, with specific content requirements and physician review obligations.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">CMS Conditions of Participation — 42 CFR § 484.60</span> — Care planning. Establishes standards for physician-authorized plans of care in home health settings.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Merged legacy 4.004.1–4.004.4 into single document. Added plain-language summary and read-back procedure. Supersedes legacy 4.004.1, 4.004.2, 4.004.3, 4.004.4.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original documents prepared and approved February–March 2023. OHCQ license submission versions.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D4-003"><div class="related-card-id">VHS-D4-003</div><div class="related-card-title">Clinical Records — Content, Timeliness & Accuracy</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-005"><div class="related-card-id">VHS-D4-005</div><div class="related-card-title">RN Delegation</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-016"><div class="related-card-id">VHS-D4-016</div><div class="related-card-title">Comprehensive Assessment & Clinical Supervision</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-005', 'D4', 1, 'RN Delegation', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['Professional Staff', 'All Clinical Staff'],
  ARRAY['10.07.05.12'],
  ARRAY['RN delegation', 'CNA', 'scope', 'competency', 'supervision', 'medication administration'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-005</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-005 · v2.0</span>
      </div>
      <h1 class="doc-title">RN Delegation</h1>
      <div class="doc-id-line">VHS-D4-005 · Applies to: Professional Staff · All Clinical Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.12</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">An RN may delegate certain tasks to non-licensed staff (CNAs, PAS aides). But the RN remains responsible for any task they delegate.</li>
<li class="wmfy-item">Non-licensed staff must be assessed as competent before being assigned a delegated task.</li>
<li class="wmfy-item">You cannot perform a delegated task if the client's condition has changed in a way that might make the task unsafe — call the RN first.</li>
<li class="wmfy-item">When in doubt about whether a task is within your scope, stop and call the RN. Never guess.</li>
<li class="wmfy-item">Delegation decisions are client-specific. Just because a task is delegated for one client does not mean it is delegated for all your clients.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To define which tasks a Registered Nurse may safely delegate to non-licensed personnel, and to establish the standards of supervision the RN must maintain over delegated tasks.</p></div></section>
<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>The Registered Nurse may delegate tasks to non-licensed personnel (CNAs, PAS aides) when those staff members are competent and work under the RN's supervision. Delegation decisions are made on a client-specific basis, taking into account the individual client's condition and needs. The supervising RN remains responsible for all care that they delegate.</p></div></section>
<section class="policy-section" id="delegable-tasks"><h2 class="section-heading">Tasks That May Be Delegated to Non-Licensed Staff</h2>
<ul class="bullet-list"><li>Non-invasive and non-sterile treatments</li><li>Collection and documentation of vital signs, height, weight, intake/output, environmental observations, and client behaviors</li><li>Ambulation, positioning, and turning</li><li>Transportation assistance</li><li>Personal hygiene and elimination care (irrigations, enemas)</li><li>Feeding and meal assistance</li><li>Socialization and companionship activities</li><li>Activities of daily living (ADLs)</li><li>Reinforcement of health teaching that has been planned and initiated by the RN</li></ul>
<div class="callout callout-warning"><div class="callout-label">⚠ CNAs May Not Administer Medications</div><div class="callout-body">Medication administration is a nursing function and cannot be delegated to non-licensed personnel. CNAs may REMIND clients to take their medications, but they may not prepare, pour, draw up, or administer any medication. See <a href="/pp/VHS-D4-009">VHS-D4-009 · Medication Reminding</a> for the full scope of permitted CNA medication activities.</div></div>
</section>
<section class="policy-section" id="rn-responsibilities"><h2 class="section-heading">RN Responsibilities After Delegation</h2>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">RN</span> Verify competency of the non-licensed staff member before delegating any task. Document the competency verification.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">RN</span> Provide written instructions for delegated tasks in the client's plan of care in AxisCare. Instructions must be specific, clear, and client-individualized.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">RN</span> Conduct supervisory visits per the schedule established in <a href="/pp/VHS-D4-016">VHS-D4-016 · Comprehensive Assessment &amp; Clinical Supervision</a>. Supervise the aide performing delegated tasks in the home at required frequencies.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">RN</span> Reassess the appropriateness of any delegation if the client's condition changes significantly. Revoke or modify delegation as needed.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">Non-Licensed Staff</span> If the client's condition has changed in a way that might make a delegated task unsafe — stop. Call the RN before proceeding.</div></li>
</ol>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Maryland Nurse Practice Act — Health Occupations Article § 8-6A</span> — Governs the scope of RN delegation to non-licensed personnel in home care settings. Establishes the RN's ongoing responsibility for delegated tasks.</div></div></div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.12" target="_blank">COMAR 10.07.05.12</a> — Plan of care. Requires that the RN develop written instructions for all delegated tasks and maintain supervision of non-licensed personnel.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary, CNA medication administration prohibition callout. Supersedes legacy 4.004.5.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 4.004.5). OHCQ license submission version.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D4-009"><div class="related-card-id">VHS-D4-009</div><div class="related-card-title">Medication Reminding</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-016"><div class="related-card-id">VHS-D4-016</div><div class="related-card-title">Comprehensive Assessment & Clinical Supervision</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-004"><div class="related-card-id">VHS-D4-004</div><div class="related-card-title">Physician Orders & Plan of Care</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-006', 'D4', 1, 'Clinical Record Review', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['Professional Staff', 'DON'],
  ARRAY['10.07.05.11'],
  ARRAY['record review', 'utilization review', 'quarterly', 'PAC', 'Marie Epah', 'audit'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-006</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-006 · v2.0</span>
      </div>
      <h1 class="doc-title">Clinical Record Review</h1>
      <div class="doc-id-line">VHS-D4-006 · Applies to: Professional Staff · DON</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.11</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Every quarter, Vitalis reviews a sample of client records to check that care is being provided correctly and documented completely.</li>
<li class="wmfy-item">The review is done by a committee that includes representatives from each discipline providing services that quarter.</li>
<li class="wmfy-item">If you are asked to participate in a record review, treat it as a learning opportunity, not a disciplinary process.</li>
<li class="wmfy-item">Problems found in the review go to the DON, who takes corrective action and follows up.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To verify that established policies are followed in providing services, that clinical records are completed accurately and on time, and that care meets appropriate standards — through a systematic quarterly review of a random sample of active and closed client records.</p></div></section>
<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>A sample of clinical records will be reviewed at least quarterly by health professionals representing the scope of Vitalis services during the period under review. The Utilization Review Committee conducts the review using the Clinical Record Review Form. Findings are reported to the DON, and summary findings are presented at Professional Advisory Committee (PAC) meetings.</p></div></section>
<section class="policy-section" id="committee"><h2 class="section-heading">Review Committee</h2>
<div class="body-text"><p>The Utilization Review Committee must include representatives from each discipline providing services during the quarter under review. Where possible, staff should not review their own records. The DON (<strong>Marie Epah</strong>) chairs the committee and is responsible for corrective action on all findings.</p></div></section>
<section class="policy-section" id="sample"><h2 class="section-heading">Sample Requirements</h2>
<table class="data-table"><thead><tr><th>Record Type</th><th>Minimum Sample</th></tr></thead><tbody>
<tr><td>Active records</td><td>Minimum 10% of active patient records based on quarterly census, with an overall minimum of 5 open records.</td></tr>
<tr><td>Closed records</td><td>Minimum 10% of closed records based on quarterly census, with an overall minimum of 5 closed records.</td></tr>
<tr><td>Overall minimum</td><td>20 records reviewed per quarter.</td></tr>
<tr><td>Discipline coverage</td><td>The sample must include records from each discipline providing services that quarter.</td></tr>
</tbody></table></section>
<section class="policy-section" id="criteria"><h2 class="section-heading">Review Criteria</h2>
<div class="body-text"><p>Each record is reviewed using the Clinical Record Review Form. Criteria include:</p></div>
<ul class="bullet-list"><li>Appropriateness of the level of care provided to protect client health and safety</li><li>Timeliness of the provision of care</li><li>Adequacy of care to meet the client's needs</li><li>Appropriateness of the specific services provided</li><li>Compliance with standards of practice for patient care</li><li>Accessibility to care</li><li>Continuity of care</li><li>Privacy and confidentiality of care</li><li>Safety of the care environment</li><li>Participation in care by the client and family</li></ul>
</section>
<section class="policy-section" id="procedure"><h2 class="section-heading">Procedure</h2>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">DON</span> Determine composition of the Utilization Review Committee for the quarter.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">DON</span> Determine the random sample to be reviewed — meeting the percentage and minimum count requirements.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Committee</span> Review each record using the Clinical Record Review Form. Document findings on the Quarterly Audit Summary.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">DON</span> Review the Quarterly Audit Summary. Identify problems and opportunities for improvement. Take corrective action where indicated and write a follow-up report of actions and results.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">DON</span> Present the summary of findings at the next Professional Advisory Committee (PAC) meeting.</div></li>
<li class="step"><span class="step-num">6</span><div class="step-body"><span class="role-tag">DON</span> Retain records of the quarterly review summary, problems identified, actions taken, and follow-up results in the agency quality file.</div></li>
</ol>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.11" target="_blank">COMAR 10.07.05.11</a> — Clinical records. Requires RSAs to conduct periodic record reviews to verify compliance with documentation standards and care quality.</div></div></div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.08" target="_blank">COMAR 10.07.05.08(D)</a> — PAC responsibilities. Requires summary of clinical record review findings to be reported to the PAC.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Named DON (Marie Epah) as committee chair. Added plain-language summary. Supersedes legacy 4.005.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 4.005.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D4-003"><div class="related-card-id">VHS-D4-003</div><div class="related-card-title">Clinical Records — Content, Timeliness & Accuracy</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-001"><div class="related-card-id">VHS-D4-001</div><div class="related-card-title">Security of Clinical Information</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-002"><div class="related-card-id">VHS-D4-002</div><div class="related-card-title">Retention of Clinical Records</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-007', 'D4', 1, 'Approved Abbreviations', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.11'],
  ARRAY['abbreviations', 'Do Not Use', 'ISMP', 'documentation', 'medication errors'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-007</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-007 · v2.0</span>
      </div>
      <h1 class="doc-title">Approved Abbreviations</h1>
      <div class="doc-id-line">VHS-D4-007 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.11</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Only use abbreviations in client records that are on the Vitalis approved abbreviations list.</li>
<li class="wmfy-item">There is also a "Do Not Use" list — these abbreviations are banned because they cause medication errors and misunderstandings.</li>
<li class="wmfy-item">If you are not sure whether an abbreviation is approved, write the full word instead. When in doubt, spell it out.</li>
<li class="wmfy-item">Both lists are posted in the office and available on the Vitalis Portal.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To ensure consistent, safe, and unambiguous terminology in all clinical records — reducing the risk of miscommunication and documentation errors among the healthcare team.</p></div></section>
<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>All staff who document in the clinical record must use only approved abbreviations. The use of unapproved or "Do Not Use" abbreviations in clinical records is not permitted.</p></div></section>
<section class="policy-section" id="procedure"><h2 class="section-heading">Procedure</h2>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body">A copy of the Vitalis Approved Medical Abbreviations list is available to all staff in the office reference area and on the Vitalis Portal.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body">A copy of the "Do Not Use Abbreviations" list is available to all staff in the office reference area and on the Vitalis Portal. These abbreviations are prohibited because they have historically caused medication errors.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body">When in doubt about whether an abbreviation is approved, write the complete word or phrase instead. The goal is clarity — always choose clarity over brevity.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body">Staff are educated on the approved abbreviation list during orientation and reminded of the list at least annually during in-service training.</div></li>
</ol>
<div class="callout callout-warning"><div class="callout-label">⚠ Why This Matters</div><div class="callout-body">Abbreviation errors are a leading cause of medication mistakes in home care. An RN writing "QD" when they mean "every day" may be read as "QID" (four times a day) by another provider — a four-fold dosing error. The "Do Not Use" list exists because of real patient harm. Follow it exactly.</div></div>
</section>
<section class="policy-section" id="references"><h2 class="section-heading">Reference Documents</h2>
<table class="data-table"><thead><tr><th>Document</th><th>Location</th></tr></thead><tbody>
<tr><td>Approved Medical Abbreviations List</td><td>Posted in office reference area and Vitalis Portal — updated annually by the DON.</td></tr>
<tr><td>Do Not Use Abbreviations List</td><td>Posted in office reference area and Vitalis Portal — based on ISMP and TJC standards for prohibited abbreviations.</td></tr>
</tbody></table></section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.11" target="_blank">COMAR 10.07.05.11</a> — Client records. Requires RSAs to maintain records using standardized, professional terminology.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">ISMP — Institute for Safe Medication Practices</span> — Maintains the national list of error-prone abbreviations, symbols, and dose designations. Vitalis's "Do Not Use" list is based on ISMP guidance.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary and patient safety callout explaining clinical rationale. Supersedes legacy 4.006.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 4.006.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D4-003"><div class="related-card-id">VHS-D4-003</div><div class="related-card-title">Clinical Records — Content, Timeliness & Accuracy</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-010"><div class="related-card-id">VHS-D4-010</div><div class="related-card-title">Medication Management — Profile, MAR & Orders</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-012"><div class="related-card-id">VHS-D4-012</div><div class="related-card-title">Adverse Drug Reactions</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-008', 'D4', 1, 'Transporting Clients', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.10'],
  ARRAY['transport', 'automobile waiver', '911', 'emergency transport', 'driver license'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-008</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-008 · v2.0</span>
      </div>
      <h1 class="doc-title">Transporting Clients</h1>
      <div class="doc-id-line">VHS-D4-008 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">You may be asked to transport a client in your own vehicle or the client's vehicle. Certain paperwork must be on file first — do not transport without it.</li>
<li class="wmfy-item">If you use the client's car: the "Client Automobile Use Waiver" must be completed and on file.</li>
<li class="wmfy-item">If you use your own car: the "Employee Automobile Waiver" must be on file, along with a current copy of your driver's license and car insurance.</li>
<li class="wmfy-item">Never transport a client in an emergency — call 911. Emergency transport is for EMS only.</li>
<li class="wmfy-item">You may help arrange non-emergency transportation through local services or family, but you don't have to do it yourself.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To establish the standards under which Vitalis staff may transport clients — ensuring appropriate waivers are in place, emergencies are handled correctly, and clients are transported safely and legally.</p></div></section>
<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Vitalis staff, employees, contractors, or other personnel may be required to transport clients of the agency in a motor vehicle — including vehicles owned or operated by the agency, the client, or the staff member — while in the course of their employment.</p></div></section>
<section class="policy-section" id="procedure"><h2 class="section-heading">Procedure</h2>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> Before any staff member transports a client using their own vehicle, place on file: (a) a completed Employee Automobile Waiver; (b) a current, non-expired copy of the employee's driver's license; and (c) a current copy of the employee's car insurance. These documents must be renewed whenever licenses or insurance expire.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Care Coordinator / DON</span> Before any staff member transports a client using the client's vehicle, a completed Client Automobile Use Waiver must be on file for that client.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Any Staff — Non-Emergency Situations</span> For non-emergency transportation needs, staff may: (a) transport the client personally if the required waivers are on file; or (b) help arrange transportation through local transportation services or the client's family/caregivers.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Any Staff — Emergency Situations</span> If a client needs immediate emergency transportation to a medical facility, follow the emergency procedures policy and call 911 immediately. Do not attempt to personally transport a client in an emergency.</div></li>
</ol>
<div class="callout callout-warning"><div class="callout-label">⚠ Emergency Transport = 911</div><div class="callout-body">Never transport a client to the emergency room in your personal vehicle during a medical emergency. Call 911 and wait for EMS. If you transport an emergency patient in your car you may delay life-saving care, create personal liability, and violate agency policy. Follow the Emergency Preparedness procedure (VHS-D7 series) while waiting for EMS to arrive.</div></div>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10</a> — Personnel standards. Requires RSAs to maintain documentation for all employee activities involving client interaction, including transportation.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary, explicit emergency transport prohibition, waiver documentation checklist. Supersedes legacy 4.007.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 4.007.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D2-003"><div class="related-card-id">VHS-D2-003</div><div class="related-card-title">Classification of Personnel & Hiring Standards</div><div class="related-card-domain">D2 · Human Resources &amp; Workforce</div></a>
<a class="related-card" href="/pp/VHS-D2-005"><div class="related-card-id">VHS-D2-005</div><div class="related-card-title">Compensation & Benefits</div><div class="related-card-domain">D2 · Human Resources &amp; Workforce</div></a>
<a class="related-card" href="/pp/VHS-D4-016"><div class="related-card-id">VHS-D4-016</div><div class="related-card-title">Comprehensive Assessment & Clinical Supervision</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-009', 'D4', 1, 'Medication Reminding', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff', 'CNA'],
  ARRAY['10.07.05.12'],
  ARRAY['medication reminding', 'CNA', 'pill organizer', 'medication minder', 'respiratory care', 'scope'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-009</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-009 · v2.0</span>
      </div>
      <h1 class="doc-title">Medication Reminding</h1>
      <div class="doc-id-line">VHS-D4-009 · Applies to: All Staff · CNA</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.12</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">CNAs may remind clients to take their medications — but ONLY if the medications have already been pre-sorted into a labeled medication minder (pill organizer).</li>
<li class="wmfy-item">You cannot pour, prepare, or handle loose prescription bottles. You may only hand the pre-sorted medication minder to the client.</li>
<li class="wmfy-item">If the client cannot open the medication minder container themselves, you may open it for them.</li>
<li class="wmfy-item">If you notice anything unusual — wrong number of pills, wrong time, client missed a dose — report it to your supervisor immediately.</li>
<li class="wmfy-item">A signed client consent for medication reminding by a non-licensed person must be on file before you do this.</li>
<li class="wmfy-item">CNAs do NOT provide any respiratory care. This includes adjusting oxygen, suctioning, or managing oxygen tanks.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To define the safe and permitted scope of medication reminding by Certified Nursing Assistants and other non-licensed staff — protecting clients from medication errors while ensuring CNAs understand exactly where their role ends.</p></div></section>
<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>A certified nursing assistant may assist a client with medication reminding ONLY when all of the following conditions are met: (1) the medications have been pre-selected by the client, a family member, a nurse, or a pharmacist; and (2) the medications are stored in a medication minder container (not the original prescription bottle); and (3) the medication minder is clearly marked by day and time of dosage; and (4) a signed client consent for non-licensed medication reminding is on file.</p></div></section>
<section class="policy-section" id="what-included"><h2 class="section-heading">What Medication Reminding Includes</h2>
<ul class="bullet-list"><li>Asking the client whether their medications were taken</li><li>Verbally prompting the client to take their medications</li><li>Handing the appropriately marked medication minder container to the client</li><li>Opening the appropriately marked medication minder container for the client if the client is physically unable to open it</li></ul>
<div class="callout callout-warning"><div class="callout-label">⚠ What Medication Reminding Does Not Include</div><div class="callout-body">CNAs may NOT pour, draw up, prepare, or administer any medication from any container — including over-the-counter medications. CNAs may NOT handle original prescription bottles except to read the label. Medication ADMINISTRATION (giving a medication to a patient) is a nursing function — it requires a licensed nurse and a physician order. If a client asks you to give them medication from a prescription bottle, call your supervisor.</div></div>
</section>
<section class="policy-section" id="reporting"><h2 class="section-heading">Reporting Irregularities</h2>
<div class="body-text"><p>The CNA must immediately report to their supervisor and to the client or client's advocate any irregularities noted in the pre-selected medications, including but not limited to: medications taken too often or not often enough; medications not taken at the correct time as identified in written instructions; incorrect number of pills in the minder; or any other concern about the medications.</p></div></section>
<section class="policy-section" id="respiratory"><h2 class="section-heading">Respiratory Care — CNAs May Not Provide</h2>
<div class="body-text"><p>Respiratory care is a skilled nursing function. CNAs may not provide: postural drainage; cupping; adjusting oxygen flow within established parameters; nasal, endotracheal, or tracheal suctioning; or turning off or changing oxygen tanks.</p>
<p><strong>Exception:</strong> CNAs MAY temporarily remove and replace a cannula or face mask for the purpose of shaving or washing the client's face, and MAY provide oral suctioning.</p></div></section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.12" target="_blank">COMAR 10.07.05.12</a> — Plan of care. Defines the scope of permitted activities for non-licensed staff and requires signed client consent for medication reminding by non-licensed personnel.</div></div></div>
<div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Maryland Nurse Practice Act — Health Occupations Article § 8-6A</span> — Defines medication administration as a nursing function that may not be delegated to non-licensed personnel.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added explicit plain-language summary, clear scope limitations callout, respiratory care exclusion. Supersedes legacy 4.008.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 4.008.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D4-005"><div class="related-card-id">VHS-D4-005</div><div class="related-card-title">RN Delegation</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-010"><div class="related-card-id">VHS-D4-010</div><div class="related-card-title">Medication Management — Profile, MAR & Orders</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-012"><div class="related-card-id">VHS-D4-012</div><div class="related-card-title">Adverse Drug Reactions</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-010', 'D4', 1, 'Medication Management — Profile, MAR & Orders', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['Professional Staff'],
  ARRAY['10.07.05.12'],
  ARRAY['medication profile', 'MAR', 'five rights', 'drug interaction', 'high-alert', 'medication error', '60 days'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-010</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-010 · v2.0</span>
      </div>
      <h1 class="doc-title">Medication Management — Profile, MAR & Orders</h1>
      <div class="doc-id-line">VHS-D4-010 · Applies to: Professional Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.12</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Only licensed nurses (RN or LPN) and certified medication aides may administer medications. CNAs may not administer medications.</li>
<li class="wmfy-item">Before giving any medication, confirm the Five Rights: Right Patient, Right Medication, Right Dosage, Right Route, Right Time.</li>
<li class="wmfy-item">Every medication must have a current physician order. If the order is unclear or incomplete, call the physician before administering.</li>
<li class="wmfy-item">Check every new medication against the client's full medication list for dangerous interactions. If you find a moderate-to-severe drug interaction, call the physician before giving the medication.</li>
<li class="wmfy-item">Vitalis does NOT administer IV chemotherapy or first-dose medications.</li>
<li class="wmfy-item">Update the medication profile at least every 60 days — or whenever there is a change to any medication.</li>
<li class="wmfy-item">Document medication administration on the MAR the same day it is given.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To establish standards for medication profile maintenance, Medication Administration Record (MAR) documentation, and medication order management — ensuring safe, accurate, and physician-ordered medication administration for all Vitalis clients who receive medications from agency staff.</p></div></section>
<section class="policy-section" id="who-may"><h2 class="section-heading">Who May Administer Medications</h2>
<div class="body-text"><p>Only the following individuals may administer medications to Vitalis clients: Registered Nurses (RN); Licensed Practical Nurses (LPN); and certified medication aides/technicians with current certification. CNAs may NOT administer medications — see <a href="/pp/VHS-D4-009">VHS-D4-009 · Medication Reminding</a>.</p>
<p>This agency will administer all physician-prescribed drugs via the prescribed route consistent with the Maryland Nurse Practice Act — <strong>except for IV chemotherapy medications and first-dose medications</strong>. These are excluded categorically.</p></div></section>
<section class="policy-section" id="five-rights"><h2 class="section-heading">The Five Rights — Required Before Every Administration</h2>
<table class="data-table"><thead><tr><th>Right</th><th>What to Check</th></tr></thead><tbody>
<tr><td>1. Right Patient</td><td>Verify the client's identity before administering any medication.</td></tr>
<tr><td>2. Right Medication</td><td>Confirm the medication matches the physician order and the MAR.</td></tr>
<tr><td>3. Right Dosage</td><td>Confirm the dose matches the order. Visually inspect for particulates, discoloration, or expiration.</td></tr>
<tr><td>4. Right Route</td><td>Confirm the route (oral, topical, etc.) matches the order.</td></tr>
<tr><td>5. Right Time / Frequency</td><td>Confirm the time and frequency match the order. Check when the last dose was given.</td></tr>
</tbody></table></section>
<section class="policy-section" id="med-profile"><h2 class="section-heading">Medication Profile</h2>
<div class="body-text"><p>The admitting RN creates a medication profile for each client at admission. The profile is maintained in AxisCare and must include all current medications (name, dose, route, frequency, drug classification), dates prescribed and discontinued, drug and food allergies, height and weight, pregnancy and lactation status, lab results, and high-alert and emergency medication flags.</p>
<p>The medication profile is updated: (1) at minimum every 60 days; (2) immediately upon any change in medication; and (3) when the client is discharged or transferred.</p>
<p>All new medications are checked for drug-drug interaction risks by the RN. Drug-drug reactions listed as potentially moderate or severe must be reported to the prescribing physician BEFORE administration.</p></div>
<div class="callout callout-warning"><div class="callout-label">⚠ High-Alert Medications</div><div class="callout-body">High-alert medications are drugs that cause significantly greater harm when used in error. Although errors may not be more common, the consequences are more serious. High-alert medications must be specifically identified and flagged on both the medication profile and the MAR. All nurses handling high-alert medications must use extra verification steps before administration.</div></div>
</section>
<section class="policy-section" id="mar"><h2 class="section-heading">Medication Administration Record (MAR)</h2>
<div class="body-text"><p>A MAR is maintained for each client who receives medication administered directly by a licensed nurse or certified medication aide. The MAR must include patient identification, diet, each medication with dose/route/frequency, start and stop dates, adverse effects, medication refusal with stated reason, high-alert and emergency medication notations, physician contact information, and relevant vital signs and lab results.</p>
<p>Medication must be properly labeled. Before administration, discuss any unresolved concerns with the physician or prescriber. <strong>Document all medication administration on the MAR the same day it is given.</strong></p></div></section>
<section class="policy-section" id="errors"><h2 class="section-heading">Medication Errors</h2>
<div class="body-text"><p>A medication error has occurred any time one of the Five Rights is violated during administration. All medication errors must be reported immediately to the nursing supervisor and the physician. A Medication Error Report must be completed. Document the error and the report on the day it occurs.</p></div></section>
<section class="policy-section" id="order-completeness"><h2 class="section-heading">Medication Orders — Completeness Requirements</h2>
<div class="body-text"><p>Every medication order must be complete. A complete medication order includes: patient name; medication name; dosage; route; frequency; duration (if applicable); order type (routine, PRN, titrating, taper, range, or stop date). Prescriptions must be legible. Blanket resume orders following a medication hold are prohibited. Investigational medications are not administered by this agency. Unclear orders must be clarified with the prescribing physician before administration.</p></div></section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.12" target="_blank">COMAR 10.07.05.12</a> — Plan of care. Establishes requirements for medication management, physician-ordered medications, and documentation of all medications administered.</div></div></div>
<div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Maryland Nurse Practice Act</span> — Establishes who may administer medications and the scope of RN/LPN medication responsibilities.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">ISMP — High-Alert Medications List</span> — National reference for medications requiring extra safety precautions due to risk of harm when used in error.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Merged legacy 4.009.1 (Medication Profile), 4.009.2 (MAR), and 4.009.5 (Medication/Prescription Orders) into single document. Added Five Rights table, 60-day update requirement, plain-language summary. Supersedes legacy 4.009.1, 4.009.2, 4.009.5.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original documents prepared and approved February–March 2023. OHCQ license submission versions.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D4-009"><div class="related-card-id">VHS-D4-009</div><div class="related-card-title">Medication Reminding</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-011"><div class="related-card-id">VHS-D4-011</div><div class="related-card-title">Medication Storage & Emergency Medications</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-012"><div class="related-card-id">VHS-D4-012</div><div class="related-card-title">Adverse Drug Reactions</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-013"><div class="related-card-id">VHS-D4-013</div><div class="related-card-title">Confused Medications & Vaccine Storage</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-011', 'D4', 1, 'Medication Storage & Emergency Medications', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['Professional Staff'],
  ARRAY['10.07.05.12'],
  ARRAY['medication storage', 'refrigerator', 'temperature', 'cold chain', 'emergency medications', 'transport', 'gel packs'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-011</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-011 · v2.0</span>
      </div>
      <h1 class="doc-title">Medication Storage & Emergency Medications</h1>
      <div class="doc-id-line">VHS-D4-011 · Applies to: Professional Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.12</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">All agency medications are kept in a locked refrigerator or freezer. Only the Administrator and DON have access.</li>
<li class="wmfy-item">Refrigerator temperature must stay between 35°F and 46°F. Freezer must stay at 5°F or below. Temperature is logged daily.</li>
<li class="wmfy-item">Never store food or drinks in the medication refrigerator.</li>
<li class="wmfy-item">When transporting medications, always use a conditioned cold pack — never dry ice. Follow the full packing procedure.</li>
<li class="wmfy-item">Emergency medications must be clearly identified on the medication profile and kept readily accessible in the patient's home.</li>
<li class="wmfy-item">Vitalis does not leave excess medications with the client — only a maximum 2-week supply is kept.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To ensure that all medications held by Vitalis Healthcare Services, LLC are stored safely, within required temperature ranges, and transported correctly — protecting medication efficacy and patient safety.</p></div></section>
<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Medications must be stored properly from the time they are received until they are administered. All medications must have a physician order before administration. Vitalis does not leave excess medications with the client — agency supply is limited to an amount sufficient to support the patient population for no longer than <strong>2 weeks</strong>. Manufacturer directions for storage and transport always take precedence.</p></div></section>
<section class="policy-section" id="refrigerator"><h2 class="section-heading">Refrigerator Requirements</h2>
<ul class="bullet-list"><li>Maintain medication storage temperatures between 35°F and 46°F year-round (target: 40°F).</li><li>Be automatic defrost (frost-free). Manual defrost refrigerators with visible cooling coils are not acceptable.</li><li>Store medications at least 2–3 inches away from walls, floor, and other boxes, and away from cold air vents.</li><li>Have a working certified thermometer placed centrally in the unit (NIST-certified).</li><li>Have doors that seal tightly.</li><li>Be used only for medication storage — no food, drinks, or non-medication items.</li><li>Be locked. Only the Administrator and DON have access.</li></ul>
</section>
<section class="policy-section" id="freezer"><h2 class="section-heading">Freezer Requirements</h2>
<ul class="bullet-list"><li>Maintain required medication storage temperatures at 5°F or below year-round.</li><li>Have an automatic defroster (manual is acceptable only if the office has an alternate storage location during defrost).</li><li>Maintain sufficient frozen cold packs.</li><li>Have a working NIST-certified thermometer placed centrally in the unit.</li></ul>
</section>
<section class="policy-section" id="storage-procedure"><h2 class="section-heading">Storage Procedure</h2>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body">Store medications in breathable plastic mesh baskets. Label baskets clearly by patient name.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body">Keep medications with shorter expiration dates at the front of the shelf.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body">Store medications in the middle of the refrigerator or freezer — never in the doors.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body">Store medications in their original packaging in clearly labeled uncovered containers with slotted sides to allow air circulation.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body">Maintain a medication inventory log documenting: medication name and doses received; date received; condition on receipt; manufacturer and lot number; and expiration date.</div></li>
<li class="step"><span class="step-num">6</span><div class="step-body">Post a sign on the refrigerator and freezer doors indicating which medications are stored where.</div></li>
</ol>
</section>
<section class="policy-section" id="transport"><h2 class="section-heading">Transportation Procedure</h2>
<div class="body-text"><p>The packing procedure below maintains medication temperatures within recommended ranges for up to <strong>12 hours</strong> during transport. Follow this procedure exactly.</p></div>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body">Assemble supplies: a hard plastic cooler (labeled "Medications: Do Not Freeze"); conditioned gel packs; a NIST-certified thermometer placed in the refrigerator at least 2 hours before packing; two 2-inch layers of bubble wrap. Do not use dry ice.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body">Condition frozen gel packs: leave at room temperature 1–2 hours until edges have defrosted and packs appear to be "sweating." Un-conditioned cold packs can freeze medications.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body">Packing sequence: (a) Spread conditioned cold packs to cover only half of the cooler bottom. (b) Lay 2 inches of bubble wrap on top. (c) Stack medication boxes on the bubble wrap — do not let boxes touch cold packs. (d) Cover medications with another 2-inch layer of bubble wrap. (e) Spread conditioned cold packs to cover only half of the bubble wrap. (f) Fill cooler to top with bubble wrap. Place thermometer display and Return/Transfer of Medications form on top.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body">On arrival at destination: check the temperature. If between 35°F and 46°F, refrigerate immediately. If outside this range, contact the DON immediately and do not administer the medication until cleared.</div></li>
</ol>
</section>
<section class="policy-section" id="emergency-meds"><h2 class="section-heading">Emergency Medications</h2>
<div class="body-text"><p>Emergency medications are identified by the nursing staff and noted on the medication profile and MAR. Emergency medications must be kept readily accessible in the patient's home in sufficient quantity for an emergency. Common emergency medications include: Humulin R (insulin), Epinephrine, Nitroglycerin, and Glucagon Injectable. This is not an exhaustive list — the RN identifies emergency medications on a client-specific basis.</p></div></section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.12" target="_blank">COMAR 10.07.05.12</a> — Plan of care. Requires all medications to be administered per physician orders and stored in a manner that preserves their efficacy and safety.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">CDC Vaccine Storage and Handling Toolkit</span> — Reference standard for temperature-controlled medication storage and transport.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Merged legacy 4.009.3 (Medication Storage) and 4.009.4 (Emergency Medication) into single document. Added plain-language summary, numbered transport procedure. Supersedes legacy 4.009.3 and 4.009.4.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original documents prepared and approved February–March 2023. OHCQ license submission versions.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D4-010"><div class="related-card-id">VHS-D4-010</div><div class="related-card-title">Medication Management — Profile, MAR & Orders</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-013"><div class="related-card-id">VHS-D4-013</div><div class="related-card-title">Confused Medications & Vaccine Storage</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-012"><div class="related-card-id">VHS-D4-012</div><div class="related-card-title">Adverse Drug Reactions</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-012', 'D4', 1, 'Adverse Drug Reactions (ADR)', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['Professional Staff'],
  ARRAY['10.07.05.12'],
  ARRAY['adverse drug reaction', 'ADR', 'drug interaction', 'QAPI', 'anaphylaxis', 'FDA MedWatch'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-012</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-012 · v2.0</span>
      </div>
      <h1 class="doc-title">Adverse Drug Reactions (ADR)</h1>
      <div class="doc-id-line">VHS-D4-012 · Applies to: Professional Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.12</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">An adverse drug reaction (ADR) is any harmful or unexpected response to a medication — even at a normal dose.</li>
<li class="wmfy-item">If you see or suspect an ADR, call the RN on call immediately. Do not wait.</li>
<li class="wmfy-item">The RN will call the physician and DON and complete an ADR Report.</li>
<li class="wmfy-item">Moderate-to-severe drug interactions must be reported to the physician BEFORE the medication is given — not after.</li>
<li class="wmfy-item">Educate clients about their medications, including what to watch for. Document that you did.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To prevent avoidable adverse drug reactions through proactive monitoring, reporting, and education — and to establish a consistent process for responding when an ADR is suspected or confirmed.</p></div></section>
<section class="policy-section" id="definition"><h2 class="section-heading">Definition</h2>
<div class="body-text"><p>An <strong>Adverse Drug Reaction (ADR)</strong> is any noxious, unintended, undesirable, or unexpected response to a drug that occurs at doses used in humans for treatment, diagnosis, or prophylaxis — excluding predictable, minor, dose-related side effects that require no change in management.</p>
<p><strong>Signs of an ADR include:</strong> anaphylaxis; arrhythmia; convulsions; hallucinations; shortness of breath; rashes or itching; hypotension; urinary retention; symptoms of neuroleptic malignant syndrome; initial report of tardive dyskinesia; EPS related to non-antipsychotic drugs; allergic (hypersensitivity) reactions; and idiosyncratic reactions.</p>
<p>A <strong>significant ADR</strong> is one that requires discontinuing the drug; requires a dosage decrease of more than 50%; necessitates hospital admission; requires supportive treatment; significantly complicates diagnosis; negatively affects prognosis; or results in temporary or permanent harm, disability, or death.</p></div></section>
<section class="policy-section" id="prevention"><h2 class="section-heading">Prevention Procedure</h2>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">RN — Before Administration</span> Check the medication profile for drug-drug interaction risks. Interactions listed as potentially moderate or severe must be reported to the prescribing physician BEFORE the medication is administered.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">RN — Client Education</span> Educate clients and families about other types of adverse interactions — including alcohol-medication interactions and food-medication interactions. Document the education on the visit note.</div></li>
</ol>
</section>
<section class="policy-section" id="response"><h2 class="section-heading">Response Procedure — If an ADR Occurs</h2>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Any Staff</span> If you witness or suspect an ADR, notify the RN or case manager immediately.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">RN</span> Contact the attending physician and DON immediately to report the suspected ADR.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">RN</span> Complete the nursing section of the Adverse Drug Reaction Report. If the ADR occurs on a weekend, document and report as soon as the occurrence is known — document the day of the occurrence.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">RN</span> Present the ADR report to the QAPI committee for review at the next scheduled meeting.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">QAPI Committee</span> Evaluate each ADR report. When appropriate, make recommendations for further evaluation by the medical director, submission of significant ADR reports to the FDA and the manufacturer, and policy or practice changes to prevent recurrence.</div></li>
</ol>
</section>
<section class="policy-section" id="documentation"><h2 class="section-heading">Documentation</h2>
<div class="body-text"><p>The clinical record must document on the day of occurrence: the ADR observed; the actions taken; the notification to the physician; and any medication changes ordered. If the occurrence is on a weekend, document as soon as it is disclosed — do not delay until the next scheduled visit.</p></div></section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.12" target="_blank">COMAR 10.07.05.12</a> — Plan of care. Requires RSAs to monitor medications for adverse effects and to document and report all adverse reactions.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">FDA MedWatch</span> — Federal program for voluntary reporting of serious adverse drug reactions to the FDA.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary, significant ADR definition, structured response procedure. Supersedes legacy 4.009.8.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 4.009.8). OHCQ license submission version.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D4-010"><div class="related-card-id">VHS-D4-010</div><div class="related-card-title">Medication Management — Profile, MAR & Orders</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-013"><div class="related-card-id">VHS-D4-013</div><div class="related-card-title">Confused Medications & Vaccine Storage</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-011"><div class="related-card-id">VHS-D4-011</div><div class="related-card-title">Medication Storage & Emergency Medications</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-013', 'D4', 1, 'Confused Medications & Vaccine Storage', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['Professional Staff'],
  ARRAY['10.07.05.12'],
  ARRAY['confused medications', 'look-alike', 'sound-alike', 'vaccine', 'cold chain', 'VFC', 'temperature'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-013</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-013 · v2.0</span>
      </div>
      <h1 class="doc-title">Confused Medications & Vaccine Storage</h1>
      <div class="doc-id-line">VHS-D4-013 · Applies to: Professional Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.12</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Some medications have names that look or sound like other medications — these are "confused medications." Always check new orders against the agency's confused drug names list.</li>
<li class="wmfy-item">If a client is on a medication from the confused drug list, verify the order with the physician before administering.</li>
<li class="wmfy-item">Vaccines have the same storage and transport rules as medications — cold chain must be maintained from manufacturer to administration.</li>
<li class="wmfy-item">If the vaccine refrigerator malfunctions: move vaccines to an ice chest for no longer than 9 hours while getting a replacement. After 9 hours, vaccines must be destroyed.</li>
<li class="wmfy-item">If temperatures go out of range during transport, label vaccines "Do Not Use" and call the VFC program immediately.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To reduce medication errors caused by look-alike/sound-alike drug names, and to ensure all vaccines are stored and transported within required temperature ranges to preserve their effectiveness and patient safety.</p></div></section>
<section class="policy-section" id="confused-meds"><h2 class="section-heading">Section A: Confused Medications</h2>
<div class="body-text"><p>Medication orders are checked against the Vitalis list of confused drug names before any medication is administered. This applies to both new orders and current medications.</p></div>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">RN</span> When a new medication is ordered, check the medication against the Confused Drug Names list available in the office and on the Vitalis Portal.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">RN</span> If the medication is on the confused drug names list, clarify the order with the ordering or attending physician as soon as possible — before administering.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">RN</span> Document the clarification conversation in AxisCare.</div></li>
</ol>
<div class="callout callout-ai"><div class="callout-label">⚠ Why Confused Medications Matter</div><div class="callout-body">Drug names like "HumaLOG" vs "HumuLIN," "hydrALAZINE" vs "hydrOXYzine," or "cetirizine" vs "sertraline" have caused serious patient harm when confused. The confused drug names list exists because these errors happen even to experienced nurses. Checking takes 30 seconds and can prevent a life-threatening event.</div></div>
</section>
<section class="policy-section" id="vaccine-storage"><h2 class="section-heading">Section B: Vaccine Storage &amp; Transportation</h2>
<div class="body-text"><p>Vaccines must be stored properly from manufacturer to administration. The maintenance of correct temperatures during transport is called the "cold chain." A broken cold chain can destroy vaccine efficacy — vaccines that have been exposed to incorrect temperatures may appear normal but provide no protection to the client.</p></div>
<section style="margin-top:16px">
<div class="body-text"><strong>Vaccine Storage Requirements — Refrigerator:</strong></div>
<ul class="bullet-list"><li>Maintain temperature 35°F–46°F year-round (target: 40°F).</li><li>Be automatic defrost (frost-free). No manual defrost refrigerators with visible cooling coils.</li><li>Store vaccines at least 2–3 inches from walls, floor, and boxes, and away from air vents.</li><li>Have a working NIST-certified thermometer placed centrally.</li><li>Be used only for vaccines and cold packs.</li><li>Be locked — access restricted to the DON and Administrator.</li><li>Record temperature daily. Correct any out-of-range temperature immediately.</li></ul>
<div class="body-text" style="margin-top:12px"><strong>Freezer Requirements:</strong></div>
<ul class="bullet-list"><li>Maintain temperature 5°F or below year-round.</li><li>Automatic defroster (manual acceptable if alternate storage available during defrost).</li><li>Working NIST-certified thermometer placed centrally.</li></ul>
</section>
<div class="body-text" style="margin-top:16px"><p><strong>Refrigerator Malfunction Protocol:</strong> In the event of a malfunction, relocate vaccines to an ice chest with cold packs immediately. Vaccines may be stored in the ice chest for no longer than <strong>9 hours</strong> while a replacement refrigerator is secured. After 9 hours, the vaccines must be destroyed. Contact the DON and Administrator immediately when a malfunction is discovered.</p></div>
</section>
<section class="policy-section" id="vaccine-transport"><h2 class="section-heading">Vaccine Transport Procedure</h2>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body">Assemble: hard plastic cooler (labeled "Vaccines: Do Not Freeze"); conditioned gel packs; NIST-certified thermometer (placed in refrigerator at least 2 hours before packing); two 2-inch layers of bubble wrap. Do NOT use dry ice.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body">Condition frozen gel packs: leave at room temperature 1–2 hours until edges are defrosted and packs are "sweating." Un-conditioned packs can freeze vaccines.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body">Packing: (a) Spread conditioned cold packs over half the cooler bottom. (b) Lay 2 inches of bubble wrap on top. (c) Stack vaccine boxes on bubble wrap — do not let them touch cold packs. (d) Cover with 2 more inches of bubble wrap. (e) Spread conditioned cold packs over half the bubble wrap. (f) Fill to top with bubble wrap. Place thermometer display and Return/Transfer of Vaccines Report on top.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body">On arrival: Check vaccine temperature immediately. If 35°F–46°F: refrigerate immediately. If below 35°F OR above 46°F: Label "Do Not Use." Contact VFC Rep or VFC program immediately: <strong>1-877-243-8832</strong>.</div></li>
</ol>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.12" target="_blank">COMAR 10.07.05.12</a> — Plan of care. Requires medication and vaccine administration to follow physician orders and manufacturer storage guidelines.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">CDC Vaccine Storage and Handling Toolkit</span> — National standard for vaccine cold chain maintenance, temperature monitoring, and transport.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">ISMP — Confused Drug Names List</span> — National reference for look-alike/sound-alike drug name pairs that require extra caution.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Merged legacy 4.009.6 (Confused Medications) and 4.009.9 (Vaccine Storage and Transportation) into single document. Added plain-language summary and "why it matters" callout. Supersedes legacy 4.009.6 and 4.009.9.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original documents prepared and approved February–March 2023. OHCQ license submission versions.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D4-010"><div class="related-card-id">VHS-D4-010</div><div class="related-card-title">Medication Management — Profile, MAR & Orders</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-011"><div class="related-card-id">VHS-D4-011</div><div class="related-card-title">Medication Storage & Emergency Medications</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-012"><div class="related-card-id">VHS-D4-012</div><div class="related-card-title">Adverse Drug Reactions</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-014', 'D4', 1, 'Patient & Family Education', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Clinical Staff'],
  ARRAY['10.07.05.12'],
  ARRAY['patient education', 'family education', 'teaching', 'documentation', 'AxisCare', 'medication adherence'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-014</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-014 · v2.0</span>
      </div>
      <h1 class="doc-title">Patient & Family Education</h1>
      <div class="doc-id-line">VHS-D4-014 · Applies to: All Clinical Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.12</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Teaching clients and families is part of your job — not optional.</li>
<li class="wmfy-item">At every visit, look for opportunities to teach the client or family member something that helps them manage the client's health.</li>
<li class="wmfy-item">Use simple words. Check that the client understood — don't just read a pamphlet and move on.</li>
<li class="wmfy-item">Document every education session in AxisCare on the day of the visit — what you taught, how you taught it, and how the client responded.</li>
<li class="wmfy-item">Involve family members and caregivers in teaching whenever possible.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To ensure clients and their families receive education that supports self-care, medication management, safety, and understanding of the client's health condition — improving outcomes and reducing hospital readmissions.</p></div></section>
<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Patient and family education is a core function of every clinical visit at Vitalis. All clinical staff are expected to use every reasonable opportunity to educate clients, family members, and designated caregivers. Education must be tailored to the client's learning ability, language, and readiness to learn. All education activities must be documented in AxisCare on the day of the visit.</p></div></section>
<section class="policy-section" id="education-topics"><h2 class="section-heading">Areas of Education</h2>
<div class="body-text"><p>Education topics are tailored to each client's individual condition and care plan. Common areas include:</p></div>
<ul class="bullet-list"><li>Medication management — names, dosages, routes, schedules, and what to do if a dose is missed</li><li>Side effects and adverse effects to watch for and report</li><li>Drug-drug and food-drug interactions (especially alcohol)</li><li>Disease management — signs and symptoms of the primary diagnosis, how to monitor, when to call the physician</li><li>Wound care and infection prevention (where applicable)</li><li>Nutrition and diet as related to the care plan</li><li>Fall prevention and safe mobility</li><li>When and how to call 911 vs. calling the agency</li><li>Advance Directives — what they are and the right to execute them</li><li>Infection control — handwashing, PPE, preventing the spread of illness in the home</li><li>Safe use of medical equipment in the home</li><li>Importance of medication adherence and follow-through with the care plan</li></ul>
</section>
<section class="policy-section" id="procedure"><h2 class="section-heading">Education Procedure</h2>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">RN / Clinical Staff</span> At each visit, assess the client's and family's current knowledge, understanding, and readiness to learn regarding the care plan. Note barriers to learning (language, literacy, cognitive impairment, emotional readiness).</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">RN / Clinical Staff</span> Select appropriate teaching methods — verbal instruction, written materials (in the client's language), demonstration, return demonstration, or a combination.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">RN / Clinical Staff</span> Teach the identified topic(s). Use plain language. If the client has a language barrier, arrange for an interpreter before teaching — see <a href="/pp/VHS-D3-009">VHS-D3-009 · Facilitating Communication</a>.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">RN / Clinical Staff</span> Evaluate understanding: ask the client or family member to explain what they learned or to demonstrate a skill. Assess their ability to apply the information.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">RN / Clinical Staff</span> Document in AxisCare on the same day: the topics taught; teaching methods used; who was present; the client's or family's response and level of understanding; and any barriers to learning and how they were addressed.</div></li>
<li class="step"><span class="step-num">6</span><div class="step-body"><span class="role-tag">RN / Clinical Staff</span> Follow up on prior teaching at subsequent visits. Reinforce, correct, or expand on previous education based on observed behavior and client feedback.</div></li>
</ol>
<div class="callout callout-axiscare"><div class="callout-label">📱 Document Every Teaching Moment</div><div class="callout-body">Education not documented — it did not happen from a compliance standpoint. OHCQ surveyors look for evidence of client education in the clinical record. "Instructed on medication" is not sufficient documentation. Write specifically what was taught, how the client responded, and what the plan is for follow-up.</div></div>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.12" target="_blank">COMAR 10.07.05.12</a> — Plan of care. Requires RSAs to provide instruction and education in the plan of care and to document all teaching activities in the clinical record.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">42 CFR § 484.60</span> — Care planning. Requires home care agencies to provide patient education as part of the individualized care plan.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Substantially expanded from legacy 6.002.1. Added structured teaching procedure, documentation requirements, topic list, plain-language summary. Supersedes legacy 6.002.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 6.002.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D4-016"><div class="related-card-id">VHS-D4-016</div><div class="related-card-title">Comprehensive Assessment & Clinical Supervision</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-003"><div class="related-card-id">VHS-D4-003</div><div class="related-card-title">Clinical Records — Content, Timeliness & Accuracy</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D3-009"><div class="related-card-id">VHS-D3-009</div><div class="related-card-title">Facilitating Communication</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-015', 'D4', 1, 'Wound Care Management', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Clinical Staff'],
  ARRAY['10.07.05.12'],
  ARRAY['wound care', 'physician order', 'documentation', 'WOCN', 'staging', 'reimbursement', 'photo consent'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-015</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-015 · v2.0</span>
      </div>
      <h1 class="doc-title">Wound Care Management</h1>
      <div class="doc-id-line">VHS-D4-015 · Applies to: All Clinical Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.12</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Never perform wound care without a specific physician order. The order must include: the protocol, technique, supplies needed, how often to do it, and what adverse events to report.</li>
<li class="wmfy-item">Measure and describe every wound at every wound care visit — length, depth, width, wound bed appearance, drainage, odor, surrounding skin, and staging.</li>
<li class="wmfy-item">Take photos only with the patient's written consent on file. Label every photo with the date, patient name, wound description, and your signature.</li>
<li class="wmfy-item">Teach the client and family how to care for the wound whenever possible.</li>
<li class="wmfy-item">If the wound is not improving with the current protocol, call the physician immediately.</li>
<li class="wmfy-item">Document wound status at minimum once a week.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To ensure wound care provided by Vitalis clinical staff is safe, appropriate, physician-ordered, and fully documented — protecting clients from wound deterioration and infection while providing the documentation needed for reimbursement.</p></div></section>
<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>All Vitalis nursing staff obtain specific physician orders before performing wound care. Orders must contain the specific protocol, technique, supplies, frequency, duration, and adverse events to report to the physician. Wound, Ostomy and Continence Nurse (WOCN) society guidance on skin and wound status is followed by all Vitalis clinical staff.</p></div></section>
<section class="policy-section" id="procedure"><h2 class="section-heading">Procedure</h2>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">RN</span> At admission, assess the integumentary system to determine whether wound care is needed. Document the assessment in AxisCare.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">RN</span> Obtain a specific physician wound care order before initiating any wound care. If the agency has standing wound care orders from a specific physician, these may be used until specific orders are obtained.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">RN / LPN</span> Perform or teach wound care as ordered by the physician. If the patient or caregiver has been instructed by other professionals (hospital, rehabilitation), observe and assess their procedure for compliance with the physician's order.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">RN / LPN</span> Document wound status at minimum once per week. Documentation must include: type of wound; measurements (length, depth, width); wound bed description; surrounding skin condition; undermining; staging; color; odor; and estimated amount and character of drainage.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">RN / LPN</span> Wound photos may be taken at the start of treatment and repeated as determined by clinical staff — but only with a signed Photograph Release from the patient or responsible party on file. Label each photo with date, patient name, wound description, and the signature of the person taking the photo. File the consent form and photos in the client's AxisCare record.</div></li>
<li class="step"><span class="step-num">6</span><div class="step-body"><span class="role-tag">RN / LPN</span> Report complications to the physician immediately for additional orders. If a wound is not responding to the current protocol, contact the primary physician to discuss a protocol change and/or change in supplies. Document all physician communications in AxisCare.</div></li>
<li class="step"><span class="step-num">7</span><div class="step-body"><span class="role-tag">RN / LPN</span> Educate the client and caregiver about signs and symptoms of wound infection, nutritional status and diet related to healing, and when and how to report problems to the agency or physician.</div></li>
<li class="step"><span class="step-num">8</span><div class="step-body"><span class="role-tag">RN / LPN</span> Arrange for wound care supplies through the agency as long as the client is receiving services. Upon discharge, provide the client and caregiver with instructions on: procedure, where to obtain supplies, complications to report, and follow-up with the physician.</div></li>
</ol>
<div class="callout callout-note"><div class="callout-label">ℹ Wound Documentation for Reimbursement</div><div class="callout-body">Accurate, detailed wound documentation is required for Medicaid and insurance reimbursement. Vague entries like "wound care performed as ordered" are insufficient. You must include specific measurements, a wound bed description, staging, and drainage characteristics at every wound care visit. Payors review wound documentation before approving reimbursement.</div></div>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.12" target="_blank">COMAR 10.07.05.12</a> — Plan of care. Requires specific physician orders for wound care and documentation of wound status and treatment in the clinical record.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">WOCN Society — Wound Care Guidelines</span> — Clinical reference for wound assessment, staging, and management in home care settings.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary, reimbursement callout, structured step-by-step procedure, photo consent requirement. Supersedes legacy 6.003.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 6.003.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D4-016"><div class="related-card-id">VHS-D4-016</div><div class="related-card-title">Comprehensive Assessment & Clinical Supervision</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-003"><div class="related-card-id">VHS-D4-003</div><div class="related-card-title">Clinical Records — Content, Timeliness & Accuracy</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-014"><div class="related-card-id">VHS-D4-014</div><div class="related-card-title">Patient & Family Education</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-016', 'D4', 1, 'Comprehensive Assessment & Clinical Supervision', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['DON', 'RN', 'LPN', 'All Clinical Staff'],
  ARRAY['10.07.05.12'],
  ARRAY['comprehensive assessment', 'clinical supervision', '48 hours', 'supervisory visit', 'LPN', 'start of care'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-016</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-016 · v2.0</span>
      </div>
      <h1 class="doc-title">Comprehensive Assessment & Clinical Supervision</h1>
      <div class="doc-id-line">VHS-D4-016 · Applies to: DON · RN · LPN · All Clinical Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.12</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Every client must have a comprehensive nursing assessment at the start of care — and whenever their condition changes significantly.</li>
<li class="wmfy-item">Only a Registered Nurse can complete the initial comprehensive assessment. An LPN cannot do this.</li>
<li class="wmfy-item">Assessments are also required: within 48 hours of any hospitalization; within 48 hours of a significant change in condition; after 15 or more days in a skilled facility; and when a new DON starts.</li>
<li class="wmfy-item">The DON, RN, or Case Manager is responsible for supervising all field staff. How often they visit depends on what care you are providing.</li>
<li class="wmfy-item">LPNs must always work under the direction of an RN. An RN must be accessible by phone any time an LPN is on duty.</li>
<li class="wmfy-item">If a client refuses an assessment, document the refusal and notify the DON and the client's Support Planner.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To establish the requirements for comprehensive nursing assessments for all Vitalis clients — and to define the supervision responsibilities of the DON, RN, and Case Manager over all clinical staff providing care.</p></div></section>
<section class="policy-section" id="when-required"><h2 class="section-heading">Comprehensive Assessment — When Required</h2>
<table class="data-table"><thead><tr><th>Trigger</th><th>Timing</th></tr></thead><tbody>
<tr><td>Start of care</td><td>At admission, prior to the delegation of any nursing tasks. Must be completed no later than 5 calendar days after the start-of-care date.</td></tr>
<tr><td>Post-hospitalization</td><td>Within 48 hours of discharge from a hospital (for any reason except diagnostic testing).</td></tr>
<tr><td>Significant change in condition</td><td>Within 48 hours of an unexpected major decline or major improvement in health status. If the RN determines in clinical judgment that 48 hours is not clinically required, document the determination and ensure assessment within 7 calendar days.</td></tr>
<tr><td>After skilled facility stay</td><td>Within 48 hours of discharge from any skilled care facility stay of 15 or more days.</td></tr>
<tr><td>New DON assumes role</td><td>When a new RN assumes the DON or Clinical Manager role.</td></tr>
<tr><td>Ongoing</td><td>At least every 60 days. At discharge. When transferred to an inpatient facility.</td></tr>
</tbody></table></section>
<section class="policy-section" id="who-performs"><h2 class="section-heading">Who Performs Comprehensive Assessments</h2>
<div class="body-text"><p>All comprehensive nursing assessments must be performed by a Registered Nurse. If multiple clinicians are utilized, responsibility for the comprehensive assessment rests with one clinician only — this must be clearly designated. LPNs may not perform the initial comprehensive assessment.</p>
<p>Assessment refusal: if a client refuses a comprehensive assessment, the RN documents the refusal in AxisCare, communicates the situation to the client's Support Planner, and notifies the DON.</p></div></section>
<section class="policy-section" id="rn-resp"><h2 class="section-heading">RN Responsibilities</h2>
<ul class="bullet-list"><li>Perform initial assessments and identify problems for each patient upon admission.</li><li>Reassess the patient's nursing needs on an ongoing, client-specific basis — monitoring their response to care.</li><li>Initiate the plan of care and all necessary revisions. Furnish services requiring substantial and specialized nursing skill.</li><li>Prepare clinical and progress notes. Coordinate services among disciplines.</li><li>Inform the physician and other personnel promptly of changes in the patient's condition.</li><li>Make CNA assignments, prepare written care instructions for each aide, and supervise aides in the home.</li><li>Direct the activities of the LPN.</li><li>Administer medications and treatments as prescribed.</li><li>Provide progress notes to the patient's physician at least every 60 days, or more frequently when the patient's condition changes or deviates from the plan of care.</li><li>Counsel the patient and family in meeting nursing and related needs.</li><li>Participate in and lead in-service programs. Supervise and teach other nursing personnel.</li><li>Maintain a clinical record for each patient receiving care.</li></ul>
</section>
<section class="policy-section" id="lpn-resp"><h2 class="section-heading">LPN Responsibilities</h2>
<div class="body-text"><p>LPN nursing services are provided under the direction of a Registered Nurse in accordance with the plan of care and the Maryland Nurse Practice Act. LPN services include:</p></div>
<ul class="bullet-list"><li>Performing selected acts in accordance with the Nurse Practice Act — patient education, treatments, and medication administration in the care of the ill, injured, or infirm.</li><li>Reporting changes in the patient's condition to the supervising RN. Documenting these reports in the clinical notes.</li><li>Preparing clinical notes for the clinical record.</li><li>Assisting the physician and RN in performing specialized procedures.</li><li>Preparing equipment and materials for treatments using aseptic technique.</li><li>Assisting the patient in learning appropriate self-care techniques.</li></ul>
<div class="callout callout-warning"><div class="callout-label">⚠ RN Accessibility — LPN on Assignment</div><div class="callout-body">Whenever an LPN is on assignment in a patient's home, a Registered Nurse must be accessible by phone and available to make a home visit — at all times, including nights, weekends, and holidays. This is a non-negotiable regulatory requirement under COMAR 10.07.05.12.</div></div>
</section>
<section class="policy-section" id="supervision"><h2 class="section-heading">Clinical Supervision Frequencies</h2>
<div class="body-text"><p>The DON, Alternate DON, and/or Case Manager are responsible for overseeing all clinical operations. Supervising nurses routinely review the plan of care, physician orders, and visit notes to ensure the plan of care is being followed.</p></div>
<table class="data-table"><thead><tr><th>Staff Type / Condition</th><th>Minimum Supervision Frequency</th></tr></thead><tbody>
<tr><td>Clients with medication administration</td><td>RN on-site supervisory visit at least every 30 days</td></tr>
<tr><td>Clients with self-administration of medications</td><td>RN on-site supervisory visit at least every 30 days</td></tr>
<tr><td>Clients without medication administration (no MAR)</td><td>RN supervisory visit at least every 60 days</td></tr>
<tr><td>Clients with serious or unstable medical conditions</td><td>RN supervisory visit at least every 14 days</td></tr>
<tr><td>Certified Nurse Aides (CNAs)</td><td>RN supervisory visit at least every 30 days</td></tr>
<tr><td>LPN visits</td><td>RN supervisory visit at least every 90 days (more often as needed)</td></tr>
<tr><td>Companions</td><td>Companion supervisor visit at least every 30 days (supervisor need not be a nurse)</td></tr>
</tbody></table>
<div class="body-text" style="margin-top:12px"><p>All supervisory visits are documented in AxisCare and placed in the patient's record. The DON reviews supervisory visit compliance in AxisCare weekly and addresses any overdue visits within 24 hours.</p></div>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.12" target="_blank">COMAR 10.07.05.12</a> — Plan of care. Establishes requirements for comprehensive assessments, RN supervision of all staff types, frequency of supervisory visits, and LPN scope under RN direction.</div></div></div>
<div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Maryland Nurse Practice Act — Health Occupations Article § 8-6A</span> — Defines the scope of RN and LPN practice and the requirements for supervision of non-licensed personnel.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Merged legacy 6.016.2 (Comprehensive Assessment), 6.020.1 (Nurse Supervision), 6.020.2 (RN Responsibilities and Assessments), and 6.020.3 (LPN) into single document. Added supervision frequency table, plain-language summary. Supersedes legacy 6.016.2, 6.020.1, 6.020.2, 6.020.3.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original documents prepared and approved February–March 2023. OHCQ license submission versions.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D4-005"><div class="related-card-id">VHS-D4-005</div><div class="related-card-title">RN Delegation</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-004"><div class="related-card-id">VHS-D4-004</div><div class="related-card-title">Physician Orders & Plan of Care</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-003"><div class="related-card-id">VHS-D4-003</div><div class="related-card-title">Clinical Records — Content, Timeliness & Accuracy</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
<a class="related-card" href="/pp/VHS-D4-015"><div class="related-card-id">VHS-D4-015</div><div class="related-card-title">Wound Care Management</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
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
  'VHS-D4-017', 'D4', 1, 'RN Pronouncement of Death', 'Director of Nursing — Marie Epah', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Clinical Staff', 'Skilled Staff'],
  ARRAY['10.07.05.12'],
  ARRAY['pronouncement of death', 'DNR', 'CPR', '911', 'Marie Epah', 'Okezie Ofeogbu'],
  $VITALIS_HTML$<style>
:root{--teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;--navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;--rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;--border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;--font-serif:'Instrument Serif',Georgia,serif;--font-sans:'DM Sans',system-ui,sans-serif;--font-mono:'SF Mono','Fira Code',monospace;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);font-size:15px;line-height:1.7;}
.main-content{max-width:820px;padding:0 48px 80px;}
.doc-banner{background:linear-gradient(135deg,var(--navy) 0%,#0B3D6B 100%);margin:0 -48px 40px;padding:32px 48px 28px;position:relative;overflow:hidden;}
.doc-banner::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,135,0.18) 0%,transparent 70%);pointer-events:none;}
.doc-banner-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
.doc-meta-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.pill{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px;display:inline-flex;align-items:center;gap:5px;}
.pill-domain{background:rgba(255,255,255,0.15);color:#fff;}
.pill-tier{background:rgba(26,155,135,0.25);color:var(--teal-mid);}
.pill-owner{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.pill-version{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-family:var(--font-mono);font-size:10px;}
.doc-title{font-family:var(--font-serif);font-size:28px;font-weight:400;color:#fff;line-height:1.25;letter-spacing:-0.3px;margin-bottom:6px;}
.doc-id-line{font-size:12px;color:rgba(255,255,255,0.5);font-family:var(--font-mono);}
.doc-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);}
.doc-meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:3px;}
.doc-meta-value{font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;}
.ack-btn{padding:10px 22px;background:var(--teal-mid);color:#fff;border:none;border-radius:var(--radius-md);font-family:var(--font-sans);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}
.ack-btn:hover:not(:disabled){background:var(--teal);transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,107,92,0.3);}
.ack-btn:disabled{background:rgba(255,255,255,0.2);cursor:not-allowed;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
.breadcrumb a{color:var(--teal);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.policy-section{margin-bottom:48px;scroll-margin-top:24px;}
.section-heading{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal-light);display:flex;align-items:center;gap:10px;}
.section-heading::before{content:'';display:block;width:4px;height:20px;background:var(--teal-mid);border-radius:2px;flex-shrink:0;}
.body-text p{margin-bottom:14px;color:var(--slate);}
.body-text p:last-child{margin-bottom:0;}
.steps{list-style:none;display:flex;flex-direction:column;gap:10px;}
.step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);}
.step-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
.step-body{font-size:14px;color:var(--slate);line-height:1.65;flex:1;}
.role-tag{display:inline-block;padding:2px 8px;background:var(--navy-light);color:var(--navy);border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle;}
.callout{border-radius:var(--radius-md);padding:16px 20px;margin:20px 0;border-left:4px solid;}
.callout-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.callout-body{font-size:13px;line-height:1.65;}
.callout-body p{margin-bottom:8px;}.callout-body p:last-child{margin-bottom:0;}
.callout-warning{background:var(--rose-light);border-color:var(--rose);}
.callout-warning .callout-label{color:var(--rose);}
.callout-warning .callout-body{color:#7B241C;}
.callout-note{background:var(--teal-light);border-color:var(--teal-mid);}
.callout-note .callout-label{color:var(--teal);}
.callout-note .callout-body{color:#1A4A42;}
.callout-axiscare{background:#EBF4FF;border-color:#3B82F6;}
.callout-axiscare .callout-label{color:#1D4ED8;}
.callout-axiscare .callout-body{color:#1E3A5F;}
.callout-ai{background:var(--amber-light);border-color:var(--amber);}
.callout-ai .callout-label{color:var(--amber);}
.callout-ai .callout-body{color:#6B4200;}
.wmfy-box{background:var(--teal-light);border:1px solid #A7D7CE;border-left:5px solid var(--teal-mid);border-radius:var(--radius-md);padding:20px 24px;margin-bottom:40px;}
.wmfy-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:var(--teal);margin-bottom:12px;}
.wmfy-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.wmfy-item{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#1A4A42;line-height:1.6;}
.wmfy-item::before{content:'✓';color:var(--teal-mid);font-weight:900;flex-shrink:0;margin-top:1px;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);margin:16px 0;}
.data-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
.data-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--slate);vertical-align:top;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:nth-child(even) td{background:var(--bg);}
.data-table td:first-child{font-weight:600;color:var(--navy);}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:12px 0;}
.bullet-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--slate);line-height:1.6;}
.bullet-list li::before{content:'·';color:var(--teal-mid);font-size:20px;line-height:1.1;flex-shrink:0;}
.reg-block{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:16px 0;}
.reg-header{background:var(--navy);color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:8px 16px;}
.reg-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);}
.reg-row:last-child{border-bottom:none;}
.reg-source{padding:3px 9px;border-radius:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;margin-top:2px;}
.src-comar{background:#EDE9FE;color:#4C1D95;}
.src-cfr{background:#DBEAFE;color:#1E3A5F;}
.src-md{background:#D1FAE5;color:#064E3B;}
.reg-cite{font-weight:700;color:var(--teal);text-decoration:none;}
.reg-cite:hover{text-decoration:underline;}
.reg-detail{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:3px;}
.version-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin:12px 0;}
.version-table th{background:var(--bg);padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);}
.version-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--slate);}
.version-table tr:last-child td{border-bottom:none;}
.version-table tr.current td{background:#F0FDF4;}
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D4">D4 · Clinical Operations</a><span>›</span><span>VHS-D4-017</span></nav>
<div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D4 · Clinical Operations</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah</span>
        <span class="pill pill-version">VHS-D4-017 · v2.0</span>
      </div>
      <h1 class="doc-title">RN Pronouncement of Death</h1>
      <div class="doc-id-line">VHS-D4-017 · Applies to: All Clinical Staff · Skilled Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.12</div></div>
  </div>
</div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Vitalis nurses do NOT pronounce death. This is not within our scope.</li>
<li class="wmfy-item">If a client appears to have died while you are on duty, follow this sequence: (1) attempt CPR and call 911 — UNLESS the client has a valid in-home DNR order; (2) if the client has an in-home DNR, call local police instead of 911; (3) notify the client's family; (4) notify the client's physician.</li>
<li class="wmfy-item">Never pronounce death. Never leave the client unattended until the appropriate authority arrives.</li>
<li class="wmfy-item">Document everything in AxisCare as soon as possible.</li>
</ul></div>
<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To establish the procedure for Vitalis clinical staff to follow when a client death occurs or is suspected while agency personnel are on duty or on assignment.</p></div></section>
<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Vitalis Healthcare Services, LLC nursing staff do not pronounce death. Pronouncement of death is the responsibility of the attending physician or other legally authorized person. Vitalis nurses follow a defined response protocol when a client death occurs or is suspected.</p></div></section>
<section class="policy-section" id="procedure"><h2 class="section-heading">Procedure</h2>
<ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Nurse / Clinical Staff — Assess Immediately</span> Assess the client's condition. If the client appears unresponsive and without pulse or respirations, determine whether a valid in-home DNR order exists.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">No DNR in place</span> Initiate CPR immediately. Call 911. Continue CPR until EMS arrives.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Valid In-Home DNR in place</span> Do not initiate CPR. Call the local police department. Honor the DNR order.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">All staff</span> Notify the client's family or next of kin of the change in condition as promptly as possible.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">All staff</span> Notify the client's attending physician of the situation.</div></li>
<li class="step"><span class="step-num">6</span><div class="step-body"><span class="role-tag">All staff</span> Notify the DON (Marie Epah) and the Administrator (Okezie Ofeogbu).</div></li>
<li class="step"><span class="step-num">7</span><div class="step-body"><span class="role-tag">All staff</span> Do not leave the client unattended until the appropriate authority (EMS, police, or coroner) has arrived and taken responsibility.</div></li>
<li class="step"><span class="step-num">8</span><div class="step-body"><span class="role-tag">RN / Clinical Staff</span> Document all actions taken, calls made, times, and the sequence of events in AxisCare as soon as practically possible.</div></li>
</ol>
<div class="callout callout-warning"><div class="callout-label">⚠ DNR Order — Confirm Before Relying on It</div><div class="callout-body">A valid in-home DNR order in Maryland must be: signed by the patient's physician; in the standardized Maryland DNR form; visible and accessible in the client's home. If you cannot locate the DNR form or are uncertain of its validity, treat it as if no DNR exists — initiate CPR and call 911. Never assume a DNR exists based on family statements alone.</div></div>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.12" target="_blank">COMAR 10.07.05.12</a> — Plan of care. Establishes the expectation that RSAs have written policies for end-of-life events, including death during agency service.</div></div></div>
<div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Maryland Health-General Article §§ 5-601 et seq.</span> — Governs the execution and enforcement of DNR orders and out-of-hospital DNR orders in Maryland.</div></div></div>
</div>
</section>
<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary, DNR validation callout, named DON and Administrator in notification chain. Supersedes legacy 6.017.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 6.017.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>
<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D3-006"><div class="related-card-id">VHS-D3-006</div><div class="related-card-title">Advance Directives</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D3-007"><div class="related-card-id">VHS-D3-007</div><div class="related-card-title">Declaration for Mental Health Treatment</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D4-016"><div class="related-card-id">VHS-D4-016</div><div class="related-card-title">Comprehensive Assessment & Clinical Supervision</div><div class="related-card-domain">D4 · Clinical Operations</div></a>
</div></section>
<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D4-Clinical-Operations.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content=EXCLUDED.html_content, title=EXCLUDED.title, version=EXCLUDED.version,
  effective_date=EXCLUDED.effective_date, review_date=EXCLUDED.review_date,
  applicable_roles=EXCLUDED.applicable_roles, comar_refs=EXCLUDED.comar_refs,
  keywords=EXCLUDED.keywords, status=EXCLUDED.status, updated_at=NOW();
