'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: 8,
        background: '#fff', color: '#4A6070', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
      }}
    >
      🖨 Print
    </button>
  )
}
