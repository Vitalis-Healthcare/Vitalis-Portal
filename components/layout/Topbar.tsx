'use client'
import { Bell } from 'lucide-react'
import { Profile } from '@/types'

export default function Topbar({ profile }: { profile: Profile | null }) {
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()
    : 'VH'

  return (
    <header style={{
      background: '#1A2E44', padding: '0 32px', height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)', zIndex: 100,
      position: 'sticky', top: 0, flexShrink: 0
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:36, height:36, background:'linear-gradient(135deg,#0E7C7B,#F4A261)',
          borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:16, fontWeight:900, color:'#fff'
        }}>V+</div>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>Vitalis Portal</div>
          <div style={{ fontSize:10, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'1.2px' }}>Staff & Compliance Hub</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:16, alignItems:'center' }}>
        <button style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:8, padding:'8px', cursor:'pointer', color:'#D1D9E0' }}>
          <Bell size={18} />
        </button>
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          background:'rgba(255,255,255,0.08)', borderRadius:24, padding:'6px 14px 6px 8px'
        }}>
          <div style={{
            width:30, height:30, borderRadius:'50%',
            background:'linear-gradient(135deg,#0E7C7B,#F4A261)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, fontWeight:700, color:'#fff'
          }}>{initials}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{profile?.full_name || 'Staff Member'}</div>
            <div style={{ fontSize:11, color:'#8FA0B0', textTransform:'capitalize' }}>{profile?.role || 'caregiver'}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
