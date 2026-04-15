export interface MonthRecord {
  id: string
  year: number
  month: number
  label: string
  createdAt: string
  updatedAt: string
}

export interface AccountRecord {
  id: string
  name: string
  percent: number
  color: string
  archived: boolean
}

export interface CategoryRecord {
  id: string
  name: string
  color: string
  archived: boolean
}

export interface IncomeEntry {
  id: string
  monthId: string
  source: string
  amount: number
  date: string
  note: string
  createdAt: string
}

export interface ExpenseEntry {
  id: string
  monthId: string
  accountId: string
  categoryId: string
  amount: number
  date: string
  note: string
  createdAt: string
}

export interface Totals {
  totalIncome: number
  totalExpense: number
  freeCash: number
  allocatedByAccount: Record<string, number>
  spentByAccount: Record<string, number>
  spentByCategory: Record<string, number>
}
