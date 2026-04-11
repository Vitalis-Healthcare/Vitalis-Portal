'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import * as T from '../editorial-theme';
import { groupCategories, renderGroupedOptions } from '../category-groups';

type Category = { id: string; name: string; kind: string; type: 'receipt' | 'expense' };
type BankAccount = { id: string; name: string; is_active: boolean };

type CatJoin = { name: string; kind: string; type: 'receipt' | 'expense' | null };

type Txn = {
  id: string;
  actual_date: string;
  category_id: string | null;
  bank_account_id: string;
  amount: number;
  description: string | null;
  reference: string | null;
  cf_categories?: CatJoin | CatJoin[] | null;
};

// Pitfall #7 — joined relation may be object OR array. Always normalize.
function catOf(t: Txn): CatJoin | null {
  const c = t.cf_categories;
  if (!c) return null;
  if (Array.isArray(c)) return c[0] ?? null;
  return c;
}

export default function TransactionsClient({
  categories, initialTransactions, bankAccounts,
}: { categories: Category[]; initialTransactions: Txn[]; bankAccounts: BankAccount[] }) {
  const router = useRouter();
  const [txns, setTxns] = useState<Txn[]>(initialTransactions);
  const [saving, setSaving] = useState(false);

  // Default bank account: prefer "M&T — Operating", else first available.
  const defaultBank =
    bankAccounts.find(b => b.name.toLowerCase().includes('operating'))?.id
    ?? bankAccounts[0]?.id
    ?? '';

  const [form, setForm] = useState({
    actual_date: new Date().toISOString().slice(0, 10),
    category_id: categories[0]?.id || '',
    bank_account_id: defaultBank,
    amount: '', description: '', reference: '',
  });

  const grouped = groupCategories(categories as any);
  const groups = renderGroupedOptions(grouped);

  const submit = async () => {
    if (!form.category_id || !form.amount || !form.bank_account_id) {
      toast.error('Date, category, bank account and amount required');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/cashflow/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setSaving(false);
    if (!res.ok) { toast.error('Failed to save'); return; }
    const created = await res.json();
    setTxns([created, ...txns]);
    setForm({ ...form, amount: '', description: '', reference: '' });
    toast.success('Entered into the book');
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Strike this entry from the book?')) return;
    const res = await fetch(`/api/cashflow/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Delete failed'); return; }
    setTxns(txns.filter(t => t.id !== id));
    toast.success('Struck out');
    router.refresh();
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const fmtDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={T.pageShell}>
      <div style={T.container}>
        <div style={T.masthead}>
          <div style={T.eyebrow}>Vitalis Healthcare · Cashflow Planner · Volume IV</div>
          <div style={T.headline}>The daybook</div>
          <div style={T.subhead}>Every dollar in, every dollar out — recorded as it happens.</div>
        </div>

        <div style={T.card}>
          <div style={T.sectionEyebrow}>New entry</div>
          <div style={T.sectionTitle}>Record a transaction</div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 140px', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={T.label}>Date</label>
              <input type="date" value={form.actual_date} onChange={e => setForm({ ...form, actual_date: e.target.value })} style={T.input} />
            </div>
            <div>
              <label style={T.label}>Category</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={T.select}>
                {groups.map(g => (
                  <optgroup key={g.label} label={g.label}>
                    {g.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label style={T.label}>Bank account</label>
              <select value={form.bank_account_id} onChange={e => setForm({ ...form, bank_account_id: e.target.value })} style={T.select}>
                {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={T.label}>Amount</label>
              <input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={T.input} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={T.label}>Description</label>
              <input type="text" placeholder="What was this for?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={T.input} />
            </div>
            <div>
              <label style={T.label}>Reference</label>
              <input type="text" placeholder="Check #, invoice #, …" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} style={T.input} />
            </div>
          </div>
          <button onClick={submit} disabled={saving || !form.amount} style={T.primaryBtn}>
            {saving ? 'Recording…' : 'Enter into the book'}
          </button>
        </div>

        <div style={T.sectionEyebrow}>The Daybook</div>
        {txns.length === 0 ? (
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, padding: 40, textAlign: 'center' }}>
            No entries yet — the ledger awaits its first mark.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.serif }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.ink}`, borderTop: `1px solid ${T.ink}` }}>
                <th style={T.tableHead}>Date</th>
                <th style={T.tableHead}>Category</th>
                <th style={T.tableHead}>Description</th>
                <th style={{ ...T.tableHead, textAlign: 'right' }}>Amount</th>
                <th style={T.tableHead}></th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t, idx) => {
                const cat = catOf(t);
                const isIncome = cat?.type === 'receipt';
                return (
                  <tr key={t.id} style={{
                    borderBottom: `0.5px solid ${T.rule}`,
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(232,226,213,0.25)',
                  }}>
                    <td style={{ padding: '12px', fontSize: 14 }}>{fmtDate(t.actual_date)}</td>
                    <td style={{ padding: '12px', fontSize: 14 }}>{cat?.name || '—'}</td>
                    <td style={{ padding: '12px', fontSize: 14, fontStyle: t.description ? 'normal' : 'italic', color: t.description ? T.ink : T.muted }}>
                      {t.description || '—'}
                    </td>
                    <td style={{ padding: '12px', fontSize: 15, textAlign: 'right', fontWeight: 500, color: isIncome ? T.good : T.bad }}>
                      {isIncome ? '+' : '−'}{fmt(Math.abs(t.amount))}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button onClick={() => remove(t.id)} style={T.ghostBtn} aria-label="Strike out">Strike out</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
