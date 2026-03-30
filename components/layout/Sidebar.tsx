'use client'
// components/layout/Sidebar.tsx
// Accepts onNavigate() — called when a nav item is tapped.
// LayoutShell uses this to close the mobile drawer after navigation.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, GraduationCap, BadgeCheck, Users, BarChart3,
  Settings, UserCheck, ClipboardList, LogOut, UserCog,
  ShieldCheck, AlertTriangle, Sparkles, Target, Handshake, SlidersHorizontal,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const adminSections = [
  { label: 'MAIN', items: [{ href: '/dashboard', label: 'Overview', icon: LayoutDashboard }] },
  { label: 'MODULES', items: [
    { href: '/lms',         label: 'Training Programmes',    icon: GraduationCap },
    { href: '/pp',          label: 'Policies & Procedures',  icon: ShieldCheck },
    { href: '/vita',  label: 'Ask Vita ✨',  icon: Sparkles },
    { href: '/ep',          label: 'Emergency Preparedness', icon: AlertTriangle },
    { href: '/credentials', label: 'Credentials',            icon: BadgeCheck },
    { href: '/references',  label: 'References',             icon: UserCheck },
    { href: '/appraisals',  label: 'Appraisals',             icon: ClipboardList },
    { href: '/staff',       label: 'Staff Portal',           icon: Users },
    { href: '/leads',               label: 'Leads & Pipeline',    icon: Target },
    { href: '/leads/referral-sources',  label: 'Referral Sources',    icon: Handshake },
    { href: '/leads/settings',          label: 'Pipeline Settings',   icon: SlidersHorizontal },
  ]},
  { label: 'ADMIN', items: [
    { href: '/users',    label: 'User Management', icon: UserCog },
    { href: '/reports',  label: 'Reports',         icon: BarChart3 },
    { href: '/settings', label: 'Settings',        icon: Settings },
  ]},
]

const staffSections = [
  { label: 'MAIN', items: [{ href: '/dashboard', label: 'Overview', icon: LayoutDashboard }] },
  { label: 'MODULES', items: [
    { href: '/lms',         label: 'Training Programmes',    icon: GraduationCap },
    { href: '/pp',          label: 'Policies & Procedures',  icon: ShieldCheck },
    { href: '/vita',  label: 'Ask Vita ✨',  icon: Sparkles },
    { href: '/ep',          label: 'Emergency Preparedness', icon: AlertTriangle },
    { href: '/credentials', label: 'Credentials',            icon: BadgeCheck },
  ]},
]

const caregiverSections = [
  { label: 'MAIN', items: [{ href: '/dashboard', label: 'Overview', icon: LayoutDashboard }] },
  { label: 'MY PORTAL', items: [
    { href: '/lms',         label: 'My Training',    icon: GraduationCap },
    { href: '/pp',          label: 'Policies',       icon: ShieldCheck },
    { href: '/vita',  label: 'Ask Vita ✨',  icon: Sparkles },
    { href: '/credentials', label: 'My Credentials', icon: BadgeCheck },
    { href: '/references',  label: 'My References',  icon: UserCheck },
  ]},
]

export default function Sidebar({
  role,
  onNavigate,
}: {
  role: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navSections =
    role === 'admin' || role === 'supervisor' ? adminSections :
    role === 'staff'                           ? staffSections :
                                                 caregiverSections

  const roleLabel =
    role === 'admin'      ? 'Admin' :
    role === 'supervisor' ? 'Supervisor' :
    role === 'staff'      ? 'Staff' : 'Caregiver'

  return (
    <aside style={{
      width: 220, background: '#fff', borderRight: '1px solid #D1D9E0',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      height: '100%', minHeight: '100vh', overflowY: 'auto',
    }}>
      <div style={{ padding: '20px 0', flex: 1 }}>
        {navSections.map((section) => (
          <div key={section.label}>
            <div style={{
              padding: '12px 20px 6px', fontSize: 10, fontWeight: 700,
              color: '#8FA0B0', letterSpacing: '1.4px', textTransform: 'uppercase',
            }}>
              {section.label}
            </div>
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{ textDecoration: 'none' }}
                  onClick={onNavigate}
                >
                  <div style={{
                    margin: '1px 8px', padding: '10px 12px', borderRadius: 8,
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: active ? '#E6F4F4' : 'transparent',
                    color: active ? '#0A5C5B' : '#4A6070',
                    fontWeight: active ? 600 : 400, fontSize: 14,
                    border: active ? '1px solid #0E7C7B22' : '1px solid transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                    // Larger touch target on mobile
                    minHeight: 44,
                  }}>
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 8px', borderTop: '1px solid #EFF2F5' }}>
        <div style={{
          margin: '0 4px 8px', padding: '5px 10px', borderRadius: 6,
          background: '#F8FAFB', fontSize: 11, color: '#8FA0B0',
          fontWeight: 600, textAlign: 'center', textTransform: 'uppercase',
          letterSpacing: '0.8px',
        }}>
          {roleLabel}
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'transparent', border: 'none',
            color: '#8FA0B0', fontSize: 14, cursor: 'pointer',
            minHeight: 44,
          }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
