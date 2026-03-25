'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, GraduationCap, FileText,
  BadgeCheck, Users, BarChart3, Settings,
  LogOut, UserCog
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navSections = [
  {
    label: 'MAIN',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    ]
  },
  {
    label: 'MODULES',
    items: [
      { href: '/lms', label: 'Training & LMS', icon: GraduationCap },
      { href: '/policies', label: 'Policies & Procedures', icon: FileText },
      { href: '/credentials', label: 'Credentials', icon: BadgeCheck },
      { href: '/staff', label: 'Staff Portal', icon: Users },
    ]
  },
  {
    label: 'ADMIN',
    items: [
      { href: '/users', label: 'User Management', icon: UserCog },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
      { href: '/settings', label: 'Settings', icon: Settings },
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside style={{
      width: 220, background: '#fff', borderRight: '1px solid #D1D9E0',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      height: '100vh', position: 'sticky', top: 0, overflowY: 'auto'
    }}>
      <div style={{ padding: '20px 0', flex: 1 }}>
        {navSections.map((section) => (
          <div key={section.label}>
            <div style={{
              padding: '12px 20px 6px', fontSize: 10, fontWeight: 700,
              color: '#8FA0B0', letterSpacing: '1.4px', textTransform: 'uppercase'
            }}>
              {section.label}
            </div>
            {section.items.map((item) => {
              const active = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    margin: '1px 8px', padding: '9px 12px', borderRadius: 8,
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: active ? '#E6F4F4' : 'transparent',
                    color: active ? '#0A5C5B' : '#4A6070',
                    fontWeight: active ? 600 : 400, fontSize: 14,
                    border: active ? '1px solid #0E7C7B22' : '1px solid transparent',
                    cursor: 'pointer', transition: 'all 0.15s'
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
        <button onClick={handleSignOut} style={{
          width: '100%', padding: '9px 12px', borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'transparent', border: 'none',
          color: '#8FA0B0', fontSize: 14, cursor: 'pointer'
        }}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
