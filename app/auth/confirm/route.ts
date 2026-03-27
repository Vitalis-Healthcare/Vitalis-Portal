// app/auth/confirm/route.ts
// Server-side token verification for password recovery links.
// Called when user clicks the invite or reset email link.
//
// Flow:
//   Email link → /auth/confirm?token_hash=XXX&type=recovery
//   → verifyOtp()  (server-side, sets session cookie)
//   → redirect to /update-password
//   → user sets password with valid session ✓
//
// This avoids hash fragments entirely. Token exchange on the server.

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type       = (searchParams.get('type') ?? 'recovery') as EmailOtpType
  const next       = searchParams.get('next') ?? '/update-password'

  if (token_hash) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })

    if (!error) {
      // Session cookie set — redirect to the password update page
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('[auth/confirm] verifyOtp error:', error.message)
    // Token invalid or expired — redirect to login with message
    return NextResponse.redirect(
      `${origin}/login?error=link_expired`
    )
  }

  // No token — redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
