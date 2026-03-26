import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    // After Google SSO: if the user signed in with a @vitalishealthcare.com account,
    // ensure their role is at least 'staff'. Never downgrade an existing supervisor/admin.
    if (session?.user?.email?.toLowerCase().endsWith('@vitalishealthcare.com')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      // Only upgrade caregiver → staff, never touch supervisor or admin
      if (profile?.role === 'caregiver' || !profile?.role) {
        await supabase
          .from('profiles')
          .update({ role: 'staff' })
          .eq('id', session.user.id)
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
