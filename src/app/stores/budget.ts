import { defineStore } from 'pinia'
import {
  collection, doc, getDocs, setDoc, deleteDoc,
  query, where, orderBy, writeBatch, onSnapshot,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from './auth'
import { monthIdFromDate } from '../db/bootstrap'
import type { AccountRecord, CategoryRecord, ExpenseEntry, IncomeEntry, MonthRecord, Totals } from '../../types/domain'

// Пути в Firestore: households/{uid}/...
function col(uid: string, name: string) {
  return collection(db, 'households', uid, name)
}
function docRef(uid: string, name: string, id: string) {
  return doc(db, 'households', uid, name, id)
}

const DEFAULT_ACCOUNTS: Omit<AccountRecord, 'id'>[] = [
  { name: 'Накопления', percent: 30, color: '#58d67b', archived: false },
  { name: 'Бытовой', percent: 35, color: '#8b6cff', archived: false },
  { name: 'Инвестиции', percent: 20, color: '#7ce5e0', archived: false },
  { name: 'Путешествия', percent: 15, color: '#ff9a5c', archived: false }
]

const DEFAULT_CATEGORIES: Omit<CategoryRecord, 'id'>[] = [
  { name: 'Продукты', color: '#8b6cff', archived: false },
  { name: 'Дом', color: '#58d67b', archived: false },
  { name: 'Транспорт', color: '#7ce5e0', archived: false },
  { name: 'Рестораны', color: '#ff9a5c', archived: false },
  { name: 'Подписки', color: '#ff6d8a', archived: false }
]

export const useBudgetStore = defineStore('budget', {
  state: () => ({
    activeMonthId: '',
    months: [] as MonthRecord[],
    accounts: [] as AccountRecord[],
    categories: [] as CategoryRecord[],
    incomes: [] as IncomeEntry[],
    expenses: [] as ExpenseEntry[],
    ready: false,
    _unsub: null as Unsubscribe | null
  }),

  getters: {
    activeMonthLabel(state) {
      return state.months.find((m) => m.id === state.activeMonthId)?.label ?? 'Месяц'
    },
    currentMonthId(): string {
      return monthIdFromDate(new Date())
    },
    isCurrentMonth(state): boolean {
      return state.activeMonthId === monthIdFromDate(new Date())
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
      for (const c of state.categories) spentByCategory[c.id] = 0
      for (const e of state.expenses) {
        spentByAccount[e.accountId] = (spentByAccount[e.accountId] ?? 0) + e.amount
        spentByCategory[e.categoryId] = (spentByCategory[e.categoryId] ?? 0) + e.amount
      }
      return { totalIncome, totalExpense, freeCash: totalIncome - totalExpense, allocatedByAccount, spentByAccount, spentByCategory }
    },
    totalIncome(): number { return this.totals.totalIncome },
    totalExpense(): number { return this.totals.totalExpense },
    balance(): number { return this.totals.freeCash }
  },

  actions: {
    async init() {
      const auth = useAuthStore()
      if (!auth.uid) return
      const uid = auth.uid

      // 1. Сеед дефолтных данных если пусто
      const accSnap = await getDocs(query(col(uid, 'accounts'), where('archived', '==', false)))
      if (accSnap.empty) {
        const batch = writeBatch(db)
        for (const a of DEFAULT_ACCOUNTS) {
          const id = crypto.randomUUID()
          batch.set(docRef(uid, 'accounts', id), { id, ...a })
        }
        await batch.commit()
      }
      const catSnap = await getDocs(query(col(uid, 'categories'), where('archived', '==', false)))
      if (catSnap.empty) {
        const batch = writeBatch(db)
        for (const c of DEFAULT_CATEGORIES) {
          const id = crypto.randomUUID()
          batch.set(docRef(uid, 'categories', id), { id, ...c })
        }
        await batch.commit()
      }

      // 2. Генерируем месяцы
      await this._ensureMonths(uid)

      this.activeMonthId = monthIdFromDate(new Date())

      // 3. Загружаем всё
      await this.reloadAll(uid)

      // 4. Реалтайм подписка на траты/доходы текущего месяца
      this._subscribeMonth(uid, this.activeMonthId)

      this.ready = true
    },

    async _ensureMonths(uid: string) {
      const START_YEAR = 2026, START_MONTH = 1
      const now = new Date()
      const cursor = new Date(START_YEAR, START_MONTH - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 1)
      const snap = await getDocs(col(uid, 'months'))
      const existing = new Set(snap.docs.map((d) => d.id))
      const batch = writeBatch(db)
      let hasNew = false
      while (cursor <= end) {
        const id = monthIdFromDate(cursor)
        if (!existing.has(id)) {
          const label = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(cursor))
          batch.set(docRef(uid, 'months', id), {
            id, year: cursor.getFullYear(), month: cursor.getMonth() + 1,
            label, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
          })
          hasNew = true
        }
        cursor.setMonth(cursor.getMonth() + 1)
      }
      if (hasNew) await batch.commit()
    },

    async reloadAll(uidArg?: string) {
      const uid = uidArg ?? useAuthStore().uid!
      const [monthsSnap, accSnap, catSnap, incSnap, expSnap] = await Promise.all([
        getDocs(query(col(uid, 'months'), orderBy('id', 'desc'))),
        getDocs(query(col(uid, 'accounts'), where('archived', '==', false))),
        getDocs(query(col(uid, 'categories'), where('archived', '==', false))),
        getDocs(query(col(uid, 'incomes'), where('monthId', '==', this.activeMonthId), orderBy('date'))),
        getDocs(query(col(uid, 'expenses'), where('monthId', '==', this.activeMonthId), orderBy('date')))
      ])
      this.months = monthsSnap.docs.map((d) => d.data() as MonthRecord)
      this.accounts = accSnap.docs.map((d) => d.data() as AccountRecord)
      this.categories = catSnap.docs.map((d) => d.data() as CategoryRecord)
      this.incomes = incSnap.docs.map((d) => d.data() as IncomeEntry)
      this.expenses = expSnap.docs.map((d) => d.data() as ExpenseEntry)
    },

    _subscribeMonth(uid: string, monthId: string) {
      if (this._unsub) this._unsub()
      // Реалтайм подписка на траты активного месяца
      const q = query(col(uid, 'expenses'), where('monthId', '==', monthId), orderBy('date'))
      this._unsub = onSnapshot(q, (snap) => {
        this.expenses = snap.docs.map((d) => d.data() as ExpenseEntry)
      })
    },

    async switchMonth(monthId: string) {
      if (monthId > monthIdFromDate(new Date())) return
      this.activeMonthId = monthId
      const uid = useAuthStore().uid!
      await this.reloadAll(uid)
      this._subscribeMonth(uid, monthId)
    },

    // ── Income ────────────────────────────────────────────────────────────
    async createIncome(payload: { source: string; amount: number; date: string; note: string }) {
      if (!this.isCurrentMonth) throw new Error('READ_ONLY_MONTH')
      const uid = useAuthStore().uid!
      const id = crypto.randomUUID()
      await setDoc(docRef(uid, 'incomes', id), {
        id, monthId: this.activeMonthId, source: payload.source,
        amount: payload.amount, date: payload.date, note: payload.note,
        createdAt: new Date().toISOString()
      })
      await this.reloadAll()
    },

    async deleteIncome(id: string) {
      if (!this.isCurrentMonth) throw new Error('READ_ONLY_MONTH')
      const uid = useAuthStore().uid!
      await deleteDoc(docRef(uid, 'incomes', id))
      await this.reloadAll()
    },

    // ── Expenses ───────────────────────────────────────────────────────────
    async createExpense(payload: { accountId: string; categoryId: string; amount: number; date: string; note: string }) {
      if (!this.isCurrentMonth) throw new Error('READ_ONLY_MONTH')
      const uid = useAuthStore().uid!
      const id = crypto.randomUUID()
      await setDoc(docRef(uid, 'expenses', id), {
        id, monthId: this.activeMonthId, accountId: payload.accountId,
        categoryId: payload.categoryId, amount: payload.amount,
        date: payload.date, note: payload.note, createdAt: new Date().toISOString()
      })
      await this.reloadAll()
    },

    async updateExpense(id: string, payload: { accountId: string; categoryId: string; amount: number; date: string; note: string }) {
      if (!this.isCurrentMonth) throw new Error('READ_ONLY_MONTH')
      const uid = useAuthStore().uid!
      await setDoc(docRef(uid, 'expenses', id), {
        id, monthId: this.activeMonthId, accountId: payload.accountId,
        categoryId: payload.categoryId, amount: payload.amount,
        date: payload.date, note: payload.note, createdAt: new Date().toISOString()
      }, { merge: true })
      await this.reloadAll()
    },

    async deleteExpense(id: string) {
      if (!this.isCurrentMonth) throw new Error('READ_ONLY_MONTH')
      const uid = useAuthStore().uid!
      await deleteDoc(docRef(uid, 'expenses', id))
      await this.reloadAll()
    },

    // ── Accounts ───────────────────────────────────────────────────────────
    async saveAccounts(accounts: AccountRecord[]) {
      const uid = useAuthStore().uid!
      const batch = writeBatch(db)
      const snap = await getDocs(col(uid, 'accounts'))
      const newIds = new Set(accounts.map((a) => a.id))
      for (const d of snap.docs) {
        if (!newIds.has(d.id)) batch.update(d.ref, { archived: true })
      }
      for (const a of accounts) {
        batch.set(docRef(uid, 'accounts', a.id), { ...a, archived: false }, { merge: true })
      }
      await batch.commit()
      await this.reloadAll()
    },

    // ── Categories ──────────────────────────────────────────────────────────
    async saveCategories(categories: CategoryRecord[]) {
      const uid = useAuthStore().uid!
      const batch = writeBatch(db)
      const snap = await getDocs(col(uid, 'categories'))
      const newIds = new Set(categories.map((c) => c.id))
      for (const d of snap.docs) {
        if (!newIds.has(d.id)) batch.update(d.ref, { archived: true })
      }
      for (const c of categories) {
        batch.set(docRef(uid, 'categories', c.id), { ...c, archived: false }, { merge: true })
      }
      await batch.commit()
      await this.reloadAll()
    },

    // ── Export / Reset ───────────────────────────────────────────────────
    async exportData() {
      const uid = useAuthStore().uid!
      const [m, a, c, i, e] = await Promise.all([
        getDocs(col(uid, 'months')),
        getDocs(col(uid, 'accounts')),
        getDocs(col(uid, 'categories')),
        getDocs(col(uid, 'incomes')),
        getDocs(col(uid, 'expenses'))
      ])
      return JSON.stringify({
        months: m.docs.map((d) => d.data()),
        accounts: a.docs.map((d) => d.data()),
        categories: c.docs.map((d) => d.data()),
        incomes: i.docs.map((d) => d.data()),
        expenses: e.docs.map((d) => d.data())
      }, null, 2)
    },

    async resetAll() {
      const uid = useAuthStore().uid!
      const collections = ['months', 'accounts', 'categories', 'incomes', 'expenses']
      for (const name of collections) {
        const snap = await getDocs(col(uid, name))
        const batch = writeBatch(db)
        snap.docs.forEach((d) => batch.delete(d.ref))
        if (snap.docs.length) await batch.commit()
      }
      await this.init()
    }
  }
})
