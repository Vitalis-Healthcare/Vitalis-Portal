/**
 * lib/renderMarkdown.tsx
 * Shared markdown → React renderer for all AI text outputs in the portal.
 * No external dependencies. Handles the patterns Claude actually produces:
 *   **bold**, ## headings, bullet lists, numbered lists, blank lines.
 *
 * Usage:
 *   import { renderMarkdown } from '@/lib/renderMarkdown'
 *   <div>{renderMarkdown(text, accentColor)}</div>
 */

import React from 'react'

function renderInline(text: string, accent: string): React.ReactNode {
  // Split on **bold**, *italic*, and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 700, color: accent }}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} style={{
              fontFamily: 'monospace', fontSize: '0.9em',
              background: '#F1F5F9', padding: '1px 5px',
              borderRadius: 4, color: '#1A2E44'
            }}>{part.slice(1, -1)}</code>
          )
        }
        return part
      })}
    </>
  )
}

export function renderMarkdown(text: string, accentColor = '#0B6B5C'): React.ReactNode[] {
  if (!text) return []
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0
  let keyCounter = 0
  const k = () => keyCounter++

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Blank line → small vertical gap (not a full <br> which creates too much space)
    if (trimmed === '') {
      nodes.push(<div key={k()} style={{ height: 6 }} />)
      i++
      continue
    }

    // H1 # or #
    if (trimmed.startsWith('# ')) {
      nodes.push(
        <div key={k()} style={{ fontSize: 15, fontWeight: 800, color: accentColor, marginTop: 14, marginBottom: 5, lineHeight: 1.3 }}>
          {renderInline(trimmed.slice(2), accentColor)}
        </div>
      )
      i++; continue
    }

    // H2 ##
    if (trimmed.startsWith('## ')) {
      nodes.push(
        <div key={k()} style={{ fontSize: 14, fontWeight: 800, color: accentColor, marginTop: 12, marginBottom: 4, lineHeight: 1.3 }}>
          {renderInline(trimmed.slice(3), accentColor)}
        </div>
      )
      i++; continue
    }

    // H3 ###
    if (trimmed.startsWith('### ')) {
      nodes.push(
        <div key={k()} style={{ fontSize: 13, fontWeight: 700, color: accentColor, marginTop: 10, marginBottom: 3, lineHeight: 1.3 }}>
          {renderInline(trimmed.slice(4), accentColor)}
        </div>
      )
      i++; continue
    }

    // Horizontal rule ---
    if (trimmed === '---' || trimmed === '***') {
      nodes.push(<hr key={k()} style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '10px 0' }} />)
      i++; continue
    }

    // Bullet list — collect consecutive bullet lines
    if (trimmed.match(/^[-*•]\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().match(/^[-*•]\s+/)) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''))
        i++
      }
      nodes.push(
        <ul key={k()} style={{ margin: '6px 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 13, lineHeight: 1.65, color: 'inherit', paddingLeft: 2 }}>
              {renderInline(item, accentColor)}
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Numbered list — collect consecutive numbered lines
    if (trimmed.match(/^\d+\.\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s+/)) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      nodes.push(
        <ol key={k()} style={{ margin: '6px 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 13, lineHeight: 1.65, color: 'inherit', paddingLeft: 2 }}>
              {renderInline(item, accentColor)}
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Bold-only line used as a label (e.g. **Summary:**) — treat as mini-heading
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
      nodes.push(
        <div key={k()} style={{ fontSize: 13, fontWeight: 700, color: accentColor, marginTop: 8, marginBottom: 2 }}>
          {trimmed.slice(2, -2)}
        </div>
      )
      i++; continue
    }

    // Normal paragraph line
    nodes.push(
      <p key={k()} style={{ margin: '2px 0', fontSize: 13, lineHeight: 1.7, color: 'inherit' }}>
        {renderInline(trimmed, accentColor)}
      </p>
    )
    i++
  }

  return nodes
}
