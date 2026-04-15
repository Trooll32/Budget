import { defineStore } from 'pinia'
import { db } from '../db/client'
import { ensureCurrentMonth, seedDefaults, resetAllData } from '../db/bootstrap'
import type { AccountRecord, CategoryRecord, ExpenseEntry, IncomeEntry, MonthRecord, Totals } from '../../types/domain'

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

    totals(state): Totals {
      const totalIncome = state.incomes.reduce((s, i) => s + i.amount, 0)
      const totalExpense = state.expenses.reduce((s, e) => s + e.amount, 0)

      const allocatedByAccount: Record<string, number> = {}
      const spentByAccount: Record<string, number> = {}
      const spentByCategory: Record<string, number> = {}

      for (const a of state.accounts) {
        allocatedByAccount[a.id] = totalIncome * (a.percent / 100)
        spentByAccount[a.id] = 0
      }
      for (const c of state.categories) {
        spentByCategory[c.id] = 0
      }
      for (const e of state.expenses) {
        spentByAccount[e.accountId] = (spentByAccount[e.accountId] ?? 0) + e.amount
        spentByCategory[e.categoryId] = (spentByCategory[e.categoryId] ?? 0) + e.amount
      }

      return {
        totalIncome,
        totalExpense,
        freeCash: totalIncome - totalExpense,
        allocatedByAccount,
        spentByAccount,
        spentByCategory
      }
    },

    // Shorthand getters for convenience
    totalIncome(): number { return this.totals.totalIncome },
    totalExpense(): number { return this.totals.totalExpense },
    balance(): number { return this.totals.freeCash }
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

    // ─── Income ───────────────────────────────────────────────────────────────
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

    async deleteIncome(id: string) {
      await db.incomes.delete(id)
      await this.reloadAll()
    },

    // ─── Expenses ─────────────────────────────────────────────────────────────
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

    async updateExpense(id: string, payload: { accountId: string; categoryId: string; amount: number; date: string; note: string }) {
      await db.expenses.update(id, {
        accountId: payload.accountId,
        categoryId: payload.categoryId,
        amount: payload.amount,
        date: payload.date,
        note: payload.note
      })
      await this.reloadAll()
    },

    async deleteExpense(id: string) {
      await db.expenses.delete(id)
      await this.reloadAll()
    },

    // ─── Accounts ─────────────────────────────────────────────────────────────
    async saveAccounts(accounts: AccountRecord[]) {
      await db.transaction('rw', db.accounts, async () => {
        const existing = await db.accounts.toArray()
        const newIds = new Set(accounts.map((a) => a.id))
        for (const old of existing) {
          if (!newIds.has(old.id)) await db.accounts.update(old.id, { archived: true })
        }
        for (const a of accounts) {
          const found = await db.accounts.get(a.id)
          if (found) await db.accounts.update(a.id, { name: a.name, percent: a.percent, color: a.color, archived: false })
          else await db.accounts.add({ ...a, archived: false })
        }
      })
      await this.reloadAll()
    },

    // ─── Categories ───────────────────────────────────────────────────────────
    async saveCategories(categories: CategoryRecord[]) {
      await db.transaction('rw', db.categories, async () => {
        const existing = await db.categories.toArray()
        const newIds = new Set(categories.map((c) => c.id))
        for (const old of existing) {
          if (!newIds.has(old.id)) await db.categories.update(old.id, { archived: true })
        }
        for (const c of categories) {
          const found = await db.categories.get(c.id)
          if (found) await db.categories.update(c.id, { name: c.name, color: c.color, archived: false })
          else await db.categories.add({ ...c, archived: false })
        }
      })
      await this.reloadAll()
    },

    // ─── Import / Export / Reset ──────────────────────────────────────────────
    async exportData() {
      const data = {
        months: await db.months.toArray(),
        accounts: await db.accounts.toArray(),
        categories: await db.categories.toArray(),
        incomes: await db.incomes.toArray(),
        expenses: await db.expenses.toArray()
      }
      return JSON.stringify(data, null, 2)
    },

    async importData(json: string) {
      const data = JSON.parse(json)
      await db.transaction('rw', db.months, db.accounts, db.categories, db.incomes, db.expenses, async () => {
        if (Array.isArray(data.months)) { await db.months.clear(); await db.months.bulkAdd(data.months) }
        if (Array.isArray(data.accounts)) { await db.accounts.clear(); await db.accounts.bulkAdd(data.accounts) }
        if (Array.isArray(data.categories)) { await db.categories.clear(); await db.categories.bulkAdd(data.categories) }
        if (Array.isArray(data.incomes)) { await db.incomes.clear(); await db.incomes.bulkAdd(data.incomes) }
        if (Array.isArray(data.expenses)) { await db.expenses.clear(); await db.expenses.bulkAdd(data.expenses) }
      })
      await this.init()
    },

    async resetAll() {
      await resetAllData()
      await this.init()
    }
  }
})
