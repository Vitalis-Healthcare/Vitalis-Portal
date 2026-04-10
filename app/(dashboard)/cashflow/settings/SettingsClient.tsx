'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import * as T from '../editorial-theme';

type Settings = {
  id?: string;
  company_name: string | null;
  opening_cash: number;
  opening_date: string;
  week_start_dow: number;
  min_cash_alert: number;
} | null;

const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ENDS = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];

export default function SettingsClient({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    company_name: initial?.company_name || 'Vitalis HealthCare Services LLC',
    opening_cash: initial?.opening_cash?.toString() || '0',
    opening_date: initial?.opening_date || new Date().toISOString().slice(0, 10),
    week_start_dow: initial?.week_start_dow ?? 6,
    min_cash_alert: initial?.min_cash_alert?.toString() || '10000',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch('/api/cashflow/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        opening_cash: parseFloat(form.opening_cash),
        min_cash_alert: parseFloat(form.min_cash_alert),
        week_start_dow: Number(form.week_start_dow),
      }),
    });
    setSaving(false);
    if (!res.ok) { toast.error('Save failed'); return; }
    toast.success('Settings saved');
    router.refresh();
  };

  const weekEndDay = ENDS[Number(form.week_start_dow)];

  return (
    <div style={T.pageShell}>
      <div style={{ ...T.container, maxWidth: 720 }}>
        <div style={T.masthead}>
          <div style={T.eyebrow}>Vitalis Healthcare · Cashflow Planner · Volume IV</div>
          <div style={T.headline}>The almanac</div>
          <div style={T.subhead}>Foundational numbers, calendar conventions, alert thresholds.</div>
        </div>

        <div style={T.card}>
          <div style={T.sectionEyebrow}>Organization</div>
          <div style={T.sectionTitle}>The company</div>
          <label style={T.label}>Company name</label>
          <input type="text" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} style={T.input} />
        </div>

        <div style={T.card}>
          <div style={T.sectionEyebrow}>Opening position</div>
          <div style={T.sectionTitle}>Where the ledger begins</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={T.label}>Opening cash ($)</label>
              <input type="number" step="0.01" value={form.opening_cash} onChange={e => setForm({ ...form, opening_cash: e.target.value })} style={T.input} />
            </div>
            <div>
              <label style={T.label}>As of date</label>
              <input type="date" value={form.opening_date} onChange={e => setForm({ ...form, opening_date: e.target.value })} style={T.input} />
            </div>
          </div>
        </div>

        <div style={T.card}>
          <div style={T.sectionEyebrow}>Calendar & alerts</div>
          <div style={T.sectionTitle}>The rhythm of the week</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={T.label}>Week starts on</label>
              <select value={form.week_start_dow} onChange={e => setForm({ ...form, week_start_dow: Number(e.target.value) })} style={T.select}>
                {DOW.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginTop: 6 }}>
                Your weeks will end on {weekEndDay}.
              </div>
            </div>
            <div>
              <label style={T.label}>Minimum cash alert ($)</label>
              <input type="number" step="0.01" value={form.min_cash_alert} onChange={e => setForm({ ...form, min_cash_alert: e.target.value })} style={T.input} />
            </div>
          </div>
        </div>

        <button onClick={save} disabled={saving} style={T.primaryBtn}>
          {saving ? 'Saving…' : 'Save the almanac'}
        </button>
      </div>
    </div>
  );
}
