import { createClient } from '@/lib/supabase/server';
import RulesClient from './RulesClient';
export const dynamic = 'force-dynamic';
export default async function RulesPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: rules }] = await Promise.all([
    supabase.from('cf_categories').select('*').order('kind').order('sort_order'),
    supabase.from('cf_recurring_rules').select('*, cf_categories(name,kind)').order('created_at', { ascending: false }),
  ]);
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Recurring Rules</h1>
      <p className="text-sm text-gray-500 mb-6">Define income and expense rules that drive the forecast.</p>
      <RulesClient categories={categories || []} initialRules={rules || []} />
    </div>
  );
}
