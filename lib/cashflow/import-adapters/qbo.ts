// v0.5.5-b — QBO/OFX parser. Pure functions, no DB calls.
// Handles BoA-style (line-broken, bare tags) and M&T-style (single-line, closed tags).

export type QboHeader = {
  org: string | null;
  acctid: string | null;
  acctid_last4: string | null;
};

export type QboRow = {
  external_id: string;       // FITID — bank-issued unique transaction id
  posted_date: string;       // YYYY-MM-DD
  amount: number;            // signed
  name: string | null;       // <NAME> or <n>
  memo: string | null;       // <MEMO>
  trntype: string | null;    // DEBIT | CREDIT | etc.
};

// Tag matcher: tolerates both <TAG>value and <TAG>value</TAG>.
// Stops at the next < (i.e. next tag or closing tag).
function getTag(text: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>([^<]*)`, 'i');
  const m = text.match(re);
  if (!m) return null;
  return m[1].trim() || null;
}

// QBO/OFX dates look like 20260403120000.000[0:GMT] — we want YYYY-MM-DD.
function parseQboDate(raw: string | null): string | null {
  if (!raw) return null;
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function parseQboHeader(text: string): QboHeader {
  const org = getTag(text, 'ORG');
  const acctid = getTag(text, 'ACCTID');
  const acctid_last4 = acctid ? acctid.slice(-4) : null;
  return { org, acctid, acctid_last4 };
}

export function parseQboTransactions(text: string): QboRow[] {
  // Split on <STMTTRN> — first chunk is preamble, subsequent chunks are transactions.
  // We slice off everything past </STMTTRN> within each chunk to avoid bleed.
  const parts = text.split(/<STMTTRN>/i).slice(1);
  const rows: QboRow[] = [];

  for (const partRaw of parts) {
    const endIdx = partRaw.search(/<\/STMTTRN>/i);
    const part = endIdx >= 0 ? partRaw.slice(0, endIdx) : partRaw;

    const fitid = getTag(part, 'FITID');
    const dt = parseQboDate(getTag(part, 'DTPOSTED'));
    const amtStr = getTag(part, 'TRNAMT');
    if (!fitid || !dt || amtStr == null) continue;

    const amount = Number(amtStr);
    if (!Number.isFinite(amount)) continue;

    // BoA uses <NAME>, M&T uses <n>. The handover sample shows <n> in both files
    // due to upstream HTML stripping but real OFX uses <NAME>. Try both.
    const name = getTag(part, 'NAME') ?? getTag(part, 'n');
    const memo = getTag(part, 'MEMO');
    const trntype = getTag(part, 'TRNTYPE');

    rows.push({
      external_id: fitid,
      posted_date: dt,
      amount,
      name,
      memo,
      trntype,
    });
  }

  return rows;
}

// Match a parsed acctid_last4 against a list of cf_bank_accounts by short_code suffix.
// e.g. acctid_last4='3394' matches short_code='MT-3394'.
export function detectBankAccount<T extends { id: string; short_code: string }>(
  acctid_last4: string | null,
  accounts: T[],
): T | null {
  if (!acctid_last4) return null;
  return accounts.find(a => a.short_code.endsWith(acctid_last4)) ?? null;
}
