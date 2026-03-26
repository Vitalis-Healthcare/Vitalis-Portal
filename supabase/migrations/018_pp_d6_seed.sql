-- Migration 018 — P&P D6 Infection Control, Safety & CLIA (v2.0, March 2026 triennial)
-- Run AFTER 012_pp_v2_schema.sql

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D6-001', 'D6', 1, 'Infection &amp; Exposure Control Plan', 'Director of Nursing — Marie Epah (Acting)', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Personnel'],
  ARRAY['10.07.11.13'],
  ARRAY['infection control', 'bloodborne pathogens', 'exposure incident', 'UBSP', 'surveillance', 'OSHA', 'PPE', 'HBV', 'HIV'],
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
.sequence-box{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:18px 20px;margin:16px 0;}
.sequence-row{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
.sequence-row:last-child{margin-bottom:0;}
.seq-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--muted);width:80px;flex-shrink:0;}
.seq-items{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.seq-item{background:var(--navy-light);color:var(--navy);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;}
.seq-arrow{color:var(--teal-mid);font-weight:900;font-size:16px;}
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
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D6">D6 · Infection Control, Safety &amp; CLIA</a><span>›</span><span>VHS-D6-001</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D6 · Infection Control, Safety &amp; CLIA</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah (Acting)</span>
    <span class="pill pill-version">VHS-D6-001 · v2.0</span>
  </div>
  <h1 class="doc-title">Infection &amp; Exposure Control Plan</h1>
  <div class="doc-id-line">VHS-D6-001 · Applies to: All Personnel</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.11.13B</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Treat all blood and body fluids as potentially infectious — every time, with every client.</li><li class="wmfy-item">Wash your hands thoroughly before and after every client contact, even when you wore gloves.</li><li class="wmfy-item">Use the PPE (gloves, mask, gown) your supervisor provides whenever you may contact blood or body fluids.</li><li class="wmfy-item">Report any exposure incident — needlestick, blood splash, or contact with body fluids — to your supervisor immediately. Same day, every time.</li><li class="wmfy-item">Attend the required annual infection control in-service. Attendance is mandatory and documented.</li><li class="wmfy-item">If a client shows signs of a new infection, document it in the care record and notify the supervising nurse.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>Vitalis Healthcare Services, LLC maintains a comprehensive Infection and Exposure Control Plan to protect clients, personnel, and the public through the systematic surveillance, prevention, identification, and control of infections in the home care environment.</p></div></section>

<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Vitalis Healthcare Services, LLC designs, measures, assesses, and improves infection and exposure control functions monthly through its Performance Improvement Plan. The agency complies with all applicable state and federal regulations, including OSHA 29 CFR Part 1910.1030 (Bloodborne Pathogens Standard), the Maryland Communicable Disease Prevention and Control Act, and OHCQ COMAR 10.07.11.</p></div></section>

<section class="policy-section" id="definitions"><h2 class="section-heading">Key Definitions</h2>
<table class="data-table"><thead><tr><th>Term</th><th>Definition</th></tr></thead><tbody>
<tr><td>Bloodborne Pathogens</td><td>Pathogenic microorganisms present in human blood capable of causing disease, including Hepatitis B virus (HBV) and human immunodeficiency virus (HIV).</td></tr>
<tr><td>Body Fluids</td><td>Emesis, sputum, feces, urine, semen, vaginal secretions, cerebrospinal fluid, synovial fluid, pleural fluid, pericardial fluid, amniotic fluid, human breast milk, nasal secretions, saliva, sweat, and tears.</td></tr>
<tr><td>Contaminated Sharps</td><td>Any object capable of cutting or penetrating the skin that has been in contact with blood or body fluids, including needles, scalpels, broken glass, and broken capillary tubes.</td></tr>
<tr><td>Exposure Incident</td><td>A specific eye, mouth, mucous membrane, non-intact skin, or parenteral contact with blood or other potentially infectious material occurring during the course of duties.</td></tr>
<tr><td>UBSP</td><td>Universal Body Substance Precautions — an infection control approach under which all human blood and certain body fluids are treated as if known to be infectious for HIV, HBV, and other bloodborne pathogens.</td></tr>
<tr><td>Regulated Waste</td><td>Liquid or semi-liquid blood or other potentially infectious materials; items caked with dried blood; contaminated sharps; and pathological or microbiological wastes containing blood or other potentially infectious materials.</td></tr>
<tr><td>Engineering Controls</td><td>Controls that isolate or remove a bloodborne pathogen hazard from the workplace, such as sharps disposal containers, self-sheathing needles, and needleless IV systems.</td></tr>
</tbody></table></section>

<section class="policy-section" id="procedures"><h2 class="section-heading">Procedures</h2>

<h3 class="sub-heading">A. Leadership &amp; Team Responsibilities</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Director of Nursing</span> Leads the infection prevention and control team. Assigns additional registered nurses to assist as necessary. Reviews infection control data and reports findings to the Performance Improvement Committee.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">All Personnel</span> Implement infection control policies and procedures as trained. Report any exposure incident, client infection, or infection control concern to the supervising nurse without delay.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Administrator</span> Ensures resources are available for infection control training, PPE supply, and regulatory compliance. Reviews aggregate infection data quarterly.</div></li></ol>

<h3 class="sub-heading">B. Risk Identification &amp; Prioritization</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Director of Nursing</span> Identifies infection risks based on geographic location, community demographics, and the population served. Risk identification also considers the types of services provided by the agency.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Director of Nursing</span> Documents and prioritizes identified risks. Prioritized risks drive the focus of the agency's infection prevention and control activities.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Director of Nursing</span> Reviews and updates the prioritized risk list at least annually or following any significant change in client population, service area, or disease outbreak.</div></li></ol>

<h3 class="sub-heading">C. Surveillance &amp; Documentation</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Supervising RN</span> Monitors for infections acquired by clients during the receipt of agency services. Documentation of any such infection must include: date detected, client name, primary diagnosis, signs and symptoms, infection type, pathogens identified (if known), and treatment initiated.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">All Personnel</span> Record infection observations in the client's clinical record at the time of observation. Notify the supervising RN within the same visit or same day.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Director of Nursing</span> Collects, analyzes, and trends infection control data. Submits findings to the Performance Improvement Committee. Uses data to improve client care and the implementation of the infection control plan.</div></li></ol>

<h3 class="sub-heading">D. Census Management</h3>
<div class="body-text"><p>Vitalis Healthcare Services, LLC elects not to admit an increased number of potentially infected clients. An "increased number" is defined as an increase of more than 25 percentile above the agency's current census of clients with potentially infectious conditions.</p></div>

<h3 class="sub-heading">E. Training Requirements</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Orientation</span> All new personnel receive training on Universal Body Substance Precautions and infection control responsibilities during initial orientation, before providing client care.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Annual In-Service</span> Infection control in-services are scheduled no less than annually. Attendance is mandatory for all direct care personnel and shall be documented. Records of attendance are maintained in the personnel file.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">External Training</span> Verification of attendance at an equivalent infection control in-service from another institution will be accepted, provided it was completed within the same calendar year.</div></li></ol>

</section>

<div class="callout callout-warning"><div class="callout-label">⚠ Compliance Notice</div><div class="callout-body">Failure to report an exposure incident within the required timeframe may compromise the employee's eligibility for post-exposure prophylaxis and may constitute a violation of agency policy subject to disciplinary action.</div></div>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.11.13" target="_blank">COMAR 10.07.11.13B</a> — Infection prevention and control requirements for RSAs.</div></div></div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">OSHA 29 CFR 1910.1030</span> — Bloodborne Pathogens Standard.</div></div></div><div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">MD Health &amp; Safety Code Ch. 81</span> — Communicable Disease Prevention and Control Act.</div></div></div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">CDC Standard Precautions</span> — Guidelines for isolation precautions in healthcare settings.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Expanded definitions, restructured procedures into labelled sections, added compliance notice. Supersedes legacy 7.001.1.</td></tr><tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 7.001.1). OHCQ license submission version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D6-004"><div class="related-card-id">VHS-D6-004</div><div class="related-card-title">PPE & Universal/Standard Precautions</div><div class="related-card-domain">D6 · Infection Control, Safety &amp; CLIA</div></a><a class="related-card" href="/pp/VHS-D6-003"><div class="related-card-id">VHS-D6-003</div><div class="related-card-title">Safety & Incident Management</div><div class="related-card-domain">D6 · Infection Control, Safety &amp; CLIA</div></a><a class="related-card" href="/pp/VHS-D4-014"><div class="related-card-id">VHS-D4-014</div><div class="related-card-title">Patient & Family Education</div><div class="related-card-domain">D4 · Clinical Operations</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah (Acting)</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D6-Infection-Control-Safety-CLIA.docx'
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
  'VHS-D6-002', 'D6', 1, 'CLIA Waived Testing Program', 'Director of Nursing — Marie Epah (Acting)', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Designated Direct Care Personnel'],
  ARRAY['10.07.11.14'],
  ARRAY['CLIA', 'waived testing', 'blood glucose', 'urinalysis', 'quality control', 'competency', '9 months', '2 years'],
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
.sequence-box{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:18px 20px;margin:16px 0;}
.sequence-row{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
.sequence-row:last-child{margin-bottom:0;}
.seq-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--muted);width:80px;flex-shrink:0;}
.seq-items{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.seq-item{background:var(--navy-light);color:var(--navy);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;}
.seq-arrow{color:var(--teal-mid);font-weight:900;font-size:16px;}
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
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D6">D6 · Infection Control, Safety &amp; CLIA</a><span>›</span><span>VHS-D6-002</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D6 · Infection Control, Safety &amp; CLIA</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah (Acting)</span>
    <span class="pill pill-version">VHS-D6-002 · v2.0</span>
  </div>
  <h1 class="doc-title">CLIA Waived Testing Program</h1>
  <div class="doc-id-line">VHS-D6-002 · Applies to: All Designated Direct Care Personnel</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.11.14</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">You may only perform CLIA waived tests if you have been specifically trained and cleared by the CLIA Waiver designee — never perform a test you have not been trained on.</li><li class="wmfy-item">If you have not performed a specific test in the last 9 months, you must be retrained and pass competency before doing it again.</li><li class="wmfy-item">Always follow the manufacturer's instructions exactly and check expiration dates before every use.</li><li class="wmfy-item">Document all test results in the client's medical record and report them to the supervising nurse and physician as directed.</li><li class="wmfy-item">If a result is out of normal range, repeat the test as directed and notify the supervising nurse immediately.</li><li class="wmfy-item">Quality control results must be documented and retained for a minimum of 2 years.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>This policy defines the agency's CLIA Waived Testing Program, establishing accountability, training requirements, testing procedures, and equipment management standards to ensure accurate, safe, and compliant point-of-care testing in the home setting.</p></div></section>

<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Vitalis Healthcare Services, LLC holds a Certificate of Waiver under the Clinical Laboratory Improvement Amendments (CLIA) and performs only those tests listed on the waiver. The person named on the CLIA Waiver is solely responsible for the oversight, integrity, and compliance of the waived testing program.</p></div></section>

<section class="policy-section" id="approved-tests"><h2 class="section-heading">Approved CLIA Waived Tests</h2>
<div class="body-text"><p>The following tests are approved for performance by designated agency personnel under the CLIA Certificate of Waiver:</p></div>
<ul class="bullet-list"><li>Dipstick or tablet reagent urinalysis (non-automated) — bilirubin, glucose, hemoglobin, ketone, leukocytes, nitrite, protein, specific gravity, urobilinogen</li><li>Fecal occult blood</li><li>Ovulation tests — visual color comparison tests for luteinizing hormone</li><li>Urine pregnancy tests — visual color comparison tests</li><li>Erythrocyte sedimentation rate (non-automated)</li><li>Hemoglobin — copper sulfate method (non-automated)</li><li>Blood glucose — by glucose monitoring devices cleared by the FDA specifically for home use</li><li>Spun microhematocrit</li><li>Hemoglobin — by single analyte instruments with self-contained features that provide direct measurement and readout</li></ul>
<div class="callout callout-warning"><div class="callout-label">⚠ Important — Test List Is Exhaustive</div><div class="callout-body">Tests not listed above may NOT be performed under this certificate. Any newly proposed test must be submitted to the CLIA Waiver designee for approval and addition to the certificate before use.</div></div>
</section>

<section class="policy-section" id="procedures"><h2 class="section-heading">Procedures</h2>

<h3 class="sub-heading">A. Program Administration</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">CLIA Waiver Designee</span> Maintains the Certificate of Waiver and ensures it is renewed as directed by the certifying authority. Displays the certificate in a prominent place at the agency office.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">CLIA Waiver Designee</span> Maintains a current list of all personnel authorized to perform waived tests and updates it whenever staff are added or removed from the program.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Administrator</span> Ensures the agency has adequate resources to support a compliant waived testing program, including current test supplies, calibrated equipment, and updated manufacturer documentation.</div></li></ol>

<h3 class="sub-heading">B. Education &amp; Competency</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">CLIA Waiver Designee</span> Trains all designated direct care staff on each waived test before that staff member performs the test on a client. Training covers the purpose of the test, the procedure, quality control steps, and documentation requirements.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">CLIA Waiver Designee</span> Supervises each staff member through an adequate number of practice procedures using actual test materials or instruments before the staff member is permitted to perform independently.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">CLIA Waiver Designee</span> Conducts continued competency assessment as needed, with a minimum annual review or training session for each authorized test.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Designated Personnel</span> Must not perform a waived test if they have not performed it within the preceding <strong>9 months</strong> without first completing retraining and demonstrating competency to the CLIA Waiver designee.</div></li><li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">CLIA Waiver Designee</span> Maintains all education and competency testing records. Records must be current and available for inspection upon request by OHCQ or CMS surveyors.</div></li></ol>

<h3 class="sub-heading">C. Testing Process</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Designated Personnel</span> Perform all waived tests in accordance with the manufacturer's instructions for the specific test and instrument. Deviations from manufacturer instructions are not permitted.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Designated Personnel</span> Label all specimens accurately and legibly at the time of collection, before leaving the client's presence.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Designated Personnel</span> Check expiration dates on all test materials before use. Do not use expired materials. Dispose of expired items according to waste disposal procedures.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Designated Personnel</span> Document results of all waived tests in the client's clinical record at the time of testing.</div></li><li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">Designated Personnel</span> Report all results to the supervising nurse and, as directed in the plan of care, to the attending physician or case manager.</div></li><li class="step"><span class="step-num">6</span><div class="step-body"><span class="role-tag">Designated Personnel</span> Perform repeat testing when results are out of normal range and document the repeat test and its result in the clinical record.</div></li><li class="step"><span class="step-num">7</span><div class="step-body"><span class="role-tag">Designated Personnel</span> Direct any questions or concerns about test procedures or results to the supervising nurse or the CLIA Waiver designee immediately.</div></li></ol>

<h3 class="sub-heading">D. Equipment Performance &amp; Quality Control</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Designated Personnel / CLIA Waiver Designee</span> Maintain all waived testing equipment according to the manufacturer's manual, including quality control checks. Each instrument must have its own documented maintenance log.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Designated Personnel</span> Perform quality control procedures according to the manufacturer's recommended timeline. Do not extend testing beyond the manufacturer's suggested interval.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">CLIA Waiver Designee</span> Store the manufacturer's manual for each instrument in a centralized, easily accessible location at the agency.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Designated Personnel</span> Store all test components as directed by the manufacturer. Temperature-sensitive materials must be stored in appropriately controlled conditions.</div></li><li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">CLIA Waiver Designee</span> Retain quality control results documentation for a minimum of <strong>2 years</strong> and make records available to surveyors upon request.</div></li></ol>

<h3 class="sub-heading">E. Contracted Laboratories</h3>
<div class="body-text"><p>Reference and contract laboratories used by Vitalis Healthcare Services, LLC must meet federal regulations for clinical laboratories and must maintain evidence of such compliance. The agency will verify laboratory qualifications at least annually.</p></div>

</section>

<div class="callout callout-warning"><div class="callout-label">⚠ Regulatory Notice</div><div class="callout-body">Performing a CLIA waived test without documented training and competency, or performing a non-waived test under the Certificate of Waiver, constitutes a serious violation of federal law (42 CFR Part 493) and agency policy. Violations will be addressed under the Employee Discipline policy (VHS-D2-014).</div></div>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">42 CFR Part 493</span> — CLIA regulations — laboratory requirements.</div></div></div><div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.11.14" target="_blank">COMAR 10.07.11.14</a> — Clinical service standards for RSAs.</div></div></div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">OHCQ Certificate of Waiver</span> — Vitalis Healthcare Services, LLC CLIA certificate on file.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Expanded approved test list, added 9-month retraining rule, structured competency and QC procedures into labelled sections. Supersedes legacy 7.001.2.</td></tr><tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 7.001.2). OHCQ license submission version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D6-001"><div class="related-card-id">VHS-D6-001</div><div class="related-card-title">Infection & Exposure Control Plan</div><div class="related-card-domain">D6 · Infection Control, Safety &amp; CLIA</div></a><a class="related-card" href="/pp/VHS-D4-010"><div class="related-card-id">VHS-D4-010</div><div class="related-card-title">Medication Management — Profile, MAR & Orders</div><div class="related-card-domain">D4 · Clinical Operations</div></a><a class="related-card" href="/pp/VHS-D2-014"><div class="related-card-id">VHS-D2-014</div><div class="related-card-title">Professional Standards & Conduct</div><div class="related-card-domain">D2 · Human Resources &amp; Workforce</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah (Acting)</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D6-Infection-Control-Safety-CLIA.docx'
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
  'VHS-D6-003', 'D6', 1, 'Safety &amp; Incident Management', 'Director of Nursing — Marie Epah (Acting)', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Personnel'],
  ARRAY['10.07.11.13'],
  ARRAY['incident report', 'adverse event', 'near-miss', 'sentinel event', 'root cause analysis', 'OSHA', 'non-retaliation', '90 days'],
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
.sequence-box{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:18px 20px;margin:16px 0;}
.sequence-row{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
.sequence-row:last-child{margin-bottom:0;}
.seq-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--muted);width:80px;flex-shrink:0;}
.seq-items{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.seq-item{background:var(--navy-light);color:var(--navy);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;}
.seq-arrow{color:var(--teal-mid);font-weight:900;font-size:16px;}
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
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D6">D6 · Infection Control, Safety &amp; CLIA</a><span>›</span><span>VHS-D6-003</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D6 · Infection Control, Safety &amp; CLIA</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah (Acting)</span>
    <span class="pill pill-version">VHS-D6-003 · v2.0</span>
  </div>
  <h1 class="doc-title">Safety &amp; Incident Management</h1>
  <div class="doc-id-line">VHS-D6-003 · Applies to: All Personnel</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.11.13</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">If anything goes wrong — a client falls, you are injured, there is a medication error, or any near-miss — report it to your supervisor the same day, no exceptions.</li><li class="wmfy-item">Complete an incident report for every adverse event and every near-miss. Reporting protects you, the client, and the agency.</li><li class="wmfy-item">You will never be disciplined for reporting an honest incident in good faith. Safety reporting is expected and required.</li><li class="wmfy-item">Do not alter, delete, or delay an incident report. Submit it accurately and promptly.</li><li class="wmfy-item">If a client or someone in the home is in immediate danger, call 911 first, then notify your supervisor.</li><li class="wmfy-item">All incident data is reviewed to identify patterns and prevent future harm — your report matters.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>This policy establishes a systematic, non-punitive framework for identifying, reporting, investigating, and resolving safety incidents involving clients, personnel, and visitors, in order to prevent harm and continuously improve the safety of care.</p></div></section>

<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Vitalis Healthcare Services, LLC is committed to a culture of safety in which all personnel are empowered and expected to report safety concerns without fear of retaliation. Every incident is an opportunity to learn and improve. The agency maintains a non-punitive reporting environment consistent with best practices in patient safety and OHCQ standards.</p></div></section>

<section class="policy-section" id="definitions"><h2 class="section-heading">Definitions</h2>
<table class="data-table"><thead><tr><th>Term</th><th>Definition</th></tr></thead><tbody>
<tr><td>Adverse Event</td><td>An unintended injury or complication resulting from care delivery rather than from the client's underlying condition, including falls, medication errors, infections acquired during care, and pressure injuries.</td></tr>
<tr><td>Near-Miss</td><td>An event or situation that did not produce client injury but had the potential to do so. Near-misses receive the same reporting and review attention as adverse events.</td></tr>
<tr><td>Sentinel Event</td><td>A serious unexpected occurrence involving death, serious physical or psychological injury, or the risk thereof. Sentinel events require immediate notification of the Administrator and Director of Nursing and a formal root cause analysis.</td></tr>
<tr><td>Root Cause Analysis (RCA)</td><td>A structured method for identifying the fundamental causes of an incident in order to implement systemic improvements and prevent recurrence.</td></tr>
</tbody></table></section>

<section class="policy-section" id="procedures"><h2 class="section-heading">Procedures</h2>

<h3 class="sub-heading">A. Immediate Response</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Personnel — First on Scene</span> Ensure the immediate safety of the client and any others present. If there is an imminent threat to life or safety, call <strong>911</strong> before any other action.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Personnel — First on Scene</span> Provide first aid or basic emergency care within the scope of your role while awaiting emergency services or supervisor guidance.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Personnel — First on Scene</span> Notify the supervising nurse or on-call supervisor by phone as soon as the client is stabilized. Do not leave the client unattended in an unsafe condition.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Supervising RN</span> Assess the client's condition. Notify the attending physician and, where applicable, the client's legal representative or emergency contact.</div></li></ol>

<h3 class="sub-heading">B. Incident Reporting</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Personnel</span> Complete an incident report for every adverse event and every near-miss using the approved Vitalis incident report form, available at <a href="https://www.vitalishealthcare.com/forms" target="_blank">www.vitalishealthcare.com/forms</a>.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Personnel</span> Submit the completed incident report to the supervising nurse no later than the end of the calendar day on which the incident occurred.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Supervising RN</span> Review the incident report for completeness and accuracy. Enter the incident into the agency's AxisCare quality tracking system within 24 hours.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Director of Nursing</span> Review all incident reports. Classify the severity of each incident. Initiate a root cause analysis for any sentinel event, significant adverse event, or pattern of recurring incidents.</div></li><li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">Administrator</span> Notified immediately of all sentinel events and any incident requiring external reporting (see Section C).</div></li></ol>

<h3 class="sub-heading">C. External Reporting Requirements</h3>
<div class="body-text"><p>The following incidents must be reported to external authorities within the timeframes specified:</p></div>
<table class="data-table"><thead><tr><th>Authority</th><th>Trigger</th><th>Timeframe</th></tr></thead><tbody>
<tr><td>OHCQ</td><td>Any serious adverse event, client death under unusual or unexpected circumstances, or pattern of incidents inconsistent with normal disease progression</td><td>Within 24 hours of discovery</td></tr>
<tr><td>MD Dept. of Aging / Local DSS</td><td>Any reasonable suspicion of client abuse, neglect, or exploitation</td><td>Immediately — per VHS-D3-004</td></tr>
<tr><td>OSHA</td><td>Work-related fatalities</td><td>Within 8 hours — via phone or osha.gov</td></tr>
<tr><td>OSHA</td><td>Work-related inpatient hospitalizations, amputations, or loss of eye</td><td>Within 24 hours</td></tr>
<tr><td>Law Enforcement</td><td>Any incident involving a crime committed against a client or employee in the course of providing care</td><td>Immediately — also notify Administrator</td></tr>
</tbody></table>
<div class="callout callout-warning"><div class="callout-label">⚠ Compliance Notice</div><div class="callout-body">Failure to report a required external incident within the mandated timeframe may result in regulatory penalties against the agency and disciplinary action against the responsible employee. When in doubt, report.</div></div>

<h3 class="sub-heading">D. Investigation &amp; Root Cause Analysis</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Director of Nursing</span> For each reportable adverse event, conducts or assigns a structured review within <strong>5 business days</strong>. Review includes: timeline reconstruction, contributing factors, equipment or environmental conditions, and staff actions.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Director of Nursing</span> For sentinel events, convenes a multidisciplinary root cause analysis team within <strong>7 calendar days</strong>. RCA findings and corrective action plan are documented and submitted to the Administrator.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Administrator</span> Reviews corrective action plans. Approves resource commitments for systemic improvements. Communicates outcomes to the Ethics Committee and Performance Improvement Committee as appropriate.</div></li></ol>

<h3 class="sub-heading">E. Corrective Action &amp; Follow-Up</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Director of Nursing / Care Coordinator</span> Implements approved corrective actions within the timeframes specified in the corrective action plan.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Director of Nursing</span> Monitors for recurrence of similar incidents for <strong>90 days</strong> following the corrective action implementation date.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Performance Improvement Committee</span> Reviews aggregate incident data quarterly. Identifies trends and makes recommendations for systemic safety improvements.</div></li></ol>

<h3 class="sub-heading">F. Non-Retaliation</h3>
<div class="body-text"><p>No personnel member shall be subjected to retaliation, disciplinary action, or adverse employment consequences for reporting a safety incident, near-miss, or unsafe condition in good faith. Personnel who engage in good-faith reporting are protected under this policy and applicable Maryland law. Intentional falsification of incident reports or willful failure to report a known incident is a separate matter and subject to disciplinary action.</p></div>

</section>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.11.13" target="_blank">COMAR 10.07.11.13</a> — Quality assurance and safety requirements for RSAs.</div></div></div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">OSHA 29 CFR 1904</span> — Recording and reporting occupational injuries and illnesses.</div></div></div><div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">MD Health-Gen. § 19-1606</span> — Home health agency quality standards.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>New policy — no legacy equivalent. Establishes non-punitive safety reporting framework, external reporting timeframe table, sentinel event and RCA procedures, and 90-day follow-up monitoring requirement.</td></tr><tr><td>v1.0</td><td>—</td><td>No prior version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D6-001"><div class="related-card-id">VHS-D6-001</div><div class="related-card-title">Infection & Exposure Control Plan</div><div class="related-card-domain">D6 · Infection Control, Safety &amp; CLIA</div></a><a class="related-card" href="/pp/VHS-D6-004"><div class="related-card-id">VHS-D6-004</div><div class="related-card-title">PPE & Universal/Standard Precautions</div><div class="related-card-domain">D6 · Infection Control, Safety &amp; CLIA</div></a><a class="related-card" href="/pp/VHS-D3-004"><div class="related-card-id">VHS-D3-004</div><div class="related-card-title">Reporting Abuse, Neglect & Exploitation</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah (Acting)</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D6-Infection-Control-Safety-CLIA.docx'
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
  'VHS-D6-004', 'D6', 1, 'PPE &amp; Universal/Standard Precautions', 'Director of Nursing — Marie Epah (Acting)', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Direct Care Personnel'],
  ARRAY['10.07.11.13'],
  ARRAY['PPE', 'gloves', 'hand hygiene', 'sharps', 'gown', 'N95', 'donning', 'doffing', 'exposure', 'bloodborne pathogens', 'OSHA'],
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
.sequence-box{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:18px 20px;margin:16px 0;}
.sequence-row{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
.sequence-row:last-child{margin-bottom:0;}
.seq-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--muted);width:80px;flex-shrink:0;}
.seq-items{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.seq-item{background:var(--navy-light);color:var(--navy);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;}
.seq-arrow{color:var(--teal-mid);font-weight:900;font-size:16px;}
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
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D6">D6 · Infection Control, Safety &amp; CLIA</a><span>›</span><span>VHS-D6-004</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D6 · Infection Control, Safety &amp; CLIA</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah (Acting)</span>
    <span class="pill pill-version">VHS-D6-004 · v2.0</span>
  </div>
  <h1 class="doc-title">PPE &amp; Universal/Standard Precautions</h1>
  <div class="doc-id-line">VHS-D6-004 · Applies to: All Direct Care Personnel</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.11.13B</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Treat all blood and body fluids as potentially infectious — assume risk with every client, every visit.</li><li class="wmfy-item">Gloves are required whenever you may contact blood, wounds, body fluids, mucous membranes, or non-intact skin. Change gloves between tasks on the same client and between clients.</li><li class="wmfy-item">Wash your hands with soap and water for at least 20 seconds before and after every client contact, after removing gloves, and after touching potentially contaminated surfaces. Use hand sanitizer when soap and water are not available.</li><li class="wmfy-item">Vitalis provides PPE to you at no cost. If your supply is low, contact your care coordinator before your next visit.</li><li class="wmfy-item">Never recap a used needle with two hands. Use the one-handed scoop technique or a mechanical recapping device.</li><li class="wmfy-item">Dispose of sharps immediately after use in an approved puncture-resistant sharps container. Never overfill a sharps container.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>This policy establishes the minimum requirements for the use of personal protective equipment (PPE) and the application of Universal/Standard Precautions by all direct care personnel of Vitalis Healthcare Services, LLC, in order to protect employees, clients, and the public from exposure to bloodborne pathogens and other potentially infectious materials.</p></div></section>

<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Vitalis Healthcare Services, LLC requires all direct care personnel to apply Universal/Standard Precautions during every client interaction. Standard Precautions treat blood, all body fluids (regardless of visible blood), non-intact skin, and mucous membranes as potentially infectious. Standard Precautions are the foundation of infection prevention in the home care setting and are applied regardless of a client's known diagnosis or infection status.</p>
<p>The agency provides all required PPE to employees at no cost and ensures adequate supplies are maintained. Personnel are responsible for using PPE correctly and for immediately reporting any supply shortage to their care coordinator.</p></div></section>

<section class="policy-section" id="procedures"><h2 class="section-heading">Procedures</h2>

<h3 class="sub-heading">A. Hand Hygiene</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">All Personnel</span> Perform hand hygiene with soap and water for a minimum of <strong>20 seconds</strong> in each of the following situations: before and after direct client contact; before and after performing any invasive procedure; before and after applying or removing gloves; after contact with blood, body fluids, or potentially contaminated surfaces; after removing PPE; before preparing or administering medications; and after using the restroom.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">All Personnel</span> When soap and water are not immediately available, use an alcohol-based hand sanitizer (minimum 60% alcohol) and rub hands together until dry. Soap and water must be used when hands are visibly soiled and after contact with Clostridioides difficile (C. diff).</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">All Personnel</span> Do not wear artificial nails or nail extenders when providing direct patient care. Keep natural nails trimmed to 1/4 inch or less.</div></li></ol>

<h3 class="sub-heading">B. Gloves</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">All Personnel</span> Wear gloves when anticipating contact with blood, body fluids, secretions, excretions, mucous membranes, non-intact skin, or contaminated equipment or surfaces.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">All Personnel</span> Change gloves between tasks on the same client if the hands will move from a contaminated body site to a clean one.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">All Personnel</span> Remove gloves before leaving the client's immediate care area. Remove by turning them inside-out to contain contamination.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">All Personnel</span> Perform hand hygiene immediately after removing gloves. Gloves do not replace hand hygiene.</div></li><li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">All Personnel</span> Do not reuse disposable gloves. Use a fresh pair for each procedure and each client contact.</div></li></ol>

<h3 class="sub-heading">C. Masks, Eye Protection &amp; Face Shields</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">All Personnel</span> Wear a mask and eye protection (goggles or face shield) during any procedure likely to generate splashes or sprays of blood, body fluids, secretions, or excretions. Examples include: wound irrigation, suctioning, tracheostomy care, and oral care for clients with active bleeding.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">All Personnel</span> Wear a surgical mask when caring for a client under Droplet Precautions as directed by the care plan or supervising RN.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">All Personnel</span> Wear a fit-tested N95 respirator (or higher) when caring for a client under Airborne Precautions (e.g., suspected or confirmed tuberculosis, measles, chickenpox). N95 use requires prior fit testing — contact the Director of Nursing if fit testing has not been completed.</div></li></ol>

<h3 class="sub-heading">D. Gowns &amp; Protective Clothing</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">All Personnel</span> Wear a gown to protect skin and clothing during procedures likely to generate splashes or sprays, or when extensive contact with the client's environment is anticipated (e.g., wound care with heavy exudate, bathing a client with active diarrhea).</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">All Personnel</span> Remove the gown before leaving the client's room or immediate care area. Roll the gown inside-out to contain contamination and discard in an appropriate waste receptacle.</div></li></ol>

<h3 class="sub-heading">E. Donning &amp; Doffing Sequence</h3>
<div class="body-text"><p>Follow this sequence to minimize cross-contamination:</p></div>
<div class="sequence-box">
  <div class="sequence-row">
    <span class="seq-label">Donning</span>
    <div class="seq-items">
      <span class="seq-item">Gown</span><span class="seq-arrow">→</span>
      <span class="seq-item">Mask / Respirator</span><span class="seq-arrow">→</span>
      <span class="seq-item">Eye Protection / Face Shield</span><span class="seq-arrow">→</span>
      <span class="seq-item">Gloves</span>
    </div>
  </div>
  <div class="sequence-row">
    <span class="seq-label">Doffing</span>
    <div class="seq-items">
      <span class="seq-item">Gloves</span><span class="seq-arrow">→</span>
      <span class="seq-item">Eye Protection / Face Shield</span><span class="seq-arrow">→</span>
      <span class="seq-item">Gown</span><span class="seq-arrow">→</span>
      <span class="seq-item">Mask / Respirator</span><span class="seq-arrow">→</span>
      <span class="seq-item">Hand Hygiene</span>
    </div>
  </div>
</div>

<h3 class="sub-heading">F. Sharps Safety</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">All Personnel</span> Never recap a used needle using a two-handed technique. Use the one-handed scoop technique or a mechanical safety device.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">All Personnel</span> Place all used sharps — needles, lancets, scalpel blades — immediately and directly into an approved puncture-resistant, leak-proof sharps disposal container after use. Do not place sharps on countertops or other surfaces.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">All Personnel</span> Never reach blindly into a sharps container. Do not fill a sharps container beyond the indicated fill line (typically 3/4 full).</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">All Personnel</span> Arrange for disposal of filled sharps containers in accordance with agency procedures and local regulations. Contact the supervising RN or care coordinator for disposal instructions.</div></li><li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">All Personnel</span> Report all needlestick or sharps injuries immediately to the supervising RN and the Administrator. Complete an incident report (<a href="/pp/VHS-D6-003">VHS-D6-003</a>). Seek medical evaluation as directed.</div></li></ol>

<h3 class="sub-heading">G. Waste Disposal</h3>
<ul class="bullet-list"><li><strong>Regulated waste</strong> (soiled dressings, contaminated disposables with visible blood or body fluids): place in a sealed, labeled biohazard bag. Contact the supervising RN for approved disposal arrangements.</li><li><strong>Contaminated laundry</strong>: handle as little as possible. Bag at the point of use in a leak-proof bag. Do not sort or rinse contaminated laundry in the client's home unless specifically instructed by the supervising RN.</li><li><strong>General waste</strong> not contaminated with blood or body fluids: standard household trash disposal is appropriate.</li></ul>

<h3 class="sub-heading">H. Exposure Incidents</h3>
<ol class="steps"><li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Exposed Personnel</span> Immediately wash the exposed area thoroughly. For skin: soap and water. For mucous membranes: flush with water.</div></li><li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Exposed Personnel</span> Notify the supervising RN and Administrator immediately — same day, same shift.</div></li><li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Supervising RN / Administrator</span> Arrange for post-exposure medical evaluation and, where indicated, post-exposure prophylaxis (PEP). Time is critical for PEP effectiveness.</div></li><li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Personnel</span> Complete an incident report (<a href="/pp/VHS-D6-003">VHS-D6-003</a>) and cooperate fully with the exposure investigation.</div></li></ol>

</section>

<div class="callout callout-warning"><div class="callout-label">⚠ Compliance Notice</div><div class="callout-body">Failure to use required PPE in situations where it is indicated constitutes a violation of OSHA Bloodborne Pathogens standards (29 CFR 1910.1030) and agency policy. Repeated non-compliance will be addressed under the Employee Discipline policy (VHS-D2-014).</div></div>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">OSHA 29 CFR 1910.1030</span> — Bloodborne Pathogens Standard — PPE and engineering controls.</div></div></div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">CDC Standard Precautions</span> — Isolation precautions in healthcare settings (2007, updated).</div></div></div><div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.11.13" target="_blank">COMAR 10.07.11.13B</a> — Infection prevention requirements for RSAs.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>New policy — no legacy equivalent. Establishes full PPE framework, donning/doffing sequence, hand hygiene standards, sharps safety, waste disposal, and exposure incident response procedure.</td></tr><tr><td>v1.0</td><td>—</td><td>No prior version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D6-001"><div class="related-card-id">VHS-D6-001</div><div class="related-card-title">Infection & Exposure Control Plan</div><div class="related-card-domain">D6 · Infection Control, Safety &amp; CLIA</div></a><a class="related-card" href="/pp/VHS-D6-003"><div class="related-card-id">VHS-D6-003</div><div class="related-card-title">Safety & Incident Management</div><div class="related-card-domain">D6 · Infection Control, Safety &amp; CLIA</div></a><a class="related-card" href="/pp/VHS-D2-014"><div class="related-card-id">VHS-D2-014</div><div class="related-card-title">Professional Standards & Conduct</div><div class="related-card-domain">D2 · Human Resources &amp; Workforce</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah (Acting)</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D6-Infection-Control-Safety-CLIA.docx'
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
  'VHS-D6-005', 'D6', 1, 'Administration of Blood', 'Director of Nursing — Marie Epah (Acting)', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Personnel'],
  ARRAY['10.07.11.14'],
  ARRAY['blood administration', 'blood products', 'scope limitation', 'transfusion', 'prohibited'],
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
.sequence-box{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:18px 20px;margin:16px 0;}
.sequence-row{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
.sequence-row:last-child{margin-bottom:0;}
.seq-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--muted);width:80px;flex-shrink:0;}
.seq-items{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.seq-item{background:var(--navy-light);color:var(--navy);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;}
.seq-arrow{color:var(--teal-mid);font-weight:900;font-size:16px;}
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
<nav class="breadcrumb"><a href="/pp">Policy Library</a><span>›</span><a href="/pp/domain/D6">D6 · Infection Control, Safety &amp; CLIA</a><span>›</span><span>VHS-D6-005</span></nav>
<div class="doc-banner"><div class="doc-banner-top"><div>
  <div class="doc-meta-pills">
    <span class="pill pill-domain">D6 · Infection Control, Safety &amp; CLIA</span>
    <span class="pill pill-tier">Tier 1 · Policy</span>
    <span class="pill pill-owner">Owner: Director of Nursing — Marie Epah (Acting)</span>
    <span class="pill pill-version">VHS-D6-005 · v2.0</span>
  </div>
  <h1 class="doc-title">Administration of Blood</h1>
  <div class="doc-id-line">VHS-D6-005 · Applies to: All Personnel</div>
</div><button class="ack-btn" id="ack-btn">Acknowledge reading</button></div>
<div class="doc-meta-grid">
  <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
  <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
  <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.11.14</div></div>
</div></div>

<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Vitalis Healthcare Services, LLC does not administer blood or blood products. This is not a service we provide.</li><li class="wmfy-item">If a client needs a blood transfusion, the care coordinator will assist with arranging that service through the appropriate provider or facility.</li><li class="wmfy-item">Do not attempt to administer blood or blood products under any circumstances, even if asked by a client, family member, or physician.</li></ul></div>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2>
<div class="body-text"><p>This policy clearly defines the scope of blood administration services at Vitalis Healthcare Services, LLC.</p></div></section>

<section class="policy-section" id="policy-statement"><h2 class="section-heading">Policy Statement</h2>
<div class="body-text"><p>Vitalis Healthcare Services, LLC <strong>does not administer blood or blood products.</strong> Personnel of this agency are not authorized to initiate, monitor, or manage blood transfusions under any circumstances.</p>
<p>Clients who require blood administration must receive that service in an acute care facility, infusion center, or through another licensed home health provider that is specifically credentialed and equipped to perform blood administration.</p>
<p>When a client's plan of care indicates a need for blood administration, the care coordinator will contact the referring physician and case manager to arrange the appropriate level of care or referral to a qualified provider.</p></div>
<div class="callout callout-warning"><div class="callout-label">⚠ Scope Limitation — No Exceptions</div><div class="callout-body">No Vitalis Healthcare Services, LLC employee or contractor is authorized to administer blood or blood products under any circumstances. Requests for blood administration must be immediately escalated to the Director of Nursing and the Administrator.</div></div>
</section>

<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory References</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div><div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.11.14" target="_blank">COMAR 10.07.11.14</a> — Scope of clinical services for RSAs.</div></div></div><div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">Related: VHS-D1-002</span> — Services Offered — authorized scope of service.</div></div></div></div>
</section>

<section class="policy-section" id="history"><h2 class="section-heading">Version History</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>New policy — no legacy equivalent. Establishes explicit prohibition on blood administration and defines escalation pathway.</td></tr><tr><td>v1.0</td><td>—</td><td>No prior version.</td></tr></tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D1-002"><div class="related-card-id">VHS-D1-002</div><div class="related-card-title">Services Offered</div><div class="related-card-domain">D1 · Governance &amp; Compliance</div></a><a class="related-card" href="/pp/VHS-D4-004"><div class="related-card-id">VHS-D4-004</div><div class="related-card-title">Physician Orders & Plan of Care</div><div class="related-card-domain">D4 · Clinical Operations</div></a><a class="related-card" href="/pp/VHS-D6-003"><div class="related-card-id">VHS-D6-003</div><div class="related-card-title">Safety & Incident Management</div><div class="related-card-domain">D6 · Infection Control, Safety &amp; CLIA</div></a></div></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2><div class="approval-block">
  <div class="approval-item"><div class="approval-role">Prepared By</div><div class="approval-name">Director of Nursing — Marie Epah (Acting)</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="approval-item"><div class="approval-role">Approved By</div><div class="approval-name">Okezie Ofeogbu — Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div></section>
</div></main>$VITALIS_HTML$,
  'active', 'VHS-D6-Infection-Control-Safety-CLIA.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content=EXCLUDED.html_content, title=EXCLUDED.title, version=EXCLUDED.version,
  effective_date=EXCLUDED.effective_date, review_date=EXCLUDED.review_date,
  applicable_roles=EXCLUDED.applicable_roles, comar_refs=EXCLUDED.comar_refs,
  keywords=EXCLUDED.keywords, status=EXCLUDED.status, updated_at=NOW();
