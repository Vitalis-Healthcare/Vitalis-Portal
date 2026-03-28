'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Mode = 'magic' | 'password' | 'reset' | 'pending' | 'magic_sent'

export default function LoginPage() {
  const [mode, setMode]               = useState<Mode>('magic')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]             = useState('')
  const [successMsg, setSuccessMsg]   = useState('')
  const router  = useRouter()
  const supabase = createClient()

  const reset = () => { setError(''); setSuccessMsg('') }

  // ── Google SSO ────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoading(true); reset()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: 'vitalishealthcare.com' },
      },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  // ── Magic link ────────────────────────────────────────────────────────────
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setLoading(true); reset()
    try {
      const res = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'pending') { setMode('pending'); setLoading(false); return }
        if (data.error === 'rejected') {
          setError('Your account request was not approved. Please contact your supervisor.')
          setLoading(false); return
        }
        setError(data.error || 'Failed to send sign-in link. Please try again.')
      } else {
        setMode('magic_sent')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    }
    setLoading(false)
  }

  // ── Password sign-in ──────────────────────────────────────────────────────
  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); reset()
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Incorrect email or password.' : error.message)
    } else {
      const { data: profile } = await supabase
        .from('profiles').select('status').eq('id', signInData.user.id).single()
      if (profile?.status === 'pending') {
        await supabase.auth.signOut(); setMode('pending')
      } else if (profile?.status === 'rejected') {
        await supabase.auth.signOut()
        setError('Your account request was not approved. Please contact your supervisor.')
      } else {
        router.push('/dashboard')
      }
    }
    setLoading(false)
  }

  // ── Forgot password ───────────────────────────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); reset()
    try {
      const res = await fetch('/api/auth/send-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Failed to send reset email.')
      else setSuccessMsg('Password reset link sent! Check your email.')
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: '1.5px solid #D1D9E0', fontSize: 14, outline: 'none',
    fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 6,
  }
  const primaryBtn: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    background: 'linear-gradient(135deg, #0E7C7B, #1A9B87)',
    color: '#fff', border: 'none', borderRadius: 9,
    fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
    opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
  }
  const ghostBtn: React.CSSProperties = {
    width: '100%', padding: '11px 16px',
    background: 'transparent', color: '#8FA0B0',
    border: '1.5px solid #E2E8F0', borderRadius: 9,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A2E44 0%, #0E4A4A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: '#fff',
        borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{ background: '#1A2E44', padding: '32px 32px 28px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #0E7C7B, #F4A261)',
            borderRadius: 14, display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff',
            marginBottom: 14,
          }}>V+</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Vitalis Portal</h1>
          <p style={{ fontSize: 12, color: '#8FA0B0', marginTop: 4, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Staff & Compliance Hub
          </p>
        </div>

        <div style={{ padding: '28px 32px 32px' }}>

          {/* ── Google SSO ── */}
          <button onClick={handleGoogle} disabled={googleLoading} style={{
            width: '100%', padding: '12px 16px', borderRadius: 10,
            border: '1.5px solid #D1D9E0', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            fontSize: 14, fontWeight: 600, color: '#1A2E44',
            cursor: googleLoading ? 'wait' : 'pointer', opacity: googleLoading ? 0.7 : 1,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 6,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.29H1.82v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.51 10.52A4.8 4.8 0 0 1 4.26 9c0-.53.09-1.04.25-1.52V5.41H1.82a8 8 0 0 0 0 7.18l2.69-2.07z"/>
              <path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.82 5.4L4.51 7.48C5.14 5.59 6.9 3.58 8.98 3.58z"/>
            </svg>
            {googleLoading ? 'Redirecting…' : 'Sign in with Google Workspace'}
          </button>
          <div style={{ textAlign: 'center', fontSize: 11, color: '#8FA0B0', marginBottom: 20, fontWeight: 500 }}>
            For office staff with a @vitalishealthcare.com Google account
          </div>

          {/* ── Divider ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#EFF2F5' }}/>
            <span style={{ fontSize: 12, color: '#8FA0B0', fontWeight: 500 }}>for caregivers & aides</span>
            <div style={{ flex: 1, height: 1, background: '#EFF2F5' }}/>
          </div>

          {/* ── Mode tab toggle (Magic Link / Password) ── */}
          {(mode === 'magic' || mode === 'password') && (
            <div style={{
              display: 'flex', background: '#F8FAFB', borderRadius: 10,
              padding: 4, marginBottom: 22, border: '1px solid #EFF2F5',
            }}>
              {(['magic', 'password'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); reset() }}
                  style={{
                    flex: 1, padding: '9px 0', border: 'none', borderRadius: 8,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: mode === m ? '#fff' : 'transparent',
                    color: mode === m ? '#0E7C7B' : '#8FA0B0',
                    boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                  }}
                >
                  {m === 'magic' ? '✨ Magic Link' : '🔑 Password'}
                </button>
              ))}
            </div>
          )}

          {/* ── Pending approval ── */}
          {mode === 'pending' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1A2E44', marginBottom: 8 }}>
                Account Pending Approval
              </h3>
              <p style={{ color: '#8FA0B0', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                Your account has been submitted and is awaiting administrator approval.
                You will receive an email once access is granted.
              </p>
              <button onClick={() => { setMode('magic'); reset() }}
                style={{ background: 'none', border: 'none', color: '#0E7C7B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                ← Back to Sign In
              </button>
            </div>
          )}

          {/* ── Magic link sent confirmation ── */}
          {mode === 'magic_sent' && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #E6F6F4, #D1FAF0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, margin: '0 auto 16px',
              }}>
                📬
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A2E44', margin: '0 0 10px' }}>
                Check your email!
              </h3>
              <p style={{ color: '#4A6070', fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
                We sent a sign-in link to
              </p>
              <div style={{
                background: '#F8FAFB', border: '1px solid #E2E8F0',
                borderRadius: 8, padding: '10px 16px', marginBottom: 20,
                fontSize: 14, fontWeight: 700, color: '#1A2E44',
              }}>
                {email}
              </div>
              <p style={{ color: '#8FA0B0', fontSize: 12, lineHeight: 1.7, marginBottom: 20 }}>
                Tap the <strong style={{ color: '#0E7C7B' }}>Sign In to Vitalis Portal</strong> button in the email.
                The link expires in <strong>1 hour</strong>.
              </p>
              <button
                onClick={() => { setMode('magic'); setEmail(''); reset() }}
                style={{ background: 'none', border: 'none', color: '#0E7C7B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                ← Use a different email
              </button>
              <div style={{ marginTop: 14, fontSize: 12, color: '#CBD5E0' }}>
                Didn't get it? Check your spam folder or{' '}
                <button
                  onClick={() => setMode('magic')}
                  style={{ background: 'none', border: 'none', color: '#8FA0B0', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  try again
                </button>
              </div>
            </div>
          )}

          {/* ── Magic link form ── */}
          {mode === 'magic' && (
            <form onSubmit={handleMagicLink}>
              <div style={{ marginBottom: 6 }}>
                <label style={lbl}>Your Email Address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com" style={inp} autoComplete="email" autoFocus
                />
              </div>
              <p style={{ fontSize: 12, color: '#8FA0B0', margin: '0 0 18px', lineHeight: 1.5 }}>
                Enter the email address your supervisor registered you with. We'll send a one-tap sign-in link — no password needed.
              </p>
              {error && (
                <div style={{ background: '#FDE8E9', color: '#E63946', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} style={primaryBtn}>
                {loading ? 'Sending…' : '✨ Send My Sign-In Link'}
              </button>
            </form>
          )}

          {/* ── Password form ── */}
          {mode === 'password' && (
            <form onSubmit={handlePassword}>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com" style={inp} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={lbl}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••" style={inp} minLength={6} />
              </div>
              <div style={{ textAlign: 'right', marginBottom: 16 }}>
                <button type="button" onClick={() => { setMode('reset'); reset() }}
                  style={{ background: 'none', border: 'none', color: '#0E7C7B', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  Forgot password?
                </button>
              </div>
              {error && (
                <div style={{ background: '#FDE8E9', color: '#E63946', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} style={{ ...primaryBtn, background: '#0E7C7B' }}>
                {loading ? '…' : 'Sign In'}
              </button>
            </form>
          )}

          {/* ── Forgot password form ── */}
          {mode === 'reset' && (
            <form onSubmit={handleReset}>
              <p style={{ fontSize: 13, color: '#8FA0B0', marginBottom: 16, marginTop: 0 }}>
                Enter your email and we'll send a link to reset your password.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com" style={inp} />
              </div>
              {error && (
                <div style={{ background: '#FDE8E9', color: '#E63946', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                  {error}
                </div>
              )}
              {successMsg && (
                <div style={{ background: '#E6F6F4', color: '#2A9D8F', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                  {successMsg}
                </div>
              )}
              <button type="submit" disabled={loading} style={{ ...primaryBtn, background: '#0E7C7B' }}>
                {loading ? '…' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => { setMode('password'); reset() }}
                style={{ ...ghostBtn, marginTop: 10 }}>
                ← Back to Sign In
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#CBD5E0' }}>
            Vitalis Healthcare Services · Baltimore, Maryland
          </p>
        </div>
      </div>
    </div>
  )
}
