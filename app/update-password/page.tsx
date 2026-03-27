'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // Wait for Supabase to exchange the token from the URL hash into a session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (session) setSessionReady(true)
      }
    })
    // Also check if session already exists (e.g. user navigated back)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #D1D9E0', fontSize: 14, outline: 'none',
    fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 6,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A2E44 0%, #0E4A4A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #0E7C7B, #2A9D8F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: 24,
          }}>🔑</div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 }}>Set New Password</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 6 }}>
            Vitalis Healthcare · Staff Portal
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A2E44', marginBottom: 8 }}>Password Updated</h3>
              <p style={{ color: '#8FA0B0', fontSize: 14 }}>Redirecting you to the dashboard…</p>
            </div>
          ) : !sessionReady ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>⏳</div>
              <p style={{ color: '#8FA0B0', fontSize: 14 }}>Verifying your link…</p>
              <p style={{ color: '#C0CCD4', fontSize: 12, marginTop: 8 }}>
                If this takes more than 10 seconds, your link may have expired.<br/>
                <a href="/login" style={{ color: '#0E7C7B' }}>Request a new one</a>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 characters" required style={inp} autoFocus />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password" required style={inp} />
              </div>
              {error && (
                <div style={{ background: '#FDE8E9', color: '#E63946', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: 12, background: '#0E7C7B', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
              }}>
                {loading ? '…' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          Vitalis Healthcare Services · Baltimore, Maryland
        </p>
      </div>
    </div>
  )
}
