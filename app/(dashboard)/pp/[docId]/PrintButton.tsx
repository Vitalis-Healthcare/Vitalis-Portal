'use client'
// app/(dashboard)/pp/[docId]/PrintButton.tsx
// Opens the policy print route in a new tab.
// The print route returns a clean standalone HTML document — no sidebar, no topbar.

export default function PrintButton({ docId }: { docId: string }) {
  return (
    <button
      onClick={() => window.open(`/api/pp/print/${docId}`, '_blank')}
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
