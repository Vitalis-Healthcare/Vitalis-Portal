import { createServiceClient } from '@/lib/supabase/service';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = createServiceClient();
  const { data } = await supabase.from('cf_settings').select('*').maybeSingle();
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Cashflow Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Opening balance, week start, and alert thresholds.</p>
      <SettingsClient initial={data} />
    </div>
  );
}
