'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

type Settings = {
  id?: string;
  company_name: string | null;
  opening_cash: number;
  opening_date: string;
  week_start_dow: number;
  min_cash_alert: number;
} | null;

const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SettingsClient({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    company_name: initial?.company_name || 'Vitalis HealthCare Services LLC',
    opening_cash: initial?.opening_cash?.toString() || '0',
    opening_date: initial?.opening_date || new Date().toISOString().slice(0, 10),
    week_start_dow: initial?.week_start_dow ?? 1,
    min_cash_alert: initial?.min_cash_alert?.toString() || '10000',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch('/api/cashflow/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        opening_cash: parseFloat(form.opening_cash),
        min_cash_alert: parseFloat(form.min_cash_alert),
        week_start_dow: Number(form.week_start_dow),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error('Save failed');
      return;
    }
    toast.success('Settings saved');
    router.refresh();
  };

  const field = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm';
  const label = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div>
        <label className={label}>Company name</label>
        <input
          type="text"
          value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          className={field}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Opening cash ($)</label>
          <input
            type="number"
            step="0.01"
            value={form.opening_cash}
            onChange={(e) => setForm({ ...form, opening_cash: e.target.value })}
            className={field}
          />
        </div>
        <div>
          <label className={label}>Opening date</label>
          <input
            type="date"
            value={form.opening_date}
            onChange={(e) => setForm({ ...form, opening_date: e.target.value })}
            className={field}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Week starts on</label>
          <select
            value={form.week_start_dow}
            onChange={(e) => setForm({ ...form, week_start_dow: Number(e.target.value) })}
            className={field}
          >
            {DOW.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Minimum cash alert ($)</label>
          <input
            type="number"
            step="0.01"
            value={form.min_cash_alert}
            onChange={(e) => setForm({ ...form, min_cash_alert: e.target.value })}
            className={field}
          />
        </div>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving…' : 'Save settings'}
      </button>
    </div>
  );
}
