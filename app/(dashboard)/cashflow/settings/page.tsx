import { createServiceClient } from '@/lib/supabase/service';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = createServiceClient();
  const [{ data: settings }, { data: categories }] = await Promise.all([
    supabase.from('cf_settings').select('*').maybeSingle(),
    supabase.from('cf_categories').select('id, name, kind, type').order('type').order('kind').order('name'),
  ]);
  return <SettingsClient initial={settings} initialCategories={categories || []} />;
}
