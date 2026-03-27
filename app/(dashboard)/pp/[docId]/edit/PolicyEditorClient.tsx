'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Proposal {
  id: string
  section_id: string
  section_title: string
  original_text: string
  proposed_text: string
  change_reason: string
  ai_prompt: string
  status: string
  created_at: string
}

interface Policy {
  doc_id: string
  title: string
  domain: string
  version: string
  html_content: string
}

export default function PolicyEditorClient({ policy, proposals: initialProposals, editorName, editorRole }: {
  policy: Policy
  proposals: Proposal[]
  editorName: string
  editorRole: string
}) {
  const [tab, setTab] = useState<'propose' | 'proposals' | 'upload'>('propose')
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals)

  // Propose tab state
  const [sectionTitle, setSectionTitle] = useState('')
  const [originalText, setOriginalText] = useState('')
  const [instruction, setInstruction] = useState('')
  const [changeReason, setChangeReason] = useState('')
  const [proposing, setProposing] = useState(false)
  const [result, setResult] = useState<{ proposed: string; id: string } | null>(null)
  const [error, setError] = useState('')

  // Upload tab state
  const [docFile, setDocFile] = useState<File | null>(null)
  const [uploadNote, setUploadNote] = useState('')
  const [uploading, setUploading] = useState(false)

  const propose = async () => {
    if (!originalText.trim() || !instruction.trim()) {
      setError('Please paste the original section text and describe what to change.')
      return
    }
    setProposing(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/pp/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId: policy.doc_id,
          sectionId: sectionTitle.toLowerCase().replace(/\s+/g, '-'),
          sectionTitle,
          originalText,
          instruction,
          changeReason,
        })
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ proposed: data.proposedText, id: data.proposalId })
        setProposals(prev => [{
          id: data.proposalId,
          section_id: sectionTitle.toLowerCase().replace(/\s+/g, '-'),
          section_title: sectionTitle,
          original_text: originalText,
          proposed_text: data.proposedText,
          change_reason: changeReason,
          ai_prompt: instruction,
          status: 'pending',
          created_at: new Date().toISOString()
        }, ...prev])
      } else {
        setError(data.error || 'Failed to generate proposal')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setProposing(false)
  }

  const approveProposal = async (proposalId: string) => {
    try {
      await fetch('/api/pp/proposals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId })
      })
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'approved' } : p))
    } catch {}
  }

  const rejectProposal = async (proposalId: string) => {
    try {
      await fetch('/api/pp/proposals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId })
      })
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'rejected' } : p))
    } catch {}
  }

  const pendingCount = proposals.filter(p => p.status === 'pending').length
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
  const ta: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }

  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#FEF3EA', text: '#F59E0B' },
    approved: { bg: '#E6F6F4', text: '#0B6B5C' },
    rejected: { bg: '#FDE8E9', text: '#E63946' },
    applied: { bg: '#EFF6FF', text: '#2563EB' },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>

      {/* LEFT: Editor panel */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', background: '#F8FAFB', borderRadius: 8, padding: 3, marginBottom: 22 }}>
          {([['propose', 'AI Rewrite'], ['proposals', `Proposals (${pendingCount})`], ['upload', 'Upload New Version']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '7px 10px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: tab === key ? '#fff' : 'transparent',
              color: tab === key ? '#1A2E44' : '#8FA0B0',
              boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Propose tab */}
        {tab === 'propose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1E40AF', lineHeight: 1.5 }}>
              💡 <strong>How it works:</strong> Paste the section you want to change, describe what needs updating, and AI will draft a revised version for your review. All proposals must be approved before they go live.
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4A6070', display: 'block', marginBottom: 5 }}>Section Name</label>
              <input value={sectionTitle} onChange={e => setSectionTitle(e.target.value)} placeholder="e.g. Purpose, Policy Statement, Step 3..." style={inp} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4A6070', display: 'block', marginBottom: 5 }}>Original Section Text</label>
              <textarea value={originalText} onChange={e => setOriginalText(e.target.value)} placeholder="Paste the current text of the section you want to update..." style={{ ...ta, minHeight: 130 }} />
              <div style={{ fontSize: 11, color: '#CBD5E0', marginTop: 4 }}>Copy from the policy document on the right, or from the source HTML file</div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4A6070', display: 'block', marginBottom: 5 }}>What Should Change?</label>
              <textarea value={instruction} onChange={e => setInstruction(e.target.value)} placeholder="e.g. Update to reflect the new COMAR 10.07.05.08 amendment effective January 2026. The DON supervision requirement has changed from quarterly to monthly..." style={ta} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4A6070', display: 'block', marginBottom: 5 }}>Reason for Change</label>
              <input value={changeReason} onChange={e => setChangeReason(e.target.value)} placeholder="e.g. Regulatory update, Personnel change, OHCQ finding..." style={inp} />
            </div>

            {error && <div style={{ background: '#FDE8E9', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>{error}</div>}

            <button onClick={propose} disabled={proposing || !originalText.trim() || !instruction.trim()} style={{
              padding: '11px 20px', background: proposing ? '#CBD5E0' : 'linear-gradient(135deg, #0B6B5C, #1A9B87)',
              border: 'none', borderRadius: 9, color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: proposing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
              {proposing ? (
                <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Generating with AI…</>
              ) : '🤖 Generate AI Proposal'}
            </button>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* Result preview */}
            {result && (
              <div style={{ background: '#E6F6F4', border: '2px solid #0B6B5C', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>✅</span>
                  <strong style={{ fontSize: 13, color: '#0B6B5C' }}>Proposal created successfully</strong>
                </div>
                <div style={{ fontSize: 12, color: '#4A6070', lineHeight: 1.6, background: '#fff', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0', maxHeight: 200, overflowY: 'auto' }}>
                  {result.proposed}
                </div>
                <div style={{ fontSize: 11, color: '#0B6B5C', marginTop: 8 }}>
                  Saved as a pending proposal. Review it in the Proposals tab, then approve to apply it.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Proposals tab */}
        {tab === 'proposals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {proposals.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#8FA0B0', fontSize: 13 }}>
                No edit proposals yet. Use the AI Rewrite tab to create one.
              </div>
            )}
            {proposals.map(p => {
              const sc = statusColors[p.status] || { bg: '#EFF2F5', text: '#8FA0B0' }
              return (
                <div key={p.id} style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', background: '#F8FAFB', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2E44' }}>{p.section_title || 'Section'}</span>
                      <span style={{ fontSize: 11, color: '#8FA0B0', marginLeft: 8 }}>{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.text }}>
                      {p.status}
                    </span>
                  </div>
                  <div style={{ padding: 14 }}>
                    {p.change_reason && <div style={{ fontSize: 12, color: '#4A6070', marginBottom: 8 }}>📌 <strong>Reason:</strong> {p.change_reason}</div>}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Original</div>
                        <div style={{ fontSize: 11, color: '#4A6070', background: '#FEF2F2', borderRadius: 6, padding: 8, maxHeight: 100, overflowY: 'auto', lineHeight: 1.5 }}>{p.original_text}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Proposed</div>
                        <div style={{ fontSize: 11, color: '#1A2E44', background: '#F0FDF4', borderRadius: 6, padding: 8, maxHeight: 100, overflowY: 'auto', lineHeight: 1.5 }}>{p.proposed_text}</div>
                      </div>
                    </div>
                    {p.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => approveProposal(p.id)} style={{ flex: 1, padding: '8px', background: '#0B6B5C', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          ✓ Approve
                        </button>
                        <button onClick={() => rejectProposal(p.id)} style={{ flex: 1, padding: '8px', background: '#FDE8E9', border: '1px solid #FCA5A5', borderRadius: 7, color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Upload tab */}
        {tab === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#FEF3EA', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
              📄 <strong>Upload a new version</strong> of this policy as a Word document. The system will process it, update the HTML, create a new version record, and trigger re-acknowledgment for all applicable staff.
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4A6070', display: 'block', marginBottom: 5 }}>Word Document (.docx)</label>
              <input type="file" accept=".docx" onChange={e => setDocFile(e.target.files?.[0] || null)}
                style={{ ...inp, padding: '7px 10px' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4A6070', display: 'block', marginBottom: 5 }}>Change Summary</label>
              <textarea value={uploadNote} onChange={e => setUploadNote(e.target.value)}
                placeholder="Describe what changed in this new version and why..." style={ta} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4A6070', display: 'block', marginBottom: 5 }}>Version Type</label>
              <select style={{ ...inp }}>
                <option value="minor">Minor (2.0 → 2.1) — no re-acknowledgment needed</option>
                <option value="major">Major (2.1 → 3.0) — all staff must re-acknowledge</option>
                <option value="regulatory">Regulatory update — all staff must re-acknowledge</option>
              </select>
            </div>
            <button disabled={!docFile || uploading} style={{ padding: '11px 20px', background: docFile ? '#0B6B5C' : '#E2E8F0', border: 'none', borderRadius: 9, color: '#fff', fontSize: 14, fontWeight: 700, cursor: docFile ? 'pointer' : 'not-allowed' }}>
              {uploading ? 'Processing…' : '📤 Upload & Process'}
            </button>
            <div style={{ fontSize: 12, color: '#8FA0B0', lineHeight: 1.5 }}>
              After upload: send the document to the P&P Claude conversation for HTML formatting, then use the Import tool to load it here.
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Live policy preview */}
      <div>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '14px 18px', background: '#F8FAFB', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2E44' }}>Current Live Document</span>
              <span style={{ fontSize: 11, color: '#8FA0B0', marginLeft: 8 }}>v{policy.version}</span>
            </div>
            <Link href={`/pp/${policy.doc_id}`} target="_blank" style={{ fontSize: 12, color: '#0B6B5C', fontWeight: 600, textDecoration: 'none' }}>
              Full view ↗
            </Link>
          </div>
          <iframe src={`/api/pp/html/${policy.doc_id}`} style={{ width: '100%', height: 700, border: 'none', display: 'block' }} title={`${policy.doc_id} preview`} />
        </div>
      </div>
    </div>
  )
}
