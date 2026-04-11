import { createServiceClient } from '@/lib/supabase/service';
import RulesClient from './RulesClient';

export const dynamic = 'force-dynamic';

export default async function RulesPage() {
  const supabase = createServiceClient();
  const [{ data: categories }, { data: rules }] = await Promise.all([
    supabase.from('cf_categories').select('*').order('kind').order('sort_order'),
    supabase.from('cf_recurring_rules').select('*, cf_categories(name,kind,type)').order('created_at', { ascending: false }),
  ]);
  return <RulesClient categories={categories || []} initialRules={rules || []} />;
}
