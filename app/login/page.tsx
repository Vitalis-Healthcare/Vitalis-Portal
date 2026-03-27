'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'reset' | 'pending'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          hd: 'vitalishealthcare.com', // Vitalis Google Workspace domain
        },
      },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
    // If successful, Google redirects away automatically
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')

    {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : error.message)
      } else {
        // Check profile status before allowing access
        const { data: profile } = await supabase
          .from('profiles').select('status').eq('id', signInData.user.id).single()
        if (profile?.status === 'pending') {
          await supabase.auth.signOut()
          setMode('pending' as any)
        } else if (profile?.status === 'rejected') {
          await supabase.auth.signOut()
          setError('Your account request was not approved. Please contact your supervisor.')
        } else {
          router.push('/dashboard')
        }
      }
    }
    setLoading(false)
  }


  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccessMsg('')
    try {
      const res = await fetch('/api/auth/send-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send reset email. Please try again.')
      } else {
        setSuccessMsg('Password reset link sent! Check your email — it may take a minute to arrive.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #D1D9E0', fontSize: 14, outline: 'none',
    fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: '#4A6070',
    display: 'block', marginBottom: 6,
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
        {/* Header */}
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

          {/* Google SSO — PRIMARY */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 10,
              border: '1.5px solid #D1D9E0', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              fontSize: 14, fontWeight: 600, color: '#1A2E44',
              cursor: googleLoading ? 'wait' : 'pointer',
              opacity: googleLoading ? 0.7 : 1,
              transition: 'all 0.15s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              marginBottom: 20,
            }}
          >
            {/* Google G logo */}
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.29H1.82v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.51 10.52A4.8 4.8 0 0 1 4.26 9c0-.53.09-1.04.25-1.52V5.41H1.82a8 8 0 0 0 0 7.18l2.69-2.07z"/>
              <path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.82 5.4L4.51 7.48C5.14 5.59 6.9 3.58 8.98 3.58z"/>
            </svg>
            {googleLoading ? 'Redirecting to Google…' : 'Sign in with Google Workspace'}
          </button>
          <div style={{ textAlign: 'center', fontSize: 11, color: '#8FA0B0', marginTop: -14, marginBottom: 6, fontWeight: 500 }}>
            for Vitalis Staff
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#EFF2F5' }}/>
            <span style={{ fontSize: 12, color: '#8FA0B0', fontWeight: 500 }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: '#EFF2F5' }}/>
          </div>



          {/* Awaiting approval screen */}
          {(mode as string) === 'pending' ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1A2E44', marginBottom: 8 }}>
                Account Pending Approval
              </h3>
              <p style={{ color: '#8FA0B0', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                Your account request has been submitted.<br/>
                You will receive an email once an administrator approves your access.
              </p>
              <button
                onClick={() => { setMode('signin'); setError(''); setSuccessMsg('') }}
                style={{ background: 'none', border: 'none', color: '#0E7C7B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                ← Back to Sign In
              </button>
            </div>
          ) : null}

          {/* Forgot password view */}
          {mode === 'reset' ? (
            <form onSubmit={handleResetPassword}>
              <p style={{ fontSize: 13, color: '#8FA0B0', marginBottom: 16, marginTop: 0 }}>
                Enter your email address and we’ll send you a link to reset your password.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@vitalishealthcare.com" style={inp}/>
              </div>
              {error && <div style={{ background: '#FDE8E9', color: '#E63946', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
              {successMsg && <div style={{ background: '#E6F6F4', color: '#2A9D8F', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{successMsg}</div>}
              <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? '…' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => { setMode('signin'); setError(''); setSuccessMsg('') }}
                style={{ width: '100%', marginTop: 10, padding: '10px 0', background: 'none', border: 'none', color: '#8FA0B0', fontSize: 13, cursor: 'pointer' }}>
                ← Back to Sign In
              </button>
            </form>
          ) : (
          <form onSubmit={handleEmailAuth}>
            {mode === 'signup' && (
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} required
                  placeholder="e.g. Amara Nwosu" style={inp}/>
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@vitalishealthcare.com" style={inp}/>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••" style={inp} minLength={6}/>
            </div>
            {mode === 'signin' && (
              <div style={{ textAlign: 'right', marginBottom: 16 }}>
                <button type="button" onClick={() => { setMode('reset'); setError(''); setSuccessMsg('') }}
                  style={{ background: 'none', border: 'none', color: '#0E7C7B', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  Forgot password?
                </button>
              </div>
            )}
            {mode === 'signup' && <div style={{ marginBottom: 20 }}/>}

            {error && <div style={{ background: '#FDE8E9', color: '#E63946', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
            {successMsg && <div style={{ background: '#E6F6F4', color: '#2A9D8F', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{successMsg}</div>}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 12, background: '#0E7C7B', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? '…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#8FA0B0' }}>
            Vitalis Healthcare Services · Baltimore, Maryland
          </p>
        </div>
      </div>
    </div>
  )
}
