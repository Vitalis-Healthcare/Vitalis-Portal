export type Kind = 'income' | 'expense';
export type Frequency = 'weekly'|'biweekly'|'semimonthly'|'monthly'|'quarterly'|'annual'|'one_time';

export interface CfCategory { id: string; name: string; kind: Kind; sort_order: number; }
export interface CfRule {
  id: string; category_id: string; label: string; amount: number;
  frequency: Frequency; start_date: string; end_date: string | null;
  day_of_month: number | null; day_of_week: number | null; active: boolean; notes: string | null;
}
export interface CfTransaction {
  id: string; txn_date: string; category_id: string; amount: number;
  description: string | null; reference: string | null;
}
export interface CfSettings {
  id?: string; company_name: string | null; opening_cash: number;
  opening_date: string; week_start_dow: number; min_cash_alert: number;
}
export interface WeekRow {
  week_ending: string;
  income: number;
  expense: number;
  net: number;
  opening: number;
  closing: number;
  below_alert: boolean;
}
export interface Forecast {
  weeks: WeekRow[];
  kpis: { current_cash: number; total_income: number; total_expense: number; lowest_cash: number; lowest_week: string | null; };
}
