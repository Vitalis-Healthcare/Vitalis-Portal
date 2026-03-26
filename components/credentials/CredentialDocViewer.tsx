'use client'
// components/credentials/CredentialDocViewer.tsx
// Document version history modal for credentials.
// Access rules:
//   - Admin (role='admin'): sees all versions, full history expandable
//   - Supervisor / Staff: sees latest + up to 2 previous versions only
//   - Caregivers: sees their own latest only (handled by calling page)

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, FileText, ExternalLink, ChevronDown, ChevronUp, Clock } from 'lucide-react'

interface CredentialDoc {
  id:             string
  document_url:   string
  file_name:      string | null
  uploaded_at:    string
  version_number: number
  is_latest:      boolean
  notes:          string | null
  uploader:       { full_name: string } | { full_name: string }[] | null
}

interface Props {
  credentialId:   string
  credentialName: string
  staffName:      string
  documentUrl?:   string
  viewerRole:     string
  isOpen:         boolean
  onClose:        () => void
}

export default function CredentialDocViewer({
  credentialId, credentialName, staffName, documentUrl, viewerRole, isOpen, onClose
}: Props) {
  const supabase = createClient()
  const [docs, setDocs]           = useState<CredentialDoc[]>([])
  const [loading, setLoading]     = useState(false)
  const [showAll, setShowAll]     = useState(false)

  const isFullAdmin = viewerRole === 'admin'

  useEffect(() => {
    if (!isOpen || !credentialId) return
    setShowAll(false)
    setLoading(true)

    supabase
      .from('credential_documents')
      .select(`id, document_url, file_name, uploaded_at, version_number, is_latest, notes, uploader:uploaded_by ( full_name )`)
      .eq('staff_credential_id', credentialId)
      .order('version_number', { ascending: false })
      .then(async ({ data, error }) => {
        if (!error && data && data.length > 0) {
          setDocs(data as unknown as CredentialDoc[])
          setLoading(false)
          return
        }
        // No versions in table — auto-backfill from document_url if available
        if (documentUrl) {
          try {
            await fetch('/api/credentials/add-document', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                staffCredentialId: credentialId,
                documentUrl,
                fileName: 'Document (backfilled)',
              }),
            })
            const { data: refetched } = await supabase
              .from('credential_documents')
              .select(`id, document_url, file_name, uploaded_at, version_number, is_latest, notes, uploader:uploaded_by ( full_name )`)
              .eq('staff_credential_id', credentialId)
              .order('version_number', { ascending: false })
            if (refetched) setDocs(refetched as unknown as CredentialDoc[])
          } catch (e) { console.warn('Backfill failed:', e) }
        }
        setLoading(false)
      })
  }, [isOpen, credentialId])

  if (!isOpen) return null

  const latest   = docs[0] ?? null
  const previous = docs.slice(1)              // everything after latest
  const visiblePrev = isFullAdmin
    ? (showAll ? previous : previous.slice(0, 2))
    : previous.slice(0, 2)                    // non-admin: max 2 previous
  const hiddenCount = previous.length - 2     // docs beyond the 2 previous

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 48px rgba(0,0,0,0.22)' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A2E44', margin: 0 }}>
              {credentialName}
            </h3>
            <p style={{ fontSize: 12, color: '#8FA0B0', margin: '3px 0 0' }}>
              {staffName} · {docs.length} version{docs.length !== 1 ? 's' : ''} on file
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0', padding: 4, marginLeft: 12, flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#8FA0B0', fontSize: 14, padding: '32px 0', justifyContent: 'center' }}>
              <Clock size={16} /> Loading document history…
            </div>
          ) : docs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8FA0B0' }}>
              <FileText size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.35 }} />
              <p style={{ fontSize: 14, margin: 0 }}>No documents uploaded for this credential.</p>
            </div>
          ) : (
            <>
              {/* ── CURRENT VERSION ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2A9D8F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                  Current Version
                </div>
                {latest && <DocCard doc={latest} isCurrent fmtTime={fmtTime} />}
              </div>

              {/* ── PREVIOUS VERSIONS ── */}
              {visiblePrev.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                    Previous Versions
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {visiblePrev.map(doc => (
                      <DocCard key={doc.id} doc={doc} isCurrent={false} fmtTime={fmtTime} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── ADMIN: SHOW/HIDE FULL HISTORY ── */}
              {isFullAdmin && hiddenCount > 0 && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  style={{ width: '100%', padding: '9px 14px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#4A6070' }}
                >
                  {showAll
                    ? <><ChevronUp size={14} /> Hide older versions</>
                    : <><ChevronDown size={14} /> View {hiddenCount} older version{hiddenCount !== 1 ? 's' : ''}</>
                  }
                </button>
              )}

              {/* ── NON-ADMIN: OLDER HISTORY NOTE ── */}
              {!isFullAdmin && previous.length > 2 && (
                <div style={{ padding: '10px 14px', background: '#F8FAFB', border: '1px solid #EFF2F5', borderRadius: 8, fontSize: 12, color: '#8FA0B0', textAlign: 'center' }}>
                  {previous.length - 2} older version{previous.length - 2 !== 1 ? 's' : ''} archived · contact admin for full history
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #EFF2F5', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#B0BEC5' }}>
            Documents retained per 7-year compliance policy
          </span>
          <button onClick={onClose} style={{ padding: '8px 20px', background: '#EFF2F5', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#4A6070', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Individual document card ──────────────────────────────────────
function DocCard({ doc, isCurrent, fmtTime }: {
  doc: CredentialDoc
  isCurrent: boolean
  fmtTime: (iso: string) => string
}) {
  const uploaderName = !doc.uploader
    ? 'System'
    : Array.isArray(doc.uploader)
      ? (doc.uploader[0]?.full_name ?? 'System')
      : doc.uploader.full_name
  const fileName     = doc.file_name || 'Document'

  return (
    <div style={{
      borderRadius: 10,
      border: isCurrent ? '1.5px solid #A7F3D0' : '1px solid #E2E8F0',
      background: isCurrent ? '#F0FDF9' : '#FAFBFC',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: isCurrent ? '#0E7C7B' : '#EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileText size={16} color={isCurrent ? '#fff' : '#8FA0B0'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2E44', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
              {fileName}
            </span>
            {isCurrent && (
              <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: '#0E7C7B', color: '#fff', letterSpacing: '0.5px', flexShrink: 0 }}>
                CURRENT
              </span>
            )}
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: '#EFF2F5', color: '#8FA0B0', flexShrink: 0 }}>
              v{doc.version_number}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#8FA0B0', lineHeight: 1.6 }}>
            Uploaded {fmtTime(doc.uploaded_at)}
            {uploaderName !== 'System' && ` · by ${uploaderName}`}
          </div>
          {doc.notes && (
            <div style={{ fontSize: 12, color: '#4A6070', marginTop: 5, fontStyle: 'italic' }}>{doc.notes}</div>
          )}
        </div>
        <a
          href={doc.document_url}
          target="_blank"
          rel="noreferrer"
          title="Open document"
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, background: isCurrent ? '#0E7C7B' : '#EFF2F5', color: isCurrent ? '#fff' : '#4A6070', fontSize: 12, fontWeight: 600, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          <ExternalLink size={12} /> View
        </a>
      </div>
    </div>
  )
}
