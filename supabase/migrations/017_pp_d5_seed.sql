-- Migration 017 — P&P D5 Business Operations (v2.0, March 2026 triennial)
-- Run AFTER 012_pp_v2_schema.sql

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D5-001', 'D5', 1, 'Billing', 'Compliance & Billing — Somto Illomuanya', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['Billing Staff', 'Administrator'],
  ARRAY['10.07.05.08'],
  ARRAY['billing', 'physician order', 'AxisCare', 'EVV', 'Somto Illomuanya', 'claims', 'fraud', 'Medicaid'],
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D5">D5 · Business Operations</a><span>›</span><span>VHS-D5-001</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D5 · Business Operations</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Compliance & Billing — Somto Illomuanya</span>
    <span class="pill pill-version">VHS-D5-001 · v2.0</span>
  </div>
  <h1 class="doc-title">Billing</h1>
  <div class="doc-id-line">VHS-D5-001 · Applies to: Billing Staff · Administrator</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.08(C)</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Billing staff: before you submit any claim, check that a signed physician order is on file for every service being billed. If there is no signed order — hold the claim.</li><li class="wmfy-item">Field staff: your AxisCare clock-in/clock-out and completed visit notes are what billing uses to verify your visits. If your documentation is incomplete, the visit cannot be billed and will not be paid.</li><li class="wmfy-item">Bills are generated every two weeks and are fully itemized. Clients are informed of all costs before services begin.</li><li class="wmfy-item">Vitalis does not extend credit and does not accept gifts or contributions.</li><li class="wmfy-item">A client cannot be discharged for non-payment while a claim is pending with a third-party payer.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To ensure the accurate, timely, and compliant submission of billing and insurance claims for all services provided by Vitalis Healthcare Services, LLC — in full compliance with Medicaid, Medicare, private payer requirements, and applicable federal and state fraud and abuse laws.</p></div></section>

<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Vitalis will submit accurate and timely billing information for all services rendered. All billed services must be supported by signed physician orders, verified AxisCare EVV records, and complete clinical documentation. Billing for services not rendered, not ordered, or not documented is prohibited and constitutes fraud. The Compliance &amp; Billing Officer (<strong>Somto Illomuanya</strong>) is responsible for overseeing billing integrity under the direction of the Administrator.</p></div></section>

<section class="policy-section" id="procedure"><h2 class="section-heading">Billing Procedure</h2>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Care Coordinator</span> Verify payer information for each patient at intake. Ensure all payer and insurance information is complete in AxisCare before the first visit.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Billing — Somto Illomuanya</span> As visit notes are turned in from field staff, verify them against the master schedule in AxisCare. Log all visits and supplies into the billing system.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Billing — Somto Illomuanya</span> Run patient billing logs from AxisCare and check against clinical notes. Correct any discrepancies before claim submission.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Billing — Somto Illomuanya</span> Before billing the end of any episode: confirm that signed physician orders are on file in AxisCare for every service to be billed. If a signed order is missing — HOLD the billing until the order is received and filed. Do not submit a claim for any service without a signed order on file.</div></li><li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">Billing — Somto Illomuanya</span> Encode billing information into the billing system. Submit claims to the appropriate payer via electronic data processing or claim forms on a bi-weekly cycle.</div></li><li class="step"><span class="step-num">6</span><div class="step-body"><span class="role-tag">Billing — Somto Illomuanya</span> Upon receipt of payment, check payment against billing. Adjust for overpayments and underpayments. Apply payments to the invoice for which they were billed.</div></li></ol>
</section>

<section class="policy-section" id="bill-contents"><h2 class="section-heading">What Every Bill Must Include</h2>
<ul class="bullet-list"><li>Client name, address, and medical record number</li><li>Agency name, address, and phone number</li><li>Date of service</li><li>Type of service provided</li><li>Supplies (if applicable) with rate in each format</li><li>Service rate in per-visit or per-hour format</li><li>Preferred payment type and due date</li><li>If insurance client: a statement explaining what insurance did not pay</li></ul>
</section>

<section class="policy-section" id="client-notification"><h2 class="section-heading">Client Notification</h2>
<div class="body-text"><p>All costs for services are discussed with the client or client representative before services begin, and documented in AxisCare. Bills are generated every two weeks and are fully itemized. If charges change, the client is notified in writing as required by COMAR.</p></div></section>

<section class="policy-section" id="billing-rules"><h2 class="section-heading">Important Billing Rules</h2>
<div class="callout callout-warning"><div class="callout-label">⚠ Hold Billing Without a Signed Order</div><div class="callout-body">Do not submit any claim for which there is no signed physician order on file in AxisCare. Billing for services without a signed order is a compliance violation and can result in claim denial, repayment demands, and federal fraud investigation. If you discover a billing error, report it to the Compliance &amp; Billing Officer and the Administrator immediately.</div></div>
<table class="data-table"><thead><tr><th>Rule</th><th>Details</th></tr></thead><tbody>
<tr><td>Credit</td><td>Vitalis does not extend credit under any circumstances.</td></tr>
<tr><td>Gifts &amp; contributions</td><td>Vitalis does not accept gifts or contributions. All such items will be returned to the sender. If the sender cannot be located, the item will be donated to charity.</td></tr>
<tr><td>Non-payment discharge</td><td>A patient cannot be transferred or discharged for non-payment while a claim is pending with a third-party payer. Non-payment discharge is only considered after all appeals are exhausted and the patient has been properly notified.</td></tr>
<tr><td>EVV verification</td><td>AxisCare EVV clock-in/clock-out records are the primary verification of all visits. Claims cannot be submitted for visits without verified EVV records.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.08" target="_blank">COMAR 10.07.05.08(C)</a> — Financial policies. Requires RSAs to maintain written billing policies including methods of billing, client notification of charges, and billing error correction.</div></div></div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">42 CFR § 1001 — Federal Anti-Kickback Statute</span> — Prohibits billing for services not rendered, falsifying claims, and other fraudulent billing practices.</div></div></div><div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Maryland Health-General Article</span> — Governs billing requirements for Medicaid-enrolled providers, including documentation and EVV requirements for home care services.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added AxisCare EVV verification requirement, named Compliance & Billing Officer (Somto Illomuanya), hold-without-order callout, plain-language summary. Supersedes legacy 5.001.1.</td></tr><tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 5.001.1). OHCQ license submission version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D5-002"><div class="related-card-id">VHS-D5-002</div><div class="related-card-title">Verification of Primary Payer</div><div class="related-card-domain">D5 · Business Operations</div></a><a class="related-card" href="/pp/VHS-D5-003"><div class="related-card-id">VHS-D5-003</div><div class="related-card-title">Staffing & Scheduling</div><div class="related-card-domain">D5 · Business Operations</div></a><a class="related-card" href="/pp/VHS-D4-004"><div class="related-card-id">VHS-D4-004</div><div class="related-card-title">Physician Orders & Plan of Care</div><div class="related-card-domain">D4 · Clinical Operations</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Compliance & Billing — Somto Illomuanya</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D5-Business-Operations.docx'
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
  'VHS-D5-002', 'D5', 1, 'Verification of Primary Payer', 'Compliance & Billing — Somto Illomuanya', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['Billing Staff', 'Admissions Staff'],
  ARRAY['10.07.05.08'],
  ARRAY['payer verification', 'insurance', 'Medicaid', 'AxisCare', 'Somto Illomuanya', 'primary payer', 'HMO'],
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D5">D5 · Business Operations</a><span>›</span><span>VHS-D5-002</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D5 · Business Operations</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Compliance & Billing — Somto Illomuanya</span>
    <span class="pill pill-version">VHS-D5-002 · v2.0</span>
  </div>
  <h1 class="doc-title">Verification of Primary Payer</h1>
  <div class="doc-id-line">VHS-D5-002 · Applies to: Billing Staff · Admissions Staff</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.08(C)</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Before services begin for any new client, billing and admissions staff must verify who the primary payer is.</li><li class="wmfy-item">Collect all insurance and coverage information from the client, family, and referral source at intake.</li><li class="wmfy-item">Call the insurance company directly to confirm primary payer status — do not rely only on what the client says.</li><li class="wmfy-item">Document all payer information completely in AxisCare before the first visit is scheduled.</li><li class="wmfy-item">If the payer changes at any point during services, update AxisCare immediately and notify the Billing Officer.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To ensure accurate billing through proper identification and verification of each client's primary payer before services begin — preventing claim denials, delayed reimbursement, and billing errors caused by incorrect or incomplete payer information.</p></div></section>

<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Each patient's insurance and payer information is verified before services begin and updated whenever coverage changes. Accurate payer identification protects both the client and the agency from billing errors, unexpected client liability, and claim denials.</p></div></section>

<section class="policy-section" id="intake-info"><h2 class="section-heading">Information to Collect at Intake</h2>
<ul class="bullet-list"><li>Name of insurance company</li><li>Name of the insured person (may differ from client)</li><li>Policy number</li><li>Social Security number (where applicable and authorized)</li><li>Telephone number of the insurance company</li><li>Whether the client is a member of an HMO or Managed Care Group</li><li>Medicare and/or Medicaid number (if applicable)</li><li>Whether the client has secondary insurance</li></ul>
</section>

<section class="policy-section" id="procedure"><h2 class="section-heading">Verification Procedure</h2>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Care Coordinator / Admissions Staff</span> At intake, collect all coverage information from the client, family, and referral source. Document all information on the Intake Form in AxisCare.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Billing — Somto Illomuanya</span> Call the Insurance Verification line at the insurance company using the information collected. Confirm: (a) that the policy is active; (b) which coverage is primary; (c) what services are covered; (d) whether prior authorization is required; and (e) what the client's financial responsibility is (co-pay, deductible, etc.).</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Billing — Somto Illomuanya</span> Document all verification results in AxisCare in the client's payer record. Note the name of the insurance representative contacted, the date and time of the call, and all information confirmed.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Care Coordinator</span> Do not activate scheduling in AxisCare until payer verification is complete and documented.</div></li><li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">All Staff</span> Notify the Billing Officer immediately if a client reports any change to their insurance, Medicaid status, or payment source. Update AxisCare payer records promptly.</div></li></ol>
<div class="callout callout-warning"><div class="callout-label">⚠ Payer Changes During Services</div><div class="callout-body">If a client's payer changes mid-service (e.g., Medicaid eligibility changes, insurance lapses, or the client gains a secondary payer), the Billing Officer must be notified the same day it is known. Submitting claims to an incorrect or inactive payer after a known payer change is a billing compliance violation.</div></div>
</section>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.08" target="_blank">COMAR 10.07.05.08(C)</a> — Financial policies. Requires RSAs to verify client coverage and maintain billing records that accurately reflect the payer for all services.</div></div></div><div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Maryland Medicaid — EVV Requirements</span> — Requires verification of Medicaid eligibility and authorization before and during the delivery of Medicaid-funded home care services.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added AxisCare documentation requirement, payer change notification obligation, named Billing Officer (Somto Illomuanya), plain-language summary. Supersedes legacy 5.002.1.</td></tr><tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 5.002.1). OHCQ license submission version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D5-001"><div class="related-card-id">VHS-D5-001</div><div class="related-card-title">Billing</div><div class="related-card-domain">D5 · Business Operations</div></a><a class="related-card" href="/pp/VHS-D5-003"><div class="related-card-id">VHS-D5-003</div><div class="related-card-title">Staffing & Scheduling</div><div class="related-card-domain">D5 · Business Operations</div></a><a class="related-card" href="/pp/VHS-D3-001"><div class="related-card-id">VHS-D3-001</div><div class="related-card-title">Client Rights, Responsibilities & Non-Discrimination</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Compliance & Billing — Somto Illomuanya</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D5-Business-Operations.docx'
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
  'VHS-D5-003', 'D5', 1, 'Staffing & Scheduling', 'Compliance & Billing — Somto Illomuanya', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.09', '10.07.05.10'],
  ARRAY['scheduling', 'AxisCare', 'EVV', 'missed visit', 'refused entry', 'Marie Epah', 'Happiness Samuel', 'Peace Enoch'],
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D5">D5 · Business Operations</a><span>›</span><span>VHS-D5-003</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D5 · Business Operations</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Compliance & Billing — Somto Illomuanya</span>
    <span class="pill pill-version">VHS-D5-003 · v2.0</span>
  </div>
  <h1 class="doc-title">Staffing & Scheduling</h1>
  <div class="doc-id-line">VHS-D5-003 · Applies to: All Staff</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">10.07.05.09 · 10.07.05.10</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">All visits are scheduled in AxisCare according to each client's plan of care. If you are assigned a visit, it is your responsibility to show up on time.</li><li class="wmfy-item">If you cannot make a scheduled visit, call the office immediately — do not just not show up.</li><li class="wmfy-item">If a client is not home, refuses entry, or refuses service, call the Care Coordinator right away and document everything in AxisCare.</li><li class="wmfy-item">The scheduling board in AxisCare is updated daily. Check it regularly so you always know your upcoming schedule.</li><li class="wmfy-item">If you notice that a visit is not happening as planned — for any reason — tell your supervisor the same day.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To ensure that adequate staffing is maintained to meet every Vitalis client's plan of care — and that any scheduling issue is identified, addressed, and documented promptly to protect client safety and continuity of care.</p></div></section>

<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>The DON (<strong>Marie Epah</strong>) and Care Coordinators (<strong>Happiness Samuel, Peace Enoch</strong>) are responsible for ensuring all visits are scheduled according to each client's plan of care. AxisCare is the authoritative scheduling and documentation platform. All scheduling activity — additions, changes, missed visits, and documentation of refused entry — is recorded in AxisCare.</p></div></section>

<section class="policy-section" id="scheduling-system"><h2 class="section-heading">Scheduling System</h2>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Care Coordinator</span> Maintain a daily scheduling board in AxisCare that is updated with all scheduled visits. New admissions, frequency changes, recertifications, and discharges are updated in AxisCare as soon as they are known.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Care Coordinator</span> Provide each employee with a written or digital weekly schedule. Schedules are available in the AxisCare mobile app for all field staff.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Care Coordinator</span> Maintain a frequency calendar in AxisCare updated weekly to confirm all visits are being made as required by the plan of care. Flag any visit that is overdue or missed.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">DON / Care Coordinator</span> Use a mix of full-time, part-time, and contract staff to ensure client needs are always met. When a regular caregiver is unavailable, identify a qualified replacement before notifying the client.</div></li></ol>
</section>

<section class="policy-section" id="visit-changes"><h2 class="section-heading">Visit Changes &amp; Cancellations</h2>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Care Coordinator</span> If a visit may be delayed, changed, or missed for any reason, notify the client as soon as the issue is known — before the scheduled visit time whenever possible.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Any Staff</span> If a client is not home at the scheduled visit time, call the Care Coordinator immediately. Document the occurrence in AxisCare — include the time, what steps were taken to reach the client, and the outcome.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Any Staff</span> If a client refuses entry or refuses service, notify the Care Coordinator immediately and document in AxisCare. Do not leave without documenting.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Care Coordinator</span> When a client refuses entry, attempt to learn the reason and work to resolve it to prevent future missed visits. Also attempt to verify the client's safety even when entry has been denied. Document all attempts and outcomes in AxisCare.</div></li></ol>
<div class="callout callout-warning"><div class="callout-label">⚠ Client Safety — Refused Entry</div><div class="callout-body">A client who refuses entry to a caregiver may be in distress, may have had a fall, or may be experiencing a cognitive episode. The Care Coordinator must always attempt to verify client safety when entry is refused — even if the refusal seems routine. If the client cannot be reached and safety is uncertain, contact the client's emergency contact and, if needed, local authorities. Document everything.</div></div>
</section>

<section class="policy-section" id="axiscare-rules"><h2 class="section-heading">AxisCare Scheduling — Key Rules</h2>
<div class="callout callout-axiscare"><div class="callout-label">📱 AxisCare — Agency ID 14356</div><div class="callout-body"><strong>Four non-negotiable scheduling rules:</strong><br><br>1. Never schedule a visit in AxisCare for a client whose payer verification is not complete (see <a href="/pp/VHS-D5-002" style="color:#1D4ED8">VHS-D5-002</a>).<br>2. Never activate a caregiver in AxisCare for a client visit until the caregiver's credentials are current and competency is verified.<br>3. Clock-in and clock-out via the AxisCare app are required for all visits — geolocation EVV must be enabled. Visits without verified EVV cannot be billed.<br>4. Any discrepancy between the AxisCare schedule and actual visits made must be investigated and resolved before the billing cycle closes.<br><br>Access AxisCare at <a href="https://14356.axiscare.com" target="_blank" style="color:#1D4ED8">14356.axiscare.com</a></div></div>
</section>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.09" target="_blank">COMAR 10.07.05.09</a> — Administrator responsibilities. Requires RSAs to maintain staffing levels adequate to meet client needs at all times.</div></div></div><div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10</a> — Personnel standards. Requires RSAs to assign only qualified, credentialed staff to client visits and to document all scheduling activity.</div></div></div><div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Maryland EVV Requirements</span> — Requires AxisCare EVV clock-in/clock-out for all Medicaid-funded home care visits. Visits without EVV verification are not reimbursable.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Updated scheduling board from physical to AxisCare digital system. Named DON (Marie Epah) and Care Coordinators (Happiness Samuel, Peace Enoch). Added client safety protocol for refused entry. Added plain-language summary. Supersedes legacy 5.004.1.</td></tr><tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 5.004.1). OHCQ license submission version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D5-001"><div class="related-card-id">VHS-D5-001</div><div class="related-card-title">Billing</div><div class="related-card-domain">D5 · Business Operations</div></a><a class="related-card" href="/pp/VHS-D5-002"><div class="related-card-id">VHS-D5-002</div><div class="related-card-title">Verification of Primary Payer</div><div class="related-card-domain">D5 · Business Operations</div></a><a class="related-card" href="/pp/VHS-D4-016"><div class="related-card-id">VHS-D4-016</div><div class="related-card-title">Comprehensive Assessment & Clinical Supervision</div><div class="related-card-domain">D4 · Clinical Operations</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Compliance & Billing — Somto Illomuanya</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D5-Business-Operations.docx'
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
  'VHS-D5-004', 'D5', 1, 'Faxing & PHI Transmission', 'Compliance & Billing — Somto Illomuanya', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.11'],
  ARRAY['fax', 'PHI', 'HIPAA', 'misdirected fax', 'HIV', 'substance abuse', 'mental health', 'confidentiality'],
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D5">D5 · Business Operations</a><span>›</span><span>VHS-D5-004</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D5 · Business Operations</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Compliance & Billing — Somto Illomuanya</span>
    <span class="pill pill-version">VHS-D5-004 · v2.0</span>
  </div>
  <h1 class="doc-title">Faxing & PHI Transmission</h1>
  <div class="doc-id-line">VHS-D5-004 · Applies to: All Staff</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">10.07.05.11 · 45 CFR Parts 160 & 164</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Fax is the last resort for sending protected health information — only use it when the information is time-sensitive and email or mail won't work in time.</li><li class="wmfy-item">Always confirm the fax number is correct before sending. Double-check it on the machine before you hit send.</li><li class="wmfy-item">Always use the Vitalis fax cover sheet. It contains the required confidentiality notice.</li><li class="wmfy-item">Never fax HIV/AIDS results, substance abuse records, or mental health treatment records. Ever.</li><li class="wmfy-item">If you send a fax to the wrong number, tell your supervisor and the HIPAA Privacy Officer immediately. Do not try to handle it yourself.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To describe the procedures that protect the privacy and security of Protected Health Information (PHI) when transmitted or received by facsimile — and to minimize the risk of misdirected faxes, unauthorized disclosure, and HIPAA violations.</p></div></section>

<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Fax is a useful tool for time-sensitive document transmission but poses significant privacy risks due to the possibility of misdirected faxes and unsecured receiving locations. All Vitalis staff will protect the confidentiality of PHI when transmitting or receiving it by fax. The HIPAA Privacy Officer (<strong>Administrator — Okezie Ofeogbu</strong>) is responsible for enforcing this policy.</p></div></section>

<section class="policy-section" id="sending"><h2 class="section-heading">Sending Faxes — Requirements</h2>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body">Use fax for PHI only when the transmission is time-sensitive and mail will not meet the reasonable needs of the sender or recipient.</div></li><li class="step"><span class="step-num">2</span><div class="step-body">Before sending: confirm with the intended recipient that the receiving fax machine is in a secure area or that someone is waiting at the machine to receive the fax immediately.</div></li><li class="step"><span class="step-num">3</span><div class="step-body">When the fax number is not pre-programmed: visually check the recipient's fax number on the machine before starting the transmission.</div></li><li class="step"><span class="step-num">4</span><div class="step-body">Use the Vitalis standard fax cover sheet for all PHI transmissions. The cover sheet must include: the required confidentiality notice; the recipient's name, business affiliation, phone number, and fax number; and the total number of pages.</div></li><li class="step"><span class="step-num">5</span><div class="step-body">Check the fax confirmation sheet immediately after transmission to confirm the fax reached the correct number. Keep fax confirmation records.</div></li><li class="step"><span class="step-num">6</span><div class="step-body">Periodically test pre-programmed fax numbers to confirm they are still valid. Recipients who regularly receive PHI faxes must be reminded to notify Vitalis of any change to their fax number.</div></li></ol>
<div class="callout callout-warning"><div class="callout-label">⚠ These Can NEVER Be Faxed</div><div class="callout-body">The following types of information must NEVER be transmitted by fax under any circumstances: <strong>HIV/AIDS status or treatment records; substance abuse condition or treatment records; mental health condition or treatment records.</strong> These are Sensitive PHI and require heightened protection. If you receive a fax from an outside organization containing Sensitive PHI, advise the sender immediately that Vitalis does not accept Sensitive PHI transmissions by fax.</div></div>
</section>

<section class="policy-section" id="misdirected"><h2 class="section-heading">Misdirected Faxes — Immediate Response</h2>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body">If you discover a fax was sent to the wrong number: immediately contact the unintended recipient by fax or telephone and request that the documents and all copies be destroyed immediately or returned to Vitalis.</div></li><li class="step"><span class="step-num">2</span><div class="step-body">Notify your supervisor and the HIPAA Privacy Officer (Administrator) immediately. Do not attempt to handle a misdirected PHI fax on your own.</div></li><li class="step"><span class="step-num">3</span><div class="step-body">The Privacy Officer performs a PHI Breach Risk Assessment to determine whether patient notification is required. See <a href="/pp/VHS-D4-001">VHS-D4-001 · Security of Clinical Information</a>.</div></li></ol>
</section>

<section class="policy-section" id="receiving"><h2 class="section-heading">Receiving Faxes — Requirements</h2>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body">Fax machines that receive PHI must be located in secure areas not accessible to the general public. If a PHI fax is received on a machine that is not in a secure area, advise the sender immediately not to use that machine for future PHI transmissions.</div></li><li class="step"><span class="step-num">2</span><div class="step-body">Check fax machines regularly — do not allow incoming PHI faxes to sit unattended on the machine. Remove and deliver faxes to the appropriate person promptly.</div></li><li class="step"><span class="step-num">3</span><div class="step-body">If you receive a fax addressed to someone at Vitalis who is not you, notify that person and deliver the fax as directed by the intended recipient.</div></li><li class="step"><span class="step-num">4</span><div class="step-body">If you receive a fax addressed to someone who is NOT affiliated with Vitalis, notify the sender immediately and destroy or return the material as directed by the sender.</div></li></ol>
</section>

<section class="policy-section" id="conf-notice"><h2 class="section-heading">Confidentiality Notice — Required Text</h2>
<div class="callout callout-note"><div class="callout-label">Required cover sheet language</div><div class="callout-body" style="font-style:italic">Confidentiality Notice: Unless otherwise indicated or obvious from the nature of this transmittal, the information contained in this facsimile message is attorney privileged and confidential information intended for the use of the individual or entity named above. If the reader of this message is not the intended recipient, you are hereby notified that any dissemination, distribution, or copying of this communication is strictly prohibited. If you have received this communication in error, please immediately notify the sender by telephone and return the original message to Vitalis Healthcare Services, LLC via U.S. Postal Service at our expense.</div></div>
</section>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">HIPAA — 45 CFR Parts 160 & 164</span> — Privacy and Security Rules. Governs the use and disclosure of PHI, including transmission by fax. Requires covered entities to implement reasonable safeguards to limit incidental disclosures.</div></div></div><div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.11" target="_blank">COMAR 10.07.05.11</a> — Confidentiality of client information. Requires RSAs to protect the confidentiality of all PHI, including during electronic and fax transmission.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added Sensitive PHI prohibition callout (HIV/AIDS, substance abuse, mental health), named HIPAA Privacy Officer (Administrator — Okezie Ofeogbu), added required confidentiality notice text, plain-language summary. Supersedes legacy 5.005.1.</td></tr><tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 5.005.1). OHCQ license submission version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D5-005"><div class="related-card-id">VHS-D5-005</div><div class="related-card-title">PHI Applications, Usernames & Passwords</div><div class="related-card-domain">D5 · Business Operations</div></a><a class="related-card" href="/pp/VHS-D4-001"><div class="related-card-id">VHS-D4-001</div><div class="related-card-title">Security of Clinical Information</div><div class="related-card-domain">D4 · Clinical Operations</div></a><a class="related-card" href="/pp/VHS-D2-006"><div class="related-card-id">VHS-D2-006</div><div class="related-card-title">Confidentiality</div><div class="related-card-domain">D2 · Human Resources &amp; Workforce</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Compliance & Billing — Somto Illomuanya</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D5-Business-Operations.docx'
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
  'VHS-D5-005', 'D5', 1, 'PHI Applications, Usernames & Passwords', 'Compliance & Billing — Somto Illomuanya', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.11'],
  ARRAY['password', 'username', 'AxisCare', 'PHI', 'HIPAA', 'shared login', 'termination of access', '180 days'],
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D5">D5 · Business Operations</a><span>›</span><span>VHS-D5-005</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D5 · Business Operations</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Compliance & Billing — Somto Illomuanya</span>
    <span class="pill pill-version">VHS-D5-005 · v2.0</span>
  </div>
  <h1 class="doc-title">PHI Applications, Usernames & Passwords</h1>
  <div class="doc-id-line">VHS-D5-005 · Applies to: All Staff</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">45 CFR Parts 160 & 164</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Your AxisCare login and any other system login containing patient information belongs to you alone. Never share it with anyone.</li><li class="wmfy-item">Change your password at least every 180 days. If you don't change it on time, your access will be locked until you do.</li><li class="wmfy-item">Log out of every system containing patient information before you walk away from your computer or device.</li><li class="wmfy-item">Using someone else's password to access patient records — for any reason — is the same as falsifying a medical record. It is grounds for immediate termination.</li><li class="wmfy-item">If your access is not needed for your current job, report it to the Administrator for removal. If you see someone accessing systems they should not be accessing, report it.</li><li class="wmfy-item">When you leave Vitalis, your access to all systems containing PHI is terminated immediately on your last day.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To protect patient health information (PHI) from unauthorized access by establishing strict standards for usernames, passwords, and system access — in compliance with HIPAA Security Rule requirements.</p></div></section>

<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>All access to clinical information systems containing PHI — including AxisCare, the Vitalis Portal, billing systems, email, and any other platform containing patient or business data — is governed by this policy. Password security and verified access are essential to protecting PHI. Only persons who need information to perform their job functions may access it. The Administrator (Privacy Officer) is responsible for granting, reviewing, and terminating all system access.</p></div></section>

<section class="policy-section" id="access-principles"><h2 class="section-heading">Access Principles</h2>
<ul class="bullet-list"><li>Access to applications containing patient data is granted on a need-to-know basis only. Broader access than needed is not granted simply because it is available.</li><li>All covered systems require individual user accounts. Shared logins are prohibited.</li><li>Access to PHI applications must be verified at least every 180 days — during January and July each year. Users must sign both the verification notice and the nondisclosure agreement.</li><li>All covered systems require passwords to be changed at least every 180 days. Users who do not change their passwords on schedule will have access suspended until the change is made.</li><li>Accounts that have not been used for 180 days are automatically suspended.</li></ul>
</section>

<section class="policy-section" id="password-requirements"><h2 class="section-heading">Password Requirements</h2>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body">Passwords are strictly personal and may not be shared with anyone under any circumstances — including supervisors, colleagues, IT support, or family members.</div></li><li class="step"><span class="step-num">2</span><div class="step-body">Change your password at least once every 180 days. Vitalis encourages more frequent changes. Use a password that is not easily guessed and is different from passwords used for personal accounts.</div></li><li class="step"><span class="step-num">3</span><div class="step-body">Log off all PHI applications completely before leaving your workstation, device, or clinical area — even briefly.</div></li><li class="step"><span class="step-num">4</span><div class="step-body">Do not allow any other person to use your login, even if you are present. Do not use your own login to access information on behalf of another person.</div></li><li class="step"><span class="step-num">5</span><div class="step-body">If you suspect your password has been compromised, change it immediately and notify the Administrator.</div></li></ol>
</section>

<section class="policy-section" id="prohibited"><h2 class="section-heading">Prohibited Actions — Grounds for Termination</h2>
<div class="body-text"><p>The following actions are violations of this policy and may result in disciplinary action up to and including immediate termination:</p></div>
<ul class="bullet-list"><li>Sharing your sign-on code or password with anyone</li><li>Using another person's username or password for any purpose</li><li>Using your own credentials to access patient or employee records not related to your job</li><li>Attempting to guess or obtain another person's password</li><li>Accessing secured applications, files, or databases without proper authorization</li><li>Leaving a secured application unattended while signed in</li><li>Using a colleague's logged-in session to access systems you are not authorized to use</li><li>Failing to sign the Information Systems Security Acknowledgment and Nondisclosure Agreement</li><li>Using a patient's or employee's information for any purpose other than legitimate job functions</li><li>Using or attempting to access systems to conduct investigations without proper authorization</li></ul>
<div class="callout callout-warning"><div class="callout-label">⚠ Using Someone Else's Login = Falsifying a Medical Record</div><div class="callout-body">Entering information into a patient's clinical record using another person's credentials constitutes falsification of the medical record — regardless of the accuracy of the information entered. This is a HIPAA violation, a federal offense, and grounds for immediate termination and possible criminal referral.</div></div>
</section>

<section class="policy-section" id="reporting"><h2 class="section-heading">Reporting Unauthorized Access</h2>
<div class="body-text"><p>All users are responsible for reporting any discovered or suspected unauthorized access or improper use of Vitalis systems. If you observe a security violation or have one reported to you:</p></div>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body">Report the situation to the Administrator (Privacy Officer) and, where applicable, to your direct supervisor.</div></li><li class="step"><span class="step-num">2</span><div class="step-body">If the violation involves state or federal law, the Administrator will contact the appropriate agency.</div></li><li class="step"><span class="step-num">3</span><div class="step-body">If you are contacted by an external organization conducting an investigation of an alleged violation involving Vitalis information resources, immediately inform the Administrator. Do not respond to investigators on your own — refer them to the Administrator.</div></li></ol>
</section>

<section class="policy-section" id="termination-access"><h2 class="section-heading">Termination of Access</h2>
<div class="body-text"><p>Upon termination of any Vitalis employee or contractor, the Administrator terminates all access to PHI applications on the employee's last day — or immediately upon notification of termination, whichever comes first. This includes AxisCare, the Vitalis Portal, email, billing systems, and any other systems containing patient or business data.</p></div></section>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">HIPAA Security Rule — 45 CFR Part 164</span> — Access control. Requires covered entities to implement technical policies and procedures for authorized access to electronic PHI. Requires unique user identification, automatic logoff, and audit controls.</div></div></div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">HIPAA Privacy Rule — 45 CFR Part 164</span> — Minimum necessary standard. Requires covered entities to limit access to PHI to the minimum necessary to perform a job function.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added AxisCare-specific access guidance, named Administrator as Privacy Officer, added termination-of-access procedure, falsification callout, plain-language summary. Supersedes legacy 5.006.1.</td></tr><tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 5.006.1). OHCQ license submission version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D5-004"><div class="related-card-id">VHS-D5-004</div><div class="related-card-title">Faxing & PHI Transmission</div><div class="related-card-domain">D5 · Business Operations</div></a><a class="related-card" href="/pp/VHS-D4-001"><div class="related-card-id">VHS-D4-001</div><div class="related-card-title">Security of Clinical Information</div><div class="related-card-domain">D4 · Clinical Operations</div></a><a class="related-card" href="/pp/VHS-D2-006"><div class="related-card-id">VHS-D2-006</div><div class="related-card-title">Confidentiality</div><div class="related-card-domain">D2 · Human Resources &amp; Workforce</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Compliance & Billing — Somto Illomuanya</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D5-Business-Operations.docx'
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
  'VHS-D5-006', 'D5', 1, 'Red Flags Rules & Identity Theft Prevention', 'Compliance & Billing — Somto Illomuanya', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.08'],
  ARRAY['red flags', 'identity theft', 'FTC', 'insurance fraud', 'photo ID', 'Somto Illomuanya', 'admission', 'verification'],
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
@media(max-width:768px){.main-content{padding:0 20px 60px;max-width:100%;}.doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}.doc-meta-grid{grid-template-columns:1fr 1fr;}.approval-block{grid-template-columns:1fr;}}
@media print{.main-content{padding:0;}.doc-banner{margin:0 0 32px;}.ack-btn{display:none;}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content"><div class="main-content">
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D5">D5 · Business Operations</a><span>›</span><span>VHS-D5-006</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D5 · Business Operations</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Compliance & Billing — Somto Illomuanya</span>
    <span class="pill pill-version">VHS-D5-006 · v2.0</span>
  </div>
  <h1 class="doc-title">Red Flags Rules & Identity Theft Prevention</h1>
  <div class="doc-id-line">VHS-D5-006 · Applies to: All Staff</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">FTC Red Flags Rule · 45 CFR Parts 160 & 164</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Identity theft in healthcare is real — someone can use another person's insurance or identity to receive care, leaving the real patient with incorrect records and unpaid bills.</li><li class="wmfy-item">At every new client admission, verify photo ID and insurance card. If something doesn't look right — a photo that doesn't match, a card that looks altered — report it to your supervisor.</li><li class="wmfy-item">If a client says they received a bill for services they didn't get, or that their insurance benefits were used without their knowledge — that is a red flag. Report it immediately to the Billing Officer.</li><li class="wmfy-item">Never try to investigate identity theft yourself. Report it to your supervisor and let the Administrator handle it.</li><li class="wmfy-item">This program is reviewed annually. All staff are trained on it.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>To establish Vitalis Healthcare Services, LLC's Identity Theft Prevention and Detection Program in compliance with the Federal Trade Commission (FTC) Red Flags Rule — enabling staff to identify, detect, and respond to indicators of possible identity theft in patient accounts and records.</p></div></section>

<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Vitalis follows all federal and state laws regarding identity theft prevention and detection. The Administrator (<strong>Okezie Ofeogbu</strong>) is responsible for implementing and maintaining this program. The program is reviewed no less than annually. All staff are trained at hire and updated annually. A "red flag" is any pattern, practice, or specific account activity that indicates possible identity theft.</p></div></section>

<section class="policy-section" id="red-flags"><h2 class="section-heading">Identifying Red Flags</h2>
<div class="body-text"><p>The following are recognized as potential red flags that may indicate identity theft:</p></div>
<ul class="bullet-list"><li>A client receives a bill for another individual, for a service they deny receiving, or from a provider they never visited.</li><li>A client receives an Explanation of Benefits for services they never received.</li><li>A client's medical records show treatment inconsistent with their physical examination or reported history.</li><li>A client receives a collection notice for a medical bill they did not incur.</li><li>A client reports that their insurance benefits have been depleted or a lifetime cap reached for services they never received.</li><li>A client disputes a bill and claims to be a victim of identity theft.</li><li>A client presents an insurance card but never produces physical documentation.</li><li>A notice or inquiry from an insurance fraud investigator or law enforcement agency is received.</li><li>A client's signature on a current form does not match the signature in existing records.</li><li>A photo ID submitted by a client does not match the client's appearance.</li><li>Documents submitted appear to be altered or forged.</li><li>A client fails to provide identifying information when asked.</li><li>An address or phone number on record is discovered to be incorrect, non-existent, or fictitious.</li></ul>
</section>

<section class="policy-section" id="detecting"><h2 class="section-heading">Detecting Red Flags — At Admission</h2>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Care Coordinator / Admissions Staff</span> At every new client admission, ask the client or guardian to present: a valid photo ID (driver's license or other government-issued ID); and a current health insurance or Medicare/Medicaid card.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Care Coordinator</span> Verify that the photo on the ID matches the person presenting it.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Care Coordinator</span> Confirm that information on all documents (name, date of birth, address) is consistent with each other and with information already in the agency's records.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Care Coordinator</span> If any inconsistency is identified, do not proceed with admission. Report the inconsistency to the Administrator immediately.</div></li></ol>
</section>

<section class="policy-section" id="responding"><h2 class="section-heading">Responding to Red Flags</h2>
<div class="body-text"><p><strong>If an employee detects a potential red flag:</strong> (1) Gather all relevant documentation. (2) Report the incident immediately to your supervisor or the Administrator. (3) Do not attempt to investigate on your own.</p></div>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Administrator</span> Determine whether the activity is fraudulent or authentic based on the reported documentation.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Administrator</span> If fraud is confirmed or strongly suspected: notify appropriate law enforcement; notify the affected patient; notify affected physicians; assess the impact on agency records and billing; and apply existing HIPAA security procedures.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Administrator</span> Review the affected patient's medical record for any inaccuracies caused by potential identity theft. If inaccuracies exist, note them clearly in the record.</div></li></ol>
</section>

<section class="policy-section" id="victim-response"><h2 class="section-heading">If a Patient Claims to Be a Victim of Identity Theft</h2>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Any Staff</span> Encourage the patient to file a police report for identity theft if they have not already done so.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Billing — Somto Illomuanya</span> Encourage the patient to complete the FTC ID Theft Affidavit with supporting documentation.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Administrator</span> Compare the patient's documentation with information in Vitalis's records to determine the scope of the identity theft.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Administrator</span> Determine what additional remedial actions or notifications are required under HIPAA and applicable state law. Notify the patient in writing of the determination and any corrective actions taken.</div></li></ol>
</section>

<section class="policy-section" id="training"><h2 class="section-heading">Training &amp; Annual Review</h2>
<div class="body-text"><p>All staff receive training on this policy and the Red Flags Rule at hire. New staff receive training within a reasonable time after joining. Training records include: participant names; date; and subject matter. The Administrator reviews and updates this program annually, incorporating any new red flags identified through the agency's experience or regulatory updates.</p></div></section>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">FTC Red Flags Rule — 16 CFR Part 681</span> — Requires financial institutions and creditors, including healthcare providers who bill insurance or extend credit, to develop and implement identity theft prevention programs.</div></div></div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">HIPAA Security Rule — 45 CFR Part 164</span> — Requires covered entities to implement physical, administrative, and technical safeguards to protect PHI from unauthorized access or disclosure, including identity theft.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Named Administrator (Okezie Ofeogbu) as program owner and Billing Officer (Somto Illomuanya) in patient affidavit process. Added plain-language summary and structured response procedures. Supersedes legacy 5.007.1.</td></tr><tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 5.007.1). OHCQ license submission version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D5-005"><div class="related-card-id">VHS-D5-005</div><div class="related-card-title">PHI Applications, Usernames & Passwords</div><div class="related-card-domain">D5 · Business Operations</div></a><a class="related-card" href="/pp/VHS-D5-001"><div class="related-card-id">VHS-D5-001</div><div class="related-card-title">Billing</div><div class="related-card-domain">D5 · Business Operations</div></a><a class="related-card" href="/pp/VHS-D5-002"><div class="related-card-id">VHS-D5-002</div><div class="related-card-title">Verification of Primary Payer</div><div class="related-card-domain">D5 · Business Operations</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Compliance & Billing — Somto Illomuanya</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D5-Business-Operations.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content=EXCLUDED.html_content, title=EXCLUDED.title, version=EXCLUDED.version,
  effective_date=EXCLUDED.effective_date, review_date=EXCLUDED.review_date,
  applicable_roles=EXCLUDED.applicable_roles, comar_refs=EXCLUDED.comar_refs,
  keywords=EXCLUDED.keywords, status=EXCLUDED.status, updated_at=NOW();
