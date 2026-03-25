'use client'
import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

interface Props {
  docId: string
  docVersion: string
  ackState: 'acknowledged' | 'required' | 'not-applicable'
  acknowledgedAt: string | null
  userId: string
  userRole: string
}

export default function PolicyAcknowledgeButton({
  docId, docVersion, ackState: initialState, acknowledgedAt, userId, userRole
}: Props) {
  const [state, setState] = useState(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (state === 'not-applicable') return null

  if (state === 'acknowledged') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '9px 16px', borderRadius: 8,
        background: '#E6F6F4', color: '#2A9D8F',
        fontSize: 13, fontWeight: 700
      }}>
        <CheckCircle size={15} />
        Acknowledged
        {acknowledgedAt && (
          <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8, marginLeft: 4 }}>
            {new Date(acknowledgedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    )
  }

  const handleAcknowledge = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pp/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId,
          docVersion,
          timestamp: new Date().toISOString()
        })
      })
      if (res.ok) {
        setState('acknowledged')
      } else {
        const json = await res.json().catch(() => ({}))
        setError(json.error || 'Failed to acknowledge. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleAcknowledge}
        disabled={loading}
        style={{
          padding: '9px 20px', borderRadius: 8, border: 'none',
          background: loading ? '#CBD5E0' : '#0B6B5C',
          color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 7,
          transition: 'background 0.2s'
        }}
      >
        {loading ? (
          <>
            <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
            Submitting…
          </>
        ) : (
          <>✓ Acknowledge reading</>
        )}
      </button>
      {error && (
        <div style={{ fontSize: 12, color: '#E63946', marginTop: 6 }}>{error}</div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
