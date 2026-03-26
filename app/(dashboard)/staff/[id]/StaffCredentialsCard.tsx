'use client'
import { useState } from 'react'
import { CheckCircle, FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

interface CredDoc {
  id: string
  file_name: string
  file_url: string
  uploaded_at: string
  uploaded_by_name: string | null
}

interface CredentialWithDocs {
  id: string
  status: string
  issue_date: string | null
  expiry_date: string | null
  does_not_expire: boolean
  notes: string | null
  credential_type: { name: string } | null
  documents: CredDoc[]
}

interface Props {
  credentials: CredentialWithDocs[]
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    current:  { bg: '#E6F4F4', color: '#0A5C5B', label: 'Current'  },
    expiring: { bg: '#FEF3EA', color: '#C96B15', label: 'Expiring' },
    expired:  { bg: '#FDE8E9', color: '#B91C1C', label: 'Expired'  },
    missing:  { bg: '#F1F5F9', color: '#64748B', label: 'Missing'  },
  }
  const s = map[status] ?? map.missing
  return (
    <span style={{ padding: '2px 9px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  )
}

function CredentialRow({ cred }: { cred: CredentialWithDocs }) {
  const [expanded, setExpanded] = useState(false)
  const latest   = cred.documents[0] ?? null
  const history  = cred.documents.slice(1)
  const hasHistory = history.length > 0

  const expDays = cred.expiry_date
    ? Math.ceil((new Date(cred.expiry_date).getTime() - Date.now()) / 86_400_000)
    : null
  const alertColor = cred.status === 'expired' ? '#B91C1C' : cred.status === 'expiring' ? '#C96B15' : null

  return (
    <div style={{
      borderRadius: 8,
      border: alertColor ? `1px solid ${alertColor}40` : '1px solid #EFF2F5',
      borderLeft: alertColor ? `3px solid ${alertColor}` : '3px solid #2A9D8F',
      marginBottom: 10,
      overflow: 'hidden',
    }}>
      {/* Main row */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <CheckCircle size={14} color={alertColor ?? '#2A9D8F'} style={{ flexShrink: 0, marginTop: 2 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2E44' }}>
              {cred.credential_type?.name ?? 'Unknown'}
            </span>
            <StatusBadge status={cred.does_not_expire ? 'current' : cred.status} />
          </div>

          <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {cred.issue_date && <span>Issued: {fmtDate(cred.issue_date)}</span>}
            {cred.does_not_expire
              ? <span>Does not expire</span>
              : cred.expiry_date && (
                <span style={{ color: alertColor ?? '#8FA0B0', fontWeight: alertColor ? 600 : 400 }}>
                  {alertColor
                    ? cred.status === 'expired'
                      ? `Expired ${fmtDate(cred.expiry_date)}`
                      : `Expires ${fmtDate(cred.expiry_date)} (${expDays}d)`
                    : `Expires: ${fmtDate(cred.expiry_date)}`}
                </span>
              )}
          </div>

          {/* Latest document */}
          {latest ? (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={12} color="#0E7C7B" />
              <a
                href={latest.file_url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: '#0E7C7B', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {latest.file_name}
                <ExternalLink size={10} />
              </a>
              <span style={{ fontSize: 11, color: '#B0BEC5' }}>
                (uploaded {fmtDate(latest.uploaded_at)}{latest.uploaded_by_name ? ` by ${latest.uploaded_by_name}` : ''})
              </span>
            </div>
          ) : (
            <div style={{ marginTop: 8, fontSize: 12, color: '#B0BEC5', fontStyle: 'italic' }}>
              No document uploaded
            </div>
          )}
        </div>

        {/* History toggle */}
        {hasHistory && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D9E0', background: '#F8FAFB', cursor: 'pointer', fontSize: 11, color: '#4A6070', fontWeight: 600 }}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {history.length} older version{history.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Version history */}
      {expanded && hasHistory && (
        <div style={{ borderTop: '1px solid #EFF2F5', background: '#F8FAFC', padding: '10px 14px 10px 38px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8FA0B0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
            Previous Versions
          </div>
          {history.map((doc, i) => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < history.length - 1 ? 6 : 0 }}>
              <FileText size={11} color="#B0BEC5" />
              <a
                href={doc.file_url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: '#4A6070', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {doc.file_name}
                <ExternalLink size={9} color="#B0BEC5" />
              </a>
              <span style={{ fontSize: 11, color: '#B0BEC5' }}>
                {fmtDate(doc.uploaded_at)}{doc.uploaded_by_name ? ` · ${doc.uploaded_by_name}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProfileCredentialsCard({ credentials }: Props) {
  const alertCreds   = credentials.filter(c => !c.does_not_expire && (c.status === 'expiring' || c.status === 'expired'))
  const currentCreds = credentials.filter(c => c.does_not_expire || c.status === 'current')
  const missingCreds = credentials.filter(c => c.status === 'missing')

  return (
    <div>
      {alertCreds.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            ⚠ Requires Attention
          </div>
          {alertCreds.map(c => <CredentialRow key={c.id} cred={c} />)}
        </div>
      )}

      {currentCreds.length > 0 && (
        <div style={{ marginBottom: alertCreds.length > 0 ? 0 : 0 }}>
          {alertCreds.length > 0 && (
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2A9D8F', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Current
            </div>
          )}
          {currentCreds.map(c => <CredentialRow key={c.id} cred={c} />)}
        </div>
      )}

      {missingCreds.map(c => <CredentialRow key={c.id} cred={c} />)}

      {credentials.length === 0 && (
        <p style={{ color: '#8FA0B0', fontSize: 13 }}>No credentials on file.</p>
      )}
    </div>
  )
}
