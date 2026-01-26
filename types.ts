
export type ExpenseType = 'Fixa' | 'Variável';
export type ExpenseStatus = 'Pago' | 'Pendente';

export interface Expense {
  id: string;
  description: string;
  category: string;
  type: ExpenseType;
  expectedValue: number;
  paidValue: number;
  dueDate: string;
  status: ExpenseStatus;
}

export interface CategoryInfo {
  name: string;
  color: string;
  icon?: string;
}

export interface SummaryData {
  totalExpected: number;
  totalPaid: number;
  balance: number;
  progress: number;
  fixedTotal: number;
  variableTotal: number;
}

export interface MonthData {
  expenses: Expense[];
  userName: string;
}

export type MonthlyDataStore = Record<number, MonthData>;

export interface AppSettings {
  categories: Record<string, CategoryInfo>;
}