'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import * as T from '../editorial-theme';
import { groupCategories, renderGroupedOptions } from '../category-groups';

type Category = { id: string; name: string; kind: string; type: 'receipt' | 'expense' };
type Rule = {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  cf_categories?: { name: string; kind: string; type: 'receipt' | 'expense' };
};
const FREQS = ['weekly', 'biweekly', 'semimonthly', 'monthly', 'quarterly', 'annual', 'one_time'];

export default function RulesClient({ categories, initialRules }: { categories: Category[]; initialRules: Rule[] }) {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category_id: categories[0]?.id || '',
    name: '', amount: '', frequency: 'monthly',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '', day_of_month: '', is_active: true,
  });

  const grouped = groupCategories(categories as never);
  const groups = renderGroupedOptions(grouped);

  const submit = async () => {
    if (!form.category_id || !form.name || !form.amount) { toast.error('Category, name, amount required'); return; }
    setSaving(true);
    const payload = {
      category_id: form.category_id,
      name: form.name,
      amount: parseFloat(form.amount),
      frequency: form.frequency,
      start_date: form.start_date,
      end_date: form.end_date || null,
      day_of_month: form.day_of_month ? parseInt(form.day_of_month) : null,
      is_active: form.is_active,
    };
    try {
      const res = await fetch('/api/cashflow/rules', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = 'Save failed';
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
        toast.error(msg);
        setSaving(false);
        return;
      }
      const created = await res.json();
      setRules([created, ...rules]);
      setForm({ ...form, name: '', amount: '' });
      toast.success('Rule added · forecast generated');
      router.refresh();
    } catch (e) {
      toast.error(`Network error: ${e instanceof Error ? e.message : 'unknown'}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Retire this standing order? Future un-matched forecast items will be removed.')) return;
    const res = await fetch(`/api/cashflow/rules/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      let msg = 'Delete failed';
      try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
      toast.error(msg);
      return;
    }
    setRules(rules.filter(r => r.id !== id));
    toast.success('Retired');
    router.refresh();
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <div style={T.pageShell}>
      <div style={T.container}>
        <div style={T.masthead}>
          <div style={T.eyebrow}>Vitalis Healthcare · Cashflow Planner · Volume IV</div>
          <div style={T.headline}>Standing orders</div>
          <div style={T.subhead}>The rhythms of income and obligation — payroll, rent, Medicaid, the predictable tide.</div>
        </div>

        <div style={T.card}>
          <div style={T.sectionEyebrow}>New rule</div>
          <div style={T.sectionTitle}>Define a recurring transaction</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px', gap: 12, marginBottom: 12 }}>
            <div><label style={T.label}>Category</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={T.select}>
                {groups.map(g => (<optgroup key={g.label} label={g.label}>{g.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>))}
              </select></div>
            <div><label style={T.label}>Name</label>
              <input type="text" placeholder="e.g. Office rent" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={T.input} /></div>
            <div><label style={T.label}>Amount</label>
              <input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={T.input} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div><label style={T.label}>Frequency</label>
              <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} style={T.select}>
                {FREQS.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
              </select></div>
            <div><label style={T.label}>Starts</label>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={T.input} /></div>
            <div><label style={T.label}>Ends (optional)</label>
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={T.input} /></div>
            <div><label style={T.label}>Day of month</label>
              <input type="number" placeholder="e.g. 15" value={form.day_of_month} onChange={e => setForm({ ...form, day_of_month: e.target.value })} style={T.input} /></div>
          </div>
          <button onClick={submit} disabled={saving} style={T.primaryBtn}>{saving ? 'Adding…' : 'Enter into the book'}</button>
        </div>

        <div style={T.sectionEyebrow}>Active rules</div>
        {rules.length === 0 ? (
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, padding: 40, textAlign: 'center' }}>
            No standing orders yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.serif }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.ink}`, borderTop: `1px solid ${T.ink}` }}>
                <th style={T.tableHead}>Name</th>
                <th style={T.tableHead}>Category</th>
                <th style={T.tableHead}>Cadence</th>
                <th style={{ ...T.tableHead, textAlign: 'right' }}>Amount</th>
                <th style={T.tableHead}></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r, idx) => {
                const isIncome = r.cf_categories?.type === 'receipt';
                return (
                  <tr key={r.id} style={{
                    borderBottom: `0.5px solid ${T.rule}`,
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(232,226,213,0.25)',
                  }}>
                    <td style={{ padding: '12px', fontSize: 15, fontWeight: 500 }}>{r.name}</td>
                    <td style={{ padding: '12px', fontSize: 14, color: T.muted }}>{r.cf_categories?.name || '—'}</td>
                    <td style={{ padding: '12px', fontSize: 13, fontStyle: 'italic', color: T.muted }}>{String(r.frequency).replace('_', ' ')}</td>
                    <td style={{ padding: '12px', fontSize: 15, textAlign: 'right', fontWeight: 500, color: isIncome ? T.good : T.bad }}>
                      {isIncome ? '+' : '−'}{fmt(Math.abs(r.amount))}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button onClick={() => remove(r.id)} style={T.ghostBtn}>Retire</button>
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
