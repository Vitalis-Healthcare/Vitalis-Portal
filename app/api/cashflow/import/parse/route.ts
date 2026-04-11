import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';
import { parseQboHeader, parseQboTransactions, detectBankAccount } from '@/lib/cashflow/import-adapters/qbo';

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

  const flagged = rows.map(r => ({ ...r, is_duplicate: dupSet.has(r.external_id) }));

  return NextResponse.json({
    header,
    detected_bank_account: detectedBank,
    bank_accounts: accounts,
    rows: flagged,
  });
}
