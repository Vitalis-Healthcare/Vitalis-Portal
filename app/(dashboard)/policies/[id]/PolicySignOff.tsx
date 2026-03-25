'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

interface Props {
  policyId: string; version: string; title: string;
  userId: string; alreadySigned: boolean; signedAt?: string;
}

export default function PolicySignOff({ policyId, version, title, userId, alreadySigned, signedAt }: Props) {
  const [confirmed, setConfirmed] = useState(false)
  const [signing, setSigning] = useState(false)
  const [done, setDone] = useState(alreadySigned)
  const supabase = createClient()
  const router = useRouter()

  const handleSign = async () => {
    if (!confirmed) { alert('Please tick the checkbox to confirm you have read this policy.'); return }
    setSigning(true)
    const { error } = await supabase.from('policy_acknowledgements').insert({
      policy_id: policyId, user_id: userId, version_signed: version
    })
    if (!error) {
      await supabase.from('audit_log').insert({
        user_id: userId, action: `Signed policy: ${title} ${version}`,
        entity_type: 'policy', entity_id: policyId
      })
      setDone(true)
      router.refresh()
    }
    setSigning(false)
  }

  if (done) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:12, color:'#2A9D8F' }}>
        <CheckCircle size={20}/>
        <div>
          <strong style={{ fontSize:14 }}>You have signed off on this policy.</strong>
          {signedAt && <div style={{ fontSize:12, color:'#8FA0B0' }}>Signed {new Date(signedAt).toLocaleString()}</div>}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 style={{ fontSize:15, fontWeight:700, color:'#1A2E44', marginBottom:12 }}>Acknowledgement Required</h3>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:16 }}>
        <input type="checkbox" id="ack_check" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}
          style={{ marginTop:3, accentColor:'#0E7C7B', width:16, height:16 }}/>
        <label htmlFor="ack_check" style={{ fontSize:14, color:'#4A6070', lineHeight:1.5, cursor:'pointer' }}>
          I confirm that I have read, understood, and agree to comply with this policy.
          I understand that this digital signature is legally binding and will be recorded
          with my name, date, and timestamp.
        </label>
      </div>
      <button onClick={handleSign} disabled={signing || !confirmed} style={{
        padding:'10px 24px', background: confirmed ? '#0E7C7B' : '#D1D9E0',
        color: confirmed ? '#fff' : '#8FA0B0', border:'none', borderRadius:8,
        fontSize:14, fontWeight:600, cursor: confirmed ? 'pointer' : 'not-allowed',
        transition:'all 0.2s'
      }}>
        {signing ? 'Signing…' : '✍️ Sign & Acknowledge Policy'}
      </button>
    </div>
  )
}
