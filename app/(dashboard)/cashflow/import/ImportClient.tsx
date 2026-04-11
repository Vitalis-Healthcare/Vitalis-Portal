'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import * as T from '@/lib/cashflow/editorial-theme';
import { groupCategories, renderGroupedOptions } from '../category-groups';

type Category = { id: string; name: string; kind: string; type: 'receipt' | 'expense' };
type BankAccount = { id: string; short_code: string; name: string; is_active: boolean };

type ParsedRow = {
  external_id: string;
  posted_date: string;
  amount: number;
  name: string | null;
  memo: string | null;
  trntype: string | null;
  is_duplicate: boolean;
};

type ParseResponse = {
  header: { org: string | null; acctid: string | null; acctid_last4: string | null };
  detected_bank_account: BankAccount | null;
  bank_accounts: BankAccount[];
  rows: ParsedRow[];
};

export default function ImportClient({ categories }: { categories: Category[] }) {
  const router = useRouter();

  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [parsed, setParsed] = useState<ParseResponse | null>(null);
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [included, setIncluded] = useState<Record<string, boolean>>({});

  const grouped = groupCategories(categories as any);
  const groups = renderGroupedOptions(grouped);

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const text = await file.text();
      const res = await fetch('/api/cashflow/import/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qbo_text: text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'Failed to parse the statement');
        return;
      }
      const data: ParseResponse = await res.json();
      setParsed(data);
      setBankAccountId(data.detected_bank_account?.id || '');
      // Default: include every non-duplicate row.
      const inc: Record<string, boolean> = {};
      data.rows.forEach(r => { inc[r.external_id] = !r.is_duplicate; });
      setIncluded(inc);
      const dupCount = data.rows.filter(r => r.is_duplicate).length;
      toast.success(
        `Parsed ${data.rows.length} entries${dupCount > 0 ? ` — ${dupCount} already in the book` : ''}`
      );
    } finally {
      setParsing(false);
    }
  };

  const commit = async () => {
    if (!parsed || !bankAccountId) { toast.error('Confirm the bank account first'); return; }
    const rowsToCommit = parsed.rows.filter(r => included[r.external_id]);
    if (rowsToCommit.length === 0) { toast.error('No entries selected'); return; }
    setCommitting(true);
    try {
      const res = await fetch('/api/cashflow/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_account_id: bankAccountId,
          category_id: categoryId || null,
          rows: rowsToCommit,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'Commit failed');
        return;
      }
      const data = await res.json();
      toast.success(`Admitted ${data.count} entries to the book`);
      setParsed(null);
      setBankAccountId('');
      setCategoryId('');
      setIncluded({});
      router.refresh();
    } finally {
      setCommitting(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const fmtDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const includedCount = parsed ? parsed.rows.filter(r => included[r.external_id]).length : 0;
  const includedNet = parsed
    ? parsed.rows.filter(r => included[r.external_id]).reduce((s, r) => s + r.amount, 0)
    : 0;

  return (
    <div style={T.pageShell}>
      <div style={T.container}>
        <div style={T.masthead}>
          <div style={T.eyebrow}>Vitalis Healthcare · Cashflow Planner · Volume IV</div>
          <div style={T.headline}>The arrivals</div>
          <div style={T.subhead}>Bring in a statement. Admit each entry to the book.</div>
        </div>

        {!parsed && (
          <div style={T.card}>
            <div style={T.sectionEyebrow}>Bring in a statement</div>
            <div style={T.sectionTitle}>Choose a QBO file from your bank</div>
            <p style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginTop: 8, marginBottom: 16, fontStyle: 'italic' }}>
              In your online banking, look for &ldquo;Download&rdquo; and choose Quicken (.QBO) or Web Connect.
              The bank account will be detected automatically from the file.
            </p>
            <input
              type="file"
              accept=".qbo,.ofx"
              disabled={parsing}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              style={{ ...T.input, padding: 8 }}
            />
            {parsing && <div style={{ marginTop: 12, fontFamily: T.serif, fontStyle: 'italic', color: T.muted }}>Reading the statement…</div>}
          </div>
        )}

        {parsed && (
          <>
            <div style={T.card}>
              <div style={T.sectionEyebrow}>Confirm the arrival</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                <div>
                  <label style={T.label}>Bank account</label>
                  <select value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} style={T.select}>
                    <option value="">— select —</option>
                    {parsed.bank_accounts.map(b => (
                      <option key={b.id} value={b.id}>{b.short_code}</option>
                    ))}
                  </select>
                  {parsed.detected_bank_account && (
                    <div style={{ fontFamily: T.serif, fontSize: 12, color: T.muted, marginTop: 6, fontStyle: 'italic' }}>
                      Detected from file: {parsed.detected_bank_account.short_code}
                    </div>
                  )}
                  {!parsed.detected_bank_account && (
                    <div style={{ fontFamily: T.serif, fontSize: 12, color: T.bad, marginTop: 6, fontStyle: 'italic' }}>
                      Could not detect bank account from file. Please choose manually.
                    </div>
                  )}
                </div>
                <div>
                  <label style={T.label}>Assign all to category (optional)</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={T.select}>
                    <option value="">— leave uncategorised —</option>
                    {groups.map(g => (
                      <optgroup key={g.label} label={g.label}>
                        {g.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={T.sectionEyebrow}>The reading</div>
            <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginBottom: 12 }}>
              {includedCount} of {parsed.rows.length} selected · net {fmt(includedNet)}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.serif }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.ink}`, borderTop: `1px solid ${T.ink}` }}>
                  <th style={{ ...T.tableHead, width: 40 }}></th>
                  <th style={T.tableHead}>Date</th>
                  <th style={T.tableHead}>Description</th>
                  <th style={{ ...T.tableHead, textAlign: 'right' }}>Amount</th>
                  <th style={T.tableHead}></th>
                </tr>
              </thead>
              <tbody>
                {parsed.rows.map((r, idx) => {
                  const desc = (r.memo && r.memo.length > (r.name?.length ?? 0)) ? r.memo : (r.name ?? r.memo ?? '—');
                  const isIncome = r.amount > 0;
                  return (
                    <tr key={r.external_id} style={{
                      borderBottom: `0.5px solid ${T.rule}`,
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(232,226,213,0.25)',
                      opacity: included[r.external_id] ? 1 : 0.45,
                    }}>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="checkbox"
                          checked={!!included[r.external_id]}
                          onChange={e => setIncluded({ ...included, [r.external_id]: e.target.checked })}
                        />
                      </td>
                      <td style={{ padding: '12px', fontSize: 14 }}>{fmtDate(r.posted_date)}</td>
                      <td style={{ padding: '12px', fontSize: 13 }}>{desc}</td>
                      <td style={{ padding: '12px', fontSize: 15, textAlign: 'right', fontWeight: 500, color: isIncome ? T.good : T.bad }}>
                        {isIncome ? '+' : '−'}{fmt(Math.abs(r.amount))}
                      </td>
                      <td style={{ padding: '12px', fontSize: 12, fontStyle: 'italic', color: T.bad }}>
                        {r.is_duplicate ? '⚠ already in the book' : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button onClick={commit} disabled={committing || includedCount === 0 || !bankAccountId} style={T.primaryBtn}>
                {committing ? 'Admitting…' : `Admit ${includedCount} to the book`}
              </button>
              <button onClick={() => setParsed(null)} style={T.ghostBtn}>Discard</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
