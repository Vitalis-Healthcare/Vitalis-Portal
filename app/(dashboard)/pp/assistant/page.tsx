import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PPAIChat from '../PPAIChat'

export default async function PolicyAssistantPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const ppRole =
    profile?.role === 'admin'      ? 'Administrator' :
    profile?.role === 'supervisor' ? 'Director of Nursing' :
    profile?.role === 'caregiver'  ? 'CNA' : 'All Staff'

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Back */}
      <div style={{ marginBottom: 16 }}>
        <Link href="/pp" style={{ color: '#8FA0B0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <ArrowLeft size={13} /> Policies & Procedures
        </Link>
      </div>

      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2E44', margin: '0 0 4px' }}>
          🤖 Policy Assistant
        </h1>
        <p style={{ fontSize: 13, color: '#8FA0B0', margin: 0 }}>
          Ask anything about Vitalis policies and procedures. I'll find the answer and link you to the exact document.
        </p>
      </div>

      {/* Chat */}
      <PPAIChat
        userId={user.id}
        userRole={ppRole}
        userName={profile?.full_name || 'there'}
      />

      {/* Footer hint */}
      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <Link href="/pp" style={{ fontSize: 12, color: '#8FA0B0', textDecoration: 'none' }}>
          ← Browse all policies
        </Link>
      </div>
    </div>
  )
}
