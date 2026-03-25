-- Migration 011 — P&P policies table and D1 seed

INSERT INTO pp_policies (doc_id, domain, tier, title, owner_role, version, effective_date, review_date, applicable_roles, comar_refs, keywords, html_content, status, source_file) VALUES (
  'VHS-D1-001', 'D1', 1, 'Mission, Vision & Values', 'Administrator', '2.0',
  '2025-01-15', '2026-01-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.08'],
  ARRAY['mission','vision','values','philosophy','culture','extraordinary care','innovation'],
  $VITALIS_HTML$

  <header class="doc-header">
    <div class="breadcrumb">
      <a href="/portal">Portal</a><span>›</span>
      <a href="/portal/policies">Policies</a><span>›</span>
      <a href="/portal/policies?domain=D1">D1 · Governance &amp; compliance</a><span>›</span>
      <span>VHS-D1-001</span>
    </div>
    <div class="meta-strip">
      <span class="meta-pill pill-domain">D1 · Governance &amp; compliance</span>
      <span class="meta-pill pill-tier">Tier 1 · Policy</span>
      <span class="meta-pill pill-owner">Owner: Administrator</span>
      <span class="meta-pill pill-version">v2.0 · Effective Jan 15 2025</span>
    </div>
    <h1 class="doc-title">Mission, vision &amp; values</h1>
    <p class="doc-id"><strong>VHS-D1-001</strong> &nbsp;·&nbsp; Supersedes legacy 1.001.2 &nbsp;·&nbsp; Applies to: All Staff</p>
    <div class="meta-table">
      <div class="meta-item"><div class="meta-item-label">Effective date</div><div class="meta-item-value">January 15, 2025</div></div>
      <div class="meta-item"><div class="meta-item-label">Next review due</div><div class="meta-item-value">January 15, 2026</div></div>
      <div class="meta-item"><div class="meta-item-label">COMAR reference</div><div class="meta-item-value">10.07.05.08</div></div>
    </div>
  </header>

  <!-- Purpose -->
  <section class="policy-section" id="purpose">
    <h2 class="section-heading">Purpose</h2>
    <div class="body-text">
      <p>To define and communicate the foundational purpose, strategic direction, and behavioral standards of Vitalis Healthcare Services, LLC — and to ensure every member of our team understands how these principles guide decisions, interactions, and the care we deliver every day.</p>
      <p>This document is the organizational anchor for all Vitalis policies and procedures. When any policy appears to conflict with another, the mission and values stated here are the interpretive guide.</p>
    </div>
  </section>

  <!-- Mission -->
  <section class="policy-section" id="mission">
    <h2 class="section-heading">Mission statement</h2>
    <div class="body-text">
      <p style="font-family:var(--font-serif);font-size:20px;color:var(--navy);line-height:1.5;border-left:4px solid var(--teal-mid);padding-left:18px;font-style:italic;margin:16px 0;">
        Our mission is to make a positive difference in the lives of clients and patients by providing compassionate, high-quality home health care — delivered by dedicated, caring, and highly skilled staff. Every patient's well-being is vital to everything we do at Vitalis.
      </p>
      <p>This mission is not aspirational language — it is the standard against which every clinical decision, hiring choice, and operational practice at Vitalis is measured. The Governing Body reviews and reaffirms the mission statement at least annually as part of the organizational evaluation.</p>
    </div>
  </section>

  <!-- Vision -->
  <section class="policy-section" id="vision">
    <h2 class="section-heading">Vision</h2>
    <div class="body-text">
      <p>Vitalis Healthcare Services is committed to achieving the highest standard of home-based care in the communities we serve — and to being recognized as a vital, indispensable part of the healthcare continuum for every patient who comes through our doors.</p>
      <p>Our vision drives strategic decisions: the technology we adopt, the staff we hire, the partnerships we pursue, and the standards we hold ourselves to. Growth at Vitalis is purposeful — we expand our capacity only when we are confident we can maintain excellence.</p>
    </div>
  </section>

  <!-- Values -->
  <section class="policy-section" id="values">
    <h2 class="section-heading">Core values</h2>
    <div class="body-text">
      <p>These six values define how every Vitalis employee is expected to behave — with patients, with each other, and with our community partners. They are not posted on a wall; they are demonstrated in daily practice.</p>
    </div>
    <div class="value-grid">
      <div class="value-card">
        <div class="value-name">Extraordinary care</div>
        <div class="value-desc">We provide more than adequate care — we provide care that patients remember and trust. Every contact is an opportunity to demonstrate that Vitalis is essential to each patient's wellbeing.</div>
      </div>
      <div class="value-card">
        <div class="value-name">Visionary growth &amp; innovation</div>
        <div class="value-desc">We actively seek better ways to deliver care — through technology, data, and creative thinking. Innovation is not optional; it is how we fulfill our mission as the healthcare landscape changes around us.</div>
      </div>
      <div class="value-card">
        <div class="value-name">Synergy</div>
        <div class="value-desc">We solve problems together. No single person, discipline, or department has all the answers. We work in genuine partnership with patients, families, physicians, and each other.</div>
      </div>
      <div class="value-card">
        <div class="value-name">People development &amp; encouragement</div>
        <div class="value-desc">We invest in our staff because our staff is our care. Being an employer of choice means developing people's skills, recognizing their contributions, and creating space for them to grow.</div>
      </div>
      <div class="value-card">
        <div class="value-name">Transparency</div>
        <div class="value-desc">We operate openly. Information flows freely among staff, and we are honest with patients, families, and regulators — even when the news is difficult. Transparency builds the trust that makes care possible.</div>
      </div>
      <div class="value-card">
        <div class="value-name">Empowerment with accountability</div>
        <div class="value-desc">We give people the authority to act and the tools to track results. Empowerment without accountability is chaos; accountability without empowerment is compliance theater. We pursue neither.</div>
      </div>
    </div>
  </section>

  <!-- Operating principles -->
  <section class="policy-section" id="principles">
    <h2 class="section-heading">Operating principles</h2>
    <div class="body-text">
      <p>The following principles translate our values into day-to-day behavioral expectations for all Vitalis staff. These are non-negotiable standards of conduct.</p>
    </div>
    <ul class="principle-list">
      <li class="principle-item">
        <div class="principle-num">1</div>
        <div class="principle-body"><strong>Patient first, always.</strong> When any decision could go multiple ways, the path that best serves the patient's safety, dignity, and wellbeing is the correct one. This principle overrides cost, convenience, and scheduling considerations.</div>
      </li>
      <li class="principle-item">
        <div class="principle-num">2</div>
        <div class="principle-body"><strong>Document everything.</strong> If it wasn't documented, it didn't happen. Timely, accurate clinical records protect patients, protect staff, and protect the organization. No exception.</div>
      </li>
      <li class="principle-item">
        <div class="principle-num">3</div>
        <div class="principle-body"><strong>Communicate proactively.</strong> Don't wait to be asked. If something is wrong, changing, or uncertain — tell your supervisor, the DON, or the Administrator. Silence is never the safe choice in a clinical environment.</div>
      </li>
      <li class="principle-item">
        <div class="principle-num">4</div>
        <div class="principle-body"><strong>Embrace technology as a care tool.</strong> AxisCare, Claude, and our portal are not administrative burdens — they are how we deliver more accurate, more responsive, and more efficient care. Engage with them fully.</div>
      </li>
      <li class="principle-item">
        <div class="principle-num">5</div>
        <div class="principle-body"><strong>Hold each other to our standards.</strong> A colleague cutting corners on documentation or client interaction is not someone else's problem. Every Vitalis employee has standing — and responsibility — to raise concerns respectfully.</div>
      </li>
      <li class="principle-item">
        <div class="principle-num">6</div>
        <div class="principle-body"><strong>Represent Vitalis with pride.</strong> In every client home, every phone call, and every interaction with physicians, families, and community partners — you are Vitalis. How you show up is how Vitalis is known.</div>
      </li>
    </ul>

    <div class="callout callout-note" style="margin-top:20px;">
      <div class="callout-label">📋 For new staff</div>
      <div class="callout-body">During orientation, the Administrator or DON will walk through this document with you and discuss how these values apply to your specific role. You will be asked to sign an acknowledgment confirming you have read, understood, and agree to uphold the Vitalis mission and values. See <a href="VHS-D2-007-orientation.html">VHS-D2-007 · Orientation &amp; Staff Development →</a></div>
    </div>
  </section>

  <!-- Regulatory -->
  <section class="policy-section" id="regulatory">
    <h2 class="section-heading">Regulatory &amp; accreditation references</h2>
    <div class="reg-block">
      <div class="reg-header">Regulatory &amp; accreditation references</div>
      <div class="reg-row">
        <span class="reg-source src-comar">COMAR</span>
        <div>
          <div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.08" target="_blank">COMAR 10.07.05.08</a> — Organizational structure and policies. Requires the governing body to adopt written policies defining the agency's mission, organizational structure, and standards of conduct, and to review those policies at least annually.</div>
          <div class="reg-note">Primary compliance anchor for this document</div>
        </div>
      </div>
      <div class="reg-row">
        <span class="reg-source src-md">MD Code</span>
        <div>
          <div class="reg-detail"><span class="reg-cite">Health-General Article § 19-4A-04, Annotated Code of Maryland</span> — RSA governing body responsibilities. Establishes the governing body's legal obligation to adopt, implement, and monitor adherence to all agency policies, including the mission and organizational values.</div>
          <div class="reg-note">Statutory foundation underlying COMAR 10.07.05</div>
        </div>
      </div>
      <div class="reg-footer">
        <span>Last verified: March 2025</span>
        <span>Next regulatory review: January 2026 · Owner: Administrator</span>
      </div>
    </div>
  </section>

  <!-- Related -->
  <section class="policy-section" id="related">
    <h2 class="section-heading">Related documents</h2>
    <div class="related-grid">
      <a class="related-card" href="VHS-D1-003-administrative-control.html">
        <div class="related-card-id">VHS-D1-003</div>
        <div class="related-card-title">Administrative control &amp; governing body structure</div>
        <div class="related-card-domain">D1 · Governance &amp; compliance</div>
      </a>
      <a class="related-card" href="VHS-D1-004-ethics-compliance.html">
        <div class="related-card-id">VHS-D1-004</div>
        <div class="related-card-title">Ethics &amp; corporate compliance</div>
        <div class="related-card-domain">D1 · Governance &amp; compliance</div>
      </a>
      <a class="related-card" href="VHS-D2-007-orientation.html">
        <div class="related-card-id">VHS-D2-007</div>
        <div class="related-card-title">Orientation &amp; staff development</div>
        <div class="related-card-domain">D2 · Human resources &amp; workforce</div>
      </a>
      <a class="related-card" href="VHS-D1-002-services-offered.html">
        <div class="related-card-id">VHS-D1-002</div>
        <div class="related-card-title">Services offered</div>
        <div class="related-card-domain">D1 · Governance &amp; compliance</div>
      </a>
    </div>
  </section>

  <!-- Version history -->
  <section class="policy-section" id="history">
    <h2 class="section-heading">Version history</h2>
    <table class="version-table">
      <thead><tr><th>Version</th><th>Date</th><th>Author</th><th>Changes</th></tr></thead>
      <tbody>
        <tr class="current">
          <td><span class="version-badge">v2.0 current</span></td>
          <td>Jan 15, 2025</td>
          <td>Administrator</td>
          <td>Full rewrite. Expanded from a list of statements to an operational document with purpose, operating principles, and staff guidance. Added regulatory references. Adopted new VHS-D1-001 identifier. Supersedes legacy 1.001.2.</td>
        </tr>
        <tr>
          <td>v1.0</td>
          <td>Jan 1, 2022</td>
          <td>Administrator</td>
          <td>Original document (legacy 1.001.2). OHCQ license submission version.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- Approvals -->
  <section class="policy-section" id="approvals">
    <h2 class="section-heading">Approvals</h2>
    <div class="approval-block">
      <div class="approval-item">
        <div class="approval-role">Prepared by</div>
        <div class="approval-name">Administrator</div>
        <div style="font-size:12px;color:var(--muted);">Governing body authority</div>
        <div class="approval-sig-line"></div>
        <div class="approval-sig-label">Signature &amp; date</div>
      </div>
      <div class="approval-item">
        <div class="approval-role">Reviewed by</div>
        <div class="approval-name">Director of Nursing</div>
        <div style="font-size:12px;color:var(--muted);">Clinical leadership</div>
        <div class="approval-sig-line"></div>
        <div class="approval-sig-label">Signature &amp; date</div>
      </div>
      <div class="review-notice">
        ⚠ This policy is due for annual review on <strong>January 15, 2026</strong>. The Administrator will receive an automated reminder 30 days prior via the Vitalis portal.
      </div>
    </div>
  </section>

$VITALIS_HTML$,
  'active', 'VHS-D1-001-mission-vision-values.html'
) ON CONFLICT (doc_id) DO NOTHING;

INSERT INTO pp_policies (doc_id, domain, tier, title, owner_role, version, effective_date, review_date, applicable_roles, comar_refs, keywords, html_content, status, source_file) VALUES (
  'VHS-D1-002', 'D1', 1, 'Services Offered', 'Administrator', '2.0',
  '2025-01-15', '2026-01-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.07','10.07.05.12'],
  ARRAY['services','skilled nursing','CNA','personal assistance','companion','home health','scope of care'],
  $VITALIS_HTML$

  <header class="doc-header">
    <div class="breadcrumb">
      <a href="/portal">Portal</a><span>›</span><a href="/portal/policies">Policies</a><span>›</span>
      <a href="/portal/policies?domain=D1">D1 · Governance &amp; compliance</a><span>›</span><span>VHS-D1-002</span>
    </div>
    <div class="meta-strip">
      <span class="meta-pill pill-domain">D1 · Governance &amp; compliance</span>
      <span class="meta-pill pill-tier">Tier 1 · Policy</span>
      <span class="meta-pill pill-owner">Owner: Administrator</span>
      <span class="meta-pill pill-version">v2.0 · Effective Jan 15 2025</span>
    </div>
    <h1 class="doc-title">Services offered</h1>
    <p class="doc-id"><strong>VHS-D1-002</strong> &nbsp;·&nbsp; Supersedes legacy 1.002.1 &nbsp;·&nbsp; Applies to: All Staff</p>
    <div class="meta-table">
      <div class="meta-item"><div class="meta-item-label">Effective date</div><div class="meta-item-value">January 15, 2025</div></div>
      <div class="meta-item"><div class="meta-item-label">Next review due</div><div class="meta-item-value">January 15, 2026</div></div>
      <div class="meta-item"><div class="meta-item-label">COMAR references</div><div class="meta-item-value">10.07.05.07 · 10.07.05.12</div></div>
    </div>
  </header>

  <section class="policy-section" id="purpose">
    <h2 class="section-heading">Purpose</h2>
    <div class="body-text">
      <p>To define the specific home care services Vitalis Healthcare Services, LLC is licensed and authorized to provide, to clearly distinguish what is within our scope of care, and to establish the procedure for managing client needs that fall outside that scope. This policy directly informs client admissions, care planning, and public disclosure obligations.</p>
    </div>
  </section>

  <section class="policy-section" id="services">
    <h2 class="section-heading">Service lines</h2>
    <div class="body-text">
      <p>Vitalis Healthcare Services, LLC is licensed as a Level 3 Residential Service Agency by the Maryland Department of Health, Office of Health Care Quality. We are authorized to provide the following four service lines in the residence of sick or disabled individuals:</p>
    </div>
    <div class="service-grid">
      <div class="service-card sc-sn">
        <div class="service-title">Skilled nursing</div>
        <div class="service-subtitle">RN and LPN · Licensed under Maryland Health Occupations Article</div>
        <ul class="service-tasks">
          <li class="service-task"><div class="task-dot"></div>Initial and ongoing patient assessments</li>
          <li class="service-task"><div class="task-dot"></div>Wound care and dressing changes</li>
          <li class="service-task"><div class="task-dot"></div>Medication administration and management</li>
          <li class="service-task"><div class="task-dot"></div>Patient and family education</li>
          <li class="service-task"><div class="task-dot"></div>Physician order management and coordination</li>
          <li class="service-task"><div class="task-dot"></div>Care plan development and supervision</li>
          <li class="service-task"><div class="task-dot"></div>RN pronouncement of death</li>
        </ul>
        <div class="service-note">All skilled nursing is provided in accordance with the Maryland Nurse Practice Act and the patient's physician-authorized plan of care.</div>
      </div>
      <div class="service-card sc-cna">
        <div class="service-title">Certified nursing assistant (CNA)</div>
        <div class="service-subtitle">Certified by Maryland Board of Nursing · Under RN delegation and supervision</div>
        <ul class="service-tasks">
          <li class="service-task"><div class="task-dot"></div>Bathing, grooming, and personal hygiene</li>
          <li class="service-task"><div class="task-dot"></div>Dressing and undressing</li>
          <li class="service-task"><div class="task-dot"></div>Feeding and nutrition assistance</li>
          <li class="service-task"><div class="task-dot"></div>Toileting and continence care</li>
          <li class="service-task"><div class="task-dot"></div>Transfer and ambulation assistance</li>
          <li class="service-task"><div class="task-dot"></div>Positioning and repositioning</li>
          <li class="service-task"><div class="task-dot"></div>Medication reminding (with signed consent)</li>
          <li class="service-task"><div class="task-dot"></div>Routine skin and hair care</li>
        </ul>
        <div class="service-note">CNAs may only perform nursing tasks delegated in writing by an RN. Supervised every 30 days by RN.</div>
      </div>
      <div class="service-card sc-pas">
        <div class="service-title">Personal assistance services (PAS)</div>
        <div class="service-subtitle">Non-certified aide · Routine ongoing care in residence or independent living</div>
        <ul class="service-tasks">
          <li class="service-task"><div class="task-dot"></div>Activities of daily living (ADLs) — same scope as CNA above</li>
          <li class="service-task"><div class="task-dot"></div>Assisting with self-administered medications</li>
          <li class="service-task"><div class="task-dot"></div>Routine hair and skin care</li>
          <li class="service-task"><div class="task-dot"></div>Exercises as directed in care plan</li>
          <li class="service-task"><div class="task-dot"></div>Respite services for family caregivers</li>
        </ul>
        <div class="service-note">PAS aides do not require CNA certification. RN assesses whether a client's needs can be safely met by a non-certified aide before assignment. See <a href="VHS-D4-005-rn-delegation.html">VHS-D4-005 · RN Delegation →</a></div>
      </div>
      <div class="service-card sc-comp">
        <div class="service-title">Companion services</div>
        <div class="service-subtitle">Non-medical supportive services · No nursing supervision required</div>
        <ul class="service-tasks">
          <li class="service-task"><div class="task-dot"></div>Companionship and social engagement</li>
          <li class="service-task"><div class="task-dot"></div>Meal preparation and light housekeeping</li>
          <li class="service-task"><div class="task-dot"></div>Grocery shopping and errands</li>
          <li class="service-task"><div class="task-dot"></div>Transportation to appointments</li>
          <li class="service-task"><div class="task-dot"></div>Laundry and linen care</li>
          <li class="service-task"><div class="task-dot"></div>Recreational activities</li>
        </ul>
        <div class="service-note">Companions do not provide personal care or ADL assistance. Supervised every 30 days by a Companion Supervisor (not required to be a nurse).</div>
      </div>
    </div>
  </section>

  <section class="policy-section" id="exclusions">
    <h2 class="section-heading">Service exclusions</h2>
    <div class="exclusion-box">
      <div class="exclusion-title">Services Vitalis does NOT provide</div>
      <div class="exclusion-body">
        Vitalis Healthcare Services, LLC does not provide ventilator management or home medical equipment (HME) services. We do not participate in clinical research or investigational drug studies. When a client requires services outside our licensed scope, we do not attempt to provide those services — we refer. See the Unmet Service Needs section below.
      </div>
    </div>
  </section>

  <section class="policy-section" id="provision">
    <h2 class="section-heading">Provision of services — clinical requirements</h2>
    <ol class="steps">
      <li class="step">
        <div class="step-num">1</div>
        <div class="step-body">
          <span class="role-tag">RN</span>
          A Registered Nurse performs an initial comprehensive assessment of every new client who requires skilled services or assistance with activities of daily living before care begins. No aide or companion may begin services until this assessment is complete. See <a href="VHS-D4-001-rn-assessment.html">VHS-D4-001 · RN Assessment →</a>
        </div>
      </li>
      <li class="step">
        <div class="step-num">2</div>
        <div class="step-body">
          <span class="role-tag">RN</span>
          Based on the assessment, the RN determines: (a) which service line is appropriate for this client; (b) whether a certified aide is required or whether a non-certified PAS aide can safely meet needs; and (c) the appropriate supervision frequency. These determinations are documented in AxisCare and the care plan before assignment.
        </div>
      </li>
      <li class="step">
        <div class="step-num">3</div>
        <div class="step-body">
          <span class="role-tag">RN</span>
          The RN participates in developing the client's plan of care, assigns appropriate personnel, and provides training to assigned staff specific to that client's needs and care instructions.
        </div>
      </li>
      <li class="step">
        <div class="step-num">4</div>
        <div class="step-body">
          <span class="role-tag">All clinical staff</span>
          All staff providing services under Vitalis — whether direct employees or contractors — must comply with Maryland law, Vitalis policies, and the client's individualized plan of care. Staff may not unilaterally expand the scope of services provided beyond what is documented in the care plan.
        </div>
      </li>
    </ol>
  </section>

  <section class="policy-section" id="unmet">
    <h2 class="section-heading">Unmet service needs</h2>
    <div class="body-text">
      <p>When a client's care needs cannot be met by Vitalis due to scope limitations, staffing constraints, or specialty requirements, the following process applies:</p>
    </div>
    <ol class="steps">
      <li class="step">
        <div class="step-num">1</div>
        <div class="step-body"><span class="role-tag">Care Coordinator / DON</span> Identify the unmet need and document it in the client's clinical record with the reason it cannot be fulfilled by Vitalis.</div>
      </li>
      <li class="step">
        <div class="step-num">2</div>
        <div class="step-body"><span class="role-tag">Care Coordinator</span> Identify and refer the client to an appropriate agency or provider. Document the referral — including the receiving agency's name, address, and contact information — in a communication note in AxisCare.</div>
      </li>
      <li class="step">
        <div class="step-num">3</div>
        <div class="step-body"><span class="role-tag">Care Coordinator</span> Notify the client or client representative and the attending physician of the referral and the clinical reasons for it. Both notifications must be documented.</div>
      </li>
      <li class="step">
        <div class="step-num">4</div>
        <div class="step-body"><span class="role-tag">Administrator</span> All unmet service needs are reported to the Governing Body at least quarterly for awareness and service planning purposes.</div>
      </li>
    </ol>
  </section>

  <section class="policy-section" id="axiscare">
    <h2 class="section-heading">AxisCare workflow</h2>
    <div class="callout callout-axiscare">
      <div class="callout-label">AxisCare — service line setup</div>
      <div class="callout-body">
        <p><strong>At admission:</strong> The Care Coordinator or RN opens the new client profile in AxisCare and selects the authorized service line(s) from the Service Type dropdown. Only services approved in the care plan may be selected. The service type drives scheduling, EVV requirements, and billing codes.</p>
        <p><strong>Service changes:</strong> Any change to a client's authorized service line (e.g., escalating from Companion to CNA services) requires a new RN assessment documented in AxisCare before the service change is implemented in the system. The Care Coordinator updates the service type only after the RN assessment is completed and the physician order (if required) is received.</p>
        <p><strong>Unmet needs log:</strong> Document referrals for unmet services under <code>AxisCare → Client → Communication Notes → Referral</code>. Tag with "Unmet Service Referral" for quarterly reporting.</p>
      </div>
    </div>
  </section>

  <section class="policy-section" id="regulatory">
    <h2 class="section-heading">Regulatory &amp; accreditation references</h2>
    <div class="reg-block">
      <div class="reg-header">Regulatory &amp; accreditation references</div>
      <div class="reg-row">
        <span class="reg-source src-comar">COMAR</span>
        <div>
          <div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.07" target="_blank">COMAR 10.07.05.07</a> — Scope of services. Defines the services a Level 3 RSA is authorized to provide, the requirement for an RN initial assessment, and the obligation to refer unmet needs to other providers.</div>
          <div class="reg-note">Primary licensing compliance anchor for service scope</div>
        </div>
      </div>
      <div class="reg-row">
        <span class="reg-source src-comar">COMAR</span>
        <div>
          <div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.12" target="_blank">COMAR 10.07.05.12</a> — Plan of care. Requires a physician-authorized plan of care for all skilled services, and that the RN participates in care plan development and staff assignment.</div>
          <div class="reg-note">Crosswalk to VHS-D4-002 Physician Orders and Plan of Care</div>
        </div>
      </div>
      <div class="reg-row">
        <span class="reg-source src-cfr">42 CFR</span>
        <div>
          <div class="reg-detail"><span class="reg-cite">42 CFR § 484.60</span> — Care planning. Establishes standards for individualized care plans and the role of the RN in developing and supervising plans of care for all service types.</div>
          <div class="reg-note">Medicare CoP best-practice benchmark for RSA care planning standards</div>
        </div>
      </div>
      <div class="reg-row">
        <span class="reg-source src-md">MD Code</span>
        <div>
          <div class="reg-detail"><span class="reg-cite">Health Occupations Article § 8-6A, Annotated Code of Maryland</span> — Certified nursing assistant scope of practice. Defines the delegated nursing tasks a CNA may perform, the required RN delegation, and the limits of non-certified personal care aides.</div>
          <div class="reg-note">Statutory basis for the CNA and PAS aide scope distinctions in this policy</div>
        </div>
      </div>
      <div class="reg-footer">
        <span>Last verified: March 2025</span>
        <span>Next regulatory review: January 2026 · Owner: Administrator</span>
      </div>
    </div>
  </section>

  <section class="policy-section" id="related">
    <h2 class="section-heading">Related documents</h2>
    <div class="related-grid">
      <a class="related-card" href="VHS-D4-001-rn-assessment.html">
        <div class="related-card-id">VHS-D4-001</div>
        <div class="related-card-title">RN assessment &amp; comprehensive evaluation</div>
        <div class="related-card-domain">D4 · Clinical operations</div>
      </a>
      <a class="related-card" href="VHS-D4-005-rn-delegation.html">
        <div class="related-card-id">VHS-D4-005</div>
        <div class="related-card-title">RN delegation</div>
        <div class="related-card-domain">D4 · Clinical operations</div>
      </a>
      <a class="related-card" href="VHS-D1-007-services-under-contract.html">
        <div class="related-card-id">VHS-D1-007</div>
        <div class="related-card-title">Services provided under contract</div>
        <div class="related-card-domain">D1 · Governance &amp; compliance</div>
      </a>
      <a class="related-card" href="VHS-D3-001-client-rights.html">
        <div class="related-card-id">VHS-D3-001</div>
        <div class="related-card-title">Client rights &amp; responsibilities</div>
        <div class="related-card-domain">D3 · Client services</div>
      </a>
    </div>
  </section>

  <section class="policy-section" id="history">
    <h2 class="section-heading">Version history</h2>
    <table class="version-table">
      <thead><tr><th>Version</th><th>Date</th><th>Author</th><th>Changes</th></tr></thead>
      <tbody>
        <tr class="current">
          <td><span class="version-badge">v2.0 current</span></td>
          <td>Jan 15, 2025</td>
          <td>Administrator / DON</td>
          <td>Full rewrite. Expanded service card detail for each service line. Added scope distinctions between CNA and PAS aide. Added unmet needs procedure, AxisCare workflow, COMAR citations. Supersedes legacy 1.002.1.</td>
        </tr>
        <tr>
          <td>v1.0</td>
          <td>Jan 1, 2022</td>
          <td>Administrator</td>
          <td>Original document (legacy 1.002.1). OHCQ license submission version.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="policy-section" id="approvals">
    <h2 class="section-heading">Approvals</h2>
    <div class="approval-block">
      <div class="approval-item">
        <div class="approval-role">Prepared by</div>
        <div class="approval-name">Administrator</div>
        <div style="font-size:12px;color:var(--muted);">Governing body authority</div>
        <div class="approval-sig-line"></div>
        <div class="approval-sig-label">Signature &amp; date</div>
      </div>
      <div class="approval-item">
        <div class="approval-role">Reviewed by</div>
        <div class="approval-name">Director of Nursing</div>
        <div style="font-size:12px;color:var(--muted);">Clinical authority</div>
        <div class="approval-sig-line"></div>
        <div class="approval-sig-label">Signature &amp; date</div>
      </div>
      <div class="review-notice">⚠ This policy is due for annual review on <strong>January 15, 2026</strong>. The Administrator will receive an automated reminder 30 days prior via the Vitalis portal.</div>
    </div>
  </section>

$VITALIS_HTML$,
  'active', 'VHS-D1-002-services-offered.html'
) ON CONFLICT (doc_id) DO NOTHING;

INSERT INTO pp_policies (doc_id, domain, tier, title, owner_role, version, effective_date, review_date, applicable_roles, comar_refs, keywords, html_content, status, source_file) VALUES (
  'VHS-D1-003', 'D1', 1, 'Administrative control &amp; governing body structure', 'Administrator', '2.0',
  '2025-01-15', '2026-01-15',
  ARRAY['Administrator','Director of Nursing'],
  ARRAY['10.07.05.08','10.07.05.09'],
  ARRAY['governing body','administrator','DON','organizational structure','accountability','leadership'],
  $VITALIS_HTML$
  <header class="doc-header">
    <div class="breadcrumb">
      <a href="/portal">Portal</a><span>›</span><a href="/portal/policies">Policies</a><span>›</span>
      <a href="/portal/policies?domain=D1">D1 · Governance &amp; compliance</a><span>›</span><span>VHS-D1-003</span>
    </div>
    <div class="meta-strip">
      <span class="meta-pill pill-domain">D1 · Governance &amp; compliance</span>
      <span class="meta-pill pill-tier">Tier 1 · Policy</span>
      <span class="meta-pill pill-owner">Owner: Administrator</span>
      <span class="meta-pill pill-version">v2.0 · Effective Jan 15 2025</span>
    </div>
    <h1 class="doc-title">Administrative control &amp; governing body structure</h1>
    <p class="doc-id"><strong>VHS-D1-003</strong> &nbsp;·&nbsp; Supersedes legacy 1.006.1 &nbsp;·&nbsp; Applies to: Administrator · Director of Nursing · Governing Body</p>
    <div class="meta-table">
      <div class="meta-item"><div class="meta-item-label">Effective date</div><div class="meta-item-value">January 15, 2025</div></div>
      <div class="meta-item"><div class="meta-item-label">Next review due</div><div class="meta-item-value">January 15, 2026</div></div>
      <div class="meta-item"><div class="meta-item-label">COMAR reference</div><div class="meta-item-value">10.07.05.08 · 10.07.05.09</div></div>
    </div>
  </header>
  
  <section class="policy-section" id="purpose">
    <h2 class="section-heading">Purpose</h2>
    <div class="body-text">
      <p>To define the legal accountability, composition, and operational responsibilities of the Vitalis Healthcare Services, LLC Governing Body, Administrator, and Director of Nursing — and to establish clear lines of authority that ensure the agency operates in compliance with all applicable Maryland RSA regulations and delivers safe, high-quality care.</p>
    </div>
  </section>

  <section class="policy-section" id="governing-body">
    <h2 class="section-heading">Governing body</h2>
    <div class="body-text">
      <p>The Governing Body holds full legal responsibility for the conduct and operation of Vitalis Healthcare Services, LLC. It adopts, implements, enforces, and monitors adherence to all written policies as required by licensure. No operational authority supersedes the Governing Body.</p>
    </div>
    <h3 style="font-size:14px;font-weight:500;color:var(--text);margin:16px 0 10px;">Governing Body responsibilities</h3>
    <ol class="steps">
      <li class="step"><div class="step-num">1</div><div class="step-body">Adopts and annually reviews the agency mission statement, goals, and philosophy (see <a href="VHS-D1-001-mission-vision-values.html">VHS-D1-001</a>).</div></li>
      <li class="step"><div class="step-num">2</div><div class="step-body">Appoints and may dismiss the Administrator and Alternate Administrator.</div></li>
      <li class="step"><div class="step-num">3</div><div class="step-body">Reviews and approves all policies and procedures at least annually.</div></li>
      <li class="step"><div class="step-num">4</div><div class="step-body">Approves the annual operating budget, capital expenditures, and oversees fiscal affairs. See <a href="VHS-D1-006-financial-management.html">VHS-D1-006 · Financial Management →</a></div></li>
      <li class="step"><div class="step-num">5</div><div class="step-body">Ensures adequate human resources are maintained to meet patient care obligations.</div></li>
      <li class="step"><div class="step-num">6</div><div class="step-body">Promotes performance improvement and responsible utilization of community resources.</div></li>
      <li class="step"><div class="step-num">7</div><div class="step-body">Reviews business contracts and legal documents annually.</div></li>
      <li class="step"><div class="step-num">8</div><div class="step-body">Requires all Governing Body members and executive staff to submit annual written conflict of interest disclosures. Statements retained on file for a minimum of 7 years. See <a href="VHS-D2-024-conflict-of-interest.html">VHS-D2-024 · Conflict of Interest →</a></div></li>
    </ol>
    <div class="callout callout-note" style="margin-top:16px;">
      <div class="callout-label">Meeting requirements</div>
      <div class="callout-body">Governing Body member term of office is four years. A quorum requires majority representation of Governing Body membership. The Governing Body shall meet at least monthly, or more often as needed. Meeting minutes are retained on file for at least 7 years.</div>
    </div>
    <h3 style="font-size:14px;font-weight:500;color:var(--text);margin:20px 0 10px;">Governing Body member orientation</h3>
    <div class="body-text"><p>Each new Governing Body member is oriented by the Chairperson to the following before assuming responsibilities:</p></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
      <div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Organizational structure</div>
      <div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Confidentiality &amp; HIPAA agreement</div>
      <div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Mission, values, and goals</div>
      <div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Programs and initiatives overview</div>
      <div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Employee and patient grievance procedures</div>
      <div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Performance improvement responsibilities</div>
      <div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Organizational ethics and conduct</div>
      <div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Conflict of interest policy</div>
    </div>
  </section>

  <section class="policy-section" id="administrator">
    <h2 class="section-heading">Administrator</h2>
    <div class="body-text">
      <p>The Administrator is appointed by the Governing Body and is responsible for implementing and supervising all administrative policies and the provision of all services. The Administrator reports directly to the Governing Body.</p>
    </div>
    <h3 style="font-size:14px;font-weight:500;color:var(--text);margin:16px 0 10px;">Qualifications</h3>
    <div class="body-text">
      <p>The Administrator must have at least one year of managerial or supervisory experience. The Administrator may also be a supervising physician or supervising registered nurse. The Administrator and Alternate Administrator must complete a minimum of <strong>six clock hours per year</strong> of continuing education in subjects related to Administrator duties.</p>
    </div>
    <h3 style="font-size:14px;font-weight:500;color:var(--text);margin:16px 0 10px;">Administrator responsibilities</h3>
    <ol class="steps">
      <li class="step"><div class="step-num">1</div><div class="step-body">Organizes and directs the agency's ongoing functions and ensures operational compliance with all applicable federal, state, and local laws and regulations.</div></li>
      <li class="step"><div class="step-num">2</div><div class="step-body">Recruits, employs, and retains qualified, competent personnel to maintain appropriate staffing levels at all times.</div></li>
      <li class="step"><div class="step-num">3</div><div class="step-body">Implements an effective budgeting and accounting system. May authorize routine invoices and utilities not exceeding $300 without prior Governing Body approval. All expenditures above this threshold require Governing Body approval.</div></li>
      <li class="step"><div class="step-num">4</div><div class="step-body">Ensures the accuracy of all public information materials and activities. See <a href="VHS-D1-008-public-disclosure.html">VHS-D1-008 · Public Disclosure →</a></div></li>
      <li class="step"><div class="step-num">5</div><div class="step-body">Ensures annual performance evaluations are completed for all personnel by appropriate supervisors.</div></li>
      <li class="step"><div class="step-num">6</div><div class="step-body">Appoints a qualified Director of Nursing and Alternate DON. Orients the DON to organizational structure, mission, safety goals, and accountability expectations.</div></li>
      <li class="step"><div class="step-num">7</div><div class="step-body">Maintains ongoing liaison among the Governing Body, Professional Advisory Committee, employees, patients, and the community.</div></li>
      <li class="step"><div class="step-num">8</div><div class="step-body">Informs the Governing Body and staff of current organizational, community, and industry trends. Ensures management staff attend at least one approved continuing education seminar or conference annually.</div></li>
    </ol>
    <div class="callout callout-ai" style="margin-top:16px;">
      <div class="callout-label">AI assist — Administrator workflow</div>
      <div class="callout-body">
        <p>The Administrator can use Claude to stay current on Maryland RSA regulatory updates:</p>
        <div class="sample-prompt">"Search for any new guidance or amendments to COMAR 10.07.05 issued by the Maryland Office of Health Care Quality in the last 90 days. Summarize any changes that would affect Vitalis operations and flag which policy documents need updating."</div>
      </div>
    </div>
  </section>

  <section class="policy-section" id="don">
    <h2 class="section-heading">Director of Nursing (DON)</h2>
    <div class="body-text">
      <p>The DON is appointed by the Administrator and is a full-time, salaried employee of the agency. The DON holds primary clinical accountability for all services provided under the Vitalis license and reports directly to the Administrator.</p>
    </div>
    <h3 style="font-size:14px;font-weight:500;color:var(--text);margin:16px 0 10px;">DON responsibilities</h3>
    <ol class="steps">
      <li class="step"><div class="step-num">1</div><div class="step-body">Supervises all patient care activities to ensure compliance with current standards of accepted nursing and medical practice.</div></li>
      <li class="step"><div class="step-num">2</div><div class="step-body">Develops, maintains, periodically reviews, and implements philosophy, objectives, standards of practice, policies, procedures, and job descriptions for all nursing service personnel.</div></li>
      <li class="step"><div class="step-num">3</div><div class="step-body">Ensures sufficient qualified nursing personnel are available to meet patient care needs at all times, including nights, weekends, and holidays.</div></li>
      <li class="step"><div class="step-num">4</div><div class="step-body">Maintains availability by telephone during all operating hours. Ensures an RN is always accessible by phone and available for home visits when aides are on assignment.</div></li>
      <li class="step"><div class="step-num">5</div><div class="step-body">Identifies, in writing, an Alternate DON to function in the DON's absence.</div></li>
      <li class="step"><div class="step-num">6</div><div class="step-body">Participates in all activities relevant to services furnished, including the development of personnel qualifications and staff assignments.</div></li>
    </ol>
  </section>

  <section class="policy-section" id="org-chart">
    <h2 class="section-heading">Organizational structure</h2>
    <div class="body-text"><p>The following is the current organizational structure and lines of authority for Vitalis Healthcare Services, LLC. Update this section whenever personnel changes occur.</p></div>
    <div style="border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-top:8px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:var(--bg);"><th style="padding:10px 14px;text-align:left;font-weight:500;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border);">Role</th><th style="padding:10px 14px;text-align:left;font-weight:500;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border);">Name</th><th style="padding:10px 14px;text-align:left;font-weight:500;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border);">Contact</th></tr></thead>
        <tbody>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 14px;font-weight:500;color:var(--text);">Governing Body Member / Administrator</td><td style="padding:10px 14px;color:var(--slate);">Favour Ofeogbu</td><td style="padding:10px 14px;color:var(--slate);">240-425-7465</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 14px;font-weight:500;color:var(--text);">Chief Financial Officer</td><td style="padding:10px 14px;color:var(--slate);">Okezie Ofeogbu</td><td style="padding:10px 14px;color:var(--slate);">240-425-7465</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 14px;font-weight:500;color:var(--text);">Director of Nursing</td><td style="padding:10px 14px;color:var(--slate);">[Current DON — update upon appointment]</td><td style="padding:10px 14px;color:var(--slate);">—</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 14px;font-weight:500;color:var(--text);">Alternate DON / Alternate Administrator</td><td style="padding:10px 14px;color:var(--slate);">[Current Alt DON — update upon appointment]</td><td style="padding:10px 14px;color:var(--slate);">—</td></tr>
          <tr><td style="padding:10px 14px;font-weight:500;color:var(--text);">Office address</td><td colspan="2" style="padding:10px 14px;color:var(--slate);">16701 Melford Blvd., Suite 400, Bowie, MD 20715</td></tr>
        </tbody>
      </table>
    </div>
    <div class="callout callout-warning" style="margin-top:16px;">
      <div class="callout-label">⚠ Maintenance required</div>
      <div class="callout-body">This table must be updated within 5 business days of any change in personnel in these roles. The Administrator is responsible for keeping this section current. Outdated org chart information is a common OHCQ survey deficiency.</div>
    </div>
  </section>

  <section class="policy-section" id="operating-hours">
    <h2 class="section-heading">Operating hours &amp; availability</h2>
    <div class="body-text">
      <p>Standard operating hours are <strong>8:30 a.m. – 5:30 p.m., Monday through Friday</strong>, excluding recognized national holidays (New Year's Day, Independence Day, Labor Day, Thanksgiving Day, Christmas Day).</p>
      <p>The Administrator (or alternate) and the DON (or alternate) are available during all operating hours — either in person or by telecommunication. After 5:30 p.m. and on weekends and holidays, the answering service relays calls to the RN on call. See <a href="VHS-D7-003-after-hours-care.html">VHS-D7-003 · After-Hours Care →</a> for the full on-call escalation protocol.</p>
      <p>The agency's main telephone number — <strong>240-618-3184</strong> — is posted at building entry and transferred to the answering service when the office is unstaffed.</p>
    </div>
  </section>

  <section class="policy-section" id="regulatory">
    <h2 class="section-heading">Regulatory &amp; accreditation references</h2>
    <div class="reg-block">
      <div class="reg-header">Regulatory &amp; accreditation references</div>
      <div class="reg-row">
        <span class="reg-source src-comar">COMAR</span>
        <div>
          <div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.08" target="_blank">COMAR 10.07.05.08</a> — Governing authority. Defines the legal responsibilities of the governing body for RSA policy adoption, implementation, and ongoing compliance oversight.</div>
          <div class="reg-note">Primary governing body compliance anchor · OHCQ surveys directly against this regulation</div>
        </div>
      </div>
      <div class="reg-row">
        <span class="reg-source src-comar">COMAR</span>
        <div>
          <div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.09" target="_blank">COMAR 10.07.05.09</a> — Administrator qualifications and responsibilities. Establishes minimum qualifications for the Administrator role, continuing education requirements, and accountability to the governing body.</div>
          <div class="reg-note">Crosswalk: Administrator qualification requirements and annual CE obligation</div>
        </div>
      </div>
      <div class="reg-row">
        <span class="reg-source src-md">MD Code</span>
        <div>
          <div class="reg-detail"><span class="reg-cite">Health-General Article § 19-4A-04, Annotated Code of Maryland</span> — RSA governing body legal obligations. Establishes the governing body's statutory duty to assume full legal responsibility for policy determination, management, operation, and financial liability of the agency.</div>
          <div class="reg-note">Statutory foundation underlying COMAR 10.07.05.08</div>
        </div>
      </div>
      <div class="reg-footer">
        <span>Last verified: March 2025</span>
        <span>Next regulatory review: January 2026 · Owner: Administrator</span>
      </div>
    </div>
  </section>

  <section class="policy-section" id="related">
    <h2 class="section-heading">Related documents</h2>
    <div class="related-grid">
      <a class="related-card" href="VHS-D1-001-mission-vision-values.html"><div class="related-card-id">VHS-D1-001</div><div class="related-card-title">Mission, vision &amp; values</div><div class="related-card-domain">D1 · Governance</div></a>
      <a class="related-card" href="VHS-D1-004-ethics-compliance.html"><div class="related-card-id">VHS-D1-004</div><div class="related-card-title">Ethics &amp; corporate compliance</div><div class="related-card-domain">D1 · Governance</div></a>
      <a class="related-card" href="VHS-D1-005-pac.html"><div class="related-card-id">VHS-D1-005</div><div class="related-card-title">Professional Advisory Committee</div><div class="related-card-domain">D1 · Governance</div></a>
      <a class="related-card" href="VHS-D1-006-financial-management.html"><div class="related-card-id">VHS-D1-006</div><div class="related-card-title">Financial management</div><div class="related-card-domain">D1 · Governance</div></a>
      <a class="related-card" href="VHS-D2-024-conflict-of-interest.html"><div class="related-card-id">VHS-D2-024</div><div class="related-card-title">Conflict of interest</div><div class="related-card-domain">D2 · Human resources</div></a>
      <a class="related-card" href="VHS-D7-003-after-hours-care.html"><div class="related-card-id">VHS-D7-003</div><div class="related-card-title">After-hours care &amp; on-call protocol</div><div class="related-card-domain">D7 · Emergency &amp; continuity</div></a>
    </div>
  </section>

  <section class="policy-section" id="history">
    <h2 class="section-heading">Version history</h2>
    <table class="version-table">
      <thead><tr><th>Version</th><th>Date</th><th>Author</th><th>Changes</th></tr></thead>
      <tbody>
        <tr class="current"><td><span class="version-badge">v2.0 current</span></td><td>Jan 15, 2025</td><td>Administrator</td><td>Full rewrite. Restructured into Governing Body, Administrator, DON, and Org Chart sections. Added qualification details, AI assist prompt, operating hours, and COMAR citations. Org chart updated to reflect current personnel. Supersedes legacy 1.006.1.</td></tr>
        <tr><td>v1.0</td><td>Jan 1, 2022</td><td>Administrator</td><td>Original document (legacy 1.006.1). OHCQ license submission version.</td></tr>
      </tbody>
    </table>
  </section>

  <section class="policy-section" id="approvals">
    <h2 class="section-heading">Approvals</h2>
    <div class="approval-block">
      <div class="approval-item"><div class="approval-role">Prepared &amp; approved by</div><div class="approval-name">Administrator</div><div style="font-size:12px;color:var(--muted);">Governing body authority</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
      <div class="approval-item"><div class="approval-role">Reviewed by</div><div class="approval-name">Director of Nursing</div><div style="font-size:12px;color:var(--muted);">Clinical leadership</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
      <div class="review-notice">⚠ This policy is due for annual review on <strong>January 15, 2026</strong>. The Administrator will receive an automated reminder 30 days prior via the Vitalis portal.</div>
    </div>
  </section>

$VITALIS_HTML$,
  'active', 'VHS-D1-003-administrative-control.html'
) ON CONFLICT (doc_id) DO NOTHING;

INSERT INTO pp_policies (doc_id, domain, tier, title, owner_role, version, effective_date, review_date, applicable_roles, comar_refs, keywords, html_content, status, source_file) VALUES (
  'VHS-D1-004', 'D1', 1, 'Ethics &amp; corporate compliance', 'Administrator', '2.0',
  '2025-01-15', '2026-01-15',
  ARRAY['All Staff'],
  NULL,
  ARRAY['ethics','compliance','corporate compliance','fraud','waste','abuse','hotline','reporting','OIG'],
  $VITALIS_HTML$
  <header class="doc-header">
    <div class="breadcrumb"><a href="/portal">Portal</a><span>›</span><a href="/portal/policies">Policies</a><span>›</span><a href="/portal/policies?domain=D1">D1 · Governance &amp; compliance</a><span>›</span><span>VHS-D1-004</span></div>
    <div class="meta-strip">
      <span class="meta-pill pill-domain">D1 · Governance &amp; compliance</span>
      <span class="meta-pill pill-tier">Tier 1 · Policy</span>
      <span class="meta-pill pill-owner">Owner: Administrator</span>
      <span class="meta-pill pill-version">v2.0 · Effective Jan 15 2025</span>
    </div>
    <h1 class="doc-title">Ethics &amp; corporate compliance</h1>
    <p class="doc-id"><strong>VHS-D1-004</strong> &nbsp;·&nbsp; Supersedes legacy 1.006.2, 1.006.3 &nbsp;·&nbsp; Applies to: All Staff · Administrative Staff</p>
    <div class="meta-table">
      <div class="meta-item"><div class="meta-item-label">Effective date</div><div class="meta-item-value">January 15, 2025</div></div>
      <div class="meta-item"><div class="meta-item-label">Next review due</div><div class="meta-item-value">January 15, 2026</div></div>
      <div class="meta-item"><div class="meta-item-label">COMAR reference</div><div class="meta-item-value">10.07.05.08</div></div>
    </div>
  </header>
  
  <section class="policy-section" id="purpose">
    <h2 class="section-heading">Purpose</h2>
    <div class="body-text">
      <p>To establish the ethical framework, compliance program, and Ethics Committee structure that governs the conduct of all Vitalis Healthcare Services, LLC personnel — ensuring the agency operates in full compliance with federal and state law, OHCQ licensing requirements, and the highest ethical standards of home health care practice.</p>
    </div>
  </section>
  <section class="policy-section" id="policy">
    <h2 class="section-heading">Policy statement</h2>
    <div class="body-text">
      <p>Vitalis Healthcare Services, LLC is committed to conducting all business operations with honesty, integrity, and full legal compliance. This commitment extends to every employee, contractor, and affiliated professional. The Compliance Program is system-wide and applies to all levels of the organization.</p>
      <p>All personnel are expected to: know and follow applicable federal and state laws; report suspected violations promptly and without fear of retaliation; seek guidance from their supervisor or the Administrator when uncertain; and never allow personal or financial interest to compromise patient care or agency integrity.</p>
    </div>
    <div class="callout callout-warning">
      <div class="callout-label">⚠ Zero tolerance</div>
      <div class="callout-body">Vitalis has zero tolerance for fraud, waste, or abuse in any federal or state healthcare program. This includes falsifying documentation, billing for services not rendered, misrepresenting diagnoses, or soliciting or receiving improper referral compensation. Violations are grounds for immediate termination and mandatory reporting to applicable authorities.</div>
    </div>
  </section>
  <section class="policy-section" id="ethics-committee">
    <h2 class="section-heading">Ethics Committee</h2>
    <div class="body-text">
      <p>The Ethics Committee is an advisory group appointed by the Administrator to review ethical and moral questions raised by staff or patients. Any staff member or patient may submit a written request for Ethics Committee review to the Administrator or DON at any time.</p>
    </div>
    <h3 style="font-size:14px;font-weight:500;color:var(--text);margin:16px 0 10px;">Composition</h3>
    <div class="body-text"><p>The Ethics Committee must include at minimum: (1) the Administrator; (2) the Director of Nursing; (3) a representative from a non-skilled discipline. Additional members may be appointed as needed.</p></div>
    <h3 style="font-size:14px;font-weight:500;color:var(--text);margin:16px 0 10px;">Process</h3>
    <ol class="steps">
      <li class="step"><div class="step-num">1</div><div class="step-body">Staff member or patient submits written request to the Administrator or DON describing the ethical question or concern.</div></li>
      <li class="step"><div class="step-num">2</div><div class="step-body">The Ethics Committee convenes within <strong>3 business days</strong> of receiving the written request.</div></li>
      <li class="step"><div class="step-num">3</div><div class="step-body">The Committee encourages dialogue, educates relevant parties, identifies issues, offers viable options, and seeks supplemental resources as needed. The Committee acts in an advisory capacity — not a punitive one.</div></li>
      <li class="step"><div class="step-num">4</div><div class="step-body">Meeting minutes including final action are submitted to the Governing Body within <strong>24 hours</strong> of the completed committee meeting.</div></li>
      <li class="step"><div class="step-num">5</div><div class="step-body">If the ethics question involves a potential legal violation, the Administrator notifies appropriate counsel and/or authorities.</div></li>
    </ol>
  </section>
  <section class="policy-section" id="compliance-program">
    <h2 class="section-heading">Corporate compliance program</h2>
    <div class="body-text">
      <p>The Compliance Program serves three purposes: (1) to educate all personnel about legal risks in healthcare business practices; (2) to encourage managers to seek appropriate legal counsel before acting on uncertain situations; and (3) to secure compliance with federal and state guidelines.</p>
    </div>
    <h3 style="font-size:14px;font-weight:500;color:var(--text);margin:16px 0 10px;">Key compliance obligations — all staff</h3>
    <ol class="steps">
      <li class="step"><div class="step-num">1</div><div class="step-body"><strong>OIG Exclusion check:</strong> Prior to hire, and annually thereafter, the Administrator verifies that no staff member or contractor is excluded from federal healthcare programs via the Office of Inspector General exclusion database. No excluded individual may provide services billed to Medicare or Medicaid.</div></li>
      <li class="step"><div class="step-num">2</div><div class="step-body"><strong>Anti-kickback compliance:</strong> No employee or contractor may offer, solicit, pay, or receive anything of value in exchange for patient referrals. This includes gifts, meals, entertainment, or any remuneration beyond standard employment compensation. See <a href="VHS-D3-002-solicitation-referrals.html">VHS-D3-002 · Referral Remuneration Policy →</a></div></li>
      <li class="step"><div class="step-num">3</div><div class="step-body"><strong>Accurate billing:</strong> All services billed must reflect services actually rendered, properly authorized, and accurately documented in AxisCare. The Billing/Compliance Officer reviews all claims before submission.</div></li>
      <li class="step"><div class="step-num">4</div><div class="step-body"><strong>Documentation integrity:</strong> No staff member may alter, destroy, or falsify any clinical record, billing record, or personnel file. Corrections to records must follow the approved correction protocol (single line through error, initial, date, and correction).</div></li>
      <li class="step"><div class="step-num">5</div><div class="step-body"><strong>Annual compliance training:</strong> All staff complete compliance training during orientation and annually thereafter. Training covers fraud and abuse definitions, reporting obligations, patient rights, and this policy. Completion is tracked in the Vitalis LMS portal.</div></li>
    </ol>
  </section>
  <section class="policy-section" id="reporting">
    <h2 class="section-heading">Reporting obligations &amp; non-retaliation</h2>
    <div class="body-text">
      <p>Every Vitalis employee has both the right and the obligation to report suspected violations of this policy or applicable law — without fear of retaliation. Retaliation against anyone who reports a good-faith compliance concern is itself a violation of this policy and grounds for disciplinary action.</p>
      <p>Reports may be made to: the direct supervisor; the Administrator; or directly to the Maryland Office of Health Care Quality (1-877-402-8218). Anonymous reports may be made by contacting the Administrator in writing without identification.</p>
      <p>Upon receiving a report, the Administrator investigates the concern promptly and documents all findings. If a legal violation is confirmed or suspected, appropriate external authorities are notified.</p>
    </div>
  </section>
  <section class="policy-section" id="ai-assist">
    <h2 class="section-heading">AI assist</h2>
    <div class="callout callout-ai">
      <div class="callout-label">Claude AI — compliance monitoring</div>
      <div class="callout-body">
        <p>The Administrator or Compliance Officer can use Claude to support ongoing compliance monitoring:</p>
        <div class="sample-prompt">"Review our current billing records in AxisCare for [month] and flag any patterns that could indicate billing anomalies — such as unusually high visit counts per client, services billed without corresponding EVV records, or claims submitted without matching physician orders."</div>
        <div class="sample-prompt" style="margin-top:8px;">"Search the OIG exclusion database for [staff name] and confirm their current exclusion status."</div>
      </div>
    </div>
  </section>
  <section class="policy-section" id="regulatory">
    <h2 class="section-heading">Regulatory &amp; accreditation references</h2>
    <div class="reg-block">
      <div class="reg-header">Regulatory &amp; accreditation references</div>
      <div class="reg-row">
        <span class="reg-source src-comar">COMAR</span>
        <div>
          <div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.08" target="_blank">COMAR 10.07.05.08</a> — Organizational policies. Requires the governing body to adopt and enforce policies ensuring ethical and legally compliant operations, including procedures for handling ethics complaints and compliance concerns.</div>
          <div class="reg-note">Primary regulatory anchor for ethics and compliance framework</div>
        </div>
      </div>
      <div class="reg-row">
        <span class="reg-source src-cfr">42 CFR</span>
        <div>
          <div class="reg-detail"><span class="reg-cite">42 CFR § 1001 et seq.</span> — Federal Anti-Kickback Statute and OIG exclusion program. Prohibits remuneration for referrals in federal healthcare programs and establishes the OIG exclusion database that agencies must check before hiring.</div>
          <div class="reg-note">Federal compliance anchor for billing integrity and referral practices</div>
        </div>
      </div>
      <div class="reg-row">
        <span class="reg-source src-chap">CHAP</span>
        <div>
          <div class="reg-detail"><span class="reg-cite">CHAP Compliance Program Standards (effective June 2024)</span> — Requires all accredited organizations to maintain a formal compliance program including policies, training, reporting mechanisms, and non-retaliation protections.</div>
          <div class="reg-note">CHAP updated compliance standards effective June 2024 — applied to all accreditation scopes including home care</div>
        </div>
      </div>
      <div class="reg-footer">
        <span>Last verified: March 2025</span>
        <span>Next regulatory review: January 2026 · Owner: Administrator</span>
      </div>
    </div>
  </section>
  <section class="policy-section" id="related">
    <h2 class="section-heading">Related documents</h2>
    <div class="related-grid">
      <a class="related-card" href="VHS-D1-003-administrative-control.html"><div class="related-card-id">VHS-D1-003</div><div class="related-card-title">Administrative control &amp; governing body</div><div class="related-card-domain">D1 · Governance</div></a>
      <a class="related-card" href="VHS-D2-024-conflict-of-interest.html"><div class="related-card-id">VHS-D2-024</div><div class="related-card-title">Conflict of interest</div><div class="related-card-domain">D2 · Human resources</div></a>
      <a class="related-card" href="VHS-D3-002-solicitation-referrals.html"><div class="related-card-id">VHS-D3-002</div><div class="related-card-title">Solicitation &amp; referral remuneration</div><div class="related-card-domain">D3 · Client services</div></a>
      <a class="related-card" href="VHS-D5-001-billing.html"><div class="related-card-id">VHS-D5-001</div><div class="related-card-title">Billing &amp; revenue cycle</div><div class="related-card-domain">D5 · Business operations</div></a>
    </div>
  </section>
  <section class="policy-section" id="history">
    <h2 class="section-heading">Version history</h2>
    <table class="version-table">
      <thead><tr><th>Version</th><th>Date</th><th>Author</th><th>Changes</th></tr></thead>
      <tbody>
        <tr class="current"><td><span class="version-badge">v2.0 current</span></td><td>Jan 15, 2025</td><td>Administrator</td><td>Full rewrite. Merged legacy 1.006.2 (Ethics Committee) and 1.006.3 (Corporate Compliance Plan) into single unified document. Added zero-tolerance statement, OIG exclusion procedure, AI assist prompts, CHAP 2024 compliance standard reference. Supersedes legacy 1.006.2 and 1.006.3.</td></tr>
        <tr><td>v1.0</td><td>Jan 1, 2022</td><td>Administrator</td><td>Original documents (legacy 1.006.2 and 1.006.3). OHCQ license submission versions.</td></tr>
      </tbody>
    </table>
  </section>

  <section class="policy-section" id="approvals">
    <h2 class="section-heading">Approvals</h2>
    <div class="approval-block">
      <div class="approval-item"><div class="approval-role">Prepared &amp; approved by</div><div class="approval-name">Administrator</div><div style="font-size:12px;color:var(--muted);">Governing body authority</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
      <div class="approval-item"><div class="approval-role">Reviewed by</div><div class="approval-name">Director of Nursing</div><div style="font-size:12px;color:var(--muted);">Clinical leadership</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
      <div class="review-notice">⚠ This policy is due for annual review on <strong>January 15, 2026</strong>. Automated reminder sent 30 days prior via portal.</div>
    </div>
  </section>
$VITALIS_HTML$,
  'active', 'VHS-D1-004-ethics-compliance.html'
) ON CONFLICT (doc_id) DO NOTHING;

INSERT INTO pp_policies (doc_id, domain, tier, title, owner_role, version, effective_date, review_date, applicable_roles, comar_refs, keywords, html_content, status, source_file) VALUES (
  'VHS-D1-005', 'D1', 1, 'Professional Advisory Committee (PAC)', 'Administrator', '2.0',
  '2025-01-15', '2026-01-15',
  ARRAY['Administrator'],
  ARRAY['10.07.05.08'],
  ARRAY['PAC','professional advisory committee','triennial review','quality improvement'],
  $VITALIS_HTML$
<header class="doc-header">
<div class="breadcrumb"><a href="/portal">Portal</a><span>›</span><a href="/portal/policies">Policies</a><span>›</span><a href="/portal/policies?domain=D1">D1 · Governance</a><span>›</span><span>VHS-D1-005</span></div>
<div class="meta-strip"><span class="meta-pill pill-domain">D1 · Governance &amp; compliance</span><span class="meta-pill pill-tier">Tier 1 · Policy</span><span class="meta-pill pill-owner">Owner: Administrator</span><span class="meta-pill pill-version">v2.0 · Jan 15 2025</span></div>
<h1 class="doc-title">Professional Advisory Committee (PAC)</h1>
<p class="doc-id"><strong>VHS-D1-005</strong> &nbsp;·&nbsp; Supersedes legacy 1.007.1</p>
<div class="meta-table"><div class="meta-item"><div class="meta-item-label">Effective date</div><div class="meta-item-value">January 15, 2025</div></div><div class="meta-item"><div class="meta-item-label">Next review due</div><div class="meta-item-value">January 15, 2026</div></div><div class="meta-item"><div class="meta-item-label">COMAR reference</div><div class="meta-item-value">10.07.05.08</div></div></div>
</header>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2><div class="body-text"><p>To define the composition, responsibilities, and meeting requirements of the Vitalis Healthcare Services, LLC Professional Advisory Committee (PAC) — the body responsible for helping establish and evaluate agency policies and clinical programs at least triennially.</p></div></section>
<section class="policy-section" id="composition"><h2 class="section-heading">Composition</h2><div class="body-text"><p>The PAC is appointed by the Governing Body. The Administrator manages day-to-day coordination. The Governing Body reviews PAC membership annually.</p><p>The PAC must include at minimum:</p></div>
<div style="border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin:12px 0;">
<table style="width:100%;border-collapse:collapse;font-size:13px;">
<thead><tr style="background:var(--bg);"><th style="padding:10px 14px;text-align:left;font-weight:500;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border);">Required member</th><th style="padding:10px 14px;text-align:left;font-weight:500;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border);">Requirement</th></thead>
<tbody>
<tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 14px;font-weight:500;color:var(--text);">Representative from each professional discipline offered</td><td style="padding:10px 14px;color:var(--slate);">RN, LPN, CNA — one representative per discipline</td></tr>
<tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 14px;font-weight:500;color:var(--text);">Physician</td><td style="padding:10px 14px;color:var(--slate);">In active practice or within last 5 years</td></tr>
<tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 14px;font-weight:500;color:var(--text);">Non-skilled employee representative</td><td style="padding:10px 14px;color:var(--slate);">Companion, PAS aide, or administrative staff</td></tr>
<tr><td style="padding:10px 14px;font-weight:500;color:var(--text);">Independent consumer representative</td><td style="padding:10px 14px;color:var(--slate);">Neither an agency employee nor owner. Represents patient perspective.</td></tr>
</tbody>
</table>
</div>
</section>
<section class="policy-section" id="meetings"><h2 class="section-heading">Meetings &amp; schedule</h2><div class="body-text"><p>The PAC meets <strong>at least triennially</strong> (every 3 years) to conduct the full program review outlined below. The initial PAC meeting occurs prior to the agency initiating patient care, and must approve all agency policies and procedures before care begins.</p><p>The Administrator provides the following orientation to PAC members before each meeting begins: (1) organizational structure; (2) employee and patient grievance policies; (3) responsibilities for quality improvement; (4) review of the agency's mission and goals; and (5) execution of a confidentiality agreement.</p></div></section>
<section class="policy-section" id="agenda"><h2 class="section-heading">Required review agenda</h2><div class="body-text"><p>At each PAC meeting, the following areas must be reviewed and documented. Recommended changes are submitted to the Governing Body for approval.</p></div>
<h3 style="font-size:14px;font-weight:500;color:var(--text);margin:14px 0 8px;">Administrative &amp; operational policies</h3>
<div class="body-text"><p>Administrative records · Admission and discharge criteria · Informed consent · Advance directives including DNR orders · Client rights · Contract services · Medication management · Quality improvement · Mandated reporting of abuse, neglect, and exploitation · Communicable and reportable diseases · Client records and confidentiality · Record retention · Supervision and delivery of services · Emergency and on-call services · Infection control · Consumer complaint handling · Telemonitoring · Approved variances · Specialized training requirements · Primary diagnoses and level of care served · Service areas covered.</p></div>
<h3 style="font-size:14px;font-weight:500;color:var(--text);margin:14px 0 8px;">Financial policies</h3>
<div class="body-text"><p>Admission agreements · Service delivery data collection and verification · Billing methods for agency and contractors · Client fee change notification · Billing error correction and refund policy · Delinquent account collection.</p></div>
<h3 style="font-size:14px;font-weight:500;color:var(--text);margin:14px 0 8px;">Personnel policies</h3>
<div class="body-text"><p>Written job descriptions · Personnel record maintenance · Professional license and certification verification · Annual performance and competency evaluation · Contractor qualification verification · Management and supervision adequacy · Criminal background check process · Reporting of licensed personnel violations to appropriate boards.</p></div>
<h3 style="font-size:14px;font-weight:500;color:var(--text);margin:14px 0 8px;">Annual service statistics reviewed</h3>
<div class="body-text"><p>At minimum, the annual review assesses: diagnosis mix · age distribution · sex · referral sources · length of service · number of visits · service types provided · referrals not admitted and reasons · reasons for discharge · patient disposition · staffing levels.</p></div>
</section>
<section class="policy-section" id="documentation"><h2 class="section-heading">Documentation</h2><div class="body-text"><p>Written minutes must document: dates of meetings · attendance with signatures · agenda items · recommendations made. Minutes are presented, read, and accepted at the next regular Governing Body meeting following the PAC meeting. All PAC minutes are retained in the administrative records.</p></div>
<div class="callout callout-ai"><div class="callout-label">AI assist — PAC preparation</div><div class="callout-body"><p>Before each PAC meeting, the Administrator can ask Claude:</p><div class="sample-prompt">"Generate the PAC meeting agenda and preparation packet for [date], including a summary of all policy changes made since the last PAC meeting, current service statistics from AxisCare, and a list of any open compliance items or regulatory changes since our last review."</div></div></div>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory references</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; accreditation references</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.08" target="_blank">COMAR 10.07.05.08(D)</a> — Professional advisory committee. Requires RSAs to establish a PAC with defined membership, triennial meeting schedule, and responsibility to review all agency policies and submit recommendations to the governing body.</div><div class="reg-note">Primary PAC compliance anchor · triennial meeting requirement is mandatory</div></div></div>
<div class="reg-footer"><span>Last verified: March 2025</span><span>Next regulatory review: January 2026</span></div>
</div></section>
<section class="policy-section" id="related"><h2 class="section-heading">Related documents</h2>
<div class="related-grid">
<a class="related-card" href="VHS-D1-003-administrative-control.html"><div class="related-card-id">VHS-D1-003</div><div class="related-card-title">Administrative control &amp; governing body</div><div class="related-card-domain">D1 · Governance</div></a>
<a class="related-card" href="VHS-D1-004-ethics-compliance.html"><div class="related-card-id">VHS-D1-004</div><div class="related-card-title">Ethics &amp; corporate compliance</div><div class="related-card-domain">D1 · Governance</div></a>
</div></section>
<section class="policy-section" id="history"><h2 class="section-heading">Version history</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Author</th><th>Changes</th></tr></thead>
<tbody><tr class="current"><td><span class="version-badge">v2.0 current</span></td><td>Jan 15, 2025</td><td>Administrator</td><td>Full rewrite. Restructured into composition table, meeting schedule, required agenda sections. Added AI assist prompt. Supersedes legacy 1.007.1.</td></tr>
<tr><td>v1.0</td><td>Jan 1, 2022</td><td>Administrator</td><td>Original document (legacy 1.007.1). OHCQ license submission version.</td></tr></tbody>
</table></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2>
<div class="approval-block">
<div class="approval-item"><div class="approval-role">Prepared &amp; approved by</div><div class="approval-name">Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
<div class="approval-item"><div class="approval-role">Reviewed by</div><div class="approval-name">Director of Nursing</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
<div class="review-notice">⚠ Annual review due <strong>January 15, 2026</strong>. Automated reminder sent 30 days prior.</div>
</div></section>
$VITALIS_HTML$,
  'active', 'VHS-D1-005-pac.html'
) ON CONFLICT (doc_id) DO NOTHING;

INSERT INTO pp_policies (doc_id, domain, tier, title, owner_role, version, effective_date, review_date, applicable_roles, comar_refs, keywords, html_content, status, source_file) VALUES (
  'VHS-D1-006', 'D1', 1, 'Financial management', 'Administrator', '2.0',
  '2025-01-15', '2026-01-15',
  ARRAY['Administrator','CFO'],
  ARRAY['10.07.05.08'],
  ARRAY['financial records','budget','capital expenditures','GAAP','audit','fiscal management'],
  $VITALIS_HTML$
<header class="doc-header">
<div class="breadcrumb"><a href="/portal">Portal</a><span>›</span><a href="/portal/policies">Policies</a><span>›</span><a href="/portal/policies?domain=D1">D1 · Governance</a><span>›</span><span>VHS-D1-006</span></div>
<div class="meta-strip"><span class="meta-pill pill-domain">D1 · Governance &amp; compliance</span><span class="meta-pill pill-tier">Tier 1 · Policy</span><span class="meta-pill pill-owner">Owner: Administrator</span><span class="meta-pill pill-version">v2.0 · Jan 15 2025</span></div>
<h1 class="doc-title">Financial management</h1>
<p class="doc-id"><strong>VHS-D1-006</strong> &nbsp;·&nbsp; Supersedes legacy 1.017.1, 1.017.2, 1.017.3</p>
<div class="meta-table"><div class="meta-item"><div class="meta-item-label">Effective date</div><div class="meta-item-value">January 15, 2025</div></div><div class="meta-item"><div class="meta-item-label">Next review due</div><div class="meta-item-value">January 15, 2026</div></div><div class="meta-item"><div class="meta-item-label">COMAR reference</div><div class="meta-item-value">10.07.05.08</div></div></div>
</header>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2><div class="body-text"><p>To establish standards for the maintenance of financial records, annual budget preparation, and capital expenditure planning at Vitalis Healthcare Services, LLC — ensuring fiscal transparency, regulatory compliance, and the long-term financial viability of the agency.</p></div></section>
<section class="policy-section" id="policy"><h2 class="section-heading">Policy statement</h2><div class="body-text"><p>Vitalis Healthcare Services, LLC maintains all financial records in accordance with Generally Accepted Accounting Principles (GAAP). The Governing Body holds ultimate fiscal responsibility and oversight. All financial practices must reflect sound, ethical business standards consistent with the agency's mission and applicable laws.</p></div></section>
<section class="policy-section" id="records"><h2 class="section-heading">Financial records</h2>
<ol class="steps">
<li class="step"><div class="step-num">1</div><div class="step-body"><strong>Maintenance:</strong> Financial records are maintained in their original state by an Officer of the agency. All records are accurate, dated at entry, and made available to the Administrator, Governing Body, PAC, Department of Human Services, and authorized regulatory entities upon request.</div></li>
<li class="step"><div class="step-num">2</div><div class="step-body"><strong>Retention:</strong> All financial records are retained for <strong>7 years</strong> after the month of the last audit to which they apply.</div></li>
<li class="step"><div class="step-num">3</div><div class="step-body"><strong>Payroll:</strong> Payroll is handled by the finance department using the SurePayroll platform (powered by Paychex). Payroll checks may be signed by the Administrator. See <a href="VHS-D2-004-payday.html">VHS-D2-004 · Payday Policy →</a></div></li>
<li class="step"><div class="step-num">4</div><div class="step-body"><strong>Annual external audit:</strong> An annual external review is conducted by a licensed CPA. The CPA's findings are presented to the Governing Body.</div></li>
<li class="step"><div class="step-num">5</div><div class="step-body"><strong>Quarterly review:</strong> The Administrator reviews financial information at least quarterly and reports to the Governing Body.</div></li>
</ol>
</section>
<section class="policy-section" id="budgeting"><h2 class="section-heading">Annual operating budget</h2>
<ol class="steps">
<li class="step"><div class="step-num">1</div><div class="step-body">The Administrator and CFO prepare the annual operating budget reflecting all anticipated income and expenses for the coming year. Staff input is solicited in the preparation process.</div></li>
<li class="step"><div class="step-num">2</div><div class="step-body">The budget reflects the agency's mission, strategic vision, and goals, and complies with applicable laws, GAAP, and home care industry standards.</div></li>
<li class="step"><div class="step-num">3</div><div class="step-body">The completed budget is submitted to the Governing Body for ratification and approval before the start of the fiscal year.</div></li>
<li class="step"><div class="step-num">4</div><div class="step-body">The Administrator monitors budget vs. actual expenses and revenue on an ongoing basis. Significant variances are reported to the Governing Body at monthly meetings.</div></li>
</ol>
</section>
<section class="policy-section" id="capital"><h2 class="section-heading">Capital expenditure plan</h2>
<div class="body-text"><p>A capital expenditure plan covering at least a <strong>3-year period</strong> (including the current year's budget) is maintained. The plan identifies anticipated sources of financing and objectives for each expenditure exceeding <strong>$25,000</strong> or any purchase of capital items.</p></div>
<ol class="steps">
<li class="step"><div class="step-num">1</div><div class="step-body">The Administrator and CFO develop and maintain the capital expenditure plan with input from administrative staff.</div></li>
<li class="step"><div class="step-num">2</div><div class="step-body">The Governing Body approves the capital expenditure plan. Quarterly capital expenditure reports are provided to the Governing Body.</div></li>
<li class="step"><div class="step-num">3</div><div class="step-body">Capital expenditures are deductible over the expected useful life of the item (not expensed all at once), in accordance with GAAP.</div></li>
</ol>
</section>
<section class="policy-section" id="controls"><h2 class="section-heading">Financial controls &amp; insurance</h2>
<div class="body-text"><p>The agency maintains adequate insurance coverage at all times, including: (1) malpractice insurance; and (2) general liability insurance covering personal property damages, bodily injury, product liability, and libel/slander at a minimum of <strong>$1 million comprehensive general liability per occurrence</strong>.</p>
<p>The Administrator may authorize routine invoices and utility expenses not exceeding <strong>$300</strong> without prior Governing Body approval. All expenditures above this threshold require Governing Body approval.</p></div>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory references</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; accreditation references</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.08" target="_blank">COMAR 10.07.05.08(C)</a> — Financial policies. Requires RSAs to maintain written financial policies covering billing methods, fee structures, data collection, and financial record management. Governing Body is responsible for approving budgets and capital expenditures.</div><div class="reg-note">Primary financial compliance anchor</div></div></div>
<div class="reg-footer"><span>Last verified: March 2025</span><span>Next regulatory review: January 2026</span></div>
</div></section>
<section class="policy-section" id="related"><h2 class="section-heading">Related documents</h2>
<div class="related-grid">
<a class="related-card" href="VHS-D1-003-administrative-control.html"><div class="related-card-id">VHS-D1-003</div><div class="related-card-title">Administrative control &amp; governing body</div><div class="related-card-domain">D1 · Governance</div></a>
<a class="related-card" href="VHS-D5-001-billing.html"><div class="related-card-id">VHS-D5-001</div><div class="related-card-title">Billing &amp; revenue cycle</div><div class="related-card-domain">D5 · Business operations</div></a>
<a class="related-card" href="VHS-D2-004-payday.html"><div class="related-card-id">VHS-D2-004</div><div class="related-card-title">Payday policy</div><div class="related-card-domain">D2 · Human resources</div></a>
</div></section>
<section class="policy-section" id="history"><h2 class="section-heading">Version history</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Author</th><th>Changes</th></tr></thead>
<tbody><tr class="current"><td><span class="version-badge">v2.0 current</span></td><td>Jan 15, 2025</td><td>Administrator / CFO</td><td>Full rewrite. Merged three legacy financial documents (1.017.1 Financial Records, 1.017.2 Financial Planning, 1.017.3 Capital Expenditures) into a single unified policy. Added insurance minimums, payroll platform reference, expenditure approval threshold. Supersedes legacy 1.017.1, 1.017.2, 1.017.3.</td></tr>
<tr><td>v1.0</td><td>Jan 1, 2022</td><td>Administrator</td><td>Original documents (legacy 1.017.1, 1.017.2, 1.017.3). OHCQ license submission versions.</td></tr></tbody>
</table></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2>
<div class="approval-block">
<div class="approval-item"><div class="approval-role">Prepared &amp; approved by</div><div class="approval-name">Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
<div class="approval-item"><div class="approval-role">Reviewed by</div><div class="approval-name">Director of Nursing</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
<div class="review-notice">⚠ Annual review due <strong>January 15, 2026</strong>. Automated reminder sent 30 days prior.</div>
</div></section>
$VITALIS_HTML$,
  'active', 'VHS-D1-006-financial-management.html'
) ON CONFLICT (doc_id) DO NOTHING;

INSERT INTO pp_policies (doc_id, domain, tier, title, owner_role, version, effective_date, review_date, applicable_roles, comar_refs, keywords, html_content, status, source_file) VALUES (
  'VHS-D1-007', 'D1', 1, 'Services provided under contract', 'Administrator', '2.0',
  '2025-01-15', '2026-01-15',
  ARRAY['Administrator','Director of Nursing'],
  ARRAY['10.07.05.08','10.07.05.10'],
  ARRAY['contract','contractor','contracted services','arrangement','subcontract','billing','1099'],
  $VITALIS_HTML$
<header class="doc-header">
<div class="breadcrumb"><a href="/portal">Portal</a><span>›</span><a href="/portal/policies">Policies</a><span>›</span><a href="/portal/policies?domain=D1">D1 · Governance</a><span>›</span><span>VHS-D1-007</span></div>
<div class="meta-strip"><span class="meta-pill pill-domain">D1 · Governance &amp; compliance</span><span class="meta-pill pill-tier">Tier 1 · Policy</span><span class="meta-pill pill-owner">Owner: Administrator</span><span class="meta-pill pill-version">v2.0 · Jan 15 2025</span></div>
<h1 class="doc-title">Services provided under contract</h1>
<p class="doc-id"><strong>VHS-D1-007</strong> &nbsp;·&nbsp; Supersedes legacy 1.018.1</p>
<div class="meta-table"><div class="meta-item"><div class="meta-item-label">Effective date</div><div class="meta-item-value">January 15, 2025</div></div><div class="meta-item"><div class="meta-item-label">Next review due</div><div class="meta-item-value">January 15, 2026</div></div><div class="meta-item"><div class="meta-item-label">COMAR reference</div><div class="meta-item-value">10.07.05.08,10.07.05.10</div></div></div>
</header>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2><div class="body-text"><p>To define the standards and requirements governing services provided to Vitalis clients by contracted personnel — ensuring that all contracted care meets the same quality, compliance, and documentation standards as directly employed staff, and that Vitalis maintains appropriate clinical and financial oversight of all contracted services.</p></div></section>
<section class="policy-section" id="policy"><h2 class="section-heading">Policy statement</h2><div class="body-text"><p>Vitalis Healthcare Services, LLC retains professional and financial responsibility for all services provided under contract arrangements. Regardless of employment status, all individuals providing services to Vitalis clients operate under Vitalis policies and procedures and the client's plan of care. <strong>No contracted provider may perform initial or re-evaluation visits.</strong> All contracted services are supervised by the agency.</p></div>
<div class="callout callout-warning"><div class="callout-label">⚠ Agency accountability</div><div class="callout-body">Vitalis is responsible for the quality of all contracted services rendered to its clients. Subcontracting does not transfer liability. The agency assures that all legal physician orders are carried out regardless of whether services are provided directly or under arrangement.</div></div>
</section>
<section class="policy-section" id="requirements"><h2 class="section-heading">Contractor requirements</h2>
<ol class="steps">
<li class="step"><div class="step-num">1</div><div class="step-body"><strong>Pre-contract compliance:</strong> All contracted providers complete the same pre-employment requirements as direct hires: criminal background check, Nurse Aide Registry verification (where applicable), TB screening, license/certification verification, identity verification, skills assessment, and in-person interview before assignment.</div></li>
<li class="step"><div class="step-num">2</div><div class="step-body"><strong>Orientation:</strong> All contracted providers attend Vitalis orientation before accepting client assignments. See <a href="VHS-D2-007-orientation.html">VHS-D2-007 · Orientation &amp; Staff Development →</a></div></li>
<li class="step"><div class="step-num">3</div><div class="step-body"><strong>Policy compliance:</strong> All contracted providers agree in writing to abide by Vitalis policies and procedures, attend required in-service education (with 48-hour minimum advance notice from Vitalis), and document all client visits. If 48-hour notice is not given, Vitalis provides the in-service within 72 hours of the missed meeting.</div></li>
<li class="step"><div class="step-num">4</div><div class="step-body"><strong>Documentation:</strong> Service notes must be submitted to the office within <strong>3 calendar days</strong> of the visit. Original documentation is maintained by Vitalis. The agency notifies contractors when their clients are discharged.</div></li>
<li class="step"><div class="step-num">5</div><div class="step-body"><strong>Annual contract review:</strong> All contractor agreements are reviewed annually during the agency's annual review cycle.</div></li>
<li class="step"><div class="step-num">6</div><div class="step-body"><strong>Non-discrimination:</strong> Contractor agreements prohibit discrimination against any person on the basis of race, color, national origin, disability, age, sex, or religion in admission, treatment, or participation in programs or employment.</div></li>
</ol>
</section>
<section class="policy-section" id="billing"><h2 class="section-heading">Billing &amp; payment</h2><div class="body-text">
<p>Contracted providers bill Vitalis on a semi-monthly schedule: on the <strong>16th of the month</strong> for visits made between the 1st–15th, and on the <strong>1st of the month</strong> for visits made from the 16th through month-end. Vitalis pays on the 1st and 15th of each month, contingent on receipt of appropriate documentation.</p>
<p>No payment is made until proper documentation for the billing period is received. Vitalis does not withhold taxes on behalf of contracted providers. Vitalis issues a Form 1099 to each contractor annually. Contractors are responsible for reporting and paying their own income taxes.</p>
<p>Either party may terminate the contract upon 30 calendar days' written notice. The contractor may terminate for non-payment after providing written notice and waiting 10 business days for resolution. Employee benefits are not available to contracted personnel.</p>
</div></section>
<section class="policy-section" id="axiscare"><h2 class="section-heading">AxisCare workflow</h2>
<div class="callout callout-axiscare"><div class="callout-label">AxisCare — contractor management</div><div class="callout-body">
<p><strong>Adding a contractor:</strong> The Administrator or HR/Office Manager creates the contractor profile in AxisCare under <code>Staff → Contractors</code> with employment type set to "Independent Contractor." Pre-employment compliance documents are uploaded to the contractor's digital file before any client assignment is activated.</p>
<p><strong>Visit documentation:</strong> Contracted staff submit visit notes via AxisCare EVV (Electronic Visit Verification) exactly as direct staff do. Notes submitted past the 3-day deadline generate an automatic compliance flag to the DON and Administrator.</p>
<p><strong>Contract renewal tracking:</strong> Annual contract review due dates are tracked in AxisCare under <code>Staff → Contractor → Contract Expiry</code>. Automated alert sent to Administrator 30 days before contract renewal date.</p>
</div></div>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory references</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; accreditation references</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.10" target="_blank">COMAR 10.07.05.10(H)</a> — Subcontract agencies. When an agency subcontracts services, it must verify all personnel requirements for subcontracted staff and maintain evidence of that verification.</div><div class="reg-note">Primary contractor compliance anchor</div></div></div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.08" target="_blank">COMAR 10.07.05.08</a> — Agency responsibility. The RSA retains full responsibility for quality and compliance of all services, including those provided under arrangement. Subcontracting does not transfer the agency's legal accountability.</div><div class="reg-note">Establishes non-delegable nature of agency quality responsibility</div></div></div>
<div class="reg-footer"><span>Last verified: March 2025</span><span>Next regulatory review: January 2026</span></div>
</div></section>
<section class="policy-section" id="related"><h2 class="section-heading">Related documents</h2>
<div class="related-grid">
<a class="related-card" href="VHS-D2-003-classification-of-personnel.html"><div class="related-card-id">VHS-D2-003</div><div class="related-card-title">Classification of personnel</div><div class="related-card-domain">D2 · Human resources</div></a>
<a class="related-card" href="VHS-D2-007-orientation.html"><div class="related-card-id">VHS-D2-007</div><div class="related-card-title">Orientation &amp; staff development</div><div class="related-card-domain">D2 · Human resources</div></a>
<a class="related-card" href="VHS-D5-001-billing.html"><div class="related-card-id">VHS-D5-001</div><div class="related-card-title">Billing &amp; revenue cycle</div><div class="related-card-domain">D5 · Business operations</div></a>
</div></section>
<section class="policy-section" id="history"><h2 class="section-heading">Version history</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Author</th><th>Changes</th></tr></thead>
<tbody><tr class="current"><td><span class="version-badge">v2.0 current</span></td><td>Jan 15, 2025</td><td>Administrator</td><td>Full rewrite. Added AxisCare contractor management workflow, clarified documentation timelines, updated billing cycle details, added non-discrimination clause. Supersedes legacy 1.018.1.</td></tr>
<tr><td>v1.0</td><td>Jan 1, 2022</td><td>Administrator</td><td>Original document (legacy 1.018.1). OHCQ license submission version.</td></tr></tbody>
</table></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2>
<div class="approval-block">
<div class="approval-item"><div class="approval-role">Prepared &amp; approved by</div><div class="approval-name">Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
<div class="approval-item"><div class="approval-role">Reviewed by</div><div class="approval-name">Director of Nursing</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
<div class="review-notice">⚠ Annual review due <strong>January 15, 2026</strong>. Automated reminder sent 30 days prior.</div>
</div></section>
$VITALIS_HTML$,
  'active', 'VHS-D1-007-services-under-contract.html'
) ON CONFLICT (doc_id) DO NOTHING;

INSERT INTO pp_policies (doc_id, domain, tier, title, owner_role, version, effective_date, review_date, applicable_roles, comar_refs, keywords, html_content, status, source_file) VALUES (
  'VHS-D1-008', 'D1', 1, 'Public disclosure &amp; transparency', 'Administrator', '2.0',
  '2025-01-15', '2026-01-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.06','10.07.05.04'],
  ARRAY['public disclosure','licensing authority','transparency','advertising','marketing','OHCQ','survey'],
  $VITALIS_HTML$
<header class="doc-header">
<div class="breadcrumb"><a href="/portal">Portal</a><span>›</span><a href="/portal/policies">Policies</a><span>›</span><a href="/portal/policies?domain=D1">D1 · Governance</a><span>›</span><span>VHS-D1-008</span></div>
<div class="meta-strip"><span class="meta-pill pill-domain">D1 · Governance &amp; compliance</span><span class="meta-pill pill-tier">Tier 1 · Policy</span><span class="meta-pill pill-owner">Owner: Administrator</span><span class="meta-pill pill-version">v2.0 · Jan 15 2025</span></div>
<h1 class="doc-title">Public disclosure &amp; transparency</h1>
<p class="doc-id"><strong>VHS-D1-008</strong> &nbsp;·&nbsp; Supersedes legacy 1.020.1, 1.020.2</p>
<div class="meta-table"><div class="meta-item"><div class="meta-item-label">Effective date</div><div class="meta-item-value">January 15, 2025</div></div><div class="meta-item"><div class="meta-item-label">Next review due</div><div class="meta-item-value">January 15, 2026</div></div><div class="meta-item"><div class="meta-item-label">COMAR reference</div><div class="meta-item-value">10.07.05.06,10.07.05.04</div></div></div>
</header>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2><div class="body-text"><p>To define Vitalis Healthcare Services, LLC's obligations for public transparency — specifying what information must be made available to patients, the public, and regulatory authorities, and establishing the standards for all marketing and advertising materials.</p></div></section>
<section class="policy-section" id="public-info"><h2 class="section-heading">Information available to the public</h2><div class="body-text"><p>The following information must be disclosed to members of the public upon written or verbal request:</p></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">License number</div>
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Agency owner, corporation name, and corporate officers</div>
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Administrator and Director of Nursing names</div>
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Address of record</div>
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Date of original license issuance</div>
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">License expiration date and current status</div>
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Mission statement</div>
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Services offered and service limitations</div>
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Hours of operation including on-call availability</div>
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Referral procedures and contact information</div>
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Fee schedule and patient financial responsibility</div>
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Policies and procedures (upon request)</div>
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Official survey deficiency findings and plans of correction</div>
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Summary reports of complaint investigations</div>
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Conditions for acceptance or termination of services</div>
<div style="font-size:13px;color:var(--slate);padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);">Quality and safety information</div>
</div>
<div class="body-text"><p>All documents must accurately represent the agency and its services. This policy describes available information but is not a limitation — any document otherwise legally required to be available remains so regardless of this list.</p></div>
</section>
<section class="policy-section" id="marketing"><h2 class="section-heading">Marketing &amp; advertising requirements</h2><div class="body-text"><p>All Vitalis marketing and advertising materials — digital, print, or verbal — must include the following mandatory statements:</p></div>
<div style="border:1px solid var(--teal);background:var(--teal-light);border-radius:var(--radius-md);padding:16px 20px;margin:12px 0;">
<div style="font-size:12px;font-weight:500;color:var(--teal);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Required on all marketing materials</div>
<div style="font-size:14px;color:var(--navy);font-weight:500;margin-bottom:4px;">1. Agency license number</div>
<div style="font-size:14px;color:var(--navy);font-weight:500;">"Licensed as a residential service agency by the Maryland Department of Health, Office of Health Care Quality"</div>
</div>
<div class="callout callout-warning"><div class="callout-label">⚠ Prohibited advertising</div><div class="callout-body">Vitalis may not advertise, represent, or imply that it is authorized to provide services it is not licensed to provide. No misleading or fraudulent advertising is permitted. Vitalis may not advertise as a hospice, home health agency, or nursing referral service agency unless separately licensed by the Department as such. Violations are subject to criminal referral and civil money penalties.</div></div>
</section>
<section class="policy-section" id="licensure-changes"><h2 class="section-heading">Licensure status changes</h2><div class="body-text">
<p>Unless otherwise ordered by the Secretary, Vitalis must notify each competent client and each client representative at least <strong>30 days in advance</strong> of any of the following:</p>
<p>(A) Any significant change in licensure status; (B) Voluntary surrender of the agency license; or (C) Denial, revocation, or suspension of the license.</p>
<p>Statements of deficiencies, survey reports, and plans of correction must be made available upon request to clients, client representatives, potential clients, and federal, state, or local regulatory and law enforcement agencies.</p>
</div></section>
<section class="policy-section" id="ohcq-disclosure"><h2 class="section-heading">Mandatory disclosure to OHCQ</h2><div class="body-text">
<p>Vitalis must disclose the following to the Maryland Department of Health at initial licensure, at each survey, and upon any change in ownership or management:</p>
<p>(a) Name and address of each person with ≥25% ownership or control interest, plus criminal background documentation; (b) Names and addresses of all officers, directors, agents, and managing employees; (c) Name and address of the entity responsible for agency management, including the Administrator and board chair; (d) Disclosure of any prior relationship with another RSA, health facility, hospice, or licensed program — including dates of relationship; (e) All information provided must be accurate and timely; (f) Vitalis permits surveys by OHCQ and the Joint Commission at their discretion and does not exclude properly identified surveyors.</p>
<p>Vitalis files an annual report with the Department on or before <strong>March 15 of each year</strong> upon forms furnished by the Department, covering the preceding calendar year. This report may include data on patient age, diagnostic categories, and visit classifications by service type.</p>
</div></section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory references</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; accreditation references</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.06" target="_blank">COMAR 10.07.05.06</a> — Public representation. Defines required disclosures on marketing materials, prohibits misleading advertising, and establishes penalties for violations including criminal referral.</div><div class="reg-note">Primary anchor for marketing and advertising compliance</div></div></div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.04" target="_blank">COMAR 10.07.05.04</a> — Licensing procedures. Establishes mandatory disclosure obligations to the Department at initial licensure and upon changes in ownership or management, including required annual reporting.</div><div class="reg-note">Primary anchor for OHCQ disclosure obligations</div></div></div>
<div class="reg-footer"><span>Last verified: March 2025</span><span>Next regulatory review: January 2026</span></div>
</div></section>
<section class="policy-section" id="related"><h2 class="section-heading">Related documents</h2>
<div class="related-grid">
<a class="related-card" href="VHS-D1-003-administrative-control.html"><div class="related-card-id">VHS-D1-003</div><div class="related-card-title">Administrative control &amp; governing body</div><div class="related-card-domain">D1 · Governance</div></a>
<a class="related-card" href="VHS-D1-009-change-of-ownership.html"><div class="related-card-id">VHS-D1-009</div><div class="related-card-title">Change of ownership &amp; license management</div><div class="related-card-domain">D1 · Governance</div></a>
<a class="related-card" href="VHS-D3-003-complaints-grievances.html"><div class="related-card-id">VHS-D3-003</div><div class="related-card-title">Patient complaints &amp; grievances</div><div class="related-card-domain">D3 · Client services</div></a>
</div></section>
<section class="policy-section" id="history"><h2 class="section-heading">Version history</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Author</th><th>Changes</th></tr></thead>
<tbody><tr class="current"><td><span class="version-badge">v2.0 current</span></td><td>Jan 15, 2025</td><td>Administrator</td><td>Full rewrite. Merged legacy 1.020.1 (Public Disclosure) and 1.020.2 (Disclosure to Licensing Authority) into single unified document. Added mandatory marketing statement callout, prohibition detail, annual March 15 reporting requirement. Supersedes legacy 1.020.1 and 1.020.2.</td></tr>
<tr><td>v1.0</td><td>Jan 1, 2022</td><td>Administrator</td><td>Original documents. OHCQ license submission versions.</td></tr></tbody>
</table></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2>
<div class="approval-block">
<div class="approval-item"><div class="approval-role">Prepared &amp; approved by</div><div class="approval-name">Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
<div class="approval-item"><div class="approval-role">Reviewed by</div><div class="approval-name">Director of Nursing</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
<div class="review-notice">⚠ Annual review due <strong>January 15, 2026</strong>. Automated reminder sent 30 days prior.</div>
</div></section>
$VITALIS_HTML$,
  'active', 'VHS-D1-008-public-disclosure.html'
) ON CONFLICT (doc_id) DO NOTHING;

INSERT INTO pp_policies (doc_id, domain, tier, title, owner_role, version, effective_date, review_date, applicable_roles, comar_refs, keywords, html_content, status, source_file) VALUES (
  'VHS-D1-009', 'D1', 1, 'Change of ownership &amp; license management', 'Administrator', '2.0',
  '2025-01-15', '2026-01-15',
  ARRAY['Administrator'],
  ARRAY['10.07.05.05'],
  ARRAY['change of ownership','license transfer','voluntary closure','license void','OHCQ notification'],
  $VITALIS_HTML$
<header class="doc-header">
<div class="breadcrumb"><a href="/portal">Portal</a><span>›</span><a href="/portal/policies">Policies</a><span>›</span><a href="/portal/policies?domain=D1">D1 · Governance</a><span>›</span><span>VHS-D1-009</span></div>
<div class="meta-strip"><span class="meta-pill pill-domain">D1 · Governance &amp; compliance</span><span class="meta-pill pill-tier">Tier 1 · Policy</span><span class="meta-pill pill-owner">Owner: Administrator</span><span class="meta-pill pill-version">v2.0 · Jan 15 2025</span></div>
<h1 class="doc-title">Change of ownership &amp; license management</h1>
<p class="doc-id"><strong>VHS-D1-009</strong> &nbsp;·&nbsp; Supersedes legacy 1.020.3</p>
<div class="meta-table"><div class="meta-item"><div class="meta-item-label">Effective date</div><div class="meta-item-value">January 15, 2025</div></div><div class="meta-item"><div class="meta-item-label">Next review due</div><div class="meta-item-value">January 15, 2026</div></div><div class="meta-item"><div class="meta-item-label">COMAR reference</div><div class="meta-item-value">10.07.05.05</div></div></div>
</header>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2><div class="body-text"><p>To define the procedures Vitalis Healthcare Services, LLC must follow in the event of an ownership transfer, change in administrative control, or voluntary closure — ensuring full compliance with Maryland OHCQ requirements and uninterrupted continuity of care for all active clients.</p></div></section>
<section class="policy-section" id="ownership-change"><h2 class="section-heading">Change of ownership procedure</h2>
<div class="callout callout-warning"><div class="callout-label">⚠ Critical: License is non-transferable</div><div class="callout-body">The Vitalis RSA license is valid only in the name of the licensee to whom it is issued and is not subject to sale, assignment, or other transfer. Any transfer of ownership requires a new license application. The future owner must file at least <strong>45 days before the transfer date</strong>.</div></div>
<ol class="steps">
<li class="step"><div class="step-num">1</div><div class="step-body"><strong>Notification to OHCQ:</strong> The Administrator notifies the Maryland Department of Health in writing no later than <strong>45 calendar days</strong> prior to any change of ownership. The notice must include: (a) the method for informing clients or client representatives of the intent to change ownership; and (b) the actions the current licensee will take to assist clients in securing comparable services if needed.</div></li>
<li class="step"><div class="step-num">2</div><div class="step-body"><strong>Client notification:</strong> Each client or client representative is notified in writing at least <strong>45 days</strong> before the effective date of the ownership change. The notice explains the change, the client's options, and available assistance in transitioning care if desired.</div></li>
<li class="step"><div class="step-num">3</div><div class="step-body"><strong>Future owner licensing:</strong> The future owner applies for a new license at least 45 days before the transfer and must meet all current licensure requirements. The Department issues a new license to the qualifying new owner.</div></li>
<li class="step"><div class="step-num">4</div><div class="step-body"><strong>Current licensee continuity:</strong> The current licensee remains responsible for agency operations and correction of all outstanding deficiencies until the new license is issued to the new owner. After issuance, the new owner assumes all compliance responsibility.</div></li>
<li class="step"><div class="step-num">5</div><div class="step-body"><strong>Stock transfers:</strong> Transfer of any stock that results in a change of control, or transfer of any stock exceeding 25% of outstanding shares, constitutes a sale and triggers this full ownership change procedure.</div></li>
</ol>
</section>
<section class="policy-section" id="voluntary-closure"><h2 class="section-heading">Voluntary closure procedure</h2>
<ol class="steps">
<li class="step"><div class="step-num">1</div><div class="step-body">The Administrator notifies the Maryland Department of Health in writing at least <strong>45 calendar days</strong> before the date of closure. The notice includes the reason for closure, date of closure, and the location and custodian of all client records (active and inactive).</div></li>
<li class="step"><div class="step-num">2</div><div class="step-body">All active clients are notified in writing at least 45 days in advance. The agency assists each active client in locating and transitioning to comparable services. A copy of each active client's clinical record is transferred to the receiving agency to ensure continuity of care.</div></li>
<li class="step"><div class="step-num">3</div><div class="step-body">On the last day of operations, the Administrator mails or returns the current and all past licenses to the Maryland Department of Health via certified mail, along with written confirmation of the official closure date.</div></li>
<li class="step"><div class="step-num">4</div><div class="step-body"><strong>Record retention after closure:</strong> The Governing Body ensures all client and personnel records are maintained in a HIPAA-compliant format for <strong>7 years</strong> from the date of closure (or until a minor client reaches age 21 if later, or 5 years after litigation conclusion). See <a href="VHS-D4-002-retention-of-clinical-records.html">VHS-D4-002 · Retention of Clinical Records →</a></div></li>
<li class="step"><div class="step-num">5</div><div class="step-body">The agency does not continue operating after the closure date stated in the notice. Failure to comply may result in enforcement action.</div></li>
</ol>
</section>
<section class="policy-section" id="license-void"><h2 class="section-heading">License void conditions</h2><div class="body-text"><p>The Vitalis RSA license is automatically void if the agency ceases to operate. A license that has become void must be returned to the Department immediately. Attempting to operate under a void license is a violation subject to criminal referral and civil penalties.</p></div></section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory references</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; accreditation references</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.05" target="_blank">COMAR 10.07.05.05</a> — Changes affecting operating license. Governs voluntary closure, change of ownership, stock transfers, and all notifications required for license modifications. Establishes the 45-day notification requirement and the non-transferability of the RSA license.</div><div class="reg-note">Primary compliance anchor for all ownership and closure scenarios</div></div></div>
<div class="reg-footer"><span>Last verified: March 2025</span><span>Next regulatory review: January 2026</span></div>
</div></section>
<section class="policy-section" id="related"><h2 class="section-heading">Related documents</h2>
<div class="related-grid">
<a class="related-card" href="VHS-D1-003-administrative-control.html"><div class="related-card-id">VHS-D1-003</div><div class="related-card-title">Administrative control &amp; governing body</div><div class="related-card-domain">D1 · Governance</div></a>
<a class="related-card" href="VHS-D7-001-agency-closure.html"><div class="related-card-id">VHS-D7-001</div><div class="related-card-title">Agency closure procedures</div><div class="related-card-domain">D7 · Emergency &amp; continuity</div></a>
<a class="related-card" href="VHS-D4-002-retention-of-clinical-records.html"><div class="related-card-id">VHS-D4-002</div><div class="related-card-title">Retention of clinical records</div><div class="related-card-domain">D4 · Clinical operations</div></a>
</div></section>
<section class="policy-section" id="history"><h2 class="section-heading">Version history</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Author</th><th>Changes</th></tr></thead>
<tbody><tr class="current"><td><span class="version-badge">v2.0 current</span></td><td>Jan 15, 2025</td><td>Administrator</td><td>Full rewrite. Added step-by-step procedures for ownership change and voluntary closure, non-transferability callout, stock transfer trigger, and cross-references to record retention policy. Supersedes legacy 1.020.3.</td></tr>
<tr><td>v1.0</td><td>Jan 1, 2022</td><td>Administrator</td><td>Original document (legacy 1.020.3). OHCQ license submission version.</td></tr></tbody>
</table></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2>
<div class="approval-block">
<div class="approval-item"><div class="approval-role">Prepared &amp; approved by</div><div class="approval-name">Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
<div class="approval-item"><div class="approval-role">Reviewed by</div><div class="approval-name">Director of Nursing</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
<div class="review-notice">⚠ Annual review due <strong>January 15, 2026</strong>. Automated reminder sent 30 days prior.</div>
</div></section>
$VITALIS_HTML$,
  'active', 'VHS-D1-009-change-of-ownership.html'
) ON CONFLICT (doc_id) DO NOTHING;

INSERT INTO pp_policies (doc_id, domain, tier, title, owner_role, version, effective_date, review_date, applicable_roles, comar_refs, keywords, html_content, status, source_file) VALUES (
  'VHS-D1-010', 'D1', 1, 'Information management', 'Administrator', '2.0',
  '2025-01-15', '2026-01-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.08'],
  ARRAY['information management','records','data','technology','systems','confidentiality','access control','AxisCare','portal'],
  $VITALIS_HTML$
<header class="doc-header">
<div class="breadcrumb"><a href="/portal">Portal</a><span>›</span><a href="/portal/policies">Policies</a><span>›</span><a href="/portal/policies?domain=D1">D1 · Governance</a><span>›</span><span>VHS-D1-010</span></div>
<div class="meta-strip"><span class="meta-pill pill-domain">D1 · Governance &amp; compliance</span><span class="meta-pill pill-tier">Tier 1 · Policy</span><span class="meta-pill pill-owner">Owner: Administrator</span><span class="meta-pill pill-version">v2.0 · Jan 15 2025</span></div>
<h1 class="doc-title">Information management</h1>
<p class="doc-id"><strong>VHS-D1-010</strong> &nbsp;·&nbsp; Supersedes legacy 1.021.1</p>
<div class="meta-table"><div class="meta-item"><div class="meta-item-label">Effective date</div><div class="meta-item-value">January 15, 2025</div></div><div class="meta-item"><div class="meta-item-label">Next review due</div><div class="meta-item-value">January 15, 2026</div></div><div class="meta-item"><div class="meta-item-label">COMAR reference</div><div class="meta-item-value">10.07.05.08</div></div></div>
</header>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2><div class="body-text"><p>To establish standards for how Vitalis Healthcare Services, LLC creates, manages, stores, accesses, and disposes of all agency information — including clinical records, financial records, personnel files, and data in all technology systems — ensuring accuracy, security, accessibility, and full HIPAA compliance.</p></div></section>
<section class="policy-section" id="policy"><h2 class="section-heading">Policy statement</h2><div class="body-text"><p>All Vitalis information systems — including AxisCare (EHR, scheduling, EVV, and billing), the Vitalis portal (P&P, LMS, and credentialing), SurePayroll/Paychex (payroll), and all communication platforms — must be used only for their intended agency purposes, accessed only by authorized personnel, and maintained with the highest standards of accuracy, confidentiality, and security.</p><p>Information is a clinical and operational asset. How Vitalis manages information directly affects patient safety, compliance standing, and agency performance. Every staff member shares responsibility for information integrity.</p></div></section>
<section class="policy-section" id="systems"><h2 class="section-heading">Vitalis information systems</h2>
<div style="border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin:12px 0;">
<table style="width:100%;border-collapse:collapse;font-size:13px;">
<thead><tr style="background:var(--bg);"><th style="padding:10px 14px;text-align:left;font-weight:500;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border);">System</th><th style="padding:10px 14px;text-align:left;font-weight:500;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border);">Purpose</th><th style="padding:10px 14px;text-align:left;font-weight:500;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border);">Access</th></thead>
<tbody>
<tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 14px;font-weight:500;color:var(--text);">AxisCare</td><td style="padding:10px 14px;color:var(--slate);">EHR · Scheduling · EVV · Billing</td><td style="padding:10px 14px;color:var(--slate);">All clinical and administrative staff (role-based)</td></tr>
<tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 14px;font-weight:500;color:var(--text);">Vitalis Portal</td><td style="padding:10px 14px;color:var(--slate);">P&amp;P library · LMS training · Credentialing</td><td style="padding:10px 14px;color:var(--slate);">All staff (role-based)</td></tr>
<tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 14px;font-weight:500;color:var(--text);">SurePayroll / Paychex</td><td style="padding:10px 14px;color:var(--slate);">Payroll processing</td><td style="padding:10px 14px;color:var(--slate);">Administrator · CFO</td></tr>
<tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 14px;font-weight:500;color:var(--text);">Claude (AI)</td><td style="padding:10px 14px;color:var(--slate);">Clinical support · Documentation · Compliance monitoring</td><td style="padding:10px 14px;color:var(--slate);">All staff (with PHI handling protocols)</td></tr>
<tr><td style="padding:10px 14px;font-weight:500;color:var(--text);">Email / Communication</td><td style="padding:10px 14px;color:var(--slate);">Internal and external communications</td><td style="padding:10px 14px;color:var(--slate);">All staff — no unsecured PHI via standard email</td></tr>
</tbody>
</table>
</div>
</section>
<section class="policy-section" id="access"><h2 class="section-heading">Access control</h2>
<ol class="steps">
<li class="step"><div class="step-num">1</div><div class="step-body">Access to all systems containing PHI is granted based on role and need-to-know. The Administrator (acting as Privacy Officer) determines and approves access levels.</div></li>
<li class="step"><div class="step-num">2</div><div class="step-body">All access credentials are personal and non-transferable. Passwords may not be shared under any circumstances. Staff are responsible for logging off all PHI applications before leaving their workstation. See <a href="VHS-D5-006-phi-access.html">VHS-D5-006 · PHI Applications &amp; Access Control →</a></div></li>
<li class="step"><div class="step-num">3</div><div class="step-body">Access credentials must be changed at least every <strong>180 days</strong>. Accounts inactive for 180 days are automatically suspended.</div></li>
<li class="step"><div class="step-num">4</div><div class="step-body">Upon termination of any employee, the Privacy Officer terminates all system access on the employee's last day of work — or immediately upon notification of termination, whichever comes first.</div></li>
</ol>
</section>
<section class="policy-section" id="integrity"><h2 class="section-heading">Data integrity</h2>
<div class="body-text">
<p>All entries into any Vitalis information system must be accurate, complete, legible, dated, and attributable to the person making the entry. No staff member may alter, delete, or falsify any record. Corrections to records follow the standard correction protocol: a single line through the error, initials, date, and the correct information.</p>
<p>Using another person's login credentials to enter or access records constitutes falsification of the record and is grounds for immediate termination and possible criminal referral.</p>
</div>
</section>
<section class="policy-section" id="retention"><h2 class="section-heading">Retention &amp; disposal</h2>
<div class="body-text">
<p>Clinical records are retained for <strong>7 years</strong> after client discharge (or until age 21 for minors). Financial records are retained for <strong>7 years</strong>. Personnel records are retained per Maryland employment law requirements. See <a href="VHS-D4-002-retention-of-clinical-records.html">VHS-D4-002 · Retention of Clinical Records →</a></p>
<p>Records that have reached their required retention period may be destroyed using a method that prevents retrieval. Only the Privacy Officer (Administrator) may authorize and document record destruction. Paper records are shredded; electronic records are permanently deleted or overwritten in a manner approved by the Privacy Officer.</p>
</div>
</section>
<section class="policy-section" id="axiscare"><h2 class="section-heading">AxisCare workflow</h2>
<div class="callout callout-axiscare"><div class="callout-label">AxisCare — information management</div><div class="callout-body">
<p><strong>Access provisioning:</strong> Administrator assigns user role in AxisCare at hiring <code>Admin → Users → Add User → Role Assignment</code>. Clinical roles have access to client records; administrative roles have access to scheduling and billing. No user receives broader access than their role requires.</p>
<p><strong>Access termination:</strong> On an employee's last day, the Administrator deactivates the user account in AxisCare: <code>Admin → Users → [Employee Name] → Deactivate</code>. This step is mandatory before the end of the employee's final shift.</p>
<p><strong>Audit log:</strong> AxisCare maintains a full access audit log. The DON or Administrator can review access logs at any time: <code>Admin → Audit Trail</code>. Monthly review of access logs is recommended.</p>
</div></div>
</section>
<section class="policy-section" id="ai-assist"><h2 class="section-heading">AI assist</h2>
<div class="callout callout-ai"><div class="callout-label">Claude AI — information management guidance</div><div class="callout-body">
<p>When using Claude for any work involving client information, staff must follow these protocols:</p>
<p><strong>Permitted:</strong> Using Claude to draft policy documents, generate training content, analyze de-identified data, draft communication templates, or summarize regulations.</p>
<p><strong>Use judgment:</strong> When entering client information, use minimum necessary data and avoid full names + diagnoses + dates of birth in the same prompt where possible.</p>
<div class="sample-prompt">"Vitalis is deploying Claude for clinical documentation support. Draft a PHI handling protocol for Claude that specifies what types of client information staff may and may not include when using AI tools, consistent with HIPAA minimum necessary standards."</div>
</div></div>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory references</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; accreditation references</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.08" target="_blank">COMAR 10.07.05.08</a> — Organizational policies. Requires the governing body to adopt policies covering information management, confidentiality practices, and records management as part of the required administrative policy framework.</div><div class="reg-note">Foundational information management requirement</div></div></div>
<div class="reg-row"><span class="reg-source src-cfr">45 CFR</span><div><div class="reg-detail"><span class="reg-cite">45 CFR Parts 160 and 164 (HIPAA)</span> — The Privacy Rule and Security Rule. Establishes standards for the protection of individually identifiable health information, access controls, minimum necessary standards, workforce training, and breach notification.</div><div class="reg-note">Primary federal information security and privacy standard</div></div></div>
<div class="reg-footer"><span>Last verified: March 2025</span><span>Next regulatory review: January 2026</span></div>
</div></section>
<section class="policy-section" id="related"><h2 class="section-heading">Related documents</h2>
<div class="related-grid">
<a class="related-card" href="VHS-D5-006-phi-access.html"><div class="related-card-id">VHS-D5-006</div><div class="related-card-title">PHI applications &amp; access control</div><div class="related-card-domain">D5 · Business operations</div></a>
<a class="related-card" href="VHS-D4-001-security-clinical-information.html"><div class="related-card-id">VHS-D4-001</div><div class="related-card-title">Security of clinical information</div><div class="related-card-domain">D4 · Clinical operations</div></a>
<a class="related-card" href="VHS-D4-002-retention-of-clinical-records.html"><div class="related-card-id">VHS-D4-002</div><div class="related-card-title">Retention of clinical records</div><div class="related-card-domain">D4 · Clinical operations</div></a>
<a class="related-card" href="VHS-D2-006-confidentiality.html"><div class="related-card-id">VHS-D2-006</div><div class="related-card-title">Confidentiality</div><div class="related-card-domain">D2 · Human resources</div></a>
</div></section>
<section class="policy-section" id="history"><h2 class="section-heading">Version history</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Author</th><th>Changes</th></tr></thead>
<tbody><tr class="current"><td><span class="version-badge">v2.0 current</span></td><td>Jan 15, 2025</td><td>Administrator</td><td>Full rewrite. Modernized to reflect current technology stack including AxisCare, Vitalis Portal, and Claude AI. Added systems inventory table, access termination procedure, AI usage guidance, and HIPAA crosswalk. Supersedes legacy 1.021.1.</td></tr>
<tr><td>v1.0</td><td>Jan 1, 2022</td><td>Administrator</td><td>Original document (legacy 1.021.1). OHCQ license submission version.</td></tr></tbody>
</table></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2>
<div class="approval-block">
<div class="approval-item"><div class="approval-role">Prepared &amp; approved by</div><div class="approval-name">Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
<div class="approval-item"><div class="approval-role">Reviewed by</div><div class="approval-name">Director of Nursing</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
<div class="review-notice">⚠ Annual review due <strong>January 15, 2026</strong>. Automated reminder sent 30 days prior.</div>
</div></section>
$VITALIS_HTML$,
  'active', 'VHS-D1-010-information-management.html'
) ON CONFLICT (doc_id) DO NOTHING;

INSERT INTO pp_policies (doc_id, domain, tier, title, owner_role, version, effective_date, review_date, applicable_roles, comar_refs, keywords, html_content, status, source_file) VALUES (
  'VHS-D1-011', 'D1', 1, 'Research activities &amp; investigational studies', 'Administrator', '2.0',
  '2025-01-15', '2026-01-15',
  ARRAY['All Staff'],
  ARRAY['10.07.05.08'],
  ARRAY['research','investigational','clinical trials','experimental','studies','medications'],
  $VITALIS_HTML$
<header class="doc-header">
<div class="breadcrumb"><a href="/portal">Portal</a><span>›</span><a href="/portal/policies">Policies</a><span>›</span><a href="/portal/policies?domain=D1">D1 · Governance</a><span>›</span><span>VHS-D1-011</span></div>
<div class="meta-strip"><span class="meta-pill pill-domain">D1 · Governance &amp; compliance</span><span class="meta-pill pill-tier">Tier 1 · Policy</span><span class="meta-pill pill-owner">Owner: Administrator</span><span class="meta-pill pill-version">v2.0 · Jan 15 2025</span></div>
<h1 class="doc-title">Research activities &amp; investigational studies</h1>
<p class="doc-id"><strong>VHS-D1-011</strong> &nbsp;·&nbsp; Supersedes legacy 1.019.1</p>
<div class="meta-table"><div class="meta-item"><div class="meta-item-label">Effective date</div><div class="meta-item-value">January 15, 2025</div></div><div class="meta-item"><div class="meta-item-label">Next review due</div><div class="meta-item-value">January 15, 2026</div></div><div class="meta-item"><div class="meta-item-label">COMAR reference</div><div class="meta-item-value">10.07.05.08</div></div></div>
</header>

<section class="policy-section" id="purpose"><h2 class="section-heading">Purpose</h2><div class="body-text"><p>To define Vitalis Healthcare Services, LLC's position on participation in clinical research activities, investigational drug studies, and experimental treatment protocols.</p></div></section>
<section class="policy-section" id="policy"><h2 class="section-heading">Policy statement</h2>
<div style="border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px 24px;background:var(--white);margin:12px 0;border-left:4px solid var(--navy);">
<div style="font-size:12px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Policy</div>
<div style="font-size:16px;color:var(--navy);line-height:1.6;font-weight:400;">Vitalis Healthcare Services, LLC does not participate in research activities, investigational studies, or the use of investigational medications. No client of Vitalis may be enrolled in a clinical research study or administered an investigational drug through Vitalis services.</div>
</div>
<div class="body-text" style="margin-top:16px;">
<p>This policy reflects the agency's commitment to delivering proven, evidence-based care in accordance with each client's physician-authorized plan of care. No employee or contractor may enroll a Vitalis client in any research protocol, administer investigational medications, or participate in experimental treatment trials on behalf of the agency.</p>
<p>If a client's physician is conducting research and wishes to include a Vitalis client, the physician must obtain independent consent outside of the Vitalis care relationship. Vitalis staff members are not investigators and may not perform research-related activities during the course of their Vitalis duties.</p>
</div>
<div class="callout callout-note"><div class="callout-label">Client rights note</div><div class="callout-body">Clients have the right to know that they will not receive experimental treatment or participate in research through Vitalis without their documented voluntary informed consent. This right is communicated to all clients at admission as part of the Client Rights policy. See <a href="VHS-D3-001-client-rights.html">VHS-D3-001 · Client Rights &amp; Responsibilities →</a></div></div>
</section>
<section class="policy-section" id="regulatory"><h2 class="section-heading">Regulatory references</h2>
<div class="reg-block"><div class="reg-header">Regulatory &amp; accreditation references</div>
<div class="reg-row"><span class="reg-source src-comar">COMAR</span><div><div class="reg-detail"><a class="reg-cite" href="https://mdrules.elaws.us/comar/10.07.05.08" target="_blank">COMAR 10.07.05.08</a> — Organizational policies. Requires agencies to maintain written policies covering all material aspects of operations, including the scope and limits of services provided.</div><div class="reg-note">General policy documentation requirement</div></div></div>
<div class="reg-footer"><span>Last verified: March 2025</span><span>Next regulatory review: January 2026</span></div>
</div></section>
<section class="policy-section" id="history"><h2 class="section-heading">Version history</h2>
<table class="version-table"><thead><tr><th>Version</th><th>Date</th><th>Author</th><th>Changes</th></tr></thead>
<tbody><tr class="current"><td><span class="version-badge">v2.0 current</span></td><td>Jan 15, 2025</td><td>Administrator</td><td>Rewrite. Added client rights cross-reference and rationale for policy. Supersedes legacy 1.019.1.</td></tr>
<tr><td>v1.0</td><td>Jan 1, 2022</td><td>Administrator</td><td>Original document (legacy 1.019.1). OHCQ license submission version.</td></tr></tbody>
</table></section>

<section class="policy-section" id="approvals"><h2 class="section-heading">Approvals</h2>
<div class="approval-block">
<div class="approval-item"><div class="approval-role">Prepared &amp; approved by</div><div class="approval-name">Administrator</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
<div class="approval-item"><div class="approval-role">Reviewed by</div><div class="approval-name">Director of Nursing</div><div class="approval-sig-line"></div><div class="approval-sig-label">Signature &amp; date</div></div>
<div class="review-notice">⚠ Annual review due <strong>January 15, 2026</strong>. Automated reminder sent 30 days prior.</div>
</div></section>
$VITALIS_HTML$,
  'active', 'VHS-D1-011-research-activities.html'
) ON CONFLICT (doc_id) DO NOTHING;
