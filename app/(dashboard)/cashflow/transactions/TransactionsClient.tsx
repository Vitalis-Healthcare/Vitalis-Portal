'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Trash2, Plus } from 'lucide-react';

type Category = { id: string; name: string; kind: 'income' | 'expense' };
type Txn = {
  id: string;
  txn_date: string;
  category_id: string;
  amount: number;
  description: string | null;
  reference: string | null;
  cf_categories?: { name: string; kind: string } | null;
};

export default function TransactionsClient({
  categories,
  initialTransactions,
}: {
  categories: Category[];
  initialTransactions: Txn[];
}) {
  const router = useRouter();
  const [txns, setTxns] = useState<Txn[]>(initialTransactions);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    txn_date: new Date().toISOString().slice(0, 10),
    category_id: categories[0]?.id || '',
    amount: '',
    description: '',
    reference: '',
  });

  const submit = async () => {
    if (!form.category_id || !form.amount) {
      toast.error('Category and amount required');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/cashflow/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error('Failed to save');
      return;
    }
    const created = await res.json();
    setTxns([created, ...txns]);
    setForm({ ...form, amount: '', description: '', reference: '' });
    toast.success('Transaction recorded');
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    const res = await fetch(`/api/cashflow/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Delete failed');
      return;
    }
    setTxns(txns.filter((t) => t.id !== id));
    toast.success('Deleted');
    router.refresh();
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">New transaction</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="date"
            value={form.txn_date}
            onChange={(e) => setForm({ ...form, txn_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.kind === 'income' ? '+ ' : '− '}
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <input
            type="text"
            placeholder="Reference"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <button
          onClick={submit}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {saving ? 'Saving…' : 'Add transaction'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Recent transactions</h2>
        </div>
        {txns.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No transactions yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {txns.map((t) => {
                const isIncome = t.cf_categories?.kind === 'income';
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{t.txn_date}</td>
                    <td className="px-4 py-2 text-gray-700">{t.cf_categories?.name || '—'}</td>
                    <td className="px-4 py-2 text-gray-500">{t.description || '—'}</td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : '−'}
                      {fmt(Math.abs(t.amount))}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => remove(t.id)}
                        className="text-gray-400 hover:text-rose-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
