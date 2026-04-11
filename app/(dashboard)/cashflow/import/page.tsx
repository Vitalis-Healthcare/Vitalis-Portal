import { createServiceClient } from '@/lib/supabase/service';
import { requireCashflowAdmin } from '@/lib/cashflow/auth';
import ImportClient from './ImportClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireCashflowAdmin();
  const sb = createServiceClient();

  const { data: cats } = await sb
    .from('cf_categories')
    .select('id,name,kind,type')
    .eq('is_active', true)
    .order('sort_order');

  return <ImportClient categories={(cats ?? []) as any[]} />;
}
