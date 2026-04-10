import { requireCashflowAdmin } from '@/lib/cashflow/auth';
export default async function CashflowLayout({ children }: { children: React.ReactNode }) {
  await requireCashflowAdmin();
  return <>{children}</>;
}
