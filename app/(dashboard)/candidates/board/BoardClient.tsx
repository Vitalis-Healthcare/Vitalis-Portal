'use client'
// app/(dashboard)/candidates/board/BoardClient.tsx
//
// Inline styles throughout, matching the rest of the portal. The visual
// language deliberately mirrors the Credentials board — sticky first column,
// centred marks, small uppercase headers — because staff already know how to
// read that grid.
//
// What differs is that these columns are a SEQUENCE. How far right the marks
// reach is progress, and the gap where they stop is the problem.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Clock, UserCheck, Users } from 'lucide-react'
import type { TrackRow, MarkState, Owner } from '@/lib/onboarding/track-board'

const C = {
  navy: '#1A2E44', teal: '#0A5C5B', tealBr: '#0E7C7B',
  gray: '#4A6070', faint: '#8FA0B0', line: '#EFF2F5', edge: '#E2E8F0',
  amber: '#B26A00', amberBg: '#FEF3E2',
  red: '#9B3B3B', redBg: '#F4EBEB',
  green: '#1B7A43', greenBg: '#E6F6EC',
  purple: '#6B3FA0', purpleBg: '#F0E9FB',
}

const MARK: Record<MarkState, { bg: string; fg: string; glyph: string }> = {
  done:    { bg: C.greenBg,  fg: C.green,  glyph: '\u2713' },
  partial: { bg: C.amberBg,  fg: C.amber,  glyph: '\u25D0' },
  waived:  { bg: '#EEF2FF',  fg: '#3F4E9B', glyph: 'W' },
  waiting: { bg: C.purpleBg, fg: C.purple, glyph: '\u2026' },
  overdue: { bg: C.redBg,    fg: C.red,    glyph: '!' },
  none:    { bg: 'transparent', fg: '#D6DDE4', glyph: '\u25CB' },
}

const OWNER_LABEL: Record<Owner, string> = {
  candidate: 'With them',
  staff: 'With you',
  admin: 'With an admin',
  done: 'Complete',
  closed: 'Closed',
}

function Mark({ state, detail }: { state: MarkState; detail: string }) {
  const m = MARK[state]
  return (
    <span title={detail} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 24, height: 24, borderRadius: '50%',
      background: m.bg, color: m.fg,
      fontSize: state === 'waived' ? 11 : 13, fontWeight: 800, cursor: 'default',
    }}>{m.glyph}</span>
  )
}

function Stat({ n, label, tone, icon }: { n: number; label: string; tone: 'red' | 'amber' | 'plain'; icon: React.ReactNode }) {
  const fg = tone === 'red' ? C.red : tone === 'amber' ? C.amber : C.navy
  const edge = tone === 'red' ? '#C46B6B' : tone === 'amber' ? '#E8A33D' : C.edge
  const bg = tone === 'red' ? '#FFFAFA' : tone === 'amber' ? '#FFFCF6' : '#fff'
  return (
    <div style={{
      flex: '1 1 200px', background: bg, border: `1px solid ${C.edge}`,
      borderLeft: `3px solid ${edge}`, borderRadius: 11, padding: '13px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: fg }}>
        {icon}
        <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{n}</span>
      </div>
      <div style={{ fontSize: 12.5, color: C.gray, marginTop: 3 }}>{label}</div>
    </div>
  )
}

export default function BoardClient({
  rows, summary,
}: {
  rows: TrackRow[]
  summary: { stalled: number; withYou: number; withAdmin: number; inFlight: number }
}) {
  const [showDone, setShowDone] = useState(false)
  const [onlyStalled, setOnlyStalled] = useState(false)

  const visible = useMemo(() => rows.filter((r) => {
    if (!showDone && (r.isComplete || r.isClosed)) return false
    if (onlyStalled && !r.stalled) return false
    return true
  }), [rows, showDone, onlyStalled])

  const columns = rows[0]?.milestones ?? []

  return (
    <div style={{ padding: '28px 32px 80px', maxWidth: 1420, margin: '0 auto' }}>

      <Link href="/candidates" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, color: C.tealBr,
        fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 14,
      }}>
        <ArrowLeft size={14} /> Candidates
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 800, color: C.navy, margin: 0 }}>Track board</h1>
      <p style={{ color: C.faint, fontSize: 14, margin: '5px 0 0' }}>
        Every candidate in flight, and what each one is waiting on.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '20px 0 0' }}>
        <Stat n={summary.stalled} label="Stalled — nothing has moved" tone="red" icon={<AlertTriangle size={16} />} />
        <Stat n={summary.withYou} label="Waiting on you" tone="amber" icon={<Clock size={16} />} />
        <Stat n={summary.withAdmin} label="Waiting on an administrator" tone="plain" icon={<UserCheck size={16} />} />
        <Stat n={summary.inFlight} label="In flight" tone="plain" icon={<Users size={16} />} />
      </div>

      <div style={{ marginTop: 20, background: '#fff', border: `1px solid ${C.edge}`, borderRadius: 14, overflow: 'hidden' }}>

        <div style={{
          padding: '14px 18px', borderBottom: `1px solid ${C.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.navy }}>
            {visible.length} shown
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <Toggle on={onlyStalled} onClick={() => setOnlyStalled((v) => !v)} label="Only stalled" />
            <Toggle on={showDone} onClick={() => setShowDone((v) => !v)} label="Show converted and withdrawn" />
          </div>
        </div>

        {visible.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 6 }}>
              {onlyStalled ? 'Nothing is stalled' : 'No candidates in flight'}
            </div>
            <div style={{ fontSize: 14, color: C.faint }}>
              {onlyStalled ? 'Everyone in flight has moved recently.' : 'Invite a candidate to get started.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', fontSize: 13, minWidth: 1120 }}>
              <thead>
                <tr>
                  <th style={{ ...headCell, position: 'sticky', left: 0, zIndex: 2, textAlign: 'left', paddingLeft: 18, minWidth: 200, borderRight: `1px solid ${C.line}` }}>
                    Candidate
                  </th>
                  {columns.map((m) => (
                    <th key={m.key} style={headCell}>{m.label}</th>
                  ))}
                  <th style={{ ...headCell, textAlign: 'left', paddingLeft: 16, minWidth: 240 }}>Next action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r, i) => {
                  const zebra = i % 2 === 0 ? '#fff' : '#FAFBFC'
                  return (
                    <tr key={r.id}>
                      <td style={{
                        ...bodyCell, position: 'sticky', left: 0, zIndex: 1,
                        textAlign: 'left', paddingLeft: 18, background: zebra,
                        borderRight: `1px solid ${C.line}`, whiteSpace: 'nowrap',
                      }}>
                        <Link href={`/candidates/${r.id}`} style={{ color: C.tealBr, fontWeight: 700, fontSize: 13.5, textDecoration: 'none' }}>
                          {r.firstName} {r.lastName}
                        </Link>
                        {r.source === 'carematch360' && (
                          <span style={{
                            display: 'inline-block', marginLeft: 6, padding: '1px 6px', borderRadius: 999,
                            background: '#EEF2FF', color: '#3F4E9B', fontSize: 9.5, fontWeight: 700, verticalAlign: 'middle',
                          }}>CareMatch360</span>
                        )}
                        <div style={{ fontSize: 11, color: C.faint, marginTop: 1 }}>
                          {OWNER_LABEL[r.owner]}
                          {r.lastMovementAt && !r.isComplete && !r.isClosed
                            ? ` \u00b7 ${r.daysSinceMovement === 0 ? 'moved today' : `${r.daysSinceMovement}d since movement`}`
                            : ''}
                        </div>
                      </td>

                      {r.milestones.map((m) => (
                        <td key={m.key} style={{ ...bodyCell, background: zebra }}>
                          <Mark state={m.state} detail={m.detail} />
                        </td>
                      ))}

                      <td style={{ ...bodyCell, textAlign: 'left', paddingLeft: 16, background: zebra }}>
                        {r.stalled && (
                          <div style={{
                            display: 'inline-block', background: C.redBg, color: C.red,
                            fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 999,
                            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3,
                          }}>Stalled {r.daysSinceMovement} days</div>
                        )}
                        <div style={{
                          fontSize: 12.5, lineHeight: 1.45,
                          color: r.isComplete || r.isClosed ? C.faint : C.navy,
                          fontWeight: r.isComplete || r.isClosed ? 400 : 600,
                        }}>{r.nextAction}</div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{
          display: 'flex', gap: 18, flexWrap: 'wrap', padding: '13px 18px',
          borderTop: `1px solid ${C.line}`, background: '#FCFDFD', fontSize: 12, color: C.gray,
        }}>
          <Key state="done" label="Done" />
          <Key state="partial" label="Part done" />
          <Key state="waived" label="Waived" />
          <Key state="waiting" label="With someone" />
          <Key state="overdue" label="Overdue" />
          <Key state="none" label="Not reached" />
          <span style={{ color: C.faint }}>Hover any mark for the detail.</span>
        </div>
      </div>
    </div>
  )
}

function Key({ state, label }: { state: MarkState; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Mark state={state} detail={label} /> {label}
    </span>
  )
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none',
      border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, color: C.gray,
    }}>
      <span style={{
        width: 38, height: 21, borderRadius: 999, flex: '0 0 auto',
        background: on ? C.tealBr : '#CBD5DF', position: 'relative', transition: 'background .15s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: on ? 19 : 2, width: 17, height: 17,
          borderRadius: '50%', background: '#fff', transition: 'left .15s',
        }} />
      </span>
      {label}
    </button>
  )
}

const headCell: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: C.faint, textTransform: 'uppercase',
  letterSpacing: '0.06em', padding: '11px 8px', borderBottom: `1px solid ${C.line}`,
  background: '#F8FAFB', whiteSpace: 'nowrap', textAlign: 'center',
}

const bodyCell: React.CSSProperties = {
  padding: '10px 8px', borderBottom: `1px solid ${C.line}`,
  textAlign: 'center', verticalAlign: 'middle',
}
