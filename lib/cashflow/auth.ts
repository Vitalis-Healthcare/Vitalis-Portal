import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const ADMIN_EMAIL = () => process.env.CASHFLOW_ADMIN_EMAIL || 'okezie@vitalishealthcare.com';

export async function getCashflowUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isCashflowAdmin() {
  const user = await getCashflowUser();
  return !!user && user.email?.toLowerCase() === ADMIN_EMAIL().toLowerCase();
}

export async function requireCashflowAdmin() {
  const ok = await isCashflowAdmin();
  if (!ok) redirect('/dashboard');
}

export async function assertCashflowAdmin() {
  const ok = await isCashflowAdmin();
  if (!ok) throw new Response('Forbidden', { status: 403 });
}
