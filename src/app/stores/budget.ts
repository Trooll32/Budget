import { defineStore } from 'pinia'
import { db } from '../db/client'
import { ensureCurrentMonth, seedDefaults } from '../db/bootstrap'
import type { AccountRecord, CategoryRecord, ExpenseEntry, IncomeEntry, MonthRecord } from '../../types/domain'

export const useBudgetStore = defineStore('budget', {
  state: () => ({
    activeMonthId: '',
    months: [] as MonthRecord[],
    accounts: [] as AccountRecord[],
    categories: [] as CategoryRecord[],
    incomes: [] as IncomeEntry[],
    expenses: [] as ExpenseEntry[],
    ready: false
  }),
  getters: {
    activeMonthLabel(state) {
      return state.months.find((item) => item.id === state.activeMonthId)?.label ?? 'Месяц'
    },
    totalIncome(state) {
      return state.incomes.reduce((sum, item) => sum + item.amount, 0)
    },
    totalExpense(state) {
      return state.expenses.reduce((sum, item) => sum + item.amount, 0)
    },
    balance(): number {
      return this.totalIncome - this.totalExpense
    }
  },
  actions: {
    async init() {
      await seedDefaults()
      const monthId = await ensureCurrentMonth()
      this.activeMonthId = monthId
      await this.reloadAll()
      this.ready = true
    },
    async reloadAll() {
      this.months = await db.months.orderBy('id').reverse().toArray()
      this.accounts = await db.accounts.filter((item) => !item.archived).toArray()
      this.categories = await db.categories.filter((item) => !item.archived).toArray()
      this.incomes = await db.incomes.where('monthId').equals(this.activeMonthId).sortBy('date')
      this.expenses = await db.expenses.where('monthId').equals(this.activeMonthId).sortBy('date')
    },
    async switchMonth(monthId: string) {
      this.activeMonthId = monthId
      await this.reloadAll()
    },
    async createIncome(payload: { source: string; amount: number; date: string; note: string }) {
      await db.incomes.add({
        id: crypto.randomUUID(),
        monthId: this.activeMonthId,
        source: payload.source,
        amount: payload.amount,
        date: payload.date,
        note: payload.note,
        createdAt: new Date().toISOString()
      })
      await this.reloadAll()
    },
    async createExpense(payload: { accountId: string; categoryId: string; amount: number; date: string; note: string }) {
      await db.expenses.add({
        id: crypto.randomUUID(),
        monthId: this.activeMonthId,
        accountId: payload.accountId,
        categoryId: payload.categoryId,
        amount: payload.amount,
        date: payload.date,
        note: payload.note,
        createdAt: new Date().toISOString()
      })
      await this.reloadAll()
    },
    async exportData() {
      const data = {
        months: await db.months.toArray(),
        accounts: await db.accounts.toArray(),
        categories: await db.categories.toArray(),
        incomes: await db.incomes.toArray(),
        expenses: await db.expenses.toArray()
      }
      return JSON.stringify(data, null, 2)
    }
  }
})
