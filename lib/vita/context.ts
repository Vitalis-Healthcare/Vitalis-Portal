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
    const enrollmentIds = enrollments.filter(e => e.completed_at).map(e => e.id).slice(0, 5)
    if (enrollmentIds.length > 0) {
      const { data: quizProgress } = await svc
        .from('section_progress')
        .select('enrollment_id, score, completed_at, section:section_id(title, type)')
        .in('enrollment_id', enrollmentIds)
        .eq('section:section_id.type', 'quiz')
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
