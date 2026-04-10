'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Trash2, Plus } from 'lucide-react';

type Category = { id: string; name: string; kind: 'income'|'expense' };
type Rule = any;

const FREQS = ['weekly','biweekly','semimonthly','monthly','quarterly','annual','one_time'];

export default function RulesClient({ categories, initialRules }: { categories: Category[]; initialRules: Rule[] }) {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category_id: categories[0]?.id || '',
    label: '',
    amount: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().slice(0,10),
    end_date: '',
    day_of_month: '',
    active: true,
  });

  const submit = async () => {
    if (!form.category_id || !form.label || !form.amount) { toast.error('Category, label, amount required'); return; }
    setSaving(true);
    const payload: any = { ...form, amount: parseFloat(form.amount), end_date: form.end_date || null, day_of_month: form.day_of_month ? parseInt(form.day_of_month) : null };
    const res = await fetch('/api/cashflow/rules', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) { toast.error('Save failed'); return; }
    const created = await res.json();
    setRules([created, ...rules]);
    setForm({ ...form, label:'', amount:'' });
    toast.success('Rule added');
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    const res = await fetch(`/api/cashflow/rules/${id}`, { method:'DELETE' });
    if (!res.ok) { toast.error('Delete failed'); return; }
    setRules(rules.filter(r => r.id !== id));
    toast.success('Deleted');
    router.refresh();
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
  const field = 'px-3 py-2 border border-gray-300 rounded-md text-sm';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">New recurring rule</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})} className={field}>
            {categories.map(c=><option key={c.id} value={c.id}>{c.kind==='income'?'+ ':'− '}{c.name}</option>)}
          </select>
          <input type="text" placeholder="Label (e.g. Rent)" value={form.label} onChange={e=>setForm({...form,label:e.target.value})} className={field}/>
          <input type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className={field}/>
          <select value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})} className={field}>
            {FREQS.map(f=><option key={f} value={f}>{f}</option>)}
          </select>
          <input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} className={field}/>
          <input type="date" placeholder="End (optional)" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} className={field}/>
          <input type="number" placeholder="Day of month (if monthly)" value={form.day_of_month} onChange={e=>setForm({...form,day_of_month:e.target.value})} className={field}/>
        </div>
        <button onClick={submit} disabled={saving} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          <Plus className="w-4 h-4"/>{saving?'Saving…':'Add rule'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {rules.length===0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No rules yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Label</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Frequency</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.map((r:any) => {
                const isIncome = r.cf_categories?.kind==='income';
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900 font-medium">{r.label}</td>
                    <td className="px-4 py-2 text-gray-600">{r.cf_categories?.name || '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{r.frequency}</td>
                    <td className={`px-4 py-2 text-right font-medium ${isIncome?'text-emerald-600':'text-rose-600'}`}>{isIncome?'+':'−'}{fmt(Math.abs(r.amount))}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={()=>remove(r.id)} className="text-gray-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button>
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
