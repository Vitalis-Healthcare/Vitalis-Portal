import { createServiceClient } from '@/lib/supabase/service';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = createServiceClient();
  const { data } = await supabase.from('cf_settings').select('*').maybeSingle();
  return <SettingsClient initial={data} />;
}
