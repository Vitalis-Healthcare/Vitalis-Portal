// lib/cashflow/editorial-theme.ts
// Canonical inline-style tokens for the Cashflow module.
// Palette matches CashflowDashboard.tsx exactly (cream/ink newspaper).
// Inline styles only — no Tailwind inside cashflow.

import type { CSSProperties } from 'react'

const CREAM = '#faf7f2'
const RULE = '#e8e2d5'
const RULE_STRONG = '#d9d1bf'
const INK = '#2a241a'
const MUTED = '#8a7d5f'
const GOOD = '#3b6d11'
const BAD = '#A32D2D'
const SERIF = 'Georgia, "Iowan Old Style", "Palatino Linotype", serif'

export const editorialColors = {
  cream: CREAM,
  rule: RULE,
  ruleStrong: RULE_STRONG,
  ink: INK,
  muted: MUTED,
  good: GOOD,
  bad: BAD,
  serif: SERIF,
}

export const editorial: Record<string, CSSProperties> = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '40px 32px 80px',
    fontFamily: SERIF,
    color: INK,
    background: CREAM,
    minHeight: '100vh',
  },
  headerBlock: {
    borderBottom: `1px solid ${RULE_STRONG}`,
    paddingBottom: 18,
    marginBottom: 28,
  },
  title: {
    fontFamily: SERIF,
    fontSize: 44,
    fontWeight: 400,
    letterSpacing: '-0.01em',
    margin: 0,
    color: INK,
  },
  subtitle: {
    fontFamily: SERIF,
    fontSize: 17,
    fontStyle: 'italic',
    color: MUTED,
    margin: '10px 0 0',
  },
  label: {
    fontFamily: SERIF,
    fontSize: 14,
    fontStyle: 'italic',
    color: MUTED,
  },
  pill: {
    fontFamily: SERIF,
    fontSize: 14,
    padding: '5px 14px',
    border: 'none',
    background: 'transparent',
    color: MUTED,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  pillActive: {
    fontFamily: SERIF,
    fontSize: 14,
    fontWeight: 600,
    padding: '5px 14px',
    border: 'none',
    background: 'transparent',
    color: INK,
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
  },
  card: {
    background: '#fff',
    border: `1px solid ${RULE}`,
    padding: '22px 26px',
    marginBottom: 22,
  },
  sectionHead: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: 400,
    margin: 0,
    color: INK,
  },
  fieldLabel: {
    display: 'block',
    fontFamily: SERIF,
    fontSize: 12,
    fontStyle: 'italic',
    color: MUTED,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  input: {
    width: '100%',
    fontFamily: SERIF,
    fontSize: 15,
    padding: '8px 10px',
    border: `1px solid ${RULE_STRONG}`,
    background: '#fff',
    color: INK,
    borderRadius: 0,
    boxSizing: 'border-box',
  },
  primaryBtn: {
    fontFamily: SERIF,
    fontSize: 15,
    padding: '9px 22px',
    border: `1px solid ${INK}`,
    background: INK,
    color: CREAM,
    borderRadius: 0,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
  },
  muted: {
    fontFamily: SERIF,
    fontSize: 16,
    fontStyle: 'italic',
    color: MUTED,
    textAlign: 'center',
    padding: '28px 0',
  },
  chip: {
    display: 'inline-block',
    fontFamily: SERIF,
    fontSize: 12,
    padding: '2px 10px',
    border: `1px solid ${RULE_STRONG}`,
    background: CREAM,
    color: INK,
  },
  chipMuted: {
    display: 'inline-block',
    fontFamily: SERIF,
    fontSize: 12,
    fontStyle: 'italic',
    padding: '2px 10px',
    border: `1px dashed ${RULE_STRONG}`,
    background: 'transparent',
    color: MUTED,
  },
  linkBtn: {
    fontFamily: SERIF,
    fontSize: 13,
    fontStyle: 'italic',
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: BAD,
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  },
}
