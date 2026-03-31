'use client'
// components/layout/Sidebar.tsx
// Collapsible module groups. Each group remembers open/closed state in localStorage.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, GraduationCap, BadgeCheck, Users, BarChart3,
  Settings, UserCheck, ClipboardList, LogOut, UserCog,
  ShieldCheck, AlertTriangle, Sparkles, Target, Handshake,
  SlidersHorizontal, ChevronDown, ChevronRight, TrendingUp,
  Building2, BookUser, Map, Activity, Mail, Brain, FileText,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavItem  { href: string; label: string; icon: any }
interface NavGroup { type: 'group'; id: string; label: string; emoji: string; items: NavItem[] }
interface NavFlat  { type: 'flat';  label: string; items: NavItem[] }
type NavSection = NavGroup | NavFlat

const adminNav: NavSection[] = [
  {
    type: 'flat', label: 'MAIN',
    items: [
      { href: '/dashboard', label: 'Overview',    icon: LayoutDashboard },
      { href: '/vita',      label: 'Ask Vita ✨', icon: Sparkles },
    ],
  },
  {
    type: 'group', id: 'compliance', label: 'Compliance', emoji: '🛡️',
    items: [
      { href: '/lms', label: 'Training Programmes',    icon: GraduationCap },
      { href: '/pp',  label: 'Policies & Procedures',  icon: ShieldCheck },
      { href: '/ep',  label: 'Emergency Preparedness', icon: AlertTriangle },
    ],
  },
  {
    type: 'group', id: 'workforce', label: 'Workforce', emoji: '👥',
    items: [
      { href: '/staff',       label: 'Caregiver Directory',  icon: Users },
      { href: '/credentials', label: 'Credentials',          icon: BadgeCheck },
      { href: '/appraisals',  label: 'Appraisals',           icon: ClipboardList },
      { href: '/references',  label: 'References',           icon: UserCheck },
      { href: '/reports',     label: 'Reports',              icon: BarChart3 },
    ],
  },
  {
    type: 'group', id: 'leads', label: 'Leads & Pipeline', emoji: '🎯',
    items: [
      { href: '/leads',                  label: 'Leads & Pipeline',  icon: Target },
      { href: '/leads/referral-sources', label: 'Referral Sources',  icon: Handshake },
      { href: '/leads/settings',         label: 'Pipeline Settings', icon: SlidersHorizontal },
    ],
  },
  {
    type: 'group', id: 'marketing', label: '52 Weeks Marketing', emoji: '📈',
    items: [
      { href: '/marketing',                   label: 'Overview',             icon: TrendingUp },
      { href: '/marketing/influence-centers', label: 'Influence Centers',    icon: Building2 },
      { href: '/marketing/contacts',          label: 'Contacts & Referrers', icon: BookUser },
      { href: '/marketing/route-builder',     label: 'Route Builder',        icon: Map },
      { href: '/marketing/activity-logger',   label: 'Activity Logger',      icon: Activity },
      { href: '/marketing/email-analytics',   label: 'Email Analytics',      icon: Mail },
      { href: '/marketing/intelligence',      label: 'Intelligence',         icon: Brain },
      { href: '/marketing/report',            label: 'Generate Report',      icon: FileText },
    ],
  },
  {
    type: 'flat', label: 'ADMIN',
    items: [
      { href: '/users',    label: 'User Management', icon: UserCog },
      { href: '/settings', label: 'Settings',        icon: Settings },
    ],
  },
]

const staffNav: NavSection[] = [
  {
    type: 'flat', label: 'MAIN',
    items: [
      { href: '/dashboard', label: 'Overview',    icon: LayoutDashboard },
      { href: '/vita',      label: 'Ask Vita ✨', icon: Sparkles },
    ],
  },
  {
    type: 'group', id: 'compliance', label: 'Compliance', emoji: '🛡️',
    items: [
      { href: '/lms',         label: 'Training Programmes',    icon: GraduationCap },
      { href: '/pp',          label: 'Policies & Procedures',  icon: ShieldCheck },
      { href: '/ep',          label: 'Emergency Preparedness', icon: AlertTriangle },
      { href: '/credentials', label: 'Credentials',            icon: BadgeCheck },
    ],
  },
  {
    type: 'group', id: 'workforce', label: 'Workforce', emoji: '👥',
    items: [
      { href: '/staff',       label: 'Caregiver Directory',  icon: Users },
      { href: '/credentials', label: 'Credentials',          icon: BadgeCheck },
      { href: '/appraisals',  label: 'Appraisals',           icon: ClipboardList },
      { href: '/references',  label: 'References',           icon: UserCheck },
      { href: '/users',       label: 'Caregiver Management', icon: UserCog },
      { href: '/reports',     label: 'Reports',              icon: BarChart3 },
    ],
  },
]

const caregiverNav: NavSection[] = [
  {
    type: 'flat', label: 'MY PORTAL',
    items: [
      { href: '/dashboard',   label: 'Overview',       icon: LayoutDashboard },
      { href: '/vita',        label: 'Ask Vita ✨',    icon: Sparkles },
      { href: '/lms',         label: 'My Training',    icon: GraduationCap },
      { href: '/pp',          label: 'Policies',       icon: ShieldCheck },
      { href: '/credentials', label: 'My Credentials', icon: BadgeCheck },
      { href: '/references',  label: 'My References',  icon: UserCheck },
    ],
  },
]

function NavGroupSection({ group, pathname, onNavigate }: { group: NavGroup; pathname: string; onNavigate?: () => void }) {
  const hasActive = group.items.some(item =>
    pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  )
  const storageKey = `sidebar_group_${group.id}`
  const [open, setOpen] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      setOpen(stored !== null ? JSON.parse(stored) : hasActive)
    } catch {
      setOpen(hasActive)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hasActive && hydrated) {
      setOpen(true)
      try { localStorage.setItem(storageKey, 'true') } catch {}
    }
  }, [hasActive, hydrated])

  const toggle = () => {
    const next = !open
    setOpen(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
  }

  return (
    <div style={{ marginBottom: 2 }}>
      <button onClick={toggle} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '6px 14px 6px 12px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginTop: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 13 }}>{group.emoji}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.8px',
            textTransform: 'uppercase', color: open ? '#0A5C5B' : '#8FA0B0',
          }}>
            {group.label}
          </span>
        </div>
        {open ? <ChevronDown size={12} color="#8FA0B0" /> : <ChevronRight size={12} color="#B0BEC5" />}
      </button>

      {open && (
        <div style={{ paddingBottom: 2 }}>
          {group.items.map(item => {
            const active = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={onNavigate}>
                <div style={{
                  margin: '1px 8px', padding: '7px 10px 7px 28px', borderRadius: 7,
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: active ? '#E6F4F4' : 'transparent',
                  color: active ? '#0A5C5B' : '#4A6070',
                  fontWeight: active ? 600 : 400, fontSize: 13,
                  border: active ? '1px solid #0E7C7B22' : '1px solid transparent',
                  cursor: 'pointer', minHeight: 36,
                }}>
                  <Icon size={14} />
                  <span>{item.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FlatSection({ section, pathname, onNavigate }: { section: NavFlat; pathname: string; onNavigate?: () => void }) {
  return (
    <div>
      <div style={{
        padding: '10px 20px 5px', fontSize: 10, fontWeight: 700,
        color: '#8FA0B0', letterSpacing: '1.4px', textTransform: 'uppercase',
      }}>
        {section.label}
      </div>
      {section.items.map(item => {
        const active = pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={onNavigate}>
            <div style={{
              margin: '1px 8px', padding: '9px 12px', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 10,
              background: active ? '#E6F4F4' : 'transparent',
              color: active ? '#0A5C5B' : '#4A6070',
              fontWeight: active ? 600 : 400, fontSize: 14,
              border: active ? '1px solid #0E7C7B22' : '1px solid transparent',
              cursor: 'pointer', minHeight: 42,
            }}>
              <Icon size={15} />
              <span>{item.label}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default function Sidebar({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const nav =
    role === 'admin' || role === 'supervisor' || role === 'staff' ? adminNav : caregiverNav

  const roleLabel =
    role === 'admin'      ? 'Admin' :
    role === 'supervisor' ? 'Supervisor' :
    role === 'staff'      ? 'Staff' : 'Caregiver'

  return (
    <aside style={{
      width: 224, background: '#fff', borderRight: '1px solid #D1D9E0',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      height: '100%', minHeight: '100vh', overflowY: 'auto',
    }}>
      <div style={{ padding: '16px 0', flex: 1 }}>
        {nav.map((section, i) => {
          // Hide the ADMIN flat section from supervisors/staff — they get Caregiver Management in Workforce instead
          if (section.type === 'flat' && (section as NavFlat).label === 'ADMIN' && role !== 'admin') return null
          return section.type === 'group'
            ? <NavGroupSection key={(section as NavGroup).id} group={section as NavGroup} pathname={pathname} onNavigate={onNavigate} />
            : <FlatSection key={i} section={section as NavFlat} pathname={pathname} onNavigate={onNavigate} />
        })}
      </div>
      <div style={{ padding: '12px 8px', borderTop: '1px solid #EFF2F5' }}>
        <div style={{
          margin: '0 4px 8px', padding: '5px 10px', borderRadius: 6,
          background: '#F8FAFB', fontSize: 11, color: '#8FA0B0',
          fontWeight: 600, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.8px',
        }}>
          {roleLabel}
        </div>
        <button onClick={handleSignOut} style={{
          width: '100%', padding: '10px 12px', borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'transparent', border: 'none',
          color: '#8FA0B0', fontSize: 14, cursor: 'pointer', minHeight: 44,
        }}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
