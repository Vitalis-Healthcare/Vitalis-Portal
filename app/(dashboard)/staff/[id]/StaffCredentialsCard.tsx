'use client'
// app/(dashboard)/staff/[id]/StaffCredentialsCard.tsx

import { useState } from 'react'
import { CheckCircle, FileText } from 'lucide-react'
import CredentialDocViewer from '@/components/credentials/CredentialDocViewer'

interface Credential {
  id:               string
  status:           string
  issue_date:       string
  expiry_date?:     string
  does_not_expire?: boolean
  notes?:           string
  document_url?:    string
  // Supabase returns joined relations as arrays
  credential_type?: { name: string } | { name: string }[]
}

// Normalise credential_type whether Supabase returns object or array
function getName(c: Credential): string {
  if (!c.credential_type) return 'Credential'
  return Array.isArray(c.credential_type)
    ? (c.credential_type[0]?.name ?? 'Credential')
    : c.credential_type.name
}

interface Props {
  credentials: Credential[]
  memberName:  string
  viewerRole:  string
}

export default function StaffCredentialsCard({ credentials, memberName, viewerRole }: Props) {
  const [docViewer, setDocViewer] = useState<{
    credId: string; credName: string; documentUrl?: string
  } | null>(null)

  const currentCreds  = credentials.filter(c => c.status === 'current')
  const expiringCreds = credentials.filter(c => c.status === 'expiring' || c.status === 'expired')

  const sectionTitle = {
    fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
  } as const

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={sectionTitle}>
          <span>🪪 Credentials</span>
          <span style={{ fontSize: 12, color: '#8FA0B0', fontWeight: 400 }}>{credentials.length} on file</span>
        </div>

        {expiringCreds.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E63946', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              ⚠ Requires Attention
            </div>
            {expiringCreds.map(c => {
              const expDays = c.expiry_date
                ? Math.ceil((new Date(c.expiry_date).getTime() - Date.now()) / 86400000)
                : null
              const col = c.status === 'expiring' ? '#F4A261' : '#E63946'
              return (
                <div key={c.id} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${col}40`, borderLeft: `3px solid ${col}`, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2E44' }}>{getName(c)}</div>
                      <div style={{ fontSize: 11, color: col, marginTop: 3 }}>
                        {c.status === 'expired' ? '✗ Expired' : expDays !== null ? `⚠ Expires in ${expDays} days` : 'Expiring soon'}
                        {c.expiry_date && ` · ${new Date(c.expiry_date).toLocaleDateString()}`}
                      </div>
                    </div>
                    {c.document_url && (
                      <button
                        onClick={() => setDocViewer({ credId: c.id, credName: getName(c), documentUrl: c.document_url })}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#F8FAFB', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#0E7C7B', flexShrink: 0 }}
                      >
                        <FileText size={11}/> Docs
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {currentCreds.length > 0 && <div style={{ borderTop: '1px solid #EFF2F5', marginTop: 12, marginBottom: 12 }} />}
          </>
        )}

        {currentCreds.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4A6070', marginBottom: 8 }}>
            <CheckCircle size={13} color="#2A9D8F" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>{getName(c)}</div>
            {c.expiry_date && (
              <div style={{ fontSize: 11, color: '#8FA0B0' }}>
                Exp. {new Date(c.expiry_date).toLocaleDateString()}
              </div>
            )}
            {c.document_url && (
              <button
                onClick={() => setDocViewer({ credId: c.id, credName: getName(c), documentUrl: c.document_url })}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', background: '#E6F4F4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#0E7C7B', flexShrink: 0 }}
              >
                <FileText size={11}/> Docs
              </button>
            )}
          </div>
        ))}

        {credentials.length === 0 && (
          <p style={{ color: '#8FA0B0', fontSize: 13 }}>No credentials on file.</p>
        )}
      </div>

      {docViewer && (
        <CredentialDocViewer
          credentialId={docViewer.credId}
          credentialName={docViewer.credName}
          staffName={memberName}
          documentUrl={docViewer.documentUrl}
          viewerRole={viewerRole}
          isOpen={true}
          onClose={() => setDocViewer(null)}
        />
      )}
    </>
  )
}
