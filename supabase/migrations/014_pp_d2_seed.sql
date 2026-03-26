-- Migration 014 — P&P D2 Human Resources & Workforce seed (v2.0, March 2026 triennial)
-- Design: matches 013 D1 v2.0 formatting exactly
-- Run AFTER 012_pp_v2_schema.sql

INSERT INTO pp_policies
  (doc_id, domain, tier, title, owner_role, version, effective_date, review_date,
   applicable_roles, comar_refs, keywords, html_content, status, source_file)
VALUES (
  'VHS-D2-001', 'D2', 1, 'Reasonable Accommodations', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.10'],
  ARRAY['reasonable accommodation', 'ADA', 'disability', 'essential functions', 'undue hardship'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-001</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-001 · v2.0</span>
      </div>
      <h1 class="doc-title">Reasonable Accommodations</h1>
      <div class="doc-id-line">VHS-D2-001 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">If you have a physical or mental health condition that makes it hard to do your job, you can ask Vitalis to make changes to help you. This is called a reasonable accommodation.</li>
<li class="wmfy-item">You don't need to use special legal words — just tell your supervisor or the Administrator that you're having difficulty because of a health condition.</li>
<li class="wmfy-item">Vitalis will work with you to figure out what changes are possible. Not every request will be granted, but the agency will make a genuine effort to find something that works.</li>
<li class="wmfy-item">Any accommodation request stays private. It will not be used against you.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To ensure Vitalis Healthcare Services, LLC makes reasonable accommodations to the known physical or mental limitations of otherwise qualified applicants and employees, in full compliance with the Americans with Disabilities Act (ADA) and applicable Maryland law, unless such accommodation would impose an undue hardship on agency operations.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>Vitalis is committed to equal employment opportunity for all qualified individuals. When a qualified individual with a disability requests a reasonable accommodation, the agency will make a reasonable effort to identify and provide an appropriate accommodation in cooperation with the individual. All job descriptions are labeled with essential job functions — those functions a person must be able to perform, with or without reasonable accommodation.</p></div>
</section>

<section class="policy-section" id="procedure">
  <h2 class="section-heading">Procedure</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Employee / Applicant</span> Request a reasonable accommodation from the Administrator at any time — verbally or in writing. You do not need to use the word "accommodation," but must indicate that you have difficulty carrying out tasks due to a disability.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Administrator</span> Engage in an interactive dialogue with the employee or applicant to determine the nature of the limitation and what accommodations might be effective. Review the essential and marginal functions of the position against the individual's documented limitations.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Administrator</span> Identify feasible accommodation options. The agency may choose among effective options — including a less expensive alternative — as long as the need is genuinely accommodated. The agency is not required to provide a specific accommodation simply because the employee requests it.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Administrator</span> Document the accommodation request, the interactive process, the accommodation provided (or the reason none was provided), and place documentation in the employee's personnel file.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body">Any accommodation that poses a significant health or safety risk to the employee or to any other person is not considered reasonable and will not be implemented.</div></li>
<li class="step"><span class="step-num">6</span><div class="step-body">Marginal tasks — those non-essential to the position — must be reassigned or otherwise accommodated if a qualified disabled individual cannot perform them.</div></li>
</ol>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">Americans with Disabilities Act (ADA)</span> — Prohibits discrimination against qualified individuals with disabilities in all aspects of employment. Requires reasonable accommodations unless undue hardship is demonstrated.</div></div></div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10</a> — Employee and contractor requirements. Establishes non-discrimination obligations for RSA hiring practices.</div></div></div>
<div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Health-General Article § 20-601 et seq.</span> — Maryland anti-discrimination law providing parallel state-level protections for individuals with disabilities in the workplace.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary. Supersedes legacy 2.001.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 2.001.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-003">
    <div class="related-card-id">VHS-D2-003</div>
    <div class="related-card-title">Classification & Hiring Standards</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-012">
    <div class="related-card-id">VHS-D2-012</div>
    <div class="related-card-title">Employee Discipline & Separation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-013">
    <div class="related-card-id">VHS-D2-013</div>
    <div class="related-card-title">Employee Grievances</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D1-004">
    <div class="related-card-id">VHS-D1-004</div>
    <div class="related-card-title">Ethics & Corporate Compliance</div>
    <div class="related-card-domain">D1 · Governance &amp; Compliance</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-002', 'D2', 1, 'Personnel Records', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.10'],
  ARRAY['personnel records', 'employee file', 'credentials', 'expiration', 'retention', 'sensitive file'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-002</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-002 · v2.0</span>
      </div>
      <h1 class="doc-title">Personnel Records</h1>
      <div class="doc-id-line">VHS-D2-002 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">Vitalis keeps a file on every employee containing your application, ID, credentials, certifications, evaluations, and training records.</li>
<li class="wmfy-item">Your file is kept in a locked cabinet. Only the Administrator and Director of Nursing have access.</li>
<li class="wmfy-item">You can ask to see your own file at any time — just make a written request to the Administrator.</li>
<li class="wmfy-item">Items with expiration dates (CNA cert, TB test, driver's license, etc.) are tracked closely. If anything expires, you will be removed from patient assignments until it is renewed.</li>
<li class="wmfy-item">Your records are kept for at least 10 years after your last day of work.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To establish a standard, consistent method for creating, maintaining, and securing personnel records for all Vitalis Healthcare Services, LLC employees and contracted personnel, in compliance with Maryland RSA requirements and applicable employment law.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>A separate personnel file is maintained for each employee. All records are kept in a lockable filing cabinet or lockable storage in the agency business office. Only the Administrator and Director of Nursing hold keys to access personnel record storage. Employees may view their own personnel records upon written request during normal business hours. All personnel records are retained for not less than <strong>10 years</strong> past the last date of employment.</p></div>
</section>

<section class="policy-section" id="required-contents">
  <h2 class="section-heading">Required File Contents at Hire</h2>
  <div class="body-text"><p>Each file must contain, at minimum, the following at time of hire:</p></div>
  <ul class="bullet-list"><li>Employee application</li>
<li>Full legal name, title, address, telephone number, date of birth</li>
<li>Social Security card copy</li>
<li>Dated and signed withholding statement (W-4)</li>
<li>Employment eligibility verification (Form I-9)</li>
<li>Hire date and wage documentation</li>
<li>Benefits enrollment forms</li>
<li>Confidentiality agreement (signed)</li>
<li>Two professional references — both contacted and documented prior to hire</li>
<li>OIG exclusion check results</li>
<li>Signed job description</li>
<li>Policy &amp; Procedure agreement sign sheet</li>
<li>Proof of orientation including employee handbook receipt</li>
<li>Conflict of Interest statement</li>
<li>Agreement to arbitrate employment claims</li>
</ul>
</section>

<section class="policy-section" id="expiration-tracked">
  <h2 class="section-heading">Expiration-Tracked Credentials</h2>
  <div class="body-text"><p>Items with expiration dates are tracked individually. No patient may be assigned to an employee whose required credentials are expired.</p></div>
  <table class="data-table">
    <thead><tr><th>Credential</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td>Driver's license</td><td>All field staff</td></tr>
      <tr><td>Vehicle insurance</td><td>Required if transporting clients</td></tr>
      <tr><td>CPR / BLS certification</td><td>All clinical staff</td></tr>
      <tr><td>CNA certification</td><td>If applicable</td></tr>
      <tr><td>RN / LPN license</td><td>If applicable</td></tr>
      <tr><td>TB test results</td><td>Required annually for all clinical staff</td></tr>
      <tr><td>Hepatitis B titer / vaccination</td><td>Clinical staff; declination must be documented in writing</td></tr>
    </tbody>
  </table>
</section>

<section class="policy-section" id="sensitive-file">
  <h2 class="section-heading">Sensitive Personnel File</h2>
  <div class="body-text"><p>A separate, more restricted file contains sensitive data including: Statement of Employability and Criminal History check results; medical history, vaccinations, and TB testing documentation; benefit enrollment forms; and drug and alcohol screening results. Access is limited to the Administrator and DON only.</p></div>
</section>

<section class="policy-section" id="employee-access">
  <h2 class="section-heading">Employee Access to Records</h2>
  <div class="body-text"><p>Employees may request to view their own personnel file by submitting a written request to the Administrator. Review occurs during normal business hours in the presence of the Administrator or designee. Employees may not remove original documents from the file.</p></div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10</a> — Personnel qualifications and records. Requires RSAs to maintain complete, current personnel records for all employees and contractors, with verification of credentials and required health screenings.</div></div></div>
<div class="reg-row"><span class="reg-source src-md">MD Law</span><div><div class="reg-detail"><span class="reg-cite">Maryland Employment Law — Record Retention</span> — Maryland employers must retain personnel records for at least 3 years following separation. Vitalis exceeds this requirement at 10 years past last date of employment.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary. Supersedes legacy 2.002.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 2.002.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-003">
    <div class="related-card-id">VHS-D2-003</div>
    <div class="related-card-title">Classification & Hiring Standards</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-009">
    <div class="related-card-id">VHS-D2-009</div>
    <div class="related-card-title">Competency Evaluation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-011">
    <div class="related-card-id">VHS-D2-011</div>
    <div class="related-card-title">Performance Evaluation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-003', 'D2', 1, 'Classification of Personnel &amp; Hiring Standards', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.10'],
  ARRAY['classification', 'hiring', 'at-will', 'W2', 'Viventium', 'OIG exclusion', 'background check'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-003</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-003 · v2.0</span>
      </div>
      <h1 class="doc-title">Classification of Personnel & Hiring Standards</h1>
      <div class="doc-id-line">VHS-D2-003 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">Every job at Vitalis has a written job description. You must receive and sign yours before you start working.</li>
<li class="wmfy-item">All Vitalis caregivers are W2 employees — not independent contractors. You will be paid through Viventium and taxes will be withheld.</li>
<li class="wmfy-item">You are an "at-will" employee, which means either you or Vitalis can end the employment relationship at any time.</li>
<li class="wmfy-item">If your license or certification expires, you cannot work with patients until it is renewed. Tell the Administrator immediately if your license status changes for any reason.</li>
<li class="wmfy-item">Vitalis is an Equal Opportunity Employer. We do not discriminate based on age, race, religion, sex, disability, national origin, or any other protected characteristic.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To establish the classification framework for all Vitalis Healthcare Services, LLC employment positions, define hiring standards and equal opportunity obligations, and ensure every position is properly documented with a job description before any person is hired.</p></div>
</section>

<section class="policy-section" id="classifications">
  <h2 class="section-heading">Employee Classifications</h2>
  <table class="data-table">
    <thead><tr><th>Classification</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td>Regular Full-Time</td><td>Assigned a regular work week for an indefinite period. Averages at least 35 hours/week for three or more consecutive periods; expected to work 40+ hours per week.</td></tr>
      <tr><td>Regular Part-Time</td><td>Scheduled to work consistently but does not meet the Regular Full-Time threshold.</td></tr>
      <tr><td>Salaried</td><td>Pay based on an annual rate. Expected to work the hours required to fulfill job duties.</td></tr>
      <tr><td>PRN / Contract</td><td>Under contractual agreement to provide services on an as-needed basis without any guarantee of hours.</td></tr>
      <tr><td>Observational</td><td>An employee with fewer than three months of service, or any employee placed in observational status for disciplinary reasons. Three-month minimum; may be extended at management's discretion.</td></tr>
      <tr><td>Administrative</td><td>Employees who may or may not provide direct patient care and have authority to make decisions for the agency.</td></tr>
      <tr><td>Clerical</td><td>Employees without administrative, supervisory, or direct patient care responsibilities.</td></tr>
      <tr><td>Direct Care Staff</td><td>Employees with direct, hands-on contact with patients.</td></tr>
    </tbody>
  </table>
</section>

<section class="policy-section" id="at-will">
  <h2 class="section-heading">At-Will Employment</h2>
  <div class="body-text"><p>All Vitalis employees are employees at will and not for any definite period of time. No employee has the authority to vary the terms of this policy or to make an employment contract on behalf of the agency with any person.</p></div>
</section>

<section class="policy-section" id="hiring-standards">
  <h2 class="section-heading">Hiring Standards</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Administrator</span> Post open positions with an approved job description. All advertisements must clearly state that Vitalis is an Equal Opportunity Employer.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> Collect at least two professional job-related references per applicant — at minimum one from a recent employer and one personal reference. Both references must be contacted and documented prior to any conditional offer.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Administrator</span> Conduct a criminal background check (CJIS) on all candidates prior to any conditional offer of employment.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> Verify OIG exclusion status for all candidates before hire and annually thereafter. Do not hire any person excluded from Medicare or Medicaid programs.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> Complete Viventium onboarding with all new hires, including banking details for direct deposit, W-4, and I-9 forms, before the employee's first scheduled shift.</div></li>
<li class="step"><span class="step-num">6</span><div class="step-body"><span class="role-tag">Administrator</span> Extend a written conditional job offer. Every hired employee must have a signed job description in their personnel file before beginning work.</div></li>
</ol>
</section>

<section class="policy-section" id="licensed">
  <h2 class="section-heading">Licensed &amp; Certified Employees</h2>
  <div class="body-text"><p>All employees in positions requiring a license, registration, or certification must provide current copies to the agency. Employees must notify the Administrator immediately of any change in licensure status. An employee whose license has lapsed or is suspended may not be assigned to patient care and may be suspended without pay or terminated pending reinstatement.</p></div>
</section>

<section class="policy-section" id="non-discrimination">
  <h2 class="section-heading">Non-Discrimination Commitment</h2>
  <div class="body-text"><p>Vitalis hires without regard to age, race, color, national origin, religion, sex, disability, qualified disabled veteran status, Vietnam-era veteran status, or any other category protected by law. Reasonable accommodations are provided for otherwise qualified individuals with disabilities. See <a href="/pp/VHS-D2-001">VHS-D2-001 · Reasonable Accommodations</a>.</p></div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10</a> — Personnel qualifications. Requires verification of credentials, references, background checks, and health screenings for all personnel prior to patient contact.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">Title VII, ADA, ADEA</span> — Federal anti-discrimination laws governing all aspects of employment.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary, Viventium onboarding step. Supersedes legacy 2.003.2.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 2.003.2). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-002">
    <div class="related-card-id">VHS-D2-002</div>
    <div class="related-card-title">Personnel Records</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-004">
    <div class="related-card-id">VHS-D2-004</div>
    <div class="related-card-title">Employee Standards of Conduct</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-009">
    <div class="related-card-id">VHS-D2-009</div>
    <div class="related-card-title">Competency Evaluation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-004', 'D2', 1, 'Employee Standards of Conduct', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.10'],
  ARRAY['standards of conduct', 'dress code', 'professionalism', 'ethics', 'health assessment', 'bloodborne pathogen'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-004</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-004 · v2.0</span>
      </div>
      <h1 class="doc-title">Employee Standards of Conduct</h1>
      <div class="doc-id-line">VHS-D2-004 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">Field staff: wear clean, stain-free scrubs and rubber-sole shoes. Always wear your Vitalis ID badge while on duty. Pull long hair back so it does not touch the client.</li>
<li class="wmfy-item">Office staff: dress professionally. Wear your ID badge whenever you represent Vitalis in the community.</li>
<li class="wmfy-item">Before every shift, check that you are healthy enough to be with clients. If you feel sick or have been exposed to a contagious illness, call the agency before going to a client's home.</li>
<li class="wmfy-item">Act with professionalism at all times. Keep appropriate boundaries with clients and their families. Never solicit clients or discuss your personal life in ways that cross professional lines.</li>
<li class="wmfy-item">If you are exposed to blood or bodily fluids on the job, report it to the DON immediately. Do not wait.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To establish the behavioral, professional appearance, and health standards expected of all Vitalis Healthcare Services, LLC employees — protecting patient safety, maintaining professional image, and ensuring a healthy, safe workforce.</p></div>
</section>

<section class="policy-section" id="professional-ethics">
  <h2 class="section-heading">Professional Ethics</h2>
  <div class="body-text"><p>All Vitalis employees are expected to conduct themselves with the highest level of professional integrity in all interactions with patients, families, colleagues, and the public. Ethical conduct includes:</p></div>
  <ul class="bullet-list"><li>Acting in the patient's best interest at all times, even when this requires difficult conversations.</li>
<li>Being honest and accurate in all documentation, communications, and representations of care provided.</li>
<li>Maintaining appropriate professional boundaries with patients and their families at all times.</li>
<li>Protecting patient privacy and confidentiality as required by HIPAA and Vitalis policy.</li>
<li>Reporting any observed ethical violations, unsafe practices, or patient abuse/neglect immediately to the DON or Administrator.</li>
<li>Never soliciting patients, their families, or Vitalis employees to transfer services or employment to another agency.</li>
</ul>
</section>

<section class="policy-section" id="dress-code">
  <h2 class="section-heading">Dress Code</h2>
  <table class="data-table">
    <thead><tr><th>Staff Category</th><th>Requirements</th></tr></thead>
    <tbody>
      <tr><td>Field Staff (All Clinical)</td><td>Clean scrubs — wrinkle-free, no stains, no fading. Clean rubber-sole shoes; no sandals. Long hair neatly pulled back to avoid contact with the client. Company-issued ID badge worn at all times while on duty.</td></tr>
      <tr><td>Office Staff</td><td>Professional attire consistent with a normal business environment. Company-issued ID badge worn at all times when in the community representing Vitalis or at in-house events.</td></tr>
    </tbody>
  </table>
</section>

<section class="policy-section" id="health-assessments">
  <h2 class="section-heading">Employee Health Assessments</h2>
  <div class="body-text"><p>Vitalis maintains a healthy workforce to protect both patients and staff. The following health requirements apply to all clinical employees:</p></div>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> Obtain documentation of TB test (initial and annual for all clinical staff) before assigning the employee to any patient.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> Obtain Hepatitis B titer results or documentation of prior vaccination series from all clinical employees. Declination must be documented in writing.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> Conduct or verify drug and alcohol screening prior to hire. Results are maintained in the sensitive section of the personnel file.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Employee</span> Report any communicable illness, active infection, or health condition that could endanger patients to the DON or Administrator before reporting for duty. Employees will not be assigned to patient care while presenting a risk of transmission.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">Administrator / DON</span> Review employee health documentation annually as part of the credential renewal cycle.</div></li>
</ol>
  <div class="callout callout-warning">
  <div class="callout-label">⚠ Bloodborne Pathogen Exposure</div>
  <div class="callout-body">An employee who knows or suspects they have been exposed to a bloodborne pathogen during patient care must report the exposure to the DON immediately — not at end of shift, not tomorrow. Refer to the Infection Exposure Control Plan (VHS-D6-001) for the full post-exposure protocol.</div>
</div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10(C)</a> — Health requirements for RSA personnel. Mandates TB screening and health documentation for all employees who provide direct patient care.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">OSHA 29 CFR 1910.1030</span> — Bloodborne Pathogens Standard. Establishes requirements for employee health protection including Hepatitis B vaccination and post-exposure protocols.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Merged legacy 2.003.4, 2.003.5, 2.003.6. Added plain-language summary. Supersedes legacy 2.003.4, 2.003.5, and 2.003.6.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original documents prepared and approved February–March 2023. OHCQ license submission versions.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-006">
    <div class="related-card-id">VHS-D2-006</div>
    <div class="related-card-title">Confidentiality</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-012">
    <div class="related-card-id">VHS-D2-012</div>
    <div class="related-card-title">Employee Discipline & Separation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-015">
    <div class="related-card-id">VHS-D2-015</div>
    <div class="related-card-title">Drug Testing</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-005', 'D2', 1, 'Compensation &amp; Benefits', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.10'],
  ARRAY['compensation', 'benefits', 'payroll', 'Viventium', 'AxisCare', 'EVV', 'direct deposit', 'wage confidentiality', 'Jay Jelenke'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-005</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-005 · v2.0</span>
      </div>
      <h1 class="doc-title">Compensation & Benefits</h1>
      <div class="doc-id-line">VHS-D2-005 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">Vitalis pays on a bi-weekly schedule. Your pay period runs Thursday to Wednesday, and your paycheck is issued the following Friday.</li>
<li class="wmfy-item">All pay is through Viventium via direct deposit. You must complete your Viventium banking setup before your first paycheck. There are no paper check exceptions.</li>
<li class="wmfy-item">Your AxisCare clock-in and clock-out records determine your hours. Visits with incomplete EVV records cannot be paid.</li>
<li class="wmfy-item">Do not discuss your pay with coworkers — wages are confidential. This includes hourly rates, bonuses, and any other compensation.</li>
<li class="wmfy-item">After 3 months of satisfactory employment, full-time and part-time employees may become eligible for benefits. Details are in your Employee Handbook.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To define the pay cycle, payday procedures, and employee benefit structure for Vitalis Healthcare Services, LLC employees.</p></div>
</section>

<section class="policy-section" id="payroll">
  <h2 class="section-heading">Payroll Platform &amp; Pay Cycle</h2>
  <div class="body-text"><p>All Vitalis caregivers and staff are paid through <strong>Viventium</strong>, a HIPAA-compliant payroll and HR management platform. All staff are W2 employees — no independent contractor or 1099 arrangements are permitted under any circumstances.</p></div>
  <table class="data-table">
    <thead><tr><th>Item</th><th>Details</th></tr></thead>
    <tbody>
      <tr><td>Pay period</td><td>Thursday through Wednesday (bi-weekly cycle)</td></tr>
      <tr><td>Payday</td><td>Fridays — hours worked Thursday–Wednesday are paid on the following Friday</td></tr>
      <tr><td>Payroll platform</td><td>Viventium — complete banking/direct deposit setup at hire</td></tr>
      <tr><td>Hours verification</td><td>AxisCare EVV clock-in/clock-out records are the authoritative record of hours worked</td></tr>
      <tr><td>Finance contact</td><td>Jay Jelenke — payroll processing and pay inquiries</td></tr>
    </tbody>
  </table>
</section>

<section class="policy-section" id="payment">
  <h2 class="section-heading">Payment Depends on AxisCare Documentation</h2>
  <div class="body-text"><p>Your AxisCare EVV record is the sole verification of your hours. For every visit, you must complete three required actions:</p></div>
  <div class="callout callout-axiscare">
  <div class="callout-label">📱 AxisCare — Agency ID 14356</div>
  <div class="callout-body"><strong>Three required actions for every visit:</strong><br>1. Clock in using the app when you arrive at the client's location<br>2. Complete all ADLs and enter your visit notes<br>3. Clock out when you leave<br><br>Visits without complete EVV records and visit notes cannot be processed for payment. There are no exceptions.<br><br>Access AxisCare at <a href="https://14356.axiscare.com" target="_blank">14356.axiscare.com</a></div>
</div>
</section>

<section class="policy-section" id="wage-conf">
  <h2 class="section-heading">Wage Confidentiality</h2>
  <div class="body-text"><p>Wages are confidential. Employees are strictly prohibited from discussing pay or salary information with other employees. This includes hourly wages, salary, bonuses, pay increases, allowances, and any reimbursements. Violation may result in disciplinary action up to and including termination.</p></div>
</section>

<section class="policy-section" id="benefits">
  <h2 class="section-heading">Benefits</h2>
  <div class="body-text"><p>Employment at Vitalis is initially on a trial basis for the first three months for purposes of establishing eligibility for employee benefits. After completing the three-month trial period with satisfactory performance, employees who work regular full-time or part-time hours may become eligible for health care and other benefits. Full details are provided in the Employee Handbook, which every employee receives during orientation.</p></div>
  <div class="callout callout-note">
  <div class="callout-label">ℹ PRN / Contracted Personnel</div>
  <div class="callout-body">PRN staff are not eligible for employee benefits. Benefits are available only to regular full-time and part-time employees who have completed the trial period. Current benefit plan details are always available from HR / Office Manager.</div>
</div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10</a> — Personnel qualifications and records. Establishes compensation documentation requirements for RSA employees.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">Fair Labor Standards Act (FLSA)</span> — Establishes minimum wage, overtime pay, recordkeeping, and child labor standards for all W2 employees.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Merged legacy 2.004.1 and 2.005.1. Updated payroll platform from SurePayroll to Viventium. Added AxisCare EVV payment dependency, named Finance contact (Jay Jelenke). Supersedes legacy 2.004.1 and 2.005.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original documents prepared and approved February–March 2023. OHCQ license submission versions.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-003">
    <div class="related-card-id">VHS-D2-003</div>
    <div class="related-card-title">Classification & Hiring Standards</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-007">
    <div class="related-card-id">VHS-D2-007</div>
    <div class="related-card-title">Orientation & Staff Development</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-009">
    <div class="related-card-id">VHS-D2-009</div>
    <div class="related-card-title">Competency Evaluation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-006', 'D2', 1, 'Confidentiality', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.11'],
  ARRAY['confidentiality', 'HIPAA', 'PHI', 'privacy', 'breach', 'protected health information', 'social media'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-006</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-006 · v2.0</span>
      </div>
      <h1 class="doc-title">Confidentiality</h1>
      <div class="doc-id-line">VHS-D2-006 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.11 · HIPAA 45 CFR Parts 160 & 164</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">Everything you learn about a client — their health, their family, their finances — is completely private. You may not share it with anyone outside the care team.</li>
<li class="wmfy-item">Never discuss a client by name in public places, on social media, or with family members (even your own). The only people who need to know are the people caring for that client.</li>
<li class="wmfy-item">Never text patient information. Never photograph a client without written consent.</li>
<li class="wmfy-item">If you think a privacy breach has happened — even accidentally — tell the Administrator immediately. Do not wait.</li>
<li class="wmfy-item">You will sign a confidentiality agreement when you are hired. Breaking confidentiality is grounds for immediate termination.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To preserve and protect the confidentiality of all patient, employee, and business information held by Vitalis Healthcare Services, LLC — in full compliance with the Health Insurance Portability and Accountability Act (HIPAA) Privacy Rule and applicable Maryland law.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>All employees are required to safeguard confidential information. All staff must sign a confidentiality agreement at time of hire, before accessing any patient or business information. The Administrator serves as the Privacy Officer and takes the lead role in ensuring compliance with all PHI policies and staff education. Breach of confidentiality is grounds for immediate termination.</p></div>
</section>

<section class="policy-section" id="what-is">
  <h2 class="section-heading">What Is Confidential</h2>
  <div class="body-text"><p><strong>Protected Health Information (PHI)</strong> includes any individually identifiable information in possession of or derived from Vitalis regarding a patient's medical history, mental or physical condition, or treatment — including:</p></div>
  <ul class="bullet-list"><li>Physical, medical, and psychiatric records — paper, photo, video, diagnostic, and therapeutic</li>
<li>Patient insurance and billing records</li>
<li>Computer-based and department-based patient data</li>
<li>Visual observation of patients receiving medical care or accessing services</li>
<li>Verbal information provided by or about a patient</li>
</ul>
  <div class="body-text" style="margin-top:14px"><p><strong>Confidential Employee and Business Information</strong> includes: employee home address and phone number; Social Security number and tax records; performance evaluation information; business strategies and financial data whose disclosure would harm Vitalis.</p></div>
</section>

<section class="policy-section" id="obligations">
  <h2 class="section-heading">Key Obligations</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body">Sign a confidentiality agreement at orientation. The signed agreement is placed in the personnel file.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body">Do not discuss patient information in any location where unauthorized persons may overhear — including the client's home when non-care personnel are present, public spaces, or via personal text message.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body">Do not transmit PHI via standard email or personal text message. Use only agency-approved secure channels for PHI communication.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body">Do not photograph clients under any circumstances without explicit written consent documented in the clinical record. Do not share any images of client environments, residences, or routines.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body">Report any known or suspected breach of confidentiality immediately to the Administrator (Privacy Officer). Do not try to investigate or contain it yourself first.</div></li>
</ol>
</section>

<section class="policy-section" id="breach">
  <h2 class="section-heading">HIPAA Breach Notification</h2>
  <div class="callout callout-warning">
  <div class="callout-label">⚠ Mandatory Breach Reporting</div>
  <div class="callout-body">Under 45 CFR § 164.400, Vitalis is required to notify affected individuals, the Department of Health and Human Services, and in some cases the media, in the event of a breach of unsecured PHI. The Administrator (Privacy Officer) must be notified immediately of any suspected breach — no delay is acceptable.</div>
</div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">HIPAA Privacy Rule — 45 CFR Part 164</span> — Governs the use and disclosure of protected health information. Establishes patient rights, covered entity obligations, and breach notification requirements.</div></div></div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.11" target="_blank">COMAR 10.07.05.11</a> — Confidentiality of client information. Requires RSAs to maintain confidentiality of all client records and information and to have policies protecting PHI.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary with clear prohibition on photographing clients and social media language. Supersedes legacy 2.006.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 2.006.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-010">
    <div class="related-card-id">VHS-D2-010</div>
    <div class="related-card-title">Cell Phone & Texting Policy</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-012">
    <div class="related-card-id">VHS-D2-012</div>
    <div class="related-card-title">Employee Discipline & Separation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D1-002">
    <div class="related-card-id">VHS-D1-002</div>
    <div class="related-card-title">HIPAA & Confidentiality — D1</div>
    <div class="related-card-domain">D1 · Governance &amp; Compliance</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-007', 'D2', 1, 'Orientation &amp; Staff Development', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.10'],
  ARRAY['orientation', 'staff development', 'training', 'AxisCare', 'Viventium', 'competency', 'Marie Epah', 'Happiness Samuel', 'Peace Enoch'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-007</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-007 · v2.0</span>
      </div>
      <h1 class="doc-title">Orientation & Staff Development</h1>
      <div class="doc-id-line">VHS-D2-007 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">You must complete orientation before you can see any client. There are no exceptions.</li>
<li class="wmfy-item">Orientation covers everything you need to know to do your job safely — AxisCare, client rights, infection control, emergency procedures, documentation, and more.</li>
<li class="wmfy-item">At the end of orientation, your clinical skills will be assessed by an RN. If any skill is not up to standard, you will be trained and tested again before being cleared for patient care.</li>
<li class="wmfy-item">You will also need to acknowledge all Vitalis policies through the portal before being cleared.</li>
<li class="wmfy-item">Every year, you are required to attend at least one continuing education or in-service training event to keep your skills current.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To ensure all Vitalis Healthcare Services, LLC employees and contracted personnel receive comprehensive orientation before assuming patient assignments, and to establish a framework for ongoing professional development throughout their employment.</p></div>
</section>

<section class="policy-section" id="who-conducts">
  <h2 class="section-heading">Who Conducts Orientation</h2>
  <div class="body-text"><p>Orientation is instructed by the Administrator, the Director of Nursing (Acting: <strong>Marie Epah</strong>), or qualified personnel appointed by them. AxisCare platform training is conducted by the Administrator or a designated staff member. Care Coordinators (<strong>Happiness Samuel</strong> or <strong>Peace Enoch</strong>) assist with scheduling and system walkthroughs.</p></div>
</section>

<section class="policy-section" id="topics">
  <h2 class="section-heading">Required Orientation Topics</h2>
  <div class="body-text"><p>Every new employee's orientation must cover, at minimum, all of the following:</p></div>
  <ul class="bullet-list"><li>Broad goals and scope of Vitalis services — mission, vision, and core values</li>
<li>The Vitalis Policy &amp; Procedure Manual (accessed via the Vitalis Portal)</li>
<li>Duties and responsibilities of the specific job position</li>
<li>AxisCare mobile app — login, Agency ID 14356, clock-in/out, ADLs, visit notes, EVV</li>
<li>Viventium payroll — setting up direct deposit, bi-weekly pay schedule</li>
<li>Vitalis online forms at www.vitalishealthcare.com/forms — incident reports, illness reports, call-out forms</li>
<li>Methods for preventing the spread of infectious diseases — handwashing, PPE, Universal Precautions</li>
<li>Exposure Control Plan and bloodborne pathogen protocols</li>
<li>Disaster Plan and Emergency Preparedness — what to do in a client emergency</li>
<li>Patient Rights — including advance directives and end-of-life directives</li>
<li>Infection Control — handwashing technique, hand sanitizer, surface disinfection</li>
<li>Cultural Awareness and communication with diverse client populations</li>
<li>Confidentiality and PHI — HIPAA requirements, what is and is not permissible</li>
<li>How to report emergencies, abuse, neglect, accidents, incidents, or adverse effects</li>
<li>Professional Boundaries — what is acceptable and unacceptable in client relationships</li>
<li>Patient complaint handling procedures</li>
<li>Ethics and Conflict of Interest</li>
<li>Pain Management awareness</li>
<li>Available Community Resources</li>
<li>Orientation to the Performance Improvement Plan</li>
<li>Mission, Goals, and Philosophy of Vitalis Healthcare Services</li>
<li>Record keeping and documentation standards in AxisCare</li>
<li>Organization Chart and chain of command</li>
<li>Job Description and performance expectations</li>
<li>Sentinel Events — definition and reporting requirements</li>
<li>OSHA requirements — Right to Know laws, safety, and infection control</li>
<li>Corporate Compliance Plan and fraud/waste/abuse prevention</li>
<li>Incident and variance reporting — when and how to submit through the Vitalis portal forms</li>
</ul>
</section>

<section class="policy-section" id="skills">
  <h2 class="section-heading">Skills Assessment at Orientation</h2>
  <div class="body-text"><p>Skills competency is evaluated during orientation by an RN using the Skills Checklist form. Core skills are assessed at time of hire and annually. Performance skills are validated prior to independent performance in the field. Any skill rated unsatisfactory must be retrained, return-demonstrated, and documented before the employee may perform that skill with a patient.</p></div>
</section>

<section class="policy-section" id="policy-ack">
  <h2 class="section-heading">Policy Acknowledgment</h2>
  <div class="body-text"><p>All staff must acknowledge all applicable Vitalis policies through the Vitalis Portal before being cleared for patient assignment. Acknowledgment is recorded digitally in the portal. A signed physical Policy &amp; Procedure Agreement sign sheet is also placed in the personnel file. See <a href="/pp/VHS-D2-008">VHS-D2-008 · Policy &amp; Procedure Agreement</a>.</p></div>
</section>

<section class="policy-section" id="ongoing">
  <h2 class="section-heading">Ongoing Staff Development</h2>
  <ul class="bullet-list"><li>Annual attendance at at least one approved continuing education or development program (or programs required to maintain licensure).</li>
<li>Annual infection control in-service — attendance is mandatory and documented.</li>
<li>Annual skills competency re-evaluation.</li>
<li>Access to the Knowledge Resource Center (<a href="/pp/VHS-D2-017">VHS-D2-017</a>) for self-directed learning.</li>
<li>Ongoing clinical case discussion with the DON and Care Coordinators.</li>
</ul>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10</a> — Employee orientation and training. Requires RSAs to provide orientation covering all topics required by regulation, including infection control, patient rights, and emergency procedures, prior to patient contact.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Expanded orientation topic list to include AxisCare Agency ID, Viventium, online forms URL, portal policy acknowledgment. Named current orientation facilitators. Added plain-language summary. Supersedes legacy 2.007.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 2.007.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-008">
    <div class="related-card-id">VHS-D2-008</div>
    <div class="related-card-title">Policy & Procedure Agreement</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-009">
    <div class="related-card-id">VHS-D2-009</div>
    <div class="related-card-title">Competency Evaluation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-017">
    <div class="related-card-id">VHS-D2-017</div>
    <div class="related-card-title">Knowledge Resource Center</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-008', 'D2', 1, 'Policy &amp; Procedure Agreement', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.10'],
  ARRAY['policy agreement', 'acknowledgment', 'OHCQ', 'sign-off', 'portal', 'P&P'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-008</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-008 · v2.0</span>
      </div>
      <h1 class="doc-title">Policy & Procedure Agreement</h1>
      <div class="doc-id-line">VHS-D2-008 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">Before you can work with any client, you must read and acknowledge all Vitalis policies that apply to your role.</li>
<li class="wmfy-item">You do this through the Vitalis Portal — tap "Acknowledge reading" on each policy. This creates a digital record of your acknowledgment.</li>
<li class="wmfy-item">You will also sign a physical signature sheet, which goes in your personnel file.</li>
<li class="wmfy-item">When a policy is updated significantly, you will be notified and asked to re-read and re-acknowledge it.</li>
<li class="wmfy-item">This is not a formality. OHCQ surveyors check that staff have acknowledged policies. Your acknowledgment record is part of what keeps the agency in good standing.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To ensure that all Vitalis Healthcare Services, LLC employees and contracted personnel formally acknowledge their receipt, understanding, and commitment to comply with all applicable agency policies and procedures.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>No employee or contractor may begin patient-facing work without first completing a signed Policy &amp; Procedure Agreement confirming they have been oriented to and understand the Vitalis P&amp;P library. This agreement is renewed whenever a major policy update requires re-acknowledgment, and is reviewed as part of the triennial policy review cycle.</p></div>
</section>

<section class="policy-section" id="procedure">
  <h2 class="section-heading">Procedure</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> Provide all new employees and contractors with access to the full Vitalis Policy &amp; Procedure library via the Vitalis Portal during orientation. Walk through the portal navigation and confirm the employee can access all documents assigned to their role.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Employee / Contractor</span> Review all policies assigned to your role in the Vitalis Portal. Use the "Acknowledge reading" button on each policy to record your acknowledgment. Acknowledgments are timestamped and stored in the portal.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> Generate the Policy &amp; Procedure Agreement sign sheet from the portal upon completion of all acknowledgments. Have the employee sign the physical signature sheet, which is placed in the personnel file.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> Confirm completion in the Vitalis Portal and in AxisCare before clearing the employee for patient assignment.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body">When a major policy update is published, affected employees receive an automated notification from the Vitalis Portal with a prompt to re-read and re-acknowledge the updated document. The HR / Office Manager monitors acknowledgment completion and follows up with any staff who have not completed re-acknowledgment within the required timeframe.</div></li>
</ol>
</section>

<section class="policy-section" id="ohcq">
  <h2 class="section-heading">OHCQ Survey Requirement</h2>
  <div class="callout callout-warning">
  <div class="callout-label">⚠ Regulatory Compliance</div>
  <div class="callout-body">Signed Policy &amp; Procedure agreements must be available for review by OHCQ surveyors on request. Both the digital acknowledgment record in the Vitalis Portal and the signed physical signature sheet in the personnel file serve as evidence. <strong>Both must be current.</strong></div>
</div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10</a> — Personnel qualifications. Requires RSAs to document that all personnel have reviewed applicable policies and procedures prior to patient contact.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added Vitalis Portal digital acknowledgment process and plain-language summary. Supersedes legacy 2.008.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 2.008.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-007">
    <div class="related-card-id">VHS-D2-007</div>
    <div class="related-card-title">Orientation & Staff Development</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-009">
    <div class="related-card-id">VHS-D2-009</div>
    <div class="related-card-title">Competency Evaluation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-002">
    <div class="related-card-id">VHS-D2-002</div>
    <div class="related-card-title">Personnel Records</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-009', 'D2', 1, 'Competency Evaluation', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['Direct Care Staff', 'RN', 'LPN', 'CNA'],
  ARRAY['10.07.05.10'],
  ARRAY['competency', 'skills assessment', 'evaluation', 'annual', 'skills checklist', 'Marie Epah', 'DON'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-009</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-009 · v2.0</span>
      </div>
      <h1 class="doc-title">Competency Evaluation</h1>
      <div class="doc-id-line">VHS-D2-009 · Applies to: All Field Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10(D)</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">Before you work with any patient, an RN will check that you can safely perform the tasks in your job description. This is your competency evaluation.</li>
<li class="wmfy-item">You will be observed doing actual skills — it is not just a written test. If you are not up to standard on something, you will be trained and then tested again before being cleared.</li>
<li class="wmfy-item">This evaluation is repeated every year. If you don't pass annual re-evaluation, you cannot be assigned to patients until you do.</li>
<li class="wmfy-item">Do not perform any skill in a client's home that you have not been cleared to do at Vitalis, regardless of what a client or family member asks you to do.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To establish a consistent, documented process for assessing and verifying the clinical competency of all Vitalis field staff prior to patient assignment and at least annually thereafter.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>All field staff must demonstrate competency in the skills defined in their job description before being permitted to have direct contact with patients. Vitalis only assigns employees to patient care who have demonstrated competency. Prior training must originate from sources approved by the Maryland Office of Health Care Quality.</p></div>
</section>

<section class="policy-section" id="procedure">
  <h2 class="section-heading">Procedure</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">RN / DON</span> Conduct or oversee a competency evaluation for all newly hired field staff during orientation, prior to any patient assignment. Evaluation includes skills demonstration and written testing as appropriate to the role.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">RN</span> Complete the Skills Checklist form for each employee evaluated. The checklist distinguishes between Core skills (assessed at hire and annually) and Performance skills (validated prior to each independent performance in the field).</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body">If any skill is rated unsatisfactory: (a) document the deficiency on the checklist; (b) provide remedial training specific to the deficient skill; (c) conduct a return demonstration; and (d) document successful completion before allowing independent patient performance of that skill.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> File the completed Skills Checklist in the employee's personnel file. Flag the annual competency review due date in the employee's record.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">DON — Marie Epah</span> Conduct annual competency reviews for all field staff. Review is completed on or before the anniversary of the employee's hire date. The DON or a qualified RN supervises all clinical skills re-evaluations.</div></li>
<li class="step"><span class="step-num">6</span><div class="step-body">Employees who fail annual competency re-evaluation may not be assigned to patient care until deficiencies are remediated, return-demonstrated, and documented.</div></li>
</ol>
</section>

<section class="policy-section" id="supervisor-req">
  <h2 class="section-heading">Supervisor Credential Requirement</h2>
  <div class="callout callout-note">
  <div class="callout-label">ℹ Evaluator Qualification Standard</div>
  <div class="callout-body">Competency must be established through skills demonstration to a supervisor with at least equal credentials to the skill being evaluated. A CNA's skills may be evaluated by an RN or LPN. An RN's skills must be evaluated by another RN.</div>
</div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10(D)</a> — Competency requirements. Requires RSAs to verify competency of all personnel prior to patient contact and at least annually. Competency must be evaluated by a qualified supervisor.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Named DON (Marie Epah) as competency evaluator. Added plain-language summary. Supersedes legacy 2.009.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 2.009.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-007">
    <div class="related-card-id">VHS-D2-007</div>
    <div class="related-card-title">Orientation & Staff Development</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-011">
    <div class="related-card-id">VHS-D2-011</div>
    <div class="related-card-title">Performance Evaluation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-002">
    <div class="related-card-id">VHS-D2-002</div>
    <div class="related-card-title">Personnel Records</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-010', 'D2', 1, 'Cell Phone &amp; Texting Policy', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.11'],
  ARRAY['cell phone', 'texting', 'PHI', 'privacy', 'driving', 'photography', 'client consent'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-010</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-010 · v2.0</span>
      </div>
      <h1 class="doc-title">Cell Phone & Texting Policy</h1>
      <div class="doc-id-line">VHS-D2-010 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.11 · 45 CFR Part 164</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">Never use your phone while driving. Pull over safely before making or taking any call.</li>
<li class="wmfy-item">Do not use your personal phone for personal calls or browsing while you are with a client. Your attention belongs to your client.</li>
<li class="wmfy-item">Never text patient information. Never take photos of clients or their home without written consent.</li>
<li class="wmfy-item">You may use your phone for care-related calls — but be careful about who can overhear you.</li>
<li class="wmfy-item">Using your phone in ways that violate this policy can result in termination and a HIPAA breach report.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To establish guidelines for the appropriate use of personal and agency cell phones during work hours — protecting patient privacy, ensuring safety, and maintaining professional standards in all client interactions.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>Cell phones are permitted for agency business during work hours. However, their use must never compromise patient privacy, create a safety hazard, or disrupt professional care delivery. Employees are solely responsible for any traffic violations resulting from phone use while driving.</p></div>
</section>

<section class="policy-section" id="safety">
  <h2 class="section-heading">Safety</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body">Never use a handheld cell phone while driving. Pull safely off the road before making or taking a call, or use a hands-free device.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body">Do not allow cell phone use to distract from direct patient care at any time.</div></li>
</ol>
</section>

<section class="policy-section" id="privacy">
  <h2 class="section-heading">Privacy — When You May and May Not Discuss Patients by Phone</h2>
  <table class="data-table">
    <thead><tr><th style="width:30%">Status</th><th>Location / Situation</th></tr></thead>
    <tbody>
      <tr><td style="color:#0B6B5C">✓ Permitted</td><td>Alone in your car with windows up. In the client's home when everyone present is authorized to hear patient information. In a private office or secure location.</td></tr>
      <tr><td style="color:#C0392B">✗ Not Permitted</td><td>In a public place where conversation may be overheard. In another patient's home. In a car with windows down in a public space. In a client's home when unauthorized persons (repair workers, visitors) are present.</td></tr>
    </tbody>
  </table>
</section>

<section class="policy-section" id="phi">
  <h2 class="section-heading">PHI Hard Prohibitions</h2>
  <div class="callout callout-warning">
  <div class="callout-label">⚠ HIPAA Violations — Grounds for Immediate Termination</div>
  <div class="callout-body"><strong>Texting of any patient-identifiable information is strictly prohibited — no exceptions.</strong><br><br>Taking photos of patients or their home environment with any camera device is strictly prohibited without explicit written patient consent documented in the clinical record.<br><br>Both prohibitions are HIPAA violations and grounds for immediate termination.</div>
</div>
</section>

<section class="policy-section" id="etiquette">
  <h2 class="section-heading">Etiquette</h2>
  <div class="body-text"><p>Be courteous and professional on all calls representing Vitalis. Do not use your personal cell phone for personal calls or browsing during billable care hours. Limit personal calls to your own break time.</p></div>
</section>

<section class="policy-section" id="enforcement">
  <h2 class="section-heading">Enforcement</h2>
  <div class="body-text"><p>Violations are subject to disciplinary action including termination. PHI breaches are also reported to the Administrator (Privacy Officer) for HIPAA breach assessment and any required regulatory notifications.</p></div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">HIPAA — 45 CFR Part 164</span> — Governs use and disclosure of PHI. Prohibits transmission of patient-identifiable information via unsecured channels including personal text messaging.</div></div></div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.11" target="_blank">COMAR 10.07.05.11</a> — Confidentiality of client information. Requires RSAs to have policies protecting the privacy and confidentiality of all client records and communications.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary, clear permitted/not permitted table, explicit photo prohibition. Supersedes legacy 2.011.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 2.011.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-006">
    <div class="related-card-id">VHS-D2-006</div>
    <div class="related-card-title">Confidentiality</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-012">
    <div class="related-card-id">VHS-D2-012</div>
    <div class="related-card-title">Employee Discipline & Separation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-004">
    <div class="related-card-id">VHS-D2-004</div>
    <div class="related-card-title">Employee Standards of Conduct</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-011', 'D2', 1, 'Performance Evaluation', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.10'],
  ARRAY['performance evaluation', 'annual review', 'observational period', 'rebuttal'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-011</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-011 · v2.0</span>
      </div>
      <h1 class="doc-title">Performance Evaluation</h1>
      <div class="doc-id-line">VHS-D2-011 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">Your supervisor will give you a written performance evaluation at the end of your 3-month observational period, at your 1-year anniversary, and every year after that.</li>
<li class="wmfy-item">The evaluation covers what you are doing well and what needs to improve. You will know in advance when it is scheduled.</li>
<li class="wmfy-item">You must sign the evaluation — but signing does not mean you agree with everything. You have the right to write a response and have it attached to your file.</li>
<li class="wmfy-item">Your annual evaluation can affect your assignments, raises, and advancement at Vitalis. Take it seriously.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To provide a structured, documented process for evaluating employee performance at the end of the observational period, at the end of the first year of employment, and annually thereafter — supporting employee growth and maintaining care quality standards.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>A written performance evaluation is completed for each employee at least annually. Evaluations are conducted by the person(s) who supervise the employee, documented, signed by both parties, and retained in the personnel file. Signature confirms receipt only — the employee may write a rebuttal to any portion of the evaluation.</p></div>
</section>

<section class="policy-section" id="schedule">
  <h2 class="section-heading">Evaluation Schedule</h2>
  <table class="data-table">
    <thead><tr><th>Evaluation Point</th><th>Timing</th></tr></thead>
    <tbody>
      <tr><td>End of observational period</td><td>Completed at the end of the 3-month observational period, or as soon thereafter as possible.</td></tr>
      <tr><td>End of first year</td><td>Completed at the end of the employee's first year of employment.</td></tr>
      <tr><td>Annual thereafter</td><td>Completed annually on or near the employee's employment anniversary date.</td></tr>
    </tbody>
  </table>
</section>

<section class="policy-section" id="procedure">
  <h2 class="section-heading">Procedure</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Supervisor / DON</span> Notify the employee in advance of the scheduled evaluation date and time. Prepare the evaluation form with specific, documented examples of performance.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Supervisor / DON</span> Complete the written evaluation covering: progress toward prior goals, areas of strength, areas needing improvement, and future development goals.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Supervisor / DON</span> Meet with the employee to review the evaluation. Allow the employee to ask questions and respond to feedback.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Employee</span> Sign the evaluation form acknowledging receipt. The employee may write a rebuttal to any portion — the written rebuttal is attached to the evaluation and placed in the personnel file.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> File the signed evaluation (and any rebuttal) in the personnel file. Schedule the next annual evaluation date.</div></li>
</ol>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10</a> — Personnel qualifications and records. Requires RSAs to maintain documentation of employee performance reviews in personnel files.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary and evaluation schedule table. Supersedes legacy 2.013.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 2.013.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-009">
    <div class="related-card-id">VHS-D2-009</div>
    <div class="related-card-title">Competency Evaluation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-012">
    <div class="related-card-id">VHS-D2-012</div>
    <div class="related-card-title">Employee Discipline & Separation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-002">
    <div class="related-card-id">VHS-D2-002</div>
    <div class="related-card-title">Personnel Records</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-012', 'D2', 1, 'Employee Discipline &amp; Separation from Employment', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.10'],
  ARRAY['discipline', 'termination', 'progressive discipline', 'gross misconduct', 'separation', 'AxisCare access'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-012</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-012 · v2.0</span>
      </div>
      <h1 class="doc-title">Employee Discipline & Separation from Employment</h1>
      <div class="doc-id-line">VHS-D2-012 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">If you break a policy or your performance is not meeting standards, you may receive a verbal warning, then a written warning, then suspension, and then termination. In serious cases, you may be terminated immediately — without going through all those steps first.</li>
<li class="wmfy-item">Some behaviors result in immediate termination with no warnings — like falsifying records, patient abuse, theft, showing up to work intoxicated, or abandoning a client.</li>
<li class="wmfy-item">If you are terminated, you will be told the reason and given a chance to respond in writing. You will need to return all agency property before you leave.</li>
<li class="wmfy-item">All Vitalis employees are at-will. Either party can end the employment relationship at any time.</li>
<li class="wmfy-item">Employees who are terminated for cause are not eligible to be rehired.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To establish fair, consistent, and legally defensible procedures for employee disciplinary action and separation from employment at Vitalis Healthcare Services, LLC.</p></div>
</section>

<section class="policy-section" id="progressive">
  <h2 class="section-heading">Progressive Discipline</h2>
  <div class="body-text"><p>Vitalis may, at its sole discretion, use progressive disciplinary action. Disciplinary action may begin at any stage — including immediate termination — based on the nature and severity of the offense, the employee's record, and any other relevant circumstances. All disciplinary action is documented in writing with the employee acknowledging receipt.</p></div>
  <table class="data-table">
    <thead><tr><th>Step</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td>Step 1 — Verbal Warning</td><td>Issued with a witness present for minor infractions or unsatisfactory performance. The supervisor advises the employee of the specific violation and required corrective actions. Documented, signed by the employee, supervisor, and witness, and filed in the personnel record.</td></tr>
      <tr><td>Step 2 — Formal Written Warning</td><td>Issued when continued employment is in jeopardy without improvement. Must be discussed with DON and HR prior to meeting with the employee. Signed by employee and supervisor; filed in personnel record.</td></tr>
      <tr><td>Step 3 — Suspension</td><td>Used when misconduct is serious enough to require investigation. Reasons are discussed with the employee immediately. Administrator must be notified before the suspension takes effect.</td></tr>
      <tr><td>Step 4 — Termination</td><td>Issued when misconduct warrants dismissal or prior steps have not resulted in corrective change. Only the Governing Body may terminate the Administrator.</td></tr>
    </tbody>
  </table>
</section>

<section class="policy-section" id="gross">
  <h2 class="section-heading">Gross Misconduct — Immediate Termination</h2>
  <div class="body-text"><p>The following are examples of conduct that may result in immediate termination without progressive steps. This list is not exhaustive:</p></div>
  <ul class="bullet-list"><li>Consuming alcohol or being under the influence of drugs or alcohol while on assignment or on agency property</li>
<li>Use, sale, or possession of a controlled substance on agency premises or during agency business (unless lawfully prescribed)</li>
<li>Falsification of AxisCare records, clinical documentation, or any work-related document</li>
<li>Physical or verbal abuse, threats, slander, or libel against employees, clients, or visitors</li>
<li>Soliciting clients or employees to transfer services or employment to another agency</li>
<li>Theft, destruction, or negligent use of agency or patient property</li>
<li>Possession of a weapon on agency property or in a patient's home (with or without legal permit)</li>
<li>Commission of a crime while performing duties for the agency</li>
<li>Abandoning a patient or failing to make visits without notifying the agency</li>
<li>Failure to follow standard infection control precautions</li>
<li>Unauthorized disclosure of confidential patient or proprietary agency information</li>
</ul>
</section>

<section class="policy-section" id="separation">
  <h2 class="section-heading">Separation from Employment</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Supervisor</span> Contact the Administrator as soon as a situation arises that may result in termination.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Administrator</span> Document the reasons for termination clearly and completely in the personnel file.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body">Inform the employee of the reasons for termination in person and provide an opportunity to respond in writing.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body">Collect all agency property from the employee. The employee may collect personal belongings while escorted from the property.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> Terminate all system access — AxisCare, Vitalis Portal, email — immediately on the termination date. Conduct an exit interview. File all documentation in the personnel record.</div></li>
</ol>
  <div class="callout callout-note">
  <div class="callout-label">ℹ Rehire Eligibility</div>
  <div class="callout-body">Employees terminated under this policy are not eligible for rehire. Voluntary resignations are evaluated on a case-by-case basis for rehire eligibility.</div>
</div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10</a> — Personnel qualifications. Requires RSAs to maintain documentation of disciplinary actions and terminations in employee personnel files.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Merged legacy 2.014.1 and 2.015.1. Added plain-language summary, AxisCare access termination step. Supersedes legacy 2.014.1 and 2.015.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original documents prepared and approved February–March 2023. OHCQ license submission versions.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-013">
    <div class="related-card-id">VHS-D2-013</div>
    <div class="related-card-title">Employee Grievances</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-015">
    <div class="related-card-id">VHS-D2-015</div>
    <div class="related-card-title">Drug Testing</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-001">
    <div class="related-card-id">VHS-D2-001</div>
    <div class="related-card-title">Reasonable Accommodations</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-013', 'D2', 1, 'Employee Grievances', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.10'],
  ARRAY['grievance', 'complaint', 'retaliation', 'EEOC', 'fair treatment', 'discrimination', 'appeal'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-013</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-013 · v2.0</span>
      </div>
      <h1 class="doc-title">Employee Grievances</h1>
      <div class="doc-id-line">VHS-D2-013 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">If you believe you have been treated unfairly — discriminated against, harassed, or had a policy applied incorrectly — you have the right to file a formal grievance.</li>
<li class="wmfy-item">File your grievance in writing with the Administrator. Include what happened, when, and what you would like done about it.</li>
<li class="wmfy-item">You will receive a written response within 30 days.</li>
<li class="wmfy-item">If you are not satisfied with the response, you can appeal to the Governing Body within 15 days.</li>
<li class="wmfy-item">No one will retaliate against you for filing a good-faith grievance. Retaliation is itself a policy violation.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To provide a clear, accessible, and fair process through which Vitalis employees can raise workplace concerns, report discrimination, and seek resolution — without fear of retaliation.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>Vitalis Healthcare Services, LLC is committed to maintaining a fair workplace. Any employee who believes they have been subjected to unfair treatment, policy violations, harassment, or discrimination has the right to file a grievance. Retaliation against any employee who files a good-faith grievance is strictly prohibited and is itself grounds for disciplinary action.</p></div>
</section>

<section class="policy-section" id="procedure">
  <h2 class="section-heading">Procedure</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Employee</span> Attempt to resolve the concern informally with the immediate supervisor, if appropriate and safe. If informal resolution is not possible or appropriate, proceed directly to Step 2.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Employee</span> Submit a written grievance to the Administrator. Include: your name; the nature of the concern; the specific policy, action, or event at issue; the date(s) involved; and the remedy or resolution requested.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Administrator</span> Acknowledge receipt within 2 business days. Conduct a thorough investigation affording all relevant parties an opportunity to provide information.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body"><span class="role-tag">Administrator</span> Issue a written decision no later than <strong>30 calendar days</strong> after receipt. Provide a copy to the employee.</div></li>
<li class="step"><span class="step-num">5</span><div class="step-body"><span class="role-tag">Employee</span> If unsatisfied with the Administrator's decision, appeal in writing to the Governing Body within <strong>15 days</strong> of receiving the decision.</div></li>
<li class="step"><span class="step-num">6</span><div class="step-body"><span class="role-tag">Governing Body</span> Issue a written decision in response to the appeal no later than <strong>30 days</strong> after the appeal is filed. The Governing Body's decision is final.</div></li>
</ol>
</section>

<section class="policy-section" id="external">
  <h2 class="section-heading">External Reporting</h2>
  <div class="callout callout-note">
  <div class="callout-label">ℹ Your Right to File Externally</div>
  <div class="callout-body">The availability of this internal grievance procedure does not prevent any employee from filing a complaint with external agencies including the U.S. Equal Employment Opportunity Commission (EEOC), the Maryland Commission on Civil Rights, or the U.S. Department of Labor. You are not required to exhaust internal remedies before filing externally.</div>
</div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10</a> — Personnel policies. Requires RSAs to establish and maintain employee grievance procedures that are accessible to all staff.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">Title VII, ADA, ADEA, FMLA</span> — Federal employment protections prohibiting workplace discrimination and retaliation. Employees retain the right to file complaints with federal agencies regardless of internal procedures.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary. Supersedes legacy 2.016.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 2.016.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-012">
    <div class="related-card-id">VHS-D2-012</div>
    <div class="related-card-title">Employee Discipline & Separation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-001">
    <div class="related-card-id">VHS-D2-001</div>
    <div class="related-card-title">Reasonable Accommodations</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-014">
    <div class="related-card-id">VHS-D2-014</div>
    <div class="related-card-title">Professional Standards & Reporting</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-014', 'D2', 1, 'Professional Standards &amp; Reporting', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['RN', 'LPN', 'CNA'],
  ARRAY['10.07.05.10'],
  ARRAY['professional standards', 'peer review', 'board reporting', 'Maryland Board of Nursing', 'mandatory reporting'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-014</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-014 · v2.0</span>
      </div>
      <h1 class="doc-title">Professional Standards & Reporting</h1>
      <div class="doc-id-line">VHS-D2-014 · Applies to: RN · LPN · CNA</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10 · Health Occupations §§ 8-316, 8-6A-10</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">If you see a colleague providing unsafe or inappropriate care, you must report it. This is not optional — it is a professional and legal obligation.</li>
<li class="wmfy-item">If Vitalis becomes aware of something you did or failed to do that may put your license at risk, the agency is required by Maryland law to report it to the Board of Nursing immediately.</li>
<li class="wmfy-item">You are also entitled to due process — a fair hearing and an opportunity to respond to any complaint before action is taken.</li>
<li class="wmfy-item">If you suspect client abuse, neglect, or exploitation by anyone — call the Maryland Abuse/Neglect Hotline immediately: 1-800-332-6347.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To ensure all Vitalis professional clinical staff comply with their respective professional practice and title acts relating to peer review and professional reporting — and to establish the agency's obligation to report violations to the appropriate regulatory board when known.</p></div>
</section>

<section class="policy-section" id="peer-review">
  <h2 class="section-heading">Annual Professional Peer Review</h2>
  <div class="body-text"><p>An annual review of all Vitalis services is performed by the Review Committee, comprised of at minimum the Administrator (<strong>Okezie Ofeogbu</strong>), DON (<strong>Marie Epah</strong>), and a Certified Nurse Aide. The Committee reviews:</p></div>
  <ul class="bullet-list"><li>Quality of care provided</li>
<li>Service efficiency</li>
<li>Scope of services against license</li>
<li>Clinical record management</li>
<li>Staffing records</li>
<li>Agency policy and procedure compliance</li>
</ul>
  <div class="body-text" style="margin-top:14px"><p>Appropriate changes or modifications are made upon agreement of the Committee and submitted to the Governing Body.</p></div>
</section>

<section class="policy-section" id="mandatory">
  <h2 class="section-heading">Mandatory Board Reporting</h2>
  <div class="body-text"><p>If Vitalis becomes aware of an action or inaction by a professional employee, contractor, or referral that may be grounds for action under Health Occupations Article §§ 8-316 and 8-6A-10, Annotated Code of Maryland, the agency must report the action or condition to the Board of Nursing and the Office of Health Care Quality immediately upon becoming aware.</p></div>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Administrator / DON</span> Upon receipt of any complaint involving a licensed professional, initiate the agency complaint procedure and concurrently evaluate whether the matter may require board reporting.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Administrator</span> If board reporting is required, file the report immediately — do not wait for the internal investigation to conclude. Both processes run concurrently.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Administrator</span> If an employee has abused, exploited, or neglected a client, report immediately to local authorities and to the Maryland Department of Human Resources Abuse/Neglect Hotline: <strong>1-800-332-6347</strong>.</div></li>
</ol>
</section>

<section class="policy-section" id="contacts">
  <h2 class="section-heading">Board Contact Information</h2>
  <table class="data-table">
    <thead><tr><th>Board / Agency</th><th>Contact</th></tr></thead>
    <tbody>
      <tr><td>Maryland Board of Nursing</td><td>4140 Patterson Avenue, Baltimore, MD 21215-2254 · (410) 585-1900 · 1-888-202-9861</td></tr>
      <tr><td>Board of Audiology, Hearing Aid Dispensers &amp; SLP</td><td>4201 Patterson Avenue, Baltimore, MD 21215 · (410) 764-4725</td></tr>
      <tr><td>MD Dept. of Human Resources — Abuse/Neglect Hotline</td><td><strong>1-800-332-6347</strong></td></tr>
    </tbody>
  </table>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10</a> — Personnel qualifications. Establishes peer review and professional standards requirements for RSA clinical staff.</div></div></div>
<div class="reg-row"><span class="reg-source src-md">MD Code</span><div><div class="reg-detail"><span class="reg-cite">Health Occupations Article §§ 8-316 and 8-6A-10</span> — Mandatory reporting obligations for licensed professionals and their employers when conduct may be grounds for board action.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Merged legacy 2.021.1 and 2.022.1. Named Review Committee members. Added plain-language summary. Supersedes legacy 2.021.1 and 2.022.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original documents prepared and approved February–March 2023. OHCQ license submission versions.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-009">
    <div class="related-card-id">VHS-D2-009</div>
    <div class="related-card-title">Competency Evaluation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-012">
    <div class="related-card-id">VHS-D2-012</div>
    <div class="related-card-title">Employee Discipline & Separation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D1-003">
    <div class="related-card-id">VHS-D1-003</div>
    <div class="related-card-title">Abuse, Neglect & Exploitation — D1</div>
    <div class="related-card-domain">D1 · Governance &amp; Compliance</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-015', 'D2', 1, 'Drug Testing', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.10'],
  ARRAY['drug testing', 'alcohol', 'substance', 'impairment', 'pre-employment', 'reasonable suspicion', 'prescription'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-015</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-015 · v2.0</span>
      </div>
      <h1 class="doc-title">Drug Testing</h1>
      <div class="doc-id-line">VHS-D2-015 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">All new hires are drug and alcohol tested before they start. A positive test result means you will not be hired.</li>
<li class="wmfy-item">If you are involved in a workplace incident, or if a supervisor has reasonable cause to believe you are impaired, you may be required to test immediately.</li>
<li class="wmfy-item">Being impaired at work — by alcohol, illegal drugs, or misused prescription medication — is grounds for immediate termination.</li>
<li class="wmfy-item">If you take a prescription medication that could affect your ability to work safely, you are required to tell the DON or Administrator so we can discuss appropriate work adjustments.</li>
<li class="wmfy-item">Refusing to be tested, or attempting to tamper with a test, is treated the same as a positive result.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To maintain a controlled substance, drug, and alcohol-free workplace for the safety of all Vitalis Healthcare Services, LLC employees, patients, and the public — in compliance with applicable federal and state law.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>Vitalis is committed to a drug-free workplace. The use, possession, distribution, or sale of controlled substances, alcohol, or other impairing substances during work hours, on agency property, or while on patient assignment is strictly prohibited and grounds for immediate termination.</p></div>
</section>

<section class="policy-section" id="testing">
  <h2 class="section-heading">Testing Requirements</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> All candidates receive drug and alcohol screening as part of the conditional pre-employment process. A positive result disqualifies the candidate from employment.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Administrator / DON</span> Post-incident testing may be required following any workplace accident, patient safety incident, or event where impairment is a reasonable possibility.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Administrator</span> Reasonable suspicion testing is conducted when observable evidence — slurred speech, unsteady gait, unusual behavior, or odor of alcohol — gives the supervisor reasonable cause to believe an employee is impaired. Document the observable evidence before ordering testing.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body">An employee who tests positive, refuses to be tested, or attempts to tamper with a drug test is subject to immediate suspension pending investigation and possible termination.</div></li>
</ol>
</section>

<section class="policy-section" id="prescription">
  <h2 class="section-heading">Prescription Medications</h2>
  <div class="callout callout-note">
  <div class="callout-label">ℹ Disclosure Requirement</div>
  <div class="callout-body">Employees taking lawfully prescribed medications that may affect alertness, coordination, or judgment must notify the DON or Administrator. The agency will work with the employee to determine appropriate duty accommodations. Failure to disclose a medication that causes an impairment-related incident is grounds for disciplinary action.</div>
</div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10</a> — Personnel qualifications. Requires RSAs to maintain a workforce capable of safe, competent patient care — including prohibitions on impairment while on duty.</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">Federal</span><div><div class="reg-detail"><span class="reg-cite">Drug-Free Workplace Act</span> — Federal requirements for drug-free workplace policies for organizations receiving federal contracts or grants.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary. Supersedes legacy 2.023.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 2.023.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-012">
    <div class="related-card-id">VHS-D2-012</div>
    <div class="related-card-title">Employee Discipline & Separation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-004">
    <div class="related-card-id">VHS-D2-004</div>
    <div class="related-card-title">Employee Standards of Conduct</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-002">
    <div class="related-card-id">VHS-D2-002</div>
    <div class="related-card-title">Personnel Records</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-016', 'D2', 1, 'Conflict of Interest', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.08'],
  ARRAY['conflict of interest', 'gifts', 'referral', 'disclosure', 'client solicitation', 'financial interest'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-016</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-016 · v2.0</span>
      </div>
      <h1 class="doc-title">Conflict of Interest</h1>
      <div class="doc-id-line">VHS-D2-016 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.08</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">A conflict of interest is when your personal situation could affect — or look like it could affect — how you do your job at Vitalis.</li>
<li class="wmfy-item">Common examples: referring a client to another agency where you work or have a financial interest; using client information for your own benefit; taking gifts from clients or their families.</li>
<li class="wmfy-item">If you think you might have a conflict of interest, tell your supervisor or the Administrator right away. It is much better to disclose it than to have it discovered later.</li>
<li class="wmfy-item">Never take cash, credit cards, personal items, house keys, or medications from a client's home — even if offered.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To identify and manage actual or potential conflicts of interest that could compromise the integrity of Vitalis Healthcare Services, LLC operations, patient care, or business relationships.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>All Vitalis employees, contractors, and Governing Body members must avoid situations in which personal, financial, or professional interests conflict — or could appear to conflict — with their duty to act in the best interests of the agency and its clients. Annual written conflict of interest disclosures are required of all Governing Body members and executive staff.</p></div>
</section>

<section class="policy-section" id="what-constitutes">
  <h2 class="section-heading">What Constitutes a Conflict of Interest</h2>
  <ul class="bullet-list"><li>Having a personal financial interest in a business that transacts with Vitalis</li>
<li>Referring clients to other agencies for personal gain</li>
<li>Using your position at Vitalis or knowledge of client affairs for personal gain outside the agency</li>
<li>Using client lists or contact information from Vitalis in employment at another agency</li>
<li>Accepting gifts, cash, food, medications, or personal items from clients or their families</li>
<li>Engaging in practices that violate anti-trust laws or other laws regulating agency business</li>
<li>Misusing privileged information or revealing confidential business or patient data to outsiders</li>
</ul>
</section>

<section class="policy-section" id="procedure">
  <h2 class="section-heading">Procedure</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Employee</span> Disclose any actual or potential conflict of interest to the supervisor or Administrator as soon as it is known or reasonably anticipated.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">Administrator</span> Evaluate the disclosed conflict and determine what action, if any, is necessary. Actions may range from no action to recusal, reassignment, or termination of the conflicting interest.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Administrator</span> If appropriate, refer the matter to the Ethics Committee for recommendation. See <a href="/pp/VHS-D1-004">VHS-D1-004 · Ethics &amp; Corporate Compliance</a>.</div></li>
<li class="step"><span class="step-num">4</span><div class="step-body">Document all disclosed conflicts and the resolution in the employee's file and in the Governing Body conflict of interest disclosure record.</div></li>
</ol>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.08" target="_blank">COMAR 10.07.05.08</a> — Governing body requirements. Requires RSAs to have a conflict of interest policy applicable to Governing Body members and agency leadership, with annual written disclosures.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary with specific caregiver-facing examples. Supersedes legacy 2.024.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 2.024.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D1-004">
    <div class="related-card-id">VHS-D1-004</div>
    <div class="related-card-title">Ethics & Corporate Compliance</div>
    <div class="related-card-domain">D1 · Governance &amp; Compliance</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-006">
    <div class="related-card-id">VHS-D2-006</div>
    <div class="related-card-title">Confidentiality</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-012">
    <div class="related-card-id">VHS-D2-012</div>
    <div class="related-card-title">Employee Discipline & Separation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
  'VHS-D2-017', 'D2', 1, 'Knowledge Resource Center', 'HR / Office Manager', '2.0',
  '2026-03-15', '2029-03-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.10'],
  ARRAY['knowledge resource', 'reference', 'library', 'portal', 'ICD-10', 'drug reference', 'in-service', 'COMAR'],
  $VITALIS_HTML$<style>
:root {
  --teal:       #0B6B5C;
  --teal-light: #E6F4F1;
  --teal-mid:   #1A9B87;
  --navy:       #1A2E44;
  --navy-light: #EBF0F6;
  --amber:      #D4860A;
  --amber-light:#FDF3DC;
  --rose:       #C0392B;
  --rose-light: #FDECEA;
  --slate:      #4A5568;
  --muted:      #718096;
  --border:     #E2E8F0;
  --bg:         #FAFBFC;
  --white:      #FFFFFF;
  --text:       #1A202C;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'SF Mono', 'Fira Code', monospace;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--text); background: var(--bg); font-size: 15px; line-height: 1.7; }
.main-content { max-width: 820px; padding: 0 48px 80px; }
.doc-banner { background: linear-gradient(135deg, var(--navy) 0%, #0B3D6B 100%); margin: 0 -48px 40px; padding: 32px 48px 28px; position: relative; overflow: hidden; }
.doc-banner::after { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(26,155,135,0.18) 0%, transparent 70%); pointer-events: none; }
.doc-banner-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
.doc-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 5px; }
.pill-domain { background: rgba(255,255,255,0.15); color: #fff; }
.pill-tier   { background: rgba(26,155,135,0.25); color: var(--teal-mid); }
.pill-owner  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.pill-version{ background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-family: var(--font-mono); font-size: 10px; }
.doc-title { font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: #fff; line-height: 1.25; letter-spacing: -0.3px; margin-bottom: 6px; }
.doc-id-line { font-size: 12px; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.doc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
.doc-meta-value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
.ack-btn { padding: 10px 22px; background: var(--teal-mid); color: #fff; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
.ack-btn:hover:not(:disabled) { background: var(--teal); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,107,92,0.3); }
.ack-btn:disabled { background: rgba(255,255,255,0.2); cursor: not-allowed; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.breadcrumb a { color: var(--teal); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.policy-section { margin-bottom: 48px; scroll-margin-top: 24px; }
.section-heading { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid var(--teal-light); display: flex; align-items: center; gap: 10px; }
.section-heading::before { content: ''; display: block; width: 4px; height: 20px; background: var(--teal-mid); border-radius: 2px; flex-shrink: 0; }
.body-text p { margin-bottom: 14px; color: var(--slate); }
.body-text p:last-child { margin-bottom: 0; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.step-body { font-size: 14px; color: var(--slate); line-height: 1.65; flex: 1; }
.role-tag { display: inline-block; padding: 2px 8px; background: var(--navy-light); color: var(--navy); border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
.callout { border-radius: var(--radius-md); padding: 16px 20px; margin: 20px 0; border-left: 4px solid; }
.callout-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
.callout-body { font-size: 13px; line-height: 1.65; }
.callout-body p { margin-bottom: 8px; } .callout-body p:last-child { margin-bottom: 0; }
.callout-warning { background: var(--rose-light); border-color: var(--rose); }
.callout-warning .callout-label { color: var(--rose); }
.callout-warning .callout-body  { color: #7B241C; }
.callout-note { background: var(--teal-light); border-color: var(--teal-mid); }
.callout-note .callout-label { color: var(--teal); }
.callout-note .callout-body  { color: #1A4A42; }
.callout-axiscare { background: #EBF4FF; border-color: #3B82F6; }
.callout-axiscare .callout-label { color: #1D4ED8; }
.callout-axiscare .callout-body  { color: #1E3A5F; }
.callout-ai { background: var(--amber-light); border-color: var(--amber); }
.callout-ai .callout-label { color: var(--amber); }
.callout-ai .callout-body  { color: #6B4200; }
.wmfy-box { background: var(--teal-light); border: 1px solid #A7D7CE; border-left: 5px solid var(--teal-mid); border-radius: var(--radius-md); padding: 20px 24px; margin-bottom: 40px; }
.wmfy-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal); margin-bottom: 12px; }
.wmfy-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.wmfy-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #1A4A42; line-height: 1.6; }
.wmfy-item::before { content: '✓'; color: var(--teal-mid); font-weight: 900; flex-shrink: 0; margin-top: 1px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); margin: 16px 0; }
.data-table th { background: var(--navy); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--slate); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: var(--bg); }
.data-table td:first-child { font-weight: 600; color: var(--navy); }
.bullet-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
.bullet-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--slate); line-height: 1.6; }
.bullet-list li::before { content: '·'; color: var(--teal-mid); font-size: 20px; line-height: 1.1; flex-shrink: 0; }
.reg-block { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 16px 0; }
.reg-header { background: var(--navy); color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; }
.reg-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.reg-row:last-child { border-bottom: none; }
.reg-source { padding: 3px 9px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px; }
.src-comar { background: #EDE9FE; color: #4C1D95; }
.src-cfr   { background: #DBEAFE; color: #1E3A5F; }
.src-md    { background: #D1FAE5; color: #064E3B; }
.reg-cite { font-weight: 700; color: var(--teal); text-decoration: none; }
.reg-cite:hover { text-decoration: underline; }
.reg-detail { font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 3px; }
.version-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin: 12px 0; }
.version-table th { background: var(--bg); padding: 8px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.version-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--slate); }
.version-table tr:last-child td { border-bottom: none; }
.version-table tr.current td { background: #F0FDF4; }
.version-badge { display: inline-block; padding: 3px 9px; background: var(--teal); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; }
.approval-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
.approval-item { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
.approval-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; }
.approval-name { font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }
.approval-sig-line { border-bottom: 1.5px solid var(--border); margin-bottom: 6px; height: 28px; }
.approval-sig-label { font-size: 11px; color: var(--muted); }
.review-notice { grid-column: 1 / -1; background: var(--amber-light); border: 1px solid var(--amber); border-radius: var(--radius-md); padding: 12px 16px; font-size: 13px; color: #5C3A00; }
.related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
.related-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; transition: all 0.2s; display: block; }
.related-card:hover { border-color: var(--teal-mid); box-shadow: 0 2px 8px rgba(11,107,92,0.1); transform: translateY(-1px); }
.related-card-id { font-family: var(--font-mono); font-size: 11px; color: var(--teal-mid); font-weight: 700; margin-bottom: 4px; }
.related-card-title { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
.related-card-domain { font-size: 11px; color: var(--muted); }
@media (max-width: 768px) {
  .main-content { padding: 0 20px 60px; max-width: 100%; }
  .doc-banner { margin: 0 -20px 32px; padding: 24px 20px 20px; }
  .doc-meta-grid { grid-template-columns: 1fr 1fr; }
  .approval-block { grid-template-columns: 1fr; }
}
@media print {
  .main-content { padding: 0; }
  .doc-banner { margin: 0 0 32px; }
  .ack-btn { display: none; }
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<main class="content">
  <div class="main-content">
    <nav class="breadcrumb">
  <a href="/pp">Policy Library</a>
  <span>›</span>
  <a href="/pp/domain/D2">D2 · Human Resources &amp; Workforce</a>
  <span>›</span>
  <span>VHS-D2-017</span>
</nav>
    <div class="doc-banner">
  <div class="doc-banner-top">
    <div>
      <div class="doc-meta-pills">
        <span class="pill pill-domain">D2 · Human Resources &amp; Workforce</span>
        <span class="pill pill-tier">Tier 1 · Policy</span>
        <span class="pill pill-owner">Owner: HR / Office Manager</span>
        <span class="pill pill-version">VHS-D2-017 · v2.0</span>
      </div>
      <h1 class="doc-title">Knowledge Resource Center</h1>
      <div class="doc-id-line">VHS-D2-017 · Applies to: All Staff</div>
    </div>
    <button class="ack-btn" id="ack-btn">Acknowledge reading</button>
  </div>
  <div class="doc-meta-grid">
    <div><div class="doc-meta-label">Effective Date</div><div class="doc-meta-value">March 15, 2026</div></div>
    <div><div class="doc-meta-label">Next Review Due</div><div class="doc-meta-value">March 15, 2029</div></div>
    <div><div class="doc-meta-label">COMAR Reference</div><div class="doc-meta-value">COMAR 10.07.05.10</div></div>
  </div>
</div>
    
<div class="wmfy-box">
  <div class="wmfy-label">✦ What this means for you</div>
  <ul class="wmfy-list"><li class="wmfy-item">The Vitalis Portal is your primary source for policies, training modules, and reference materials. You can access it from any device, any time.</li>
<li class="wmfy-item">There is also a physical resource shelf in the office with reference books, drug guides, state regulations, nursing procedure manuals, and past in-service materials.</li>
<li class="wmfy-item">If you ever have a clinical question and don't know the answer — use the resource center before improvising. Ask the DON or your supervisor if you are still unsure.</li>
<li class="wmfy-item">You were shown where the resource center is during orientation. If you cannot find it or access the portal, contact HR immediately.</li>
</ul>
</div>

<section class="policy-section" id="purpose">
  <h2 class="section-heading">Purpose</h2>
  <div class="body-text"><p>To ensure all Vitalis Healthcare Services, LLC staff have access to a designated collection of knowledge-based resources that support safe, current, evidence-based practice and ongoing professional development.</p></div>
</section>

<section class="policy-section" id="policy-statement">
  <h2 class="section-heading">Policy Statement</h2>
  <div class="body-text"><p>The continuous education of Vitalis staff is a priority in promoting quality care. The agency maintains both a physical resource area in the office and a digital resource hub within the Vitalis Portal where knowledge-based materials are available to all staff at all times.</p></div>
</section>

<section class="policy-section" id="procedure">
  <h2 class="section-heading">Procedure</h2>
  <ol class="steps">
<li class="step"><span class="step-num">1</span><div class="step-body"><span class="role-tag">Administrator</span> Designate and maintain a physical area in the office where knowledge-based materials are kept and accessible to all staff during operating hours.</div></li>
<li class="step"><span class="step-num">2</span><div class="step-body"><span class="role-tag">HR / Office Manager</span> During orientation, introduce each new staff member to the physical Resource Center location and the Vitalis Portal digital library. Confirm the employee can navigate both before clearing them for patient assignment.</div></li>
<li class="step"><span class="step-num">3</span><div class="step-body"><span class="role-tag">Administrator / DON</span> Maintain the required resource center materials listed below, updating them as new editions or regulations become available.</div></li>
</ol>
</section>

<section class="policy-section" id="materials">
  <h2 class="section-heading">Required Resource Center Materials</h2>
  <ul class="bullet-list"><li>Policy and Procedure Manual — full library accessed via Vitalis Portal</li>
<li>Nursing Procedures Manual</li>
<li>ICD-10 Coding Reference (current edition)</li>
<li>Drug Reference Guide (current edition)</li>
<li>Disaster Plan and Emergency Preparedness materials</li>
<li>Past in-service education materials and handouts</li>
<li>Safety Data Sheet (SDS) / MSDS Book</li>
<li>Maryland State Regulations — COMAR 10.07.05 (Residential Service Agencies)</li>
<li>Maryland Board of Nursing — Professional Practices Acts</li>
<li>Current nursing and home health industry journals</li>
<li>Medical Dictionary</li>
<li>Community Resources relevant to the clients and services Vitalis provides</li>
<li>Vitalis Orientation Manual</li>
</ul>
</section>

<section class="policy-section" id="digital">
  <h2 class="section-heading">Digital Library — Vitalis Portal</h2>
  <div class="callout callout-axiscare">
  <div class="callout-label">🖥 Vitalis Portal — Digital Resource Hub</div>
  <div class="callout-body">The Vitalis Portal is the primary digital knowledge resource. All staff have role-based access to the full P&amp;P library, LMS training modules, credentialing documents, and reference materials.<br><br>Staff who cannot access the portal should contact HR / Office Manager immediately — <strong>portal access is required for patient assignment clearance.</strong></div>
</div>
</section>

<section class="policy-section" id="regulatory">
  <h2 class="section-heading">Regulatory References</h2>
  <div class="reg-block"><div class="reg-header">Regulatory &amp; Accreditation References</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10</a> — Personnel training and development. Requires RSAs to make educational and reference resources available to all staff to support competent, safe care delivery.</div></div></div>
</div>
</section>

<section class="policy-section" id="history">
  <h2 class="section-heading">Version History</h2>
  <table class="version-table">
<thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody><tr class="current"><td><span class="version-badge">v2.0 · Current</span></td><td>Mar 15, 2026</td><td>Full rewrite for triennial review. Added plain-language summary, Vitalis Portal as primary digital resource, updated materials list. Supersedes legacy 2.025.1.</td></tr>
<tr><td>v1.0</td><td>Feb 28, 2023</td><td>Original policy prepared and approved February–March 2023 (legacy 2.025.1). OHCQ license submission version.</td></tr>
</tbody></table>
</section>

<section class="policy-section" id="related">
  <h2 class="section-heading">Related Documents</h2>
  <div class="related-grid">
  <a class="related-card" href="/pp/VHS-D2-007">
    <div class="related-card-id">VHS-D2-007</div>
    <div class="related-card-title">Orientation & Staff Development</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-008">
    <div class="related-card-id">VHS-D2-008</div>
    <div class="related-card-title">Policy & Procedure Agreement</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  <a class="related-card" href="/pp/VHS-D2-009">
    <div class="related-card-id">VHS-D2-009</div>
    <div class="related-card-title">Competency Evaluation</div>
    <div class="related-card-domain">D2 · Human Resources &amp; Workforce</div>
  </a>
  </div>
</section>
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
  <div class="review-notice">
    ⚠ This policy is due for its next triennial review on <strong>March 15, 2029</strong>. The document owner will receive a reminder 60 days prior via the Vitalis Portal.
  </div>
</div>
</section>
  </div>
</main>$VITALIS_HTML$,
  'active', 'VHS-D2-Human-Resources-Workforce.docx'
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
