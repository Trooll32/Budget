import Dexie, { type Table } from 'dexie'
import type { AccountRecord, CategoryRecord, ExpenseEntry, IncomeEntry, MonthRecord } from '../../types/domain'

export class BudgetDatabase extends Dexie {
  months!: Table<MonthRecord, string>
  accounts!: Table<AccountRecord, string>
  categories!: Table<CategoryRecord, string>
  incomes!: Table<IncomeEntry, string>
  expenses!: Table<ExpenseEntry, string>

  constructor() {
    super('budget-webview-db')
    this.version(1).stores({
      months: 'id, year, month, updatedAt',
      accounts: 'id, name, archived',
      categories: 'id, name, archived',
      incomes: 'id, monthId, date, source',
      expenses: 'id, monthId, date, accountId, categoryId'
    })
  }
}

export const db = new BudgetDatabase()
