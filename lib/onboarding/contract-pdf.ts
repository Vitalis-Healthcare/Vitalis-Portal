// lib/onboarding/contract-pdf.ts
//
// Renders a signed agreement's stored HTML snapshot to PDF.
//
// WHY CHROMIUM, given the weight. The snapshot is the legal record: masthead,
// CSS grid terms block, the drawn signature as an embedded PNG, the audit line.
// Laying that out again by hand with a PDF primitive library would produce a
// document that does NOT match what the person signed, which defeats the point
// of filing it. Rendering the exact HTML is the only version of this worth
// having, and only a browser engine does that faithfully.
//
// It is imported ONLY here and by the two routes that need a PDF, so the ~76 MB
// of puppeteer-core and @sparticuz/chromium land in those functions alone and
// nowhere else in the portal.
//
// Failure is ALWAYS soft. A PDF is a filing convenience; the snapshot in
// onb_contracts.rendered_html is the record. Nothing in the signing path may
// fail because a browser would not start.

import type { Browser } from 'puppeteer-core'

export interface PdfResult {
  ok: boolean
  pdf?: Buffer
  error?: string
}

/**
 * Local development has no bundled Chromium and does not need one — set
 * CHROMIUM_EXECUTABLE_PATH to a local Chrome and it is used instead.
 */
async function launch(): Promise<Browser> {
  const puppeteer = await import('puppeteer-core')
  const local = process.env.CHROMIUM_EXECUTABLE_PATH
  if (local) {
    return puppeteer.default.launch({
      executablePath: local,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true,
    })
  }
  const chromium = (await import('@sparticuz/chromium')).default
  return puppeteer.default.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  })
}

/**
 * HTML in, PDF bytes out.
 *
 * `waitUntil: 'load'` rather than 'networkidle0': the only external request the
 * document makes is the Google Fonts stylesheet, and on a cold serverless
 * function that occasionally never settles. A missing webfont costs us slightly
 * different letterforms; waiting for network idle costs us the whole document.
 */
export async function renderContractPdf(html: string): Promise<PdfResult> {
  if (!html || html.length < 100) {
    return { ok: false, error: 'There is no signed document to convert.' }
  }
  let browser: Browser | null = null
  try {
    browser = await launch()
    const page = await browser.newPage()
    // The snapshot is our own stored HTML, but it is set as content rather
    // than navigated to, so there is no origin and nothing can be fetched
    // beyond what the markup itself references.
    await page.setContent(html, { waitUntil: 'load', timeout: 20000 })
    // Give webfonts a brief chance, then proceed regardless.
    try {
      await page.evaluate(() => (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready)
    } catch {
      /* Font loading API unavailable or slow — the document still renders. */
    }
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', bottom: '0.6in', left: '0.6in', right: '0.6in' },
    })
    return { ok: true, pdf: Buffer.from(pdf) }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[contract-pdf] render failed:', msg)
    return { ok: false, error: msg }
  } finally {
    // Always close. A leaked browser on a warm serverless container is a
    // memory leak that eventually takes the function down.
    if (browser) {
      try { await browser.close() } catch { /* already gone */ }
    }
  }
}

/** `Vitalis-Agreement-Jane-Doe-2026-08-06.pdf` — safe on every filesystem. */
export function pdfFileName(candidateName: string, signedAtIso: string): string {
  const name = (candidateName || 'Caregiver')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'Caregiver'
  const date = (signedAtIso || '').slice(0, 10) || 'undated'
  return `Vitalis-Agreement-${name}-${date}.pdf`
}
