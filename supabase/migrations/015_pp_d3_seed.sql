-- Migration 015 — P&P D3 Client Services & Care Delivery (v2.0, March 2026 triennial)
-- Run AFTER 012_pp_v2_schema.sql

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D3-001', 'D3', 1, 'Client Rights, Responsibilities & Non-Discrimination', 'Care Coordinator', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff', 'Clients & Caregivers'],
  ARRAY['10.07.05.14', '10.07.05.15'],
  ARRAY['client rights', 'non-discrimination', 'client responsibilities', 'ADA', 'language access', 'admission', 'DNR', 'dignity'],
  $VITALIS_HTML$<style>
:root {
  --teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;
  --navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;
  --rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;
  --border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;
  --font-serif:'Instrument Serif',Georgia,serif;
  --font-sans:'DM Sans',system-ui,sans-serif;
  --font-mono:'SF Mono','Fira Code',monospace;
  --radius-sm:6px;--radius-md:10px;--radius-lg:14px;
}
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
.contact-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0;}
.contact-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px;text-align:center;border-top:3px solid var(--teal-mid);}
.contact-label{font-size:11px;font-weight:700;color:var(--navy);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;}
.contact-number{font-size:14px;font-weight:800;color:var(--teal);}
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
@media(max-width:768px){
  .main-content{padding:0 20px 60px;max-width:100%;}
  .doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}
  .doc-meta-grid{grid-template-columns:1fr 1fr;}
  .approval-block{grid-template-columns:1fr;}
  .contact-grid{grid-template-columns:1fr 1fr;}
}
@media print{
  .main-content{padding:0;}
  .doc-banner{margin:0 0 32px;}
  .ack-btn{display:none;}
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a><span>›</span>
  <a href="/pp/domain/D3">D3 · Client Services &amp; Care Delivery</a>
  <span>›</span><span>VHS-D3-001</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D3 · Client Services &amp; Care Delivery</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Care Coordinator</span>
        <span class="pill pill-version">VHS-D3-001 · v2.0</span>
      </div>
      <h1 class="doc-title">Client Rights, Responsibilities & Non-Discrimination</h1>
      <div class="doc-id-line">VHS-D3-001 · Applies to: All Staff · Clients & Caregivers</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">10.07.05.14 · 10.07.05.15</div></div>
  </div>
</div>
    
<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Every client at Vitalis has rights. Your job is to protect those rights — even when a client does not assert them.</li>
<li class="wmfy-item">Treat every client with dignity and respect, regardless of their race, religion, age, disability, national origin, sexual orientation, or whether they have a DNR order.</li>
<li class="wmfy-item">Never deny or delay care because of who a client is or because you personally disagree with their health care decisions.</li>
<li class="wmfy-item">Clients have the right to see their records, refuse treatment, know who is caring for them, and complain without fear of retaliation.</li>
<li class="wmfy-item">Give every new client the Client Rights document at admission. Make sure they understand it — use an interpreter if needed.</li>
<li class="wmfy-item">If a client or family member cannot speak or read English, stop. Find an interpreter before continuing. See <a href="/pp/VHS-D3-009">VHS-D3-009 · Facilitating Communication</a>.</li>
</ul></div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To define the rights and responsibilities of all clients receiving services from Vitalis Healthcare Services, LLC — and to establish the agency's obligation to protect those rights without exception, and to ensure all programs and services are accessible to every person regardless of disability, language, or other characteristic.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>Vitalis Healthcare Services, LLC is committed to the dignity, autonomy, and rights of every client. All clients will receive services without discrimination. Client rights are posted in the agency office and provided in writing to every client at admission. Violation of client rights by any Vitalis employee or contractor is grounds for immediate disciplinary action up to and including termination.</p></div>
</section>

<section class="policy-section" id="client-rights">
  <h2 class="section-heading">Client Rights</h2>
  <div class="body-text"><p>As a Vitalis client, you have the right to:</p></div>
  <ul class="bullet-list"><li>Receive competent, individualized home care without regard to race, color, creed, sex, age, national origin, disability, ancestry, religion, sexual orientation, diagnosis, HIV status, ability to pay, or DNR status.</li>
<li>Be treated with consideration, respect, and full recognition of your human dignity — including privacy during treatment and personal care.</li>
<li>Receive care that is adequate, appropriate, and compliant with all applicable state, local, and federal laws and regulations.</li>
<li>Participate in developing, reviewing, and modifying your care plan. Be informed of all treatments, disciplines providing care, and frequency of visits before care begins — and to be advised of any changes at least 5 days in advance.</li>
<li>Know the name, licensure status, staff position, and employer of every person who provides, staffs, or supervises your care.</li>
<li>Refuse treatment after being fully informed of the consequences of that refusal.</li>
<li>Be free from mental, verbal, sexual, and physical abuse, neglect, involuntary seclusion, and exploitation — including humiliation, intimidation, or punishment of any kind.</li>
<li>Have your personal property treated with respect. Vitalis staff will never take any item — including cash, credit cards, medications, or house keys — from your home.</li>
<li>Privacy and confidentiality of all your records, communications, and personal information.</li>
<li>Know that you will not receive experimental treatment or participate in research without your documented voluntary informed consent.</li>
<li>Be informed about your advance directives and your right to execute or revoke them.</li>
<li>File a complaint about your care at any time without fear of retaliation or interruption of services. Contact Vitalis at (240) 618-3184, 24 hours a day, 7 days a week.</li>
<li>Contact external regulatory agencies at any time — including OHCQ (1-877-402-8218) and Adult Protective Services (1-800-917-7383) — without reprisal.</li>
<li>Review your health records during normal business hours.</li>
<li>Receive assistance locating community resources if needed.</li>
<li>Choose your health care provider and maintain continuity of care.</li>
</ul>
</section>

<section class="policy-section" id="client-responsibilities">
  <h2 class="section-heading">Client Responsibilities</h2>
  <div class="body-text"><p>As a Vitalis client, you are responsible for:</p></div>
  <ul class="bullet-list"><li>Providing complete and accurate information about your health, medications, allergies, and medical history.</li>
<li>Notifying Vitalis if you will not be home for a scheduled visit.</li>
<li>Notifying Vitalis before changing your address or phone number.</li>
<li>Notifying Vitalis if you are hospitalized or if your physician changes or stops your home care.</li>
<li>Notifying Vitalis of any changes to your payment source or advance directives.</li>
<li>Making a conscious effort to follow your plan of care.</li>
<li>Asking questions about anything you do not understand regarding your treatment.</li>
<li>Informing staff when a health condition or medication change has occurred.</li>
</ul>
</section>

<section class="policy-section" id="non-discrimination">
  <h2 class="section-heading">Non-Discrimination</h2>
  <div class="body-text">
    <p>Vitalis does not discriminate in service delivery or employment on the basis of race, color, creed, national origin, religion, sex, age, disability, marital status, sexual orientation, diagnosis, HIV status, ability to pay, or DNR status. This obligation extends to all contractual and other arrangements with third parties.</p>
    <p>The Administrator (<strong>Okezie Ofeogbu</strong>) serves as the Agency Civil Rights Coordinator responsible for implementing this policy. All marketing and publicly distributed materials include the required statement: <em>"Patients and clients will receive quality services without regard to race, age, color, creed, national origin, religion, sex, marital status, sexual orientation, disability, handicap, or HIV status."</em></p>
  </div>
</section>

<section class="policy-section" id="program-accessibility">
  <h2 class="section-heading">Program Accessibility</h2>
  <div class="body-text"><p>All Vitalis programs and activities are accessible to and usable by persons with disabilities — including those who are deaf, hard of hearing, blind, or who have other sensory or physical impairments. Services are delivered to clients in their place of residence, which is itself the primary accessibility accommodation.</p>
  <p>Additional accessibility accommodations available at no charge include: qualified sign language interpreters; qualified language interpreters for all languages; Maryland Relay Service (TTY/TDD) for the deaf and hearing-impaired; readers and recorded materials for the blind; large print materials for the visually impaired; flash cards, alphabet boards, and communication boards; and assistive devices for persons with impaired manual skills.</p>
  <p>To request any accessibility accommodation, contact your nurse or the Care Coordinator. See <a href="/pp/VHS-D3-009">VHS-D3-009 · Facilitating Communication</a> for the full communication access procedure.</p></div>
</section>

<section class="policy-section" id="admission-procedure">
  <h2 class="section-heading">Admission Procedure</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Care Coordinator / RN</span> At or before the time of admission, provide the client or legal representative with a written copy of this Client Rights document and the Service Agreement. Review key rights verbally.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Care Coordinator / RN</span> If the client has a language barrier or disability affecting communication, arrange for an interpreter or appropriate assistive aid before completing the admission process. Do not proceed with admission documentation until communication is established.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Care Coordinator / RN</span> Obtain the signed Service Agreement from the client or legal representative. The agreement includes signature lines confirming receipt of client rights information and advance directive information.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Care Coordinator</span> Document receipt of client rights in AxisCare in the client's admission record on the date of admission.</div></li>
</ol>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.14" target="_blank">COMAR 10.07.05.14</a> — Client rights. Establishes the minimum client rights RSAs must protect and communicate at admission.</div></div></div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.15" target="_blank">COMAR 10.07.05.15</a> — Non-discrimination. Prohibits discrimination in service delivery based on any protected characteristic.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">Title VI, Civil Rights Act of 1964</span> — Prohibits discrimination based on race, color, or national origin in programs receiving federal financial assistance.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">Section 504, Rehabilitation Act of 1973</span> — Prohibits discrimination based on disability in programs receiving federal financial assistance.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">Americans with Disabilities Act (ADA)</span> — Establishes broad protections against discrimination for individuals with disabilities, including accessibility requirements.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Merged legacy 3.001.1 (Client Rights & Responsibilities), 3.001.2 (Non-Discrimination), and 3.001.3 (Program Accessibility) into single document. Updated contact information (Bowie address). Added plain-language summary. Supersedes legacy 3.001.1, 3.001.2, 3.001.3.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original documents prepared and approved February–March 2023. OHCQ license submission versions.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D3-003"><div class="related-card-id">VHS-D3-003</div><div class="related-card-title">Patient Complaints & Grievances</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D3-004"><div class="related-card-id">VHS-D3-004</div><div class="related-card-title">Reporting Abuse, Neglect & Exploitation</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D3-009"><div class="related-card-id">VHS-D3-009</div><div class="related-card-title">Facilitating Communication</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D3-006"><div class="related-card-id">VHS-D3-006</div><div class="related-card-title">Advance Directives</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
</div></section>

<section class="policy-section" id="approvals">
  <h2 class="section-heading">Approvals</h2>
  <div class="approval-block">
  <div class="approval-item">
    <div class="approval-role">Prepared By</div>
    <div class="approval-name">Care Coordinator — Happiness Samuel / Peace Enoch</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="approval-item">
    <div class="approval-role">Approved By</div>
    <div class="approval-name">Okezie Ofeogbu — Administrator</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D3-Client-Services-Care-Delivery.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  title = EXCLUDED.title,
  version = EXCLUDED.version,
  effective_date = EXCLUDED.effective_date,
  review_date = EXCLUDED.review_date,
  applicable_roles = EXCLUDED.applicable_roles,
  comar_refs = EXCLUDED.comar_refs,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D3-002', 'D3', 1, 'Solicitation & Referral Remuneration', 'Care Coordinator', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.08'],
  ARRAY['solicitation', 'anti-kickback', 'referral', 'remuneration', 'gifts', 'selling'],
  $VITALIS_HTML$<style>
:root {
  --teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;
  --navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;
  --rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;
  --border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;
  --font-serif:'Instrument Serif',Georgia,serif;
  --font-sans:'DM Sans',system-ui,sans-serif;
  --font-mono:'SF Mono','Fira Code',monospace;
  --radius-sm:6px;--radius-md:10px;--radius-lg:14px;
}
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
.contact-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0;}
.contact-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px;text-align:center;border-top:3px solid var(--teal-mid);}
.contact-label{font-size:11px;font-weight:700;color:var(--navy);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;}
.contact-number{font-size:14px;font-weight:800;color:var(--teal);}
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
@media(max-width:768px){
  .main-content{padding:0 20px 60px;max-width:100%;}
  .doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}
  .doc-meta-grid{grid-template-columns:1fr 1fr;}
  .approval-block{grid-template-columns:1fr;}
  .contact-grid{grid-template-columns:1fr 1fr;}
}
@media print{
  .main-content{padding:0;}
  .doc-banner{margin:0 0 32px;}
  .ack-btn{display:none;}
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a><span>›</span>
  <a href="/pp/domain/D3">D3 · Client Services &amp; Care Delivery</a>
  <span>›</span><span>VHS-D3-002</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D3 · Client Services &amp; Care Delivery</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Care Coordinator</span>
        <span class="pill pill-version">VHS-D3-002 · v2.0</span>
      </div>
      <h1 class="doc-title">Solicitation & Referral Remuneration</h1>
      <div class="doc-id-line">VHS-D3-002 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.08</div></div>
  </div>
</div>
    
<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Do not recruit clients or their families for Vitalis — or for any other agency — while you are on duty. Solicitation during work time is prohibited.</li>
<li class="wmfy-item">Never accept any payment, gift, or reward in exchange for referring a client to any provider. This includes cash, meals, gift cards, and anything else of value.</li>
<li class="wmfy-item">Do not sell anything to clients or in a client's home — not cosmetics, food products, supplements, or anything else.</li>
<li class="wmfy-item">Breaking this policy can result in immediate termination and may be reported to your professional licensing board.</li>
</ul></div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To protect the rights of clients and other agencies regarding solicitation, and to ensure Vitalis Healthcare Services, LLC does not engage in illegal remuneration for referrals in violation of federal and state anti-kickback laws.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>Vitalis will not solicit referrals through coercion, harassment, or by disparaging the reputation of other residential service agencies. The agency, its employees, and contractors are prohibited from providing or receiving illegal remuneration as an incentive for referrals.</p></div>
</section>

<section class="policy-section" id="solicitation">
  <h2 class="section-heading">Solicitation Prohibitions</h2>
  <ul class="bullet-list"><li>Solicitation of clients or their families is prohibited in patient care areas at any time.</li>
<li>Solicitation on Vitalis property during work time is prohibited.</li>
<li>Employees may not sell or promote any personal products — including cosmetics, food storage products, cleaning supplies, food services, supplements, or any other commercial items — during working time or in any client's home.</li>
<li>Employees may not accept any gratuity from a vendor or assist any salesperson in solicitation of any nature at any time.</li>
<li>Any employee found in violation of this policy will be subject to appropriate disciplinary action up to and including termination.</li>
</ul>
</section>

<section class="policy-section" id="anti-kickback">
  <h2 class="section-heading">Anti-Kickback Prohibition</h2>
  <div class="body-text"><p>Vitalis and its representatives will not intentionally or knowingly offer to pay or agree to accept any remuneration — directly or indirectly, overtly or covertly, in cash or in kind — to or from any person, firm, or organization for securing or soliciting clients or patronage for any healthcare service.</p>
  <p>Employees who receive or pay illegal remuneration for referrals may be terminated immediately and reported to their respective state licensing body and to federal authorities.</p></div>
  <div class="callout callout-warning"><div class="callout-label">⚠ This Includes Referral Partners</div><div class="callout-body">The anti-kickback prohibition applies to all referral relationships — including those with case workers, social workers, hospital discharge planners, physicians, and other agencies. Vitalis earns referrals through quality of care, satisfaction scores, and professional relationships — not payment. If anyone offers you something of value in exchange for referring clients to or from Vitalis, report it to the Administrator immediately.</div></div>
</section>

<section class="policy-section" id="referral-distribution">
  <h2 class="section-heading">Referral Distribution</h2>
  <div class="body-text"><p>Distribution of any literature by employees other than that required in the performance of their official duties is prohibited during working time. Working time is defined as the time an employee is scheduled to work and has reported to their assigned work area — it does not include time before work begins, scheduled breaks, meal breaks, or after work ends.</p></div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">42 CFR § 1001 — Anti-Kickback Statute</span> — Federal prohibition on remuneration for referrals in federal healthcare programs. Violations may result in criminal prosecution, civil money penalties, and exclusion from Medicare and Medicaid.</div></div></div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.08" target="_blank">COMAR 10.07.05.08</a> — Organizational policies. Requires RSAs to prohibit solicitation practices that are coercive, harassing, or that involve illegal remuneration.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary, expanded anti-kickback guidance, added referral partner callout. Supersedes legacy 3.002.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 3.002.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D3-001"><div class="related-card-id">VHS-D3-001</div><div class="related-card-title">Client Rights, Responsibilities & Non-Discrimination</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D2-016"><div class="related-card-id">VHS-D2-016</div><div class="related-card-title">Conflict of Interest</div><div class="related-card-domain">D2 · Human Resources &amp; Workforce</div></a>
<a class="related-card" href="/pp/VHS-D1-004"><div class="related-card-id">VHS-D1-004</div><div class="related-card-title">Ethics & Corporate Compliance</div><div class="related-card-domain">D1 · Governance &amp; Compliance</div></a>
</div></section>

<section class="policy-section" id="approvals">
  <h2 class="section-heading">Approvals</h2>
  <div class="approval-block">
  <div class="approval-item">
    <div class="approval-role">Prepared By</div>
    <div class="approval-name">Care Coordinator — Happiness Samuel / Peace Enoch</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="approval-item">
    <div class="approval-role">Approved By</div>
    <div class="approval-name">Okezie Ofeogbu — Administrator</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D3-Client-Services-Care-Delivery.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  title = EXCLUDED.title,
  version = EXCLUDED.version,
  effective_date = EXCLUDED.effective_date,
  review_date = EXCLUDED.review_date,
  applicable_roles = EXCLUDED.applicable_roles,
  comar_refs = EXCLUDED.comar_refs,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D3-003', 'D3', 1, 'Patient Complaints & Grievances', 'Care Coordinator', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.14'],
  ARRAY['complaint', 'grievance', 'OHCQ', 'retaliation', '30 days', 'Section 504', 'Okezie Ofeogbu'],
  $VITALIS_HTML$<style>
:root {
  --teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;
  --navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;
  --rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;
  --border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;
  --font-serif:'Instrument Serif',Georgia,serif;
  --font-sans:'DM Sans',system-ui,sans-serif;
  --font-mono:'SF Mono','Fira Code',monospace;
  --radius-sm:6px;--radius-md:10px;--radius-lg:14px;
}
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
.contact-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0;}
.contact-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px;text-align:center;border-top:3px solid var(--teal-mid);}
.contact-label{font-size:11px;font-weight:700;color:var(--navy);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;}
.contact-number{font-size:14px;font-weight:800;color:var(--teal);}
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
@media(max-width:768px){
  .main-content{padding:0 20px 60px;max-width:100%;}
  .doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}
  .doc-meta-grid{grid-template-columns:1fr 1fr;}
  .approval-block{grid-template-columns:1fr;}
  .contact-grid{grid-template-columns:1fr 1fr;}
}
@media print{
  .main-content{padding:0;}
  .doc-banner{margin:0 0 32px;}
  .ack-btn{display:none;}
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a><span>›</span>
  <a href="/pp/domain/D3">D3 · Client Services &amp; Care Delivery</a>
  <span>›</span><span>VHS-D3-003</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D3 · Client Services &amp; Care Delivery</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Care Coordinator</span>
        <span class="pill pill-version">VHS-D3-003 · v2.0</span>
      </div>
      <h1 class="doc-title">Patient Complaints & Grievances</h1>
      <div class="doc-id-line">VHS-D3-003 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.14</div></div>
  </div>
</div>
    
<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Any staff member can receive a complaint from a client. When you do, report it to the Administrator or Care Coordinator right away — do not try to resolve it yourself.</li>
<li class="wmfy-item">Give every new client the grievance procedure at admission. They have the right to complain about any aspect of care without fear of retaliation.</li>
<li class="wmfy-item">Clients can also contact OHCQ or other external agencies directly, at any time, without going through us first.</li>
<li class="wmfy-item">We have 30 days to investigate and respond in writing to any formal grievance. The Administrator manages this process.</li>
</ul></div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To establish a clear, accessible mechanism through which patients and clients may voice concerns or grievances about any aspect of care — and to ensure those concerns are investigated fairly, documented completely, and resolved promptly.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>Patients may voice concerns and grievances regarding any aspect of care or service without fear of coercion, discrimination, reprisal, or unreasonable interruption of services. Vitalis is committed to resolving all complaints fairly and promptly. The Administrator (<strong>Okezie Ofeogbu</strong>) serves as the Section 504 Coordinator for disability-related grievances.</p></div>
</section>

<section class="policy-section" id="how-to-file">
  <h2 class="section-heading">How to File a Complaint</h2>
  <div class="body-text"><p>A complaint may be made verbally to any staff member or in writing to the Administrator. Any staff member who receives a verbal complaint must report it to the Administrator or Care Coordinator immediately — the same day.</p>
  <p>A formal written grievance must include: the client's name and address; a description of the problem or action alleged to be discriminatory; and the remedy or relief requested.</p></div>
</section>

<section class="policy-section" id="procedure">
  <h2 class="section-heading">Grievance Procedure</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Care Coordinator / Any Staff</span> Receive the complaint. Inform the client of the grievance procedure. Report to the Administrator immediately.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Administrator</span> Acknowledge receipt of the complaint. Conduct a thorough investigation, affording all interested parties an opportunity to submit evidence. Investigation may be informal but must be complete.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Administrator</span> Issue a written decision no later than <strong>30 calendar days</strong> after receiving the complaint. Provide a copy to the client.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Client</span> If unsatisfied with the Administrator's decision, the client may appeal to the Governing Body in writing within <strong>15 days</strong> of receiving the decision.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">Governing Body</span> Issue a written decision in response to the appeal no later than <strong>30 days</strong> after the appeal is filed.</div></li>
</ol>
</section>

<section class="policy-section" id="external-contacts">
  <h2 class="section-heading">External Contacts — Available at Any Time</h2>
  <div class="body-text"><p>Clients may contact the following agencies at any time without reprisal or interruption of services:</p></div>
  <div class="contact-grid">
    <div class="contact-card"><div class="contact-label">OHCQ — Maryland Dept. of Health</div><div class="contact-number">1-877-402-8218</div></div>
    <div class="contact-card"><div class="contact-label">Adult Protective Services</div><div class="contact-number">1-800-917-7383</div></div>
    <div class="contact-card"><div class="contact-label">Child Protective Services</div><div class="contact-number">1-800-332-6347</div></div>
    <div class="contact-card"><div class="contact-label">Vitalis Healthcare — 24/7</div><div class="contact-number">(240) 618-3184</div></div>
  </div>
  <div class="body-text" style="margin-top:12px"><p>Civil rights complaints may also be directed to: The Office for Civil Rights, U.S. Department of Health and Human Services, 200 Independence Ave. SW, Washington, DC 20201.</p></div>
</section>

<section class="policy-section" id="documentation">
  <h2 class="section-heading">Documentation</h2>
  <div class="body-text"><p>All complaints must be documented completely — including the complaint, findings, and response — in the Patient Complaint Log. The Administrator or designee must begin investigating and documenting within <strong>10 calendar days</strong> of receiving the complaint and must complete the investigation within <strong>30 calendar days</strong>, unless the agency documents reasonable cause for a delay.</p></div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.14" target="_blank">COMAR 10.07.05.14</a> — Client rights. Requires RSAs to establish and communicate a grievance procedure that allows clients to voice concerns without fear of retaliation.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">Section 504 — Rehabilitation Act of 1973</span> — Requires agencies receiving federal financial assistance to maintain an internal grievance procedure for disability-related complaints.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Updated contact information, named Administrator (Okezie Ofeogbu) as Section 504 Coordinator, added external contacts table, added plain-language summary. Supersedes legacy 3.003.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 3.003.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D3-001"><div class="related-card-id">VHS-D3-001</div><div class="related-card-title">Client Rights, Responsibilities & Non-Discrimination</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D3-004"><div class="related-card-id">VHS-D3-004</div><div class="related-card-title">Reporting Abuse, Neglect & Exploitation</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D2-013"><div class="related-card-id">VHS-D2-013</div><div class="related-card-title">Employee Grievances</div><div class="related-card-domain">D2 · Human Resources &amp; Workforce</div></a>
</div></section>

<section class="policy-section" id="approvals">
  <h2 class="section-heading">Approvals</h2>
  <div class="approval-block">
  <div class="approval-item">
    <div class="approval-role">Prepared By</div>
    <div class="approval-name">Care Coordinator — Happiness Samuel / Peace Enoch</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="approval-item">
    <div class="approval-role">Approved By</div>
    <div class="approval-name">Okezie Ofeogbu — Administrator</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D3-Client-Services-Care-Delivery.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  title = EXCLUDED.title,
  version = EXCLUDED.version,
  effective_date = EXCLUDED.effective_date,
  review_date = EXCLUDED.review_date,
  applicable_roles = EXCLUDED.applicable_roles,
  comar_refs = EXCLUDED.comar_refs,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D3-004', 'D3', 1, 'Reporting Abuse, Neglect & Exploitation', 'Director of Nursing', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.14'],
  ARRAY['abuse', 'neglect', 'exploitation', 'mandated reporter', 'APS', 'OHCQ', 'Marie Epah', '1-877-402-8218', 'incident report'],
  $VITALIS_HTML$<style>
:root {
  --teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;
  --navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;
  --rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;
  --border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;
  --font-serif:'Instrument Serif',Georgia,serif;
  --font-sans:'DM Sans',system-ui,sans-serif;
  --font-mono:'SF Mono','Fira Code',monospace;
  --radius-sm:6px;--radius-md:10px;--radius-lg:14px;
}
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
.contact-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0;}
.contact-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px;text-align:center;border-top:3px solid var(--teal-mid);}
.contact-label{font-size:11px;font-weight:700;color:var(--navy);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;}
.contact-number{font-size:14px;font-weight:800;color:var(--teal);}
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
@media(max-width:768px){
  .main-content{padding:0 20px 60px;max-width:100%;}
  .doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}
  .doc-meta-grid{grid-template-columns:1fr 1fr;}
  .approval-block{grid-template-columns:1fr;}
  .contact-grid{grid-template-columns:1fr 1fr;}
}
@media print{
  .main-content{padding:0;}
  .doc-banner{margin:0 0 32px;}
  .ack-btn{display:none;}
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a><span>›</span>
  <a href="/pp/domain/D3">D3 · Client Services &amp; Care Delivery</a>
  <span>›</span><span>VHS-D3-004</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D3 · Client Services &amp; Care Delivery</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing</span>
        <span class="pill pill-version">VHS-D3-004 · v2.0</span>
      </div>
      <h1 class="doc-title">Reporting Abuse, Neglect & Exploitation</h1>
      <div class="doc-id-line">VHS-D3-004 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.14</div></div>
  </div>
</div>
    
<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">If you see — or even suspect — that a client is being abused, neglected, or exploited, report it immediately. Do not wait. Do not investigate on your own.</li>
<li class="wmfy-item">Call your supervisor right away. If you cannot reach your supervisor, call the DON (Marie Epah) or Administrator (Okezie Ofeogbu) directly.</li>
<li class="wmfy-item">Then complete an Incident Report at www.vitalishealthcare.com/forms — do this the same day.</li>
<li class="wmfy-item">Signs of abuse include unexplained bruises, burns, or injuries. Signs of neglect include untreated wounds, dehydration, or being left in soiled clothing. Signs of exploitation include missing money, unauthorized card use, or a client being pressured to hand over property.</li>
<li class="wmfy-item">You will not be punished for reporting in good faith. Failing to report when you have reason to suspect abuse IS grounds for termination.</li>
<li class="wmfy-item">In a life-threatening situation: call 911 first. Then call Vitalis.</li>
</ul></div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To protect clients from abuse, neglect, and/or exploitation by agency staff or any other individual — and to ensure all suspected incidents are reported immediately to the appropriate authorities in compliance with Maryland law.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>All Vitalis staff are mandated reporters. Any suspected abuse, neglect, or exploitation of a client must be reported immediately — to agency management, the client's physician, applicable licensing boards, and to state authorities. No staff member may retaliate against any person for reporting abuse, neglect, or exploitation in good faith. Any individual who makes a good-faith report is protected from retaliation.</p></div>
</section>

<section class="policy-section" id="definitions">
  <h2 class="section-heading">Definitions</h2>
  <table class="data-table">
    <thead><tr><th>Term</th><th>Definition</th></tr></thead>
    <tbody>
      <tr><td>Abuse</td><td>The negligent or willful infliction of injury, unreasonable confinement, intimidation, or cruel punishment with resulting physical or emotional harm or pain to an elderly or disabled person — or sexual abuse of any kind.</td></tr>
      <tr><td>Neglect</td><td>Failure to provide adequate care, supervision, or essential services — including food, hydration, hygiene, medical treatment, or a safe living environment.</td></tr>
      <tr><td>Exploitation</td><td>The deliberate misuse, misappropriation, or wrongful use of a client's belongings or money — even temporarily — without the client's consent.</td></tr>
      <tr><td>Family Violence</td><td>An act by a family or household member that is intended to result in physical harm, bodily injury, assault, or sexual assault — or a threat that reasonably places the member in fear of imminent harm.</td></tr>
    </tbody>
  </table>
</section>

<section class="policy-section" id="warning-signs">
  <h2 class="section-heading">Warning Signs</h2>
  <div class="body-text">
    <p><strong>Physical abuse indicators:</strong> Unexplained bruises (especially bilateral, clustered, or with a distinct pattern such as a handprint); bruises to genital or breast areas; bruises that do not match the explanation given; burns or injuries of unknown origin.</p>
    <p><strong>Neglect indicators:</strong> Client is malnourished or dehydrated; is dirty or has an odor; has untreated medical conditions, pressure sores, or unhealed wounds; spends long periods in soiled clothing or bedding.</p>
    <p><strong>Exploitation indicators:</strong> Client's personal items not purchased despite apparent need; expenditures not authorized by the client; pattern of overdraft charges; caregiver exerts pressure regarding finances, property, or legal documents; missing cash, valuables, or medications.</p>
  </div>
</section>

<section class="policy-section" id="procedure">
  <h2 class="section-heading">Reporting Procedure</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Any Staff — IMMEDIATELY</span> If you observe or suspect abuse, neglect, exploitation, or family violence — contact your supervisor immediately. State clearly that you are reporting a suspected case. Provide: the client's name, age, and address; the name and address of the responsible person if known; the client's current condition; the basis of your knowledge; and any other relevant information.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Supervisor — IMMEDIATELY</span> Document all information completely and accurately. Alert the DON (Marie Epah) immediately and forward the information to her.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">DON — Marie Epah</span> Review the case information for accuracy and completeness. Determine whether a joint visit is needed and who should participate. Notify the Administrator regarding the incident. Offer referrals to the victim for appropriate care and support.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Any Reporter</span> Complete an Incident Report at <a href="https://www.vitalishealthcare.com/forms" target="_blank">www.vitalishealthcare.com/forms</a> on the same day the incident is known or the allegation is received. The incident report must be submitted within 24 hours, or the next business day if the incident occurs on a weekend or holiday.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">Administrator</span> Report the incident to external authorities (see contact table below). Investigate the report within 10 calendar days. Complete the full investigation and documentation within 30 calendar days. Report licensed staff to their licensing boards if found guilty. Present findings and any new or revised policies to the Governing Body.</div></li>
</ol>
  <div class="callout callout-warning"><div class="callout-label">⚠ Mandatory Reporting — No Exceptions</div><div class="callout-body">Vitalis must report abuse, neglect, and misappropriation of property to the Maryland Office of Health Care Quality (OHCQ) at <strong>1-877-402-8218</strong> — immediately upon discovery. This is a legal obligation under Maryland law, not a discretionary action. Abuse involving family violence must also be reported to local law enforcement.</div></div>
</section>

<section class="policy-section" id="external-contacts">
  <h2 class="section-heading">Mandatory External Reporting Contacts</h2>
  <div class="contact-grid">
    <div class="contact-card"><div class="contact-label">OHCQ — Maryland Dept. of Health</div><div class="contact-number">1-877-402-8218</div></div>
    <div class="contact-card"><div class="contact-label">Adult Protective Services</div><div class="contact-number">1-800-917-7383</div></div>
    <div class="contact-card"><div class="contact-label">Child Protective Services</div><div class="contact-number">1-800-332-6347</div></div>
    <div class="contact-card"><div class="contact-label">Local Law Enforcement</div><div class="contact-number">911</div></div>
  </div>
</section>

<section class="policy-section" id="training">
  <h2 class="section-heading">Training Requirements</h2>
  <div class="body-text"><p>All new employees must receive training on abuse, neglect, and exploitation identification and reporting within <strong>30 days of hire</strong>. Training covers: recognition of abuse, neglect, and exploitation; the legal obligation to report; how to properly file the Vitalis incident report form; how to respond to an alleged incident; and emergency procedures. Training is available through the Vitalis Portal LMS and is tracked in AxisCare.</p></div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.14" target="_blank">COMAR 10.07.05.14</a> — Client rights. Establishes RSA obligations to protect clients from abuse, neglect, and exploitation, and to report incidents immediately to appropriate authorities.</div></div></div>
<div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Maryland Adult Protective Services Act</span> — Establishes mandatory reporting obligations for individuals providing care to vulnerable adults and the procedures for reporting suspected abuse, neglect, or exploitation.</div></div></div>
<div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Health Occupations Article §§ 8-316, 8-6A-10</span> — Requires licensed professionals and home care agencies to report abuse, neglect, or exploitation to the Board of Nursing and OHCQ.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. CRITICAL FIX: Replaced all instances of placeholder with Maryland OHCQ (1-877-402-8218). Updated online incident report URL to www.vitalishealthcare.com/forms. Named DON (Marie Epah) and Administrator (Okezie Ofeogbu) in reporting chain. Added plain-language summary and warning signs section. Supersedes legacy 3.004.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 3.004.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D3-001"><div class="related-card-id">VHS-D3-001</div><div class="related-card-title">Client Rights, Responsibilities & Non-Discrimination</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D3-003"><div class="related-card-id">VHS-D3-003</div><div class="related-card-title">Patient Complaints & Grievances</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D2-014"><div class="related-card-id">VHS-D2-014</div><div class="related-card-title">Professional Standards & Reporting</div><div class="related-card-domain">D2 · Human Resources &amp; Workforce</div></a>
</div></section>

<section class="policy-section" id="approvals">
  <h2 class="section-heading">Approvals</h2>
  <div class="approval-block">
  <div class="approval-item">
    <div class="approval-role">Prepared By</div>
    <div class="approval-name">Director of Nursing — Marie Epah</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="approval-item">
    <div class="approval-role">Approved By</div>
    <div class="approval-name">Okezie Ofeogbu — Administrator</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D3-Client-Services-Care-Delivery.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  title = EXCLUDED.title,
  version = EXCLUDED.version,
  effective_date = EXCLUDED.effective_date,
  review_date = EXCLUDED.review_date,
  applicable_roles = EXCLUDED.applicable_roles,
  comar_refs = EXCLUDED.comar_refs,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D3-005', 'D3', 1, 'Background Checks & Registry Verification', 'Care Coordinator', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['Administrative Staff', 'HR'],
  ARRAY['10.07.05.10'],
  ARRAY['background check', 'CJIS', 'Nurse Aide Registry', 'sex offender', 'NSOPW', 'criminal history', 'discharge'],
  $VITALIS_HTML$<style>
:root {
  --teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;
  --navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;
  --rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;
  --border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;
  --font-serif:'Instrument Serif',Georgia,serif;
  --font-sans:'DM Sans',system-ui,sans-serif;
  --font-mono:'SF Mono','Fira Code',monospace;
  --radius-sm:6px;--radius-md:10px;--radius-lg:14px;
}
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
.contact-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0;}
.contact-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px;text-align:center;border-top:3px solid var(--teal-mid);}
.contact-label{font-size:11px;font-weight:700;color:var(--navy);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;}
.contact-number{font-size:14px;font-weight:800;color:var(--teal);}
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
@media(max-width:768px){
  .main-content{padding:0 20px 60px;max-width:100%;}
  .doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}
  .doc-meta-grid{grid-template-columns:1fr 1fr;}
  .approval-block{grid-template-columns:1fr;}
  .contact-grid{grid-template-columns:1fr 1fr;}
}
@media print{
  .main-content{padding:0;}
  .doc-banner{margin:0 0 32px;}
  .ack-btn{display:none;}
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a><span>›</span>
  <a href="/pp/domain/D3">D3 · Client Services &amp; Care Delivery</a>
  <span>›</span><span>VHS-D3-005</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D3 · Client Services &amp; Care Delivery</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Care Coordinator</span>
        <span class="pill pill-version">VHS-D3-005 · v2.0</span>
      </div>
      <h1 class="doc-title">Background Checks & Registry Verification</h1>
      <div class="doc-id-line">VHS-D3-005 · Applies to: Administrative Staff · HR</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10</div></div>
  </div>
</div>
    
<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Every person who works at Vitalis — employee or contractor — is background checked before they can see any client.</li>
<li class="wmfy-item">We also check the Nurse Aide Registry and the National Sex Offender Registry for all candidates who will have direct patient contact.</li>
<li class="wmfy-item">If any of these checks reveals a disqualifying finding, the candidate cannot be hired.</li>
<li class="wmfy-item">If an employee is later found to be listed on the Nurse Aide Registry as having abused, neglected, or exploited a client, they must be discharged immediately.</li>
<li class="wmfy-item">All background check results are confidential and stored in the sensitive personnel file.</li>
</ul></div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To ensure that all Vitalis Healthcare Services, LLC staff — whether employees or contractors — have been screened for criminal history, registry listing, and sexual offender status before being placed in direct contact with clients.</p></div>
</section>

<section class="policy-section" id="cjis">
  <h2 class="section-heading">Criminal History Check — CJIS</h2>
  <div class="body-text"><p>A criminal history check through the Maryland Criminal Justice Information System (CJIS) is completed on all staff — whether employee or contractor — prior to employment and prior to any patient contact.</p>
  <p>The following conviction categories constitute <strong>absolute bars to employment</strong> in positions involving direct patient contact:</p></div>
  <ul class="bullet-list"><li>Criminal homicide</li>
<li>Kidnapping and unlawful restraint</li>
<li>Indecency with a child</li>
<li>Sexual assault</li>
<li>Aggravated assault</li>
<li>Injury to a child, elderly individual, or disabled individual</li>
<li>Abandoning or endangering a child</li>
<li>Aiding suicide</li>
<li>Agreement to abduct from custody</li>
<li>Sale or purchase of a child</li>
<li>Arson</li>
<li>Theft</li>
<li>Robbery</li>
<li>Aggravated robbery</li>
<li>Any conviction under the laws of another state, federal law, or the Uniform Code of Military Justice for an equivalent offense</li>
</ul>
  <div class="body-text" style="margin-top:12px"><p>If an applicant has a conviction that does not bar employment, the Administrator reviews the individual's full criminal history before making an employment decision. All criminal history records are for the exclusive use of this agency, the regulatory agency, and the employee — and will not be disclosed except by court order or written employee consent.</p></div>
</section>

<section class="policy-section" id="nurse-aide-registry">
  <h2 class="section-heading">Nurse Aide Registry — Maryland Board of Nursing</h2>
  <div class="body-text"><p>For all applicants who will have direct patient contact, the agency searches the Nurse Aide Registry maintained by the Maryland Board of Nursing (<a href="http://www.mbon.org" target="_blank">www.mbon.org</a>) before any conditional offer of employment is extended.</p>
  <p>If an applicant is listed on the Nurse Aide Registry as having abused, neglected, exploited, or misappropriated the property of a resident or consumer — they are unemployable at Vitalis and will not be hired.</p>
  <p>Reportable conduct that must be submitted to the Nurse Aide Registry includes: abuse or neglect that causes or may cause death or harm; sexual abuse; financial exploitation of $25 or more; and emotional, verbal, or psychological abuse that causes harm.</p></div>
  <div class="callout callout-warning"><div class="callout-label">⚠ Immediate Discharge Required</div><div class="callout-body">The agency must immediately discharge any employee who is subsequently designated on the Nurse Aide Registry as having committed an act of abuse, neglect, or mistreatment of a consumer, or misappropriation of a consumer's property. This obligation applies regardless of the employee's tenure, performance history, or the outcome of any concurrent investigation.</div></div>
</section>

<section class="policy-section" id="sex-offender">
  <h2 class="section-heading">National Sex Offender Registry</h2>
  <div class="body-text"><p>A search of the National Sex Offender Registry maintained by the United States Department of Justice (<a href="https://www.nsopw.gov" target="_blank">www.nsopw.gov</a>) is performed before any employment offer is extended to any person who will have direct patient contact.</p>
  <p>If an applicant is listed on the National Sex Offender Registry, they may not work in any capacity involving direct patient contact. The Administrator notifies the individual immediately, terminates them if already employed, documents the date of notification in the personnel record, and keeps all results confidential.</p></div>
</section>

<section class="policy-section" id="procedure">
  <h2 class="section-heading">Procedure Summary</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> Inform all applicants in writing that criminal background checks, Nurse Aide Registry checks, and National Sex Offender Registry searches will be conducted prior to any offer of employment.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> Conduct all three checks before extending any conditional offer of employment or permitting patient contact.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Administrator</span> Review results. If a disqualifying finding is identified, notify the applicant immediately and document the date and reason for the finding in the personnel record.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> Maintain all check results in the sensitive personnel file. Results are confidential.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">Administrator</span> On an ongoing basis: if any currently employed staff member is subsequently listed on the Nurse Aide Registry for a disqualifying finding, discharge them immediately.</div></li>
</ol>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10</a> — Personnel qualifications. Requires criminal history checks for all RSA personnel prior to patient contact.</div></div></div>
<div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Maryland Board of Nursing — Nurse Aide Registry</span> — Maintains the registry of CNA and unlicensed direct-care staff with confirmed findings of abuse, neglect, or exploitation.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">National Sex Offender Public Website (NSOPW)</span> — Federal database maintained by the U.S. Department of Justice at www.nsopw.gov.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Merged legacy 3.005.1 (Criminal History Checks) and 3.005.3 (Nurse Aide Registry) and National Sex Offender Registry procedure into single consolidated document. Added plain-language summary. Supersedes legacy 3.005.1 and 3.005.3.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original documents prepared and approved February–March 2023. OHCQ license submission versions.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D3-004"><div class="related-card-id">VHS-D3-004</div><div class="related-card-title">Reporting Abuse, Neglect & Exploitation</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D2-003"><div class="related-card-id">VHS-D2-003</div><div class="related-card-title">Classification of Personnel & Hiring Standards</div><div class="related-card-domain">D2 · Human Resources &amp; Workforce</div></a>
<a class="related-card" href="/pp/VHS-D2-002"><div class="related-card-id">VHS-D2-002</div><div class="related-card-title">Personnel Records</div><div class="related-card-domain">D2 · Human Resources &amp; Workforce</div></a>
</div></section>

<section class="policy-section" id="approvals">
  <h2 class="section-heading">Approvals</h2>
  <div class="approval-block">
  <div class="approval-item">
    <div class="approval-role">Prepared By</div>
    <div class="approval-name">HR / Office Manager</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="approval-item">
    <div class="approval-role">Approved By</div>
    <div class="approval-name">Okezie Ofeogbu — Administrator</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D3-Client-Services-Care-Delivery.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  title = EXCLUDED.title,
  version = EXCLUDED.version,
  effective_date = EXCLUDED.effective_date,
  review_date = EXCLUDED.review_date,
  applicable_roles = EXCLUDED.applicable_roles,
  comar_refs = EXCLUDED.comar_refs,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D3-006', 'D3', 1, 'Advance Directives', 'Director of Nursing', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Professional Staff', 'All Staff'],
  ARRAY['10.07.05.14'],
  ARRAY['advance directive', 'DNR', 'Medical Power of Attorney', 'self-determination', 'AxisCare', 'conscience objection'],
  $VITALIS_HTML$<style>
:root {
  --teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;
  --navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;
  --rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;
  --border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;
  --font-serif:'Instrument Serif',Georgia,serif;
  --font-sans:'DM Sans',system-ui,sans-serif;
  --font-mono:'SF Mono','Fira Code',monospace;
  --radius-sm:6px;--radius-md:10px;--radius-lg:14px;
}
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
.contact-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0;}
.contact-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px;text-align:center;border-top:3px solid var(--teal-mid);}
.contact-label{font-size:11px;font-weight:700;color:var(--navy);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;}
.contact-number{font-size:14px;font-weight:800;color:var(--teal);}
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
@media(max-width:768px){
  .main-content{padding:0 20px 60px;max-width:100%;}
  .doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}
  .doc-meta-grid{grid-template-columns:1fr 1fr;}
  .approval-block{grid-template-columns:1fr;}
  .contact-grid{grid-template-columns:1fr 1fr;}
}
@media print{
  .main-content{padding:0;}
  .doc-banner{margin:0 0 32px;}
  .ack-btn{display:none;}
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a><span>›</span>
  <a href="/pp/domain/D3">D3 · Client Services &amp; Care Delivery</a>
  <span>›</span><span>VHS-D3-006</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D3 · Client Services &amp; Care Delivery</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing</span>
        <span class="pill pill-version">VHS-D3-006 · v2.0</span>
      </div>
      <h1 class="doc-title">Advance Directives</h1>
      <div class="doc-id-line">VHS-D3-006 · Applies to: All Professional Staff · All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.14</div></div>
  </div>
</div>
    
<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">At every admission, ask the client whether they have an Advance Directive. Document the answer in AxisCare.</li>
<li class="wmfy-item">If they have one, try to get a copy. If you can't, document that you tried.</li>
<li class="wmfy-item">Never alter, hide, destroy, forge, or ignore an Advance Directive. This is grounds for immediate termination.</li>
<li class="wmfy-item">If a client's Advance Directive says "DNR" — follow it. If their expressed wishes conflict with the Advance Directive, notify the physician and document the conversation immediately.</li>
<li class="wmfy-item">If you have a personal or religious objection to following a client's Advance Directive, you must tell the Administrator before you are assigned to that client.</li>
<li class="wmfy-item">When in doubt about any Advance Directive question — call the DON or the client's physician. Do not guess.</li>
</ul></div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To protect and honor each patient's right to self-determination in health care decisions — including the right to execute, follow, or revoke Advance Directives — and to educate patients, families, and staff about these rights.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>Vitalis Healthcare Services, LLC recognizes and respects every patient's right to make decisions about their own medical care, including the right to refuse treatment and to designate another person to make health care decisions on their behalf. Vitalis will follow all valid Advance Directives and will not discriminate against any patient based on whether they have or have not executed an Advance Directive.</p>
  <p>Types of Advance Directives recognized by Maryland law: Directive to Physician and Family or Surrogates; Medical Power of Attorney; Declaration for Mental Health Treatment (see <a href="/pp/VHS-D3-007">VHS-D3-007</a>); Out-of-Hospital Do Not Resuscitate Order (DNR).</p></div>
</section>

<section class="policy-section" id="admission">
  <h2 class="section-heading">Procedure at Admission</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">RN</span> During the initial assessment visit, ask the patient or patient's representative whether the patient has prepared any Advance Directives. Document the patient's answer in AxisCare in the admission record.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">RN</span> If the patient has Advance Directives, attempt to obtain a copy. If a copy cannot be obtained, document in AxisCare that an attempt was made and was unsuccessful.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">RN</span> Ask whether a guardian has been appointed or whether guardianship proceedings are pending. If proceedings are pending, document this in AxisCare and obtain copies of relevant court documents.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">RN</span> Ask about the patient's marital status. Document any marital status changes and notify the attending physician of such changes.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">RN</span> Check clinical records to determine if the patient is pregnant (where applicable by age and sex). A pregnant patient's Directive to Physician and DNR Order are affected by the pregnancy — document this clearly.</div></li>
<li class="step"><span class="step-num">6</span><div class="step-body"><span class="role-tag">RN</span> Provide the patient with a written and verbal explanation of their rights under the Patient Self-Determination Act at the time of admission. Document in AxisCare whether this information was provided directly to the patient or to their representative.</div></li>
<li class="step"><span class="step-num">7</span><div class="step-body"><span class="role-tag">RN</span> Complete the Advance Directive information sheet and place it in the patient's clinical record in AxisCare.</div></li>
<li class="step"><span class="step-num">8</span><div class="step-body"><span class="role-tag">RN</span> Notify and discuss with the patient's physician the existence and status of any Advance Directives. Alert and consult the physician regarding any changes.</div></li>
</ol>
</section>

<section class="policy-section" id="ongoing">
  <h2 class="section-heading">Ongoing Obligations</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">All Staff</span> If a patient or representative revokes or attempts to revoke an Advance Directive, contact the attending physician and the DON immediately. Document the revocation in AxisCare and notify all agency personnel responsible for that patient's care.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">All Staff</span> If a patient's expressed wishes conflict with their existing Advance Directive — for a DNR Order or Declaration for Mental Health Treatment — follow the specific policies for those Advance Directives. Document the expressed desire in AxisCare and notify the patient's physician immediately.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">All Staff</span> If a dispute arises about an Advance Directive, contact the patient's physician immediately and follow the physician's decision and orders. Contact the DON and Administrator.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Any Staff — Conscience Objection</span> If you cannot follow an Advance Directive because of a personal or religious conscience objection, you must inform the Administrator BEFORE being assigned to that patient. You will be reassigned.</div></li>
</ol>
  <div class="callout callout-warning"><div class="callout-label">⚠ Absolute Prohibition</div><div class="callout-body">Under no circumstances may any Vitalis employee: conceal, cancel, deface, obliterate, or damage any Advance Directive form or DNR identification device; or falsify, forge, or withhold knowledge of a revocation or attempted revocation of any Advance Directive. Violation of this prohibition results in immediate termination and may result in criminal referral.</div></div>
</section>

<section class="policy-section" id="witness-rule">
  <h2 class="section-heading">Staff Cannot Witness Declarations for Mental Health Treatment</h2>
  <div class="body-text"><p>Agency employees may serve as the second witness to a patient's Directive to Physician and Family or Surrogate, Medical Power of Attorney, and Out-of-Hospital DNR Order. However, agency employees may <strong>NOT</strong> act as a witness to the signing of a Declaration for Mental Health Treatment. An outside party must serve as the second witness in that case. See <a href="/pp/VHS-D3-007">VHS-D3-007 · Declaration for Mental Health Treatment</a>.</p></div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.14" target="_blank">COMAR 10.07.05.14</a> — Client rights. Requires RSAs to inform all clients of their rights regarding Advance Directives at admission and to document Advance Directive status in the clinical record.</div></div></div>
<div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Maryland Patient Self-Determination Act</span> — Requires health care providers to inform patients of their rights to make decisions about their own medical care, including the right to execute an Advance Directive.</div></div></div>
<div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Maryland Health-General Article §§ 5-601 et seq.</span> — Governs the execution, validity, and enforcement of Advance Directives in Maryland, including Directives to Physician, Medical Power of Attorney, and DNR orders.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added AxisCare documentation references throughout. Added conscience objection procedure. Added plain-language summary. Supersedes legacy 3.007.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 3.007.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D3-007"><div class="related-card-id">VHS-D3-007</div><div class="related-card-title">Declaration for Mental Health Treatment</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D3-001"><div class="related-card-id">VHS-D3-001</div><div class="related-card-title">Client Rights, Responsibilities & Non-Discrimination</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D3-008"><div class="related-card-id">VHS-D3-008</div><div class="related-card-title">Coordination of Client Care</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
</div></section>

<section class="policy-section" id="approvals">
  <h2 class="section-heading">Approvals</h2>
  <div class="approval-block">
  <div class="approval-item">
    <div class="approval-role">Prepared By</div>
    <div class="approval-name">Director of Nursing — Marie Epah</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="approval-item">
    <div class="approval-role">Approved By</div>
    <div class="approval-name">Okezie Ofeogbu — Administrator</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D3-Client-Services-Care-Delivery.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  title = EXCLUDED.title,
  version = EXCLUDED.version,
  effective_date = EXCLUDED.effective_date,
  review_date = EXCLUDED.review_date,
  applicable_roles = EXCLUDED.applicable_roles,
  comar_refs = EXCLUDED.comar_refs,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D3-007', 'D3', 1, 'Declaration for Mental Health Treatment', 'Director of Nursing', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.14'],
  ARRAY['declaration for mental health', 'advance directive', 'mental health', 'witness', 'Marie Epah', 'psychoactive'],
  $VITALIS_HTML$<style>
:root {
  --teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;
  --navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;
  --rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;
  --border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;
  --font-serif:'Instrument Serif',Georgia,serif;
  --font-sans:'DM Sans',system-ui,sans-serif;
  --font-mono:'SF Mono','Fira Code',monospace;
  --radius-sm:6px;--radius-md:10px;--radius-lg:14px;
}
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
.contact-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0;}
.contact-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px;text-align:center;border-top:3px solid var(--teal-mid);}
.contact-label{font-size:11px;font-weight:700;color:var(--navy);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;}
.contact-number{font-size:14px;font-weight:800;color:var(--teal);}
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
@media(max-width:768px){
  .main-content{padding:0 20px 60px;max-width:100%;}
  .doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}
  .doc-meta-grid{grid-template-columns:1fr 1fr;}
  .approval-block{grid-template-columns:1fr;}
  .contact-grid{grid-template-columns:1fr 1fr;}
}
@media print{
  .main-content{padding:0;}
  .doc-banner{margin:0 0 32px;}
  .ack-btn{display:none;}
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a><span>›</span>
  <a href="/pp/domain/D3">D3 · Client Services &amp; Care Delivery</a>
  <span>›</span><span>VHS-D3-007</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D3 · Client Services &amp; Care Delivery</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Director of Nursing</span>
        <span class="pill pill-version">VHS-D3-007 · v2.0</span>
      </div>
      <h1 class="doc-title">Declaration for Mental Health Treatment</h1>
      <div class="doc-id-line">VHS-D3-007 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.14</div></div>
  </div>
</div>
    
<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">A Declaration for Mental Health Treatment is a special type of Advance Directive that covers mental health care decisions.</li>
<li class="wmfy-item">At admission, ask each client if they have a Declaration for Mental Health Treatment. Document the answer in AxisCare.</li>
<li class="wmfy-item">Vitalis does NOT administer psychoactive medications or provide psychiatric treatment — but we must still respect and follow a client's Declaration.</li>
<li class="wmfy-item">You may NOT witness the signing of a Declaration for Mental Health Treatment. An outside party must serve as the witness.</li>
<li class="wmfy-item">If a client has or executes a Declaration, notify the DON immediately. The DON notifies the physician.</li>
</ul></div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To establish the procedures for documenting, honoring, and properly handling a client's Declaration for Mental Health Treatment — and to clarify Vitalis's obligations and limitations in relation to mental health treatment directives.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>Vitalis Healthcare Services, LLC will follow and provide health care in accordance with all valid Declarations for Mental Health Treatment executed by patients of the agency, and will follow all legal revocations of such Declarations. Vitalis will not discriminate against any patient based on whether they have or have not executed a Declaration for Mental Health Treatment — including in pricing, admission decisions, discharge decisions, or conditions of care.</p>
  <p>Vitalis does not administer psychoactive medications to patients, does not provide psychoactive treatments, and does not administer electroconvulsive or convulsive treatments.</p></div>
</section>

<section class="policy-section" id="procedure">
  <h2 class="section-heading">Procedure</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">RN / Care Coordinator</span> At the time of admission, inform the patient of their right to execute a Declaration for Mental Health Treatment. Provide this information in writing and verbally.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">RN</span> Ask the patient or representative if the patient has or has had a Declaration for Mental Health Treatment. Document the patient's answer in AxisCare.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">RN</span> Attempt to obtain a copy of any existing Declaration for Mental Health Treatment or written revocation. Document in AxisCare whether a copy was obtained or whether an attempt was made and was unsuccessful.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">RN</span> If a Declaration exists or is subsequently executed, note this in AxisCare — including the date of execution. Notify the DON (Marie Epah) immediately.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">DON — Marie Epah</span> Upon notification that a patient has executed or revoked a Declaration for Mental Health Treatment, notify the patient's attending physician.</div></li>
<li class="step"><span class="step-num">6</span><div class="step-body"><span class="role-tag">All Staff</span> If a patient revokes a Declaration for Mental Health Treatment, document the revocation in AxisCare and notify the DON and the patient's physician immediately. Inform all agency personnel responsible for that patient's care.</div></li>
</ol>
  <div class="callout callout-warning"><div class="callout-label">⚠ Cannot Witness This Document</div><div class="callout-body">Agency employees — whether employees or contractors — may NOT act as a witness to the signing of a Declaration for Mental Health Treatment. Unlike other Advance Directives, this document requires an outside party as the second witness. If a client asks you to witness a Declaration for Mental Health Treatment, explain that you are not permitted to do so and assist them in identifying an appropriate outside witness.</div></div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Maryland Health-General Article §§ 5-601 et seq.</span> — Governs the execution, validity, and enforcement of Declarations for Mental Health Treatment in Maryland.</div></div></div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.14" target="_blank">COMAR 10.07.05.14</a> — Client rights. Requires RSAs to inform clients of their rights to execute a Declaration for Mental Health Treatment and to honor valid declarations.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added AxisCare documentation references. Named DON (Marie Epah) in notification chain. Added plain-language summary. Supersedes legacy 3.007.2.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 3.007.2). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D3-006"><div class="related-card-id">VHS-D3-006</div><div class="related-card-title">Advance Directives</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D3-001"><div class="related-card-id">VHS-D3-001</div><div class="related-card-title">Client Rights, Responsibilities & Non-Discrimination</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D3-008"><div class="related-card-id">VHS-D3-008</div><div class="related-card-title">Coordination of Client Care</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
</div></section>

<section class="policy-section" id="approvals">
  <h2 class="section-heading">Approvals</h2>
  <div class="approval-block">
  <div class="approval-item">
    <div class="approval-role">Prepared By</div>
    <div class="approval-name">Director of Nursing — Marie Epah</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="approval-item">
    <div class="approval-role">Approved By</div>
    <div class="approval-name">Okezie Ofeogbu — Administrator</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D3-Client-Services-Care-Delivery.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  title = EXCLUDED.title,
  version = EXCLUDED.version,
  effective_date = EXCLUDED.effective_date,
  review_date = EXCLUDED.review_date,
  applicable_roles = EXCLUDED.applicable_roles,
  comar_refs = EXCLUDED.comar_refs,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D3-008', 'D3', 1, 'Coordination of Client Care', 'Care Coordinator', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Clinical Staff'],
  ARRAY['10.07.05.12'],
  ARRAY['care coordination', 'case conference', '60 days', 'AxisCare', 'physician summary', 'plan of care'],
  $VITALIS_HTML$<style>
:root {
  --teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;
  --navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;
  --rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;
  --border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;
  --font-serif:'Instrument Serif',Georgia,serif;
  --font-sans:'DM Sans',system-ui,sans-serif;
  --font-mono:'SF Mono','Fira Code',monospace;
  --radius-sm:6px;--radius-md:10px;--radius-lg:14px;
}
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
.contact-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0;}
.contact-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px;text-align:center;border-top:3px solid var(--teal-mid);}
.contact-label{font-size:11px;font-weight:700;color:var(--navy);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;}
.contact-number{font-size:14px;font-weight:800;color:var(--teal);}
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
@media(max-width:768px){
  .main-content{padding:0 20px 60px;max-width:100%;}
  .doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}
  .doc-meta-grid{grid-template-columns:1fr 1fr;}
  .approval-block{grid-template-columns:1fr;}
  .contact-grid{grid-template-columns:1fr 1fr;}
}
@media print{
  .main-content{padding:0;}
  .doc-banner{margin:0 0 32px;}
  .ack-btn{display:none;}
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a><span>›</span>
  <a href="/pp/domain/D3">D3 · Client Services &amp; Care Delivery</a>
  <span>›</span><span>VHS-D3-008</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D3 · Client Services &amp; Care Delivery</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Care Coordinator</span>
        <span class="pill pill-version">VHS-D3-008 · v2.0</span>
      </div>
      <h1 class="doc-title">Coordination of Client Care</h1>
      <div class="doc-id-line">VHS-D3-008 · Applies to: All Clinical Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.12</div></div>
  </div>
</div>
    
<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">At every admission, the RN identifies all other agencies or providers involved in the client's care. This goes in AxisCare.</li>
<li class="wmfy-item">All providers involved in a client's care need to be communicating with each other. You are responsible for your part of that coordination.</li>
<li class="wmfy-item">A written summary goes to the client's physician at least every 60 days. A case conference is held at least every 60 days.</li>
<li class="wmfy-item">Document every coordination activity in AxisCare on the date it occurs. If it is not in AxisCare, it cannot be verified during an OHCQ survey.</li>
</ul></div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To ensure that all providers and agencies involved in a client's care — whether Vitalis staff, contracted professionals, or external agencies — are engaged in effective communication, reporting, and coordination, and that all coordination activities are documented in the client's clinical record.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>All service providers involved in the care of a Vitalis client, including contracted health care professionals and other agencies, will be engaged in an effective interchange, reporting, and coordination of care. All such coordination will be documented in the client's AxisCare record. Duplication of services will be actively avoided.</p></div>
</section>

<section class="policy-section" id="admission-setup">
  <h2 class="section-heading">Admission — Care Coordination Setup</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">RN</span> At admission, identify all other agencies and providers currently involved in the client's care. Document each in AxisCare in the client's Care Coordination record.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">RN / Care Coordinator</span> Contact the referring source if clarification is needed regarding the client's current care status. Give the client a choice of agencies where applicable and honor that choice.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Care Coordinator</span> Check for potential duplication of services across providers. Make referrals for additional community resources as needed. Document all referrals in AxisCare.</div></li>
</ol>
</section>

<section class="policy-section" id="ongoing">
  <h2 class="section-heading">Ongoing Coordination</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">All Clinical Staff</span> Maintain active liaison with all providers involved in the client's care. All personnel furnishing services must coordinate their efforts to support the objectives outlined in the plan of care.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">RN</span> Send a written summary report to the attending physician at least every <strong>60 days</strong>. Document the transmission in AxisCare.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">RN / Care Coordinator</span> Conduct a case conference at least every <strong>60 days</strong> for each active client — either in person or by telephone. Case conferences are attended by appropriate Vitalis staff and contracted caregivers. Notify the physician, patient, and family of significant events or plan of care revisions.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">All Clinical Staff</span> Document case conferences in AxisCare using the Case Conference form. Record attendees, topics discussed, decisions made, and next conference date.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">Care Coordinator</span> Ensure that all staff providing services under contract or arrangement participate in the coordination of services. Contracted staff participation in case conferences is required.</div></li>
</ol>
  <div class="callout callout-axiscare"><div class="callout-label">📱 AxisCare — Coordination Documentation</div><div class="callout-body">All care coordination activities must be documented in AxisCare on the date they occur. This includes: provider contacts, referrals, physician summaries, case conference notes, and communications with the client or family. The clinical record is the evidence that coordination is actually happening — if it is not in AxisCare, it cannot be verified during an OHCQ survey.<br><br>Access AxisCare at <a href="https://14356.axiscare.com" target="_blank">14356.axiscare.com</a> — Agency ID 14356.</div></div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.12" target="_blank">COMAR 10.07.05.12</a> — Plan of care. Requires RSAs to ensure all providers involved in client care are coordinating services, and that coordination activities are documented in the clinical record.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">42 CFR § 484.60</span> — Care planning. Establishes standards for individualized care plans and the coordination of care among all service providers.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added AxisCare documentation requirements throughout. Added plain-language summary. Supersedes legacy 3.009.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 3.009.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D3-001"><div class="related-card-id">VHS-D3-001</div><div class="related-card-title">Client Rights, Responsibilities & Non-Discrimination</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D3-006"><div class="related-card-id">VHS-D3-006</div><div class="related-card-title">Advance Directives</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D3-009"><div class="related-card-id">VHS-D3-009</div><div class="related-card-title">Facilitating Communication</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
</div></section>

<section class="policy-section" id="approvals">
  <h2 class="section-heading">Approvals</h2>
  <div class="approval-block">
  <div class="approval-item">
    <div class="approval-role">Prepared By</div>
    <div class="approval-name">Care Coordinator — Happiness Samuel / Peace Enoch</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="approval-item">
    <div class="approval-role">Approved By</div>
    <div class="approval-name">Okezie Ofeogbu — Administrator</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D3-Client-Services-Care-Delivery.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  title = EXCLUDED.title,
  version = EXCLUDED.version,
  effective_date = EXCLUDED.effective_date,
  review_date = EXCLUDED.review_date,
  applicable_roles = EXCLUDED.applicable_roles,
  comar_refs = EXCLUDED.comar_refs,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D3-009', 'D3', 1, 'Facilitating Communication', 'Care Coordinator', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.14', '10.07.05.15'],
  ARRAY['interpreter', 'language access', 'hearing impaired', 'Maryland Relay Service', '711', 'visually impaired', 'communication'],
  $VITALIS_HTML$<style>
:root {
  --teal:#0B6B5C;--teal-light:#E6F4F1;--teal-mid:#1A9B87;--navy:#1A2E44;
  --navy-light:#EBF0F6;--amber:#D4860A;--amber-light:#FDF3DC;
  --rose:#C0392B;--rose-light:#FDECEA;--slate:#4A5568;--muted:#718096;
  --border:#E2E8F0;--bg:#FAFBFC;--white:#FFFFFF;--text:#1A202C;
  --font-serif:'Instrument Serif',Georgia,serif;
  --font-sans:'DM Sans',system-ui,sans-serif;
  --font-mono:'SF Mono','Fira Code',monospace;
  --radius-sm:6px;--radius-md:10px;--radius-lg:14px;
}
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
.contact-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0;}
.contact-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);padding:14px;text-align:center;border-top:3px solid var(--teal-mid);}
.contact-label{font-size:11px;font-weight:700;color:var(--navy);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;}
.contact-number{font-size:14px;font-weight:800;color:var(--teal);}
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
@media(max-width:768px){
  .main-content{padding:0 20px 60px;max-width:100%;}
  .doc-banner{margin:0 -20px 32px;padding:24px 20px 20px;}
  .doc-meta-grid{grid-template-columns:1fr 1fr;}
  .approval-block{grid-template-columns:1fr;}
  .contact-grid{grid-template-columns:1fr 1fr;}
}
@media print{
  .main-content{padding:0;}
  .doc-banner{margin:0 0 32px;}
  .ack-btn{display:none;}
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a><span>›</span>
  <a href="/pp/domain/D3">D3 · Client Services &amp; Care Delivery</a>
  <span>›</span><span>VHS-D3-009</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D3 · Client Services &amp; Care Delivery</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: Care Coordinator</span>
        <span class="pill pill-version">VHS-D3-009 · v2.0</span>
      </div>
      <h1 class="doc-title">Facilitating Communication</h1>
      <div class="doc-id-line">VHS-D3-009 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">10.07.05.14 · 10.07.05.15</div></div>
  </div>
</div>
    
<div class="wmfy-box"><div class="wmfy-label">✦ What this means for you</div><ul class="wmfy-list"><li class="wmfy-item">Every client has the right to understand and be understood. If there is a language barrier, stop the assessment and get an interpreter first.</li>
<li class="wmfy-item">Never use a client's child as an interpreter — even if the child speaks English and the parent does not.</li>
<li class="wmfy-item">For clients with hearing impairments, use the Maryland Relay Service (711) or the communication tools available at Vitalis. Contact the Care Coordinator for assistive aids.</li>
<li class="wmfy-item">For visually impaired clients, read all documents aloud and document that you did so in AxisCare.</li>
<li class="wmfy-item">All communication accommodations are provided free of charge to the client.</li>
<li class="wmfy-item">If you are unsure how to communicate effectively with a client, call the Care Coordinator before proceeding.</li>
</ul></div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To ensure that every Vitalis client — regardless of language, hearing ability, vision, speech, or manual ability — can effectively communicate with agency staff and fully understand all information related to their care, rights, and services.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>Vitalis Healthcare Services, LLC is committed to providing effective communication for all clients at no cost to the client. All accommodations listed in this policy are provided free of charge. If there is any question about a client's ability to communicate properly during an assessment, the assessment must stop and an appropriate interpreter or communication aid must be obtained before proceeding.</p></div>
</section>

<section class="policy-section" id="language-access">
  <h2 class="section-heading">Language Access — Non-English Speaking Clients</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">RN / Care Coordinator</span> During admission, determine the client's preferred language. If the client does not communicate effectively in English, arrange for a qualified interpreter before proceeding with any assessments, documentation review, or consent discussions.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body">All admission documents — including the Service Agreement, Client Rights, and Advance Directive information — must be provided in the client's language. If documents cannot be obtained in the needed language, a qualified interpreter must translate them verbally to the client before the client signs anything.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body">Children of clients may not be used as interpreters. Using a minor to translate for a parent or guardian violates the client's privacy and may compromise accurate communication of complex clinical information.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Care Coordinator</span> Maintain a list of agency personnel who speak languages other than English and their availability. Contact the Administrator when professional translation of written documents is needed.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">All Staff</span> Document the presence and identity of any interpreter used at each visit in AxisCare. Document the client's choice of interpreter and their preferred communication method.</div></li>
</ol>
</section>

<section class="policy-section" id="hearing-impaired">
  <h2 class="section-heading">Hearing-Impaired Clients</h2>
  <div class="body-text"><p>For clients who are deaf or hard of hearing, the RN first ascertains the client's preferred method of communication (paper and pencil, lip reading, or sign language). If sign language is preferred, provide the client with the List of Available Interpreters and arrange for a qualified sign language interpreter.</p>
  <p>The <strong>Maryland Relay Service (dial 711)</strong> enables communication between hearing and hearing-impaired individuals. Vitalis staff may use the Maryland Relay Service to contact hearing-impaired clients by telephone when direct communication is not possible.</p>
  <p>Additional assistive services available at no charge: note-takers; computer-aided transcription services; telephone handset amplifiers; assistive listening devices; telephones compatible with hearing aids; closed captioning; TDD/TTY devices. To request any of these services, contact the Administrator.</p></div>
</section>

<section class="policy-section" id="visually-impaired">
  <h2 class="section-heading">Visually Impaired Clients</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">RN</span> For visually impaired clients, read aloud all documents normally provided to the client. Confirm that the client has heard and understood what was read. Document this confirmation in AxisCare.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">RN / Care Coordinator</span> Make available large-print patient information materials applicable to the client's condition, where available. Assist the client in completing forms if they have difficulty reading or writing.</div></li>
</ol>
</section>

<section class="policy-section" id="speech-impaired">
  <h2 class="section-heading">Speech-Impaired Clients</h2>
  <div class="body-text"><p>For clients with speech impairments, staff will ensure effective communication using available aids: writing materials, flash cards, alphabet boards, communication boards, typewriters, or TDD devices. Contact the Administrator to request any specific assistive communication device.</p></div>
</section>

<section class="policy-section" id="manual-impaired">
  <h2 class="section-heading">Clients with Manual Impairments</h2>
  <div class="body-text"><p>For clients with difficulty manipulating print materials, staff will assist by holding materials and turning pages as needed. Contact the Administrator to arrange note-takers, speaker phones, or computer-aided transcription services as needed.</p></div>
</section>

<section class="policy-section" id="translation">
  <h2 class="section-heading">Translation of Written Documents</h2>
  <div class="body-text"><p>Documents requested for translation into a single language five or more times will be maintained in translated form on an ongoing basis. All translation of vital documents is coordinated by the Administrator and must be in final, approved form with current legal and medical information before being used with clients.</p></div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.14" target="_blank">COMAR 10.07.05.14</a> — Client rights. Requires RSAs to ensure clients can communicate effectively with agency staff and are provided information in a format they can understand.</div></div></div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.15" target="_blank">COMAR 10.07.05.15</a> — Non-discrimination. Requires RSAs to provide language access services and communication aids to all clients at no charge.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">Title VI, Civil Rights Act of 1964</span> — Requires entities receiving federal financial assistance to provide meaningful access to programs for persons with limited English proficiency.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">Americans with Disabilities Act (ADA)</span> — Requires entities to provide effective communication for individuals with disabilities, including through auxiliary aids and services.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. CRITICAL FIX: Replaced TDD provider placeholder with Maryland Relay Service (711). Prohibited use of children as interpreters. Added AxisCare documentation requirements throughout. Added plain-language summary. Supersedes legacy 3.012.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 3.012.1). OHCQ license submission version. NOTE: Legacy document contained unresolved TDD provider placeholder — resolved in v2.0.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related"><h2 class="section-heading">Related Documents</h2><div class="related-grid"><a class="related-card" href="/pp/VHS-D3-001"><div class="related-card-id">VHS-D3-001</div><div class="related-card-title">Client Rights, Responsibilities & Non-Discrimination</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D3-003"><div class="related-card-id">VHS-D3-003</div><div class="related-card-title">Patient Complaints & Grievances</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
<a class="related-card" href="/pp/VHS-D3-008"><div class="related-card-id">VHS-D3-008</div><div class="related-card-title">Coordination of Client Care</div><div class="related-card-domain">D3 · Client Services &amp; Care Delivery</div></a>
</div></section>

<section class="policy-section" id="approvals">
  <h2 class="section-heading">Approvals</h2>
  <div class="approval-block">
  <div class="approval-item">
    <div class="approval-role">Prepared By</div>
    <div class="approval-name">Care Coordinator — Happiness Samuel / Peace Enoch</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="approval-item">
    <div class="approval-role">Approved By</div>
    <div class="approval-name">Okezie Ofeogbu — Administrator</div>
    <div class="approval-sig-line"></div>
    <div class="approval-sig-label">Signature &amp; date</div>
  </div>
  <div class="review-notice">⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.</div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D3-Client-Services-Care-Delivery.docx'
)
ON CONFLICT (doc_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  title = EXCLUDED.title,
  version = EXCLUDED.version,
  effective_date = EXCLUDED.effective_date,
  review_date = EXCLUDED.review_date,
  applicable_roles = EXCLUDED.applicable_roles,
  comar_refs = EXCLUDED.comar_refs,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  updated_at = NOW();
