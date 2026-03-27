'use client'
// components/layout/LayoutShell.tsx
// Client wrapper for the dashboard layout.
// Manages mobile sidebar open/close state.
// layout.tsx (server) renders this and passes children through.

import { useState, useEffect } from 'react'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import type { Profile } from '@/types'

export default function LayoutShell({
  profile,
  role,
  children,
}: {
  profile: Profile | null
  role: string
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on mount and on resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close sidebar when resizing to desktop
  useEffect(() => {
    if (!isMobile) setSidebarOpen(false)
  }, [isMobile])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isMobile, sidebarOpen])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar
        profile={profile}
        onMenuToggle={() => setSidebarOpen((o) => !o)}
        showMenuButton={isMobile}
      />

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>

        {/* Mobile backdrop */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              zIndex: 200, top: 64,
            }}
          />
        )}

        {/* Sidebar — desktop: static, mobile: fixed drawer */}
        <div style={
          isMobile
            ? {
                position: 'fixed', top: 64, left: 0, bottom: 0, zIndex: 300,
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.25s ease',
                width: 260,
                boxShadow: sidebarOpen ? '4px 0 20px rgba(0,0,0,0.2)' : 'none',
              }
            : {}
        }>
          <Sidebar role={role} onNavigate={() => setSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <main style={{
          flex: 1,
          padding: isMobile ? '16px 14px' : 32,
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: 'calc(100vh - 64px)',
          // On mobile, sidebar doesn't push content — it overlays
          marginLeft: 0,
          minWidth: 0,   // prevent flex blowout
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
