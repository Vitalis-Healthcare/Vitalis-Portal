// lib/cashflow/editorial-theme.ts
// Canonical inline-style tokens for the Cashflow module.
// Editorial aesthetic: warm off-white, Georgia serif, navy accents.
// Inline styles only — no Tailwind inside cashflow.

import type { CSSProperties } from 'react'

const INK = '#1a1a1a'
const INK_SOFT = '#5a5245'
const INK_MUTED = '#8a8170'
const PAPER = '#faf7f0'
const RULE = '#e8e4d9'
const RULE_SOFT = '#f2ede0'
const NAVY = '#1e3a5f'
const NAVY_DARK = '#14263f'
const GOLD = '#b8935a'
const GREEN = '#2d6b3f'
const RED = '#8b3a2f'

export const editorialColors = {
  ink: INK,
  inkSoft: INK_SOFT,
  inkMuted: INK_MUTED,
  paper: PAPER,
  rule: RULE,
  ruleSoft: RULE_SOFT,
  navy: NAVY,
  navyDark: NAVY_DARK,
  gold: GOLD,
  green: GREEN,
  red: RED,
}

export const editorial: Record<string, CSSProperties> = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '32px 28px 64px',
    fontFamily: 'Georgia, "Times New Roman", serif',
    color: INK,
    background: PAPER,
    minHeight: '100vh',
  },
  headerBlock: {
    borderBottom: `2px solid ${INK}`,
    paddingBottom: 16,
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 42,
    fontWeight: 400,
    letterSpacing: '-0.01em',
    margin: 0,
    color: INK,
  },
  subtitle: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 17,
    fontStyle: 'italic',
    color: INK_SOFT,
    margin: '8px 0 0',
  },
  label: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 14,
    fontStyle: 'italic',
    color: INK_SOFT,
    textTransform: 'none',
  },
  pill: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 14,
    padding: '6px 14px',
    border: `1px solid ${RULE}`,
    background: 'transparent',
    color: INK_SOFT,
    borderRadius: 2,
    cursor: 'pointer',
  },
  pillActive: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 14,
    padding: '6px 14px',
    border: `1px solid ${NAVY}`,
    background: NAVY,
    color: '#fff',
    borderRadius: 2,
    cursor: 'pointer',
  },
  card: {
    background: '#fff',
    border: `1px solid ${RULE}`,
    padding: '20px 24px',
    marginBottom: 20,
    boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
  },
  sectionHead: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 20,
    fontWeight: 400,
    margin: 0,
    color: INK,
  },
  fieldLabel: {
    display: 'block',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 12,
    fontStyle: 'italic',
    color: INK_MUTED,
    marginBottom: 4,
  },
  input: {
    width: '100%',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 15,
    padding: '8px 10px',
    border: `1px solid ${RULE}`,
    background: '#fff',
    color: INK,
    borderRadius: 2,
    boxSizing: 'border-box',
  },
  primaryBtn: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 15,
    padding: '9px 20px',
    border: `1px solid ${NAVY_DARK}`,
    background: NAVY,
    color: '#fff',
    borderRadius: 2,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  muted: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 15,
    fontStyle: 'italic',
    color: INK_MUTED,
    textAlign: 'center',
    padding: '24px 0',
  },
  chip: {
    display: 'inline-block',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 12,
    padding: '2px 10px',
    border: `1px solid ${GOLD}`,
    background: '#fdf8ed',
    color: INK_SOFT,
    borderRadius: 2,
  },
  chipMuted: {
    display: 'inline-block',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 12,
    fontStyle: 'italic',
    padding: '2px 10px',
    border: `1px dashed ${RULE}`,
    background: 'transparent',
    color: INK_MUTED,
    borderRadius: 2,
  },
  linkBtn: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 13,
    fontStyle: 'italic',
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: RED,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
}
