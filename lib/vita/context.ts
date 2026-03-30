/**
 * lib/vita/context.ts
 * ─────────────────────────────────────────────────────────────
 * Vita context modules — each function fetches one data domain
 * and returns a plain-text block for inclusion in the system prompt.
 *
 * EXTENSIBILITY:
 *   Adding a new data source (e.g. Home Care Pulse NPS data,
 *   AxisCare visit history) = add one async function here and
 *   register it in buildVitaContext() below.
 * ─────────────────────────────────────────────────────────────
 */

// ── Training context ────────────────────────────────────────────────────────
export async function buildTrainingContext(userId: string, svc: any): Promise<string> {
  try {
    const { data: enrollments } = await svc
      .from('course_enrollments')
      .select(`
        id, progress_pct, completed_at, last_accessed_at,
        course:course_id (
          id, title, lms_module_id, estimated_minutes, description,
          programme:programme_id ( title )
        )
      `)
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false })

    if (!enrollments || enrollments.length === 0) {
      return `TRAINING CONTEXT:\nNo course enrollments found for this user.`
    }

    const lines: string[] = ['TRAINING & LMS CONTEXT:']
    let completedCount = 0
    let inProgressCount = 0

    for (const e of enrollments) {
      const c = Array.isArray(e.course) ? e.course[0] : e.course
      if (!c) continue
      const prog = Array.isArray(c.programme) ? c.programme[0] : c.programme
      const status = e.completed_at ? 'COMPLETED' : e.progress_pct > 0 ? 'IN PROGRESS' : 'NOT STARTED'
      if (e.completed_at) completedCount++
      else if (e.progress_pct > 0) inProgressCount++

      const lastAccessed = e.last_accessed_at
        ? new Date(e.last_accessed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'never'

      lines.push(
        `• ${c.lms_module_id || c.id} — "${c.title}"` +
        ` | Programme: ${prog?.title || 'Unassigned'}` +
        ` | Status: ${status} (${e.progress_pct}%)` +
        (e.completed_at ? ` | Completed: ${new Date(e.completed_at).toLocaleDateString()}` : '') +
        ` | Last accessed: ${lastAccessed}` +
        ` | Est. ${c.estimated_minutes} min`
      )
    }

    lines.push(`\nSummary: ${completedCount} completed, ${inProgressCount} in progress, ${enrollments.length - completedCount - inProgressCount} not started`)

    // Also fetch section-level quiz scores for completed modules
    const enrollmentIds = enrollments.filter((e: any) => e.completed_at).map((e: any) => e.id).slice(0, 5)
    if (enrollmentIds.length > 0) {
      const { data: quizProgress } = await svc
        .from('section_progress')
        .select('enrollment_id, score, completed_at, section:section_id(title, type)')
        .in('enrollment_id', enrollmentIds)
        .not('score', 'is', null)

      if (quizProgress && quizProgress.length > 0) {
        lines.push('\nQUIZ SCORES (completed modules):')
        for (const qp of quizProgress) {
          const section = Array.isArray(qp.section) ? qp.section[0] : qp.section
          if (section && qp.score !== null) {
            const passed = qp.score >= 80
            lines.push(`  • ${section.title}: ${qp.score}% ${passed ? '✓ Pass' : '✗ Below 80%'}`)
          }
        }
      }
    }

    // Available courses not yet enrolled in
    const { data: allCourses } = await svc
      .from('courses')
      .select('id, title, lms_module_id, estimated_minutes, description, programme:programme_id(title)')
      .eq('published', true)

    if (allCourses && allCourses.length > 0) {
      const enrolledCourseIds = new Set(enrollments.map((e: any) => {
        const c = Array.isArray(e.course) ? e.course[0] : e.course
        return c?.id
      }))
      const notEnrolled = allCourses.filter((c: any) => !enrolledCourseIds.has(c.id))
      if (notEnrolled.length > 0) {
        lines.push(`\nAVAILABLE BUT NOT YET STARTED (${notEnrolled.length} courses):`)
        for (const c of notEnrolled) {
          const prog = Array.isArray(c.programme) ? c.programme[0] : c.programme
          lines.push(`  • ${c.lms_module_id || c.id} — "${c.title}" | Programme: ${prog?.title || 'Unassigned'} | Est. ${c.estimated_minutes || '?'} min`)
        }
      }
      // Module content summaries (so Vita can teach from them)
      lines.push(`\nTRAINING MODULE CATALOGUE (all ${allCourses.length} published courses):`)
      for (const c of allCourses) {
        if (c.description) lines.push(`  ${c.lms_module_id || c.title}: ${c.description.slice(0, 200)}`)
      }
    }

    return lines.join('\n')
  } catch (err) {
    console.error('buildTrainingContext error:', err)
    return 'TRAINING CONTEXT: Unable to load training data.'
  }
}

// ── Credential context ──────────────────────────────────────────────────────
export async function buildCredentialContext(userId: string, svc: any): Promise<string> {
  try {
    const { data: creds } = await svc
      .from('staff_credentials')
      .select('*, credential_type:credential_types(name, validity_days)')
      .eq('user_id', userId)
      .order('expiry_date', { ascending: true })

    if (!creds || creds.length === 0) {
      return 'CREDENTIAL CONTEXT:\nNo credentials on file for this user.'
    }

    const today = new Date()
    const lines: string[] = ['CREDENTIAL CONTEXT:']
    const urgent: string[] = []

    for (const c of creds) {
      const ct = Array.isArray(c.credential_type) ? c.credential_type[0] : c.credential_type
      const name = ct?.name || 'Unknown'

      let statusNote = ''
      let daysNote = ''
      if (c.does_not_expire) {
        statusNote = 'Does not expire'
      } else if (c.not_applicable) {
        statusNote = 'Not applicable'
      } else if (c.expiry_date) {
        const expiry = new Date(c.expiry_date)
        const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (daysUntil < 0) {
          statusNote = `EXPIRED ${Math.abs(daysUntil)} days ago`
          urgent.push(`${name} expired ${Math.abs(daysUntil)} days ago`)
        } else if (daysUntil <= 30) {
          statusNote = `EXPIRING IN ${daysUntil} DAYS`
          urgent.push(`${name} expires in ${daysUntil} days (${c.expiry_date})`)
        } else if (daysUntil <= 90) {
          statusNote = `Expiring soon (${daysUntil} days — ${c.expiry_date})`
        } else {
          statusNote = `Current — expires ${c.expiry_date}`
        }
        daysNote = ` | Expiry: ${c.expiry_date}`
      }

      lines.push(`• ${name}: ${statusNote}${daysNote} | Overall status: ${c.status} | Review: ${c.review_status || 'approved'}`)
    }

    if (urgent.length > 0) {
      lines.push(`\n⚠️  URGENT CREDENTIAL ALERTS:\n${urgent.map(u => `  - ${u}`).join('\n')}`)
    }

    // Check for credential types that should exist but are missing
    const { data: allTypes } = await svc
      .from('credential_types')
      .select('id, name, validity_days, required_for_roles')

    if (allTypes && allTypes.length > 0) {
      const submittedTypeIds = new Set(creds.map((c: any) => c.credential_type_id))
      const missing = allTypes.filter((t: any) => !submittedTypeIds.has(t.id))
      if (missing.length > 0) {
        lines.push(`\n❌ MISSING CREDENTIALS (${missing.length} types not yet on file):`)
        for (const t of missing) {
          lines.push(`  - ${t.name}${t.validity_days ? ` (renews every ${t.validity_days} days)` : ''} — Action: Upload at /credentials`)
        }
      } else {
        lines.push(`\n✅ All required credential types are on file.`)
      }
    }

    return lines.join('\n')
  } catch (err) {
    console.error('buildCredentialContext error:', err)
    return 'CREDENTIAL CONTEXT: Unable to load credential data.'
  }
}

// ── Appraisal context ───────────────────────────────────────────────────────
export async function buildAppraisalContext(userId: string, svc: any): Promise<string> {
  try {
    const { data: appraisals } = await svc
      .from('appraisals')
      .select('*, appraiser:appraiser_id(full_name)')
      .eq('caregiver_id', userId)
      .in('status', ['signed', 'completed', 'sent'])
      .order('created_at', { ascending: false })
      .limit(2) // last 2 appraisals for trend

    if (!appraisals || appraisals.length === 0) {
      return 'APPRAISAL CONTEXT:\nNo completed appraisals on record for this user.'
    }

    const lines: string[] = ['APPRAISAL CONTEXT:']

    // Score key labels for interpretation
    const SCORE_LABELS: Record<number, string> = {
      1: 'Does Not Meet Standards',
      2: 'Needs Improvement',
      3: 'Meets Standards',
      4: 'Exceeds Standards'
    }

    // Clinical competency keys
    const CLINICAL_KEYS = [
      's_patient_care_duties', 's_medications', 's_personal_care', 's_vitals',
      's_reports_changes', 's_documentation', 's_body_mechanics', 's_confidentiality',
      's_asks_for_help', 's_own_actions', 's_completes_work'
    ]
    const CLINICAL_LABELS: Record<string, string> = {
      's_patient_care_duties': 'Patient care duties',
      's_medications': 'Medication assistance',
      's_personal_care': 'Personal care / bathing',
      's_vitals': 'Vital signs accuracy',
      's_reports_changes': 'Reporting client changes',
      's_documentation': 'Documentation timeliness',
      's_body_mechanics': 'Body mechanics / safety',
      's_confidentiality': 'Confidentiality (HIPAA)',
      's_asks_for_help': 'Seeking help appropriately',
      's_own_actions': 'Accountability',
      's_completes_work': 'Completing assignments',
    }
    const PROF_KEYS = [
      's_policies_adherence', 's_attendance', 's_tardiness', 's_appearance',
      's_time_management', 's_inservices', 's_judgment', 's_cpr_certification'
    ]
    const PROF_LABELS: Record<string, string> = {
      's_policies_adherence': 'Policy adherence',
      's_attendance': 'Attendance',
      's_tardiness': 'Punctuality',
      's_appearance': 'Professional appearance',
      's_time_management': 'Time management',
      's_inservices': 'In-service attendance',
      's_judgment': 'Judgment & decision-making',
      's_cpr_certification': 'CPR certification current',
    }

    appraisals.forEach((appr: any, idx: number) => {
      const appraiser = Array.isArray(appr.appraiser) ? appr.appraiser[0] : appr.appraiser
      lines.push(`\n${idx === 0 ? 'MOST RECENT' : 'PREVIOUS'} APPRAISAL:`)
      lines.push(`Date: ${new Date(appr.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`)
      lines.push(`Period: ${appr.appraisal_period || 'Not specified'}`)
      lines.push(`Appraiser: ${appraiser?.full_name || 'Unknown'}`)
      lines.push(`Status: ${appr.status}`)

      // Clinical scores
      const clinicalScores = CLINICAL_KEYS.map(k => ({ label: CLINICAL_LABELS[k] || k, score: appr[k] as number })).filter(s => s.score)
      if (clinicalScores.length > 0) {
        lines.push('\nClinical Competencies:')
        for (const s of clinicalScores) {
          lines.push(`  • ${s.label}: ${s.score}/4 — ${SCORE_LABELS[s.score] || ''}`)
        }
        const avg = clinicalScores.reduce((sum, s) => sum + s.score, 0) / clinicalScores.length
        lines.push(`  Average clinical score: ${avg.toFixed(1)}/4`)

        const lowAreas = clinicalScores.filter(s => s.score <= 2)
        if (lowAreas.length > 0) {
          lines.push(`  Areas needing improvement: ${lowAreas.map(s => s.label).join(', ')}`)
        }
      }

      // Professional scores
      const profScores = PROF_KEYS.map(k => ({ label: PROF_LABELS[k] || k, score: appr[k] as number })).filter(s => s.score)
      if (profScores.length > 0) {
        lines.push('\nProfessional Competencies:')
        for (const s of profScores) {
          lines.push(`  • ${s.label}: ${s.score}/4 — ${SCORE_LABELS[s.score] || ''}`)
        }
        const lowAreas = profScores.filter(s => s.score <= 2)
        if (lowAreas.length > 0) {
          lines.push(`  Areas needing improvement: ${lowAreas.map(s => s.label).join(', ')}`)
        }
      }

      if (appr.comments) {
        lines.push(`\nSupervisor comments: "${appr.comments}"`)
      }
      if (appr.caregiver_signature) {
        lines.push(`Caregiver signed: Yes (${appr.signed_at ? new Date(appr.signed_at).toLocaleDateString() : 'date unknown'})`)
      }
    })

    return lines.join('\n')
  } catch (err) {
    console.error('buildAppraisalContext error:', err)
    return 'APPRAISAL CONTEXT: Unable to load appraisal data.'
  }
}

// ── Policy context (adapted from pp/ai/chat) ─────────────────────────────────
export async function buildPolicyContext(question: string, svc: any): Promise<{ catalogue: string; relevant: string }> {
  try {
    const { data: allPolicies } = await svc
      .from('pp_policies')
      .select('doc_id, domain, title, applicable_roles, comar_refs, keywords, version, review_date, status')
      .in('status', ['active', 'under-review'])
      .order('doc_id')

    if (!allPolicies || allPolicies.length === 0) {
      return { catalogue: 'No policies loaded.', relevant: '' }
    }

    const catalogue = allPolicies.map((p: any) =>
      `${p.doc_id} | ${p.title} | ${p.domain} | Applies to: ${(p.applicable_roles || []).join(', ')}`
    ).join('\n')

    // Score relevance
    const questionLower = question.toLowerCase()
    const questionWords = questionLower.split(/\s+/).filter((w: string) => w.length > 3)

    const scored = allPolicies.map((p: any) => {
      let score = 0
      const target = [p.title, ...(p.keywords || []), ...(p.comar_refs || []), p.domain, p.doc_id].join(' ').toLowerCase()
      for (const w of questionWords) if (target.includes(w)) score += 2
      if (questionLower.includes(p.doc_id.toLowerCase())) score += 10
      return { ...p, score }
    }).sort((a: any, b: any) => b.score - a.score)

    const top = scored.filter((p: any) => p.score > 0).slice(0, 4)

    let relevant = ''
    if (top.length > 0) {
      const { data: fullPolicies } = await svc
        .from('pp_policies')
        .select('doc_id, title, html_content')
        .in('doc_id', top.map((p: any) => p.doc_id))

      relevant = (fullPolicies || []).map((p: any) => {
        const text = (p.html_content || '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 3000)
        return `\n=== ${p.doc_id}: ${p.title} ===\n${text}`
      }).join('')
    }

    return { catalogue, relevant }
  } catch (err) {
    console.error('buildPolicyContext error:', err)
    return { catalogue: 'Policy data unavailable.', relevant: '' }
  }
}

// ── Vita snapshot (for personalised UI suggestions) ───────────────────────────
export async function buildVitaSnapshot(userId: string, svc: any) {
  try {
    const today = new Date()

    const { data: expiring } = await svc
      .from('staff_credentials')
      .select('id, status, expiry_date, credential_type:credential_types(name)')
      .eq('user_id', userId)
      .in('status', ['expiring', 'expired'])

    const { data: enrollments } = await svc
      .from('course_enrollments')
      .select('id, progress_pct, completed_at, course:course_id(title)')
      .eq('user_id', userId)

    const { data: lastAppraisal } = await svc
      .from('appraisals')
      .select('id, created_at, appraisal_period')
      .eq('caregiver_id', userId)
      .in('status', ['signed', 'completed', 'sent'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const incomplete = (enrollments || []).filter((e: any) => !e.completed_at)
    const expiringCreds = (expiring || [])
    const expiringNames = expiringCreds.slice(0, 2).map((c: any) => {
      const ct = Array.isArray(c.credential_type) ? c.credential_type[0] : c.credential_type
      return ct?.name || 'a credential'
    })

    return {
      expiringCredCount: expiringCreds.length,
      expiringCredNames: expiringNames,
      incompleteModuleCount: incomplete.length,
      incompleteModuleTitles: incomplete.slice(0, 2).map((e: any) => {
        const c = Array.isArray(e.course) ? e.course[0] : e.course
        return c?.title || 'a module'
      }),
      lastAppraisalDate: lastAppraisal?.created_at || null,
      totalEnrolled: (enrollments || []).length,
      totalCompleted: (enrollments || []).filter((e: any) => e.completed_at).length,
    }
  } catch {
    return {
      expiringCredCount: 0, expiringCredNames: [],
      incompleteModuleCount: 0, incompleteModuleTitles: [],
      lastAppraisalDate: null, totalEnrolled: 0, totalCompleted: 0
    }
  }
}

// ── Leads & Pipeline context (admin/supervisor only) ──────────────────────────
export async function buildLeadsContext(svc: any): Promise<string> {
  try {
    const { data: leads } = await svc
      .from('leads')
      .select(`
        id, full_name, client_name, source, referral_name, status,
        care_types, estimated_hours_week, hourly_rate,
        expected_close_date, expected_start_date,
        won_date, lost_reason, notes, created_at, updated_at,
        assignee:assigned_to(full_name)
      `)
      .order('created_at', { ascending: false })

    if (!leads || leads.length === 0) {
      return 'LEADS & PIPELINE CONTEXT:\nNo leads in the system yet.'
    }

    // Revenue helpers
    const calcMonthly = (h?: number, r?: number) => (h && r) ? h * r * 4.33 : 0
    const fmtMoney = (n: number) => '$' + Math.round(n).toLocaleString()

    // Group by status
    const STAGES = ['new','contacted','assessment_scheduled','proposal_sent','won','on_hold','cold','lost']
    const STAGE_LABELS: Record<string,string> = {
      new: 'New', contacted: 'Contacted', assessment_scheduled: 'Assessment Scheduled',
      proposal_sent: 'Proposal Sent', won: 'Won', on_hold: 'On Hold', cold: 'Cold', lost: 'Lost'
    }

    const byStatus: Record<string, typeof leads> = {}
    for (const s of STAGES) byStatus[s] = []
    for (const l of leads) {
      if (byStatus[l.status]) byStatus[l.status].push(l)
    }

    const activePipeline = leads.filter((l: any) => !['lost','cold'].includes(l.status))
    const wonLeads = leads.filter((l: any) => l.status === 'won')
    const pipelineMonthly = activePipeline.filter((l: any) => l.status !== 'won')
      .reduce((sum: number, l: any) => sum + calcMonthly(l.estimated_hours_week, l.hourly_rate), 0)
    const wonMonthly = wonLeads
      .reduce((sum: number, l: any) => sum + calcMonthly(l.estimated_hours_week, l.hourly_rate), 0)

    const lines: string[] = ['LEADS & PIPELINE CONTEXT:']
    lines.push(`Total leads: ${leads.length} | Active: ${activePipeline.length} | Won: ${wonLeads.length} | Lost/Cold: ${leads.length - activePipeline.length}`)
    lines.push(`Won monthly revenue: ${fmtMoney(wonMonthly)}/mo (${fmtMoney(wonMonthly * 12)}/yr)`)
    lines.push(`Pipeline potential: ${fmtMoney(pipelineMonthly)}/mo (if all active leads convert)`)

    // Stage breakdown
    lines.push('\nPIPELINE BREAKDOWN:')
    for (const s of STAGES) {
      const group = byStatus[s] || []
      if (group.length === 0) continue
      const groupRevenue = group.reduce((sum: number, l: any) => sum + calcMonthly(l.estimated_hours_week, l.hourly_rate), 0)
      lines.push(`\n${STAGE_LABELS[s]} (${group.length}):${groupRevenue > 0 ? ' ' + fmtMoney(groupRevenue) + '/mo potential' : ''}`)
      for (const l of group) {
        const name = l.client_name || l.full_name
        const rev = calcMonthly(l.estimated_hours_week, l.hourly_rate)
        const assignee = Array.isArray(l.assignee) ? l.assignee[0]?.full_name : l.assignee?.full_name
        lines.push(
          `  • ${name}` +
          (l.care_types?.length ? ` | ${l.care_types.join(', ')}` : '') +
          (l.estimated_hours_week ? ` | ${l.estimated_hours_week}h/wk` : '') +
          (l.hourly_rate ? ` @ $${l.hourly_rate}/hr` : '') +
          (rev > 0 ? ` = ${fmtMoney(rev)}/mo` : '') +
          (l.expected_close_date ? ` | Close: ${l.expected_close_date}` : '') +
          (assignee ? ` | Assigned: ${assignee}` : '') +
          (l.source !== 'phone' ? ` | Source: ${l.source.replace(/_/g,' ')}` : '')
        )
        if (l.notes) lines.push(`    Notes: ${l.notes.slice(0, 120)}`)
      }
    }

    // Revenue trajectory — next 6 months
    const today = new Date()
    const trajectory: Record<string, number> = {}
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      trajectory[key] = 0
    }
    for (const l of activePipeline.filter((l: any) => l.status !== 'won')) {
      if (!l.expected_close_date) continue
      const d = new Date(l.expected_close_date)
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const rev = calcMonthly(l.estimated_hours_week, l.hourly_rate)
      if (trajectory[key] !== undefined && rev > 0) trajectory[key] += rev
    }
    const trajLines = Object.entries(trajectory).filter(([,v]) => v > 0)
    if (trajLines.length > 0) {
      lines.push('\nREVENUE TRAJECTORY (pipeline closes by month):')
      for (const [month, val] of trajLines) {
        lines.push(`  ${month}: ${fmtMoney(val)}/mo potential`)
      }
    }

    // Full activity history per lead — Vita needs to know what was discussed
    const leadIds = leads.map((l: any) => l.id)
    if (leadIds.length > 0) {
      const { data: activities } = await svc
        .from('lead_activities')
        .select('lead_id, activity_type, content, next_follow_up, created_at')
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false })

      // Map activities to leads
      const actsByLead: Record<string, any[]> = {}
      const nextFU: Record<string, string> = {}
      const todayStr = today.toISOString().split('T')[0]

      for (const a of activities || []) {
        if (!actsByLead[a.lead_id]) actsByLead[a.lead_id] = []
        actsByLead[a.lead_id].push(a)
        if (a.next_follow_up && a.next_follow_up >= todayStr && !nextFU[a.lead_id]) {
          nextFU[a.lead_id] = a.next_follow_up
        }
      }

      // Enrich each lead line with last activity content
      lines.push('\nLEAD ACTIVITY DETAILS (most recent interactions):')
      for (const l of leads.filter((l: any) => !['lost','cold'].includes(l.status))) {
        const name = l.client_name || l.full_name
        const acts = actsByLead[l.id] || []
        if (acts.length === 0) {
          lines.push(`  ${name}: No activity logged yet`)
          continue
        }
        const last = acts[0]
        const lastDate = new Date(last.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        lines.push(`  ${name} (${l.status}):`)
        lines.push(`    Last contact: ${lastDate} — ${last.activity_type} — "${last.content?.slice(0, 150) || 'No notes'}"`)
        if (nextFU[l.id]) lines.push(`    Next follow-up: ${nextFU[l.id]}`)
        if (acts.length > 1) {
          lines.push(`    Previous: ${acts.slice(1, 3).map((a: any) => `${a.activity_type} on ${new Date(a.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}: "${a.content?.slice(0,80) || ''}"` ).join(' | ')}`)
        }
      }

      // Overdue & upcoming
      const overdue = leads.filter((l: any) => { const fu = nextFU[l.id]; return fu && fu < todayStr })
      const upcoming = leads.filter((l: any) => { const fu = nextFU[l.id]; return fu && fu >= todayStr })

      if (overdue.length > 0) {
        lines.push(`\n⚠️  OVERDUE FOLLOW-UPS (${overdue.length}):`)
        for (const l of overdue) {
          lines.push(`  • ${l.client_name || l.full_name} — was due ${nextFU[l.id]}`)
        }
      }
      if (upcoming.length > 0) {
        lines.push(`\n📅 UPCOMING FOLLOW-UPS (${upcoming.length}):`)
        for (const l of upcoming) {
          lines.push(`  • ${l.client_name || l.full_name} — due ${nextFU[l.id]}`)
        }
      }

      // Lost leads analysis
      const lostLeads = leads.filter((l: any) => l.status === 'lost')
      if (lostLeads.length > 0) {
        lines.push(`\nLOST LEADS ANALYSIS (${lostLeads.length} lost):`)
        const reasons: Record<string, number> = {}
        for (const l of lostLeads) {
          const r = l.lost_reason || 'unknown'
          reasons[r] = (reasons[r] || 0) + 1
        }
        for (const [reason, count] of Object.entries(reasons).sort((a,b) => b[1]-a[1])) {
          lines.push(`  ${count}x: ${reason}`)
        }
      }

      // Source attribution
      const sourceMap: Record<string, { count: number; won: number }> = {}
      for (const l of leads) {
        const src = l.source || 'unknown'
        if (!sourceMap[src]) sourceMap[src] = { count: 0, won: 0 }
        sourceMap[src].count++
        if (l.status === 'won') sourceMap[src].won++
      }
      lines.push(`\nLEAD SOURCE ATTRIBUTION:`)
      for (const [src, data] of Object.entries(sourceMap).sort((a,b) => b[1].count-a[1].count)) {
        const convRate = data.count > 0 ? Math.round(data.won/data.count*100) : 0
        lines.push(`  ${src.replace(/_/g,' ')}: ${data.count} leads, ${data.won} won (${convRate}% conv rate)`)
      }
    }

    return lines.join('\n')
  } catch (err) {
    console.error('buildLeadsContext error:', err)
    return 'LEADS CONTEXT: Unable to load pipeline data.'
  }
}

// ── Staff roster context (admin/supervisor only) ─────────────────────────────
export async function buildStaffRosterContext(svc: any): Promise<string> {
  try {
    const lines: string[] = ['STAFF ROSTER & COMPLIANCE CONTEXT:']

    // All staff profiles
    const { data: staff } = await svc
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .in('role', ['caregiver', 'supervisor'])
      .order('full_name')

    if (!staff || staff.length === 0) return 'STAFF ROSTER: No staff profiles found.'

    lines.push(`Total staff: ${staff.length} | Caregivers: ${staff.filter((s: any) => s.role === 'caregiver').length} | Supervisors: ${staff.filter((s: any) => s.role === 'supervisor').length}`)

    // Credential status across all staff
    const { data: allCreds } = await svc
      .from('staff_credentials')
      .select('user_id, status, expiry_date, credential_type:credential_types(name)')
      .order('expiry_date', { ascending: true })

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Group credentials by user
    const credsByUser: Record<string, any[]> = {}
    for (const c of allCreds || []) {
      if (!credsByUser[c.user_id]) credsByUser[c.user_id] = []
      credsByUser[c.user_id].push(c)
    }

    // Flag urgent issues
    const expired: string[] = []
    const expiringSoon: string[] = []

    for (const s of staff) {
      const userCreds = credsByUser[s.id] || []
      for (const c of userCreds) {
        const ct = Array.isArray(c.credential_type) ? c.credential_type[0] : c.credential_type
        if (!c.expiry_date) continue
        const daysUntil = Math.ceil((new Date(c.expiry_date).getTime() - today.getTime()) / 86400000)
        if (daysUntil < 0) expired.push(`${s.full_name}: ${ct?.name} EXPIRED ${Math.abs(daysUntil)}d ago`)
        else if (daysUntil <= 30) expiringSoon.push(`${s.full_name}: ${ct?.name} expires in ${daysUntil}d (${c.expiry_date})`)
      }
    }

    if (expired.length > 0) {
      lines.push(`\n🚨 EXPIRED CREDENTIALS (${expired.length}):`)
      for (const e of expired) lines.push(`  - ${e}`)
    }
    if (expiringSoon.length > 0) {
      lines.push(`\n⚠️  EXPIRING WITHIN 30 DAYS (${expiringSoon.length}):`)
      for (const e of expiringSoon) lines.push(`  - ${e}`)
    }
    if (expired.length === 0 && expiringSoon.length === 0) {
      lines.push(`\n✅ No credential emergencies across all staff.`)
    }

    // Training completion rates
    const { data: allEnrollments } = await svc
      .from('course_enrollments')
      .select('user_id, progress_pct, completed_at')

    const enrollByUser: Record<string, { total: number; completed: number }> = {}
    for (const e of allEnrollments || []) {
      if (!enrollByUser[e.user_id]) enrollByUser[e.user_id] = { total: 0, completed: 0 }
      enrollByUser[e.user_id].total++
      if (e.completed_at) enrollByUser[e.user_id].completed++
    }

    lines.push(`\nSTAFF TRAINING COMPLETION:`)
    for (const s of staff) {
      const tr = enrollByUser[s.id]
      if (tr) {
        const pct = Math.round(tr.completed / tr.total * 100)
        lines.push(`  ${s.full_name} (${s.role}): ${tr.completed}/${tr.total} courses completed (${pct}%)`)
      } else {
        lines.push(`  ${s.full_name} (${s.role}): No enrollments`)
      }
    }

    return lines.join('\n')
  } catch (err) {
    console.error('buildStaffRosterContext error:', err)
    return 'STAFF ROSTER CONTEXT: Unable to load.'
  }
}

// ── Referral source context (admin/supervisor only) ───────────────────────────
export async function buildReferralSourceContext(svc: any): Promise<string> {
  try {
    const lines: string[] = ['REFERRAL SOURCES CONTEXT:']

    const { data: sources } = await svc
      .from('referral_sources')
      .select('id, name, type, contact_name, contact_email, contact_phone, notes, active, created_at')
      .order('name')

    if (!sources || sources.length === 0) return 'REFERRAL SOURCES: No sources configured.'

    lines.push(`Total referral sources: ${sources.length} | Active: ${sources.filter((s: any) => s.active).length}`)

    // Match to leads
    const { data: leads } = await svc
      .from('leads')
      .select('id, client_name, full_name, source, referral_name, status, won_date')

    const leadsBySource: Record<string, { total: number; won: number; names: string[] }> = {}
    for (const l of leads || []) {
      const src = l.source || 'unknown'
      if (!leadsBySource[src]) leadsBySource[src] = { total: 0, won: 0, names: [] }
      leadsBySource[src].total++
      if (l.status === 'won') { leadsBySource[src].won++; leadsBySource[src].names.push(l.client_name || l.full_name) }
    }

    lines.push(`\nSOURCE PERFORMANCE:`)
    for (const src of sources) {
      const perf = leadsBySource[src.name] || leadsBySource[src.type] || { total: 0, won: 0, names: [] }
      const convRate = perf.total > 0 ? Math.round(perf.won / perf.total * 100) : 0
      lines.push(`  ${src.name} (${src.type}): ${perf.total} leads, ${perf.won} won (${convRate}% conversion)`)
      if (src.contact_name) lines.push(`    Contact: ${src.contact_name}${src.contact_email ? ' — ' + src.contact_email : ''}`)
      if (src.notes) lines.push(`    Notes: ${src.notes.slice(0, 120)}`)
      if (perf.names.length > 0) lines.push(`    Won clients: ${perf.names.join(', ')}`)
    }

    return lines.join('\n')
  } catch (err) {
    console.error('buildReferralSourceContext error:', err)
    return 'REFERRAL SOURCES CONTEXT: Unable to load.'
  }
}

// ── Marketing context (admin/supervisor only) ──────────────────────────────
export async function buildMarketingContext(svc: any): Promise<string> {
  try {
    const lines: string[] = ['MARKETING CONTEXT (52 Weeks Marketing Programme):']

    // Influence center heat map summary
    const { data: centers } = await svc
      .from('marketing_influence_centers')
      .select('name, heat_status, assigned_day, week_group, go_no_go')
      .order('name')

    if (centers && centers.length > 0) {
      const hot  = centers.filter((c: any) => c.heat_status === 'hot')
      const cold = centers.filter((c: any) => c.heat_status === 'cold')
      const dead = centers.filter((c: any) => c.heat_status === 'dead')
      lines.push(`\nINFLUENCE CENTERS: ${centers.length} total | ${hot.length} hot | ${cold.length} cold | ${dead.length} dead`)
      if (hot.length > 0) {
        lines.push(`HOT FACILITIES (priority relationship focus):`)
        for (const c of hot) lines.push(`  • ${c.name} (Week ${c.week_group}, ${c.assigned_day || 'unassigned'})`)
      }
      if (dead.length > 0) {
        lines.push(`DEAD FACILITIES (written off — low private pay potential):`)
        for (const c of dead.slice(0, 8)) lines.push(`  • ${c.name}`)
        if (dead.length > 8) lines.push(`  … and ${dead.length - 8} more`)
      }
    }

    // Recent field activity summary
    const { data: logs } = await svc
      .from('marketing_visit_logs')
      .select('visit_date, activity_type, marketing_influence_centers(name)')
      .order('visit_date', { ascending: false })
      .limit(50)

    if (logs && logs.length > 0) {
      const fCount = logs.filter((l: any) => l.activity_type === 'F').length
      const dCount = logs.filter((l: any) => l.activity_type === 'D').length
      const xCount = logs.filter((l: any) => l.activity_type === 'X').length
      const fRate  = (fCount + dCount) > 0 ? Math.round(fCount / (fCount + dCount) * 100) : 0
      const lastDate = logs[0]?.visit_date
      lines.push(`\nFIELD ACTIVITY (last 50 logs):`)
      lines.push(`  F (face-to-face): ${fCount} | D (drop-off): ${dCount} | X (missed): ${xCount}`)
      lines.push(`  F-rate: ${fRate}% (target is higher F — face-to-face builds referral relationships)`)
      lines.push(`  Most recent visit: ${lastDate}`)
    }

    // Email campaign performance
    const { data: campaigns } = await svc
      .from('marketing_email_campaigns')
      .select('campaign_date, total_opened, open_rate, total_sent')
      .order('campaign_date', { ascending: false })
      .limit(10)

    if (campaigns && campaigns.length > 0) {
      const withRate = campaigns.filter((c: any) => c.open_rate != null && c.total_sent > 0)
      const avgRate  = withRate.length > 0
        ? Math.round(withRate.reduce((a: number, c: any) => a + c.open_rate, 0) / withRate.length)
        : null
      const avgOpeners = Math.round(campaigns.reduce((a: number, c: any) => a + c.total_opened, 0) / campaigns.length)
      lines.push(`\nEMAIL BLAST (last 10 campaigns):`)
      lines.push(`  Avg open rate: ${avgRate != null ? avgRate + '%' : 'N/A (total sent unknown)'}`)
      lines.push(`  Avg openers per blast: ${avgOpeners}`)
      lines.push(`  Most recent: ${campaigns[0].campaign_date} — ${campaigns[0].total_opened} openers`)
    }

    // Top engaged contacts (external only)
    const { data: opens } = await svc
      .from('marketing_email_opens')
      .select('email_address, name_in_csv, contact_id, marketing_contacts(name, marketing_influence_centers(name))')
      .not('email_address', 'ilike', '%vitalishealthcare.com')

    if (opens && opens.length > 0) {
      const freq: Record<string, { name: string; facility: string; count: number }> = {}
      for (const o of opens) {
        const contact = Array.isArray(o.marketing_contacts) ? o.marketing_contacts[0] : o.marketing_contacts
        const facility = contact
          ? (Array.isArray(contact.marketing_influence_centers)
              ? contact.marketing_influence_centers[0]?.name
              : (contact.marketing_influence_centers as any)?.name) || '—'
          : '—'
        const key = o.email_address
        if (!freq[key]) freq[key] = { name: o.name_in_csv || contact?.name || o.email_address, facility, count: 0 }
        freq[key].count++
      }
      const top = Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 8)
      const totalCamps = campaigns?.length || 1
      lines.push(`\nTOP ENGAGED CONTACTS (most campaign opens, external only):`)
      for (const t of top) {
        const pct = Math.round(t.count / totalCamps * 100)
        lines.push(`  • ${t.name} @ ${t.facility} — opened ${t.count} campaigns (${pct}% engagement)`)
      }
      lines.push(`  ⬆ These contacts are warm — they are reading every email. Prioritise F-visits to their facilities.`)
    }

    // ── Per-facility visit breakdown (full detail) ────────────────────────────
    const { data: allLogs } = await svc
      .from('marketing_visit_logs')
      .select('influence_center_id, visit_date, activity_type, notes, marketing_influence_centers(name)')
      .order('visit_date', { ascending: false })

    if (allLogs && allLogs.length > 0) {
      const byFac: Record<string, { name: string; f: number; d: number; x: number; lastVisit: string; lastNote: string }> = {}
      for (const log of allLogs) {
        const facName = Array.isArray(log.marketing_influence_centers)
          ? log.marketing_influence_centers[0]?.name
          : (log.marketing_influence_centers as any)?.name || 'Unknown'
        const fid = log.influence_center_id
        if (!byFac[fid]) byFac[fid] = { name: facName, f: 0, d: 0, x: 0, lastVisit: log.visit_date, lastNote: '' }
        if (log.activity_type === 'F') byFac[fid].f++
        if (log.activity_type === 'D') byFac[fid].d++
        if (log.activity_type === 'X') byFac[fid].x++
        if (!byFac[fid].lastNote && log.notes) byFac[fid].lastNote = log.notes.slice(0, 120)
      }
      const today = new Date()
      lines.push(`\nFACILITY VISIT DETAIL (all visited facilities — sorted by activity):`)
      const sorted = Object.values(byFac).sort((a, b) => (b.f + b.d) - (a.f + a.d))
      for (const f of sorted) {
        const daysSince = f.lastVisit ? Math.floor((today.getTime() - new Date(f.lastVisit + 'T12:00:00').getTime()) / 86400000) : null
        const fRate = (f.f + f.d) > 0 ? Math.round(f.f / (f.f + f.d) * 100) : 0
        lines.push(`  ${f.name}: ${f.f}F / ${f.d}D / ${f.x}X | F-rate ${fRate}% | last visit ${daysSince != null ? daysSince + 'd ago' : 'unknown'}${f.lastNote ? ' | Note: ' + f.lastNote : ''}`)
      }
    }

    // ── Full referral history ─────────────────────────────────────────────────
    try {
      const { data: referrals } = await svc
        .from('marketing_referrals')
        .select('referral_date, payer_source, outcome, non_accept_reason, notes, marketing_influence_centers(name), marketing_contacts(name)')
        .order('referral_date', { ascending: false })

      if (referrals && referrals.length > 0) {
        lines.push(`\nREFERRAL HISTORY (${referrals.length} total referrals received):`)
        for (const r of referrals) {
          const fac = Array.isArray(r.marketing_influence_centers) ? r.marketing_influence_centers[0]?.name : (r.marketing_influence_centers as any)?.name || 'Unknown facility'
          const contact = Array.isArray(r.marketing_contacts) ? r.marketing_contacts[0]?.name : (r.marketing_contacts as any)?.name || 'Unknown contact'
          lines.push(`  ${r.referral_date} | FROM: ${fac} | CONTACT: ${contact} | payer: ${r.payer_source || 'unknown'} | outcome: ${r.outcome}${r.non_accept_reason ? ' | reason: ' + r.non_accept_reason : ''}`)
        }
        const declined = referrals.filter((r: any) => r.outcome === 'not_accepted')
        const payersMissed = [...new Set(declined.map((r: any) => r.payer_source).filter(Boolean))]
        lines.push(`  PAYER BARRIER: ${declined.length}/${referrals.length} referrals not accepted. Payers encountered but not contracted: ${payersMissed.join(', ') || 'unknown'}`)
        lines.push(`  STRATEGIC NOTE: Autumn Lake network (Silver Spring, Arcola, Oak Manor) is highest-volume referral source — all declined on payer grounds. Contracting with CareFirst, Wellpoint, or Maryland Medicaid would immediately unlock this pipeline.`)
      }
    } catch (_) {
      // referrals table may not exist in all environments
    }

    return lines.join('\n')
  } catch (err) {
    console.error('buildMarketingContext error:', err)
    return 'MARKETING CONTEXT: Unable to load marketing data.'
  }
}
