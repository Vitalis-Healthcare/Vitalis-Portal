// Category grouping — canonical mapping from kind → sub-group
// INFLOWS: Income (operational) + Other Inflows (non-operational)
// OUTFLOWS: Expenses (operational) + Other Payments (non-operational)

export type Category = {
  id: string;
  name: string;
  kind: string;
  type: 'receipt' | 'expense';
};

export type SubGroup = 'income' | 'other_inflows' | 'expenses' | 'other_payments';

const INCOME_KINDS = new Set(['medicaid_waiver', 'contract', 'private_pay', 'ltc_insurance']);
const OTHER_INFLOW_KINDS = new Set(['other_receipt', 'cash_injection']);
const EXPENSE_KINDS = new Set(['payroll', 'back_office', 'operating', 'insurance', 'taxes']);
const OTHER_PAYMENT_KINDS = new Set(['loan_repayment', 'owner_draw', 'misc']);

export function subGroupOf(c: Pick<Category, 'kind' | 'type'>): SubGroup {
  if (INCOME_KINDS.has(c.kind)) return 'income';
  if (OTHER_INFLOW_KINDS.has(c.kind)) return 'other_inflows';
  if (EXPENSE_KINDS.has(c.kind)) return 'expenses';
  if (OTHER_PAYMENT_KINDS.has(c.kind)) return 'other_payments';
  // Fallback by type
  return c.type === 'receipt' ? 'other_inflows' : 'other_payments';
}

export const SUB_GROUP_LABELS: Record<SubGroup, string> = {
  income: '── INCOME ──',
  other_inflows: '── OTHER INFLOWS ──',
  expenses: '── EXPENSES ──',
  other_payments: '── OTHER PAYMENTS ──',
};

export const SUB_GROUP_DISPLAY: Record<SubGroup, string> = {
  income: 'Income',
  other_inflows: 'Other Inflows',
  expenses: 'Expenses',
  other_payments: 'Other Payments',
};

export const SUB_GROUP_ORDER: SubGroup[] = ['income', 'other_inflows', 'expenses', 'other_payments'];

export function groupCategories(cats: Category[]): Record<SubGroup, Category[]> {
  const out: Record<SubGroup, Category[]> = {
    income: [], other_inflows: [], expenses: [], other_payments: [],
  };
  for (const c of cats) out[subGroupOf(c)].push(c);
  for (const k of SUB_GROUP_ORDER) out[k].sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

// Reusable <select> renderer for forms
export function renderGroupedOptions(grouped: Record<SubGroup, Category[]>) {
  // Called as JSX helper from clients
  return SUB_GROUP_ORDER.flatMap(sg =>
    grouped[sg].length > 0
      ? [{ label: SUB_GROUP_LABELS[sg], categories: grouped[sg] }]
      : []
  );
}
