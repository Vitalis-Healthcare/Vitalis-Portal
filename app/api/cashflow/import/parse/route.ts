import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';
import { parseQboHeader, parseQboTransactions, detectBankAccount } from '@/lib/cashflow/import-adapters/qbo';

// v0.5.5-c — adds transfer detection.
// Detection rule: same absolute amount, opposite signs, different bank_account_id,
// actual_date within ±2 days, both rows currently unpaired (transfer_pair_id IS NULL).
// Same-account transfers are impossible by definition and ignored.

const TRANSFER_WINDOW_DAYS = 2;

type TransferCandidate = {
  candidate_id: string | null;        // null when match is in-batch (no row id yet)
  candidate_in_batch_external_id: string | null; // set when match is in-batch
  candidate_amount: number;
  candidate_date: string;
  candidate_bank_short_code: string;
  candidate_description: string | null;
};

function dateAddDays(yyyymmdd: string, days: number): string {
  const d = new Date(yyyymmdd + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.abs(Math.round((da - db) / 86400000));
}

export async function POST(req: NextRequest) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden', { status: 403 }); }

  const body = await req.json();
  const qboText = String(body?.qbo_text ?? '');
  if (!qboText) return NextResponse.json({ error: 'qbo_text is required' }, { status: 400 });

  const header = parseQboHeader(qboText);
  const rows = parseQboTransactions(qboText);

  const supabase = createServiceClient();

  // Bank detection — match acctid_last4 against cf_bank_accounts.short_code suffix.
  const { data: accountsRaw, error: aErr } = await supabase
    .from('cf_bank_accounts')
    .select('id,short_code,name,is_active')
    .eq('is_active', true)
    .order('sort_order');
  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });
  const accounts = (accountsRaw ?? []).filter((a: any) => a.short_code !== 'LEGACY');
  const detectedBank = detectBankAccount(header.acctid_last4, accounts as any[]);

  // Duplicate detection — exact external_id match against cf_actual_items.
  const externalIds = rows.map(r => r.external_id);
  let dupSet = new Set<string>();
  if (externalIds.length > 0) {
    const { data: existing, error: dErr } = await supabase
      .from('cf_actual_items')
      .select('external_id')
      .in('external_id', externalIds);
    if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });
    dupSet = new Set((existing ?? []).map((e: any) => e.external_id));
  }

  // Transfer detection — only meaningful when we know which bank these belong to.
  // Build a candidate map: external_id -> TransferCandidate (or null if no match).
  const candidates = new Map<string, TransferCandidate>();

  if (detectedBank && rows.length > 0) {
    // Find earliest/latest dates in the batch, expanded by the transfer window.
    const dates = rows.map(r => r.posted_date).sort();
    const windowStart = dateAddDays(dates[0], -TRANSFER_WINDOW_DAYS);
    const windowEnd = dateAddDays(dates[dates.length - 1], TRANSFER_WINDOW_DAYS);

    // Pull candidate counterparts from existing actual_items, restricted to:
    //   - other banks (NOT the detected bank — same-account transfers are impossible)
    //   - currently unpaired (transfer_pair_id IS NULL)
    //   - within the date window
    //   - source != 'import' OR import — we accept any source as a candidate counterpart
    const { data: existingCandidates, error: eErr } = await supabase
      .from('cf_actual_items')
      .select('id, actual_date, amount, description, bank_account_id, cf_bank_accounts(id,short_code,name)')
      .neq('bank_account_id', detectedBank.id)
      .is('transfer_pair_id', null)
      .gte('actual_date', windowStart)
      .lte('actual_date', windowEnd);
    if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });

    // Pitfall #7 — joined relation may be object OR array.
    const normalize = (c: any) => {
      const b = c.cf_bank_accounts;
      const bank = Array.isArray(b) ? b[0] : b;
      return { ...c, bank };
    };
    const existingNorm = (existingCandidates ?? []).map(normalize);

    // Match each parsed row against existing counterparts first (preferred over in-batch).
    // Track which existing rows have been claimed so we don't double-pair.
    const claimedExisting = new Set<string>();

    for (const r of rows) {
      // Look for opposite-sign, equal-magnitude, within-window in existing rows.
      const found = existingNorm.find(c =>
        !claimedExisting.has(c.id)
        && Number(c.amount) === -r.amount
        && daysBetween(c.actual_date, r.posted_date) <= TRANSFER_WINDOW_DAYS
      );
      if (found) {
        claimedExisting.add(found.id);
        candidates.set(r.external_id, {
          candidate_id: found.id,
          candidate_in_batch_external_id: null,
          candidate_amount: Number(found.amount),
          candidate_date: found.actual_date,
          candidate_bank_short_code: found.bank?.short_code ?? '',
          candidate_description: found.description ?? null,
        });
      }
    }

    // In-batch matching is intentionally NOT performed: a single QBO file is one
    // bank's statement, so all rows in a batch share the SAME bank_account_id, and
    // same-bank transfers are impossible. Cross-batch matching happens via the
    // existing-candidates query above when the user uploads the second bank's file.
  }

  const flagged = rows.map(r => ({
    ...r,
    is_duplicate: dupSet.has(r.external_id),
    transfer_candidate: candidates.get(r.external_id) ?? null,
  }));

  return NextResponse.json({
    header,
    detected_bank_account: detectedBank,
    bank_accounts: accounts,
    rows: flagged,
  });
}
