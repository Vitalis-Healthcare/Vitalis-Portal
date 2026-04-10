'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';

type Forecast = {
  weeks: { week_ending: string; income: number; expense: number; net: number; opening: number; closing: number; below_alert: boolean }[];
  kpis: { current_cash: number; total_income: number; total_expense: number; lowest_cash: number; lowest_week: string | null };
};

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function CashflowDashboard() {
  const [weeks, setWeeks] = useState<13|26|52>(26);
  const [data, setData] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cashflow/forecast?weeks=${weeks}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [weeks]);

  if (loading || !data) return <div className="p-6 text-sm text-gray-500">Loading forecast…</div>;

  const maxClose = Math.max(...data.weeks.map(w => w.closing), 1);
  const minClose = Math.min(...data.weeks.map(w => w.closing), 0);
  const range = maxClose - minClose || 1;
  const W = 800, H = 200, PAD = 20;
  const pts = data.weeks.map((w, i) => {
    const x = PAD + (i * (W - 2*PAD)) / Math.max(data.weeks.length - 1, 1);
    const y = H - PAD - ((w.closing - minClose) / range) * (H - 2*PAD);
    return `${x},${y}`;
  }).join(' ');
  const areaPath = `M ${PAD},${H-PAD} L ${pts.replaceAll(' ', ' L ')} L ${W-PAD},${H-PAD} Z`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cashflow Forecast</h1>
          <p className="text-sm text-gray-500">Rolling {weeks}-week projection</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-md p-1">
          {[13,26,52].map(w => (
            <button key={w} onClick={() => setWeeks(w as any)}
              className={`px-3 py-1 text-sm rounded ${weeks===w?'bg-white shadow text-gray-900':'text-gray-600'}`}>{w}W</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi icon={<DollarSign className="w-5 h-5"/>} label="Current cash" value={fmt(data.kpis.current_cash)} color="blue"/>
        <Kpi icon={<TrendingUp className="w-5 h-5"/>} label="Total income" value={fmt(data.kpis.total_income)} color="emerald"/>
        <Kpi icon={<TrendingDown className="w-5 h-5"/>} label="Total expense" value={fmt(data.kpis.total_expense)} color="rose"/>
        <Kpi icon={<AlertTriangle className="w-5 h-5"/>} label="Lowest cash" value={fmt(data.kpis.lowest_cash)} sub={data.kpis.lowest_week || ''} color="amber"/>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Cash position</h2>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48">
          <defs>
            <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#cfGrad)"/>
          <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="2"/>
        </svg>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left">Week ending</th>
                <th className="px-4 py-2 text-right">Opening</th>
                <th className="px-4 py-2 text-right text-emerald-600">Income</th>
                <th className="px-4 py-2 text-right text-rose-600">Expense</th>
                <th className="px-4 py-2 text-right">Net</th>
                <th className="px-4 py-2 text-right">Closing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.weeks.map(w => (
                <tr key={w.week_ending} className={w.below_alert?'bg-rose-50':''}>
                  <td className="px-4 py-2 text-gray-700">{w.week_ending}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{fmt(w.opening)}</td>
                  <td className="px-4 py-2 text-right text-emerald-600">{fmt(w.income)}</td>
                  <td className="px-4 py-2 text-right text-rose-600">{fmt(w.expense)}</td>
                  <td className={`px-4 py-2 text-right font-medium ${w.net>=0?'text-emerald-700':'text-rose-700'}`}>{fmt(w.net)}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${w.below_alert?'text-rose-700':'text-gray-900'}`}>{fmt(w.closing)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, sub, color }: any) {
  const colors: any = { blue: 'text-blue-600 bg-blue-50', emerald: 'text-emerald-600 bg-emerald-50', rose: 'text-rose-600 bg-rose-50', amber: 'text-amber-600 bg-amber-50' };
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
        <span className={`p-1.5 rounded ${colors[color]}`}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}
