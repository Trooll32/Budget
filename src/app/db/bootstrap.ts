import { db } from './client'
import type { AccountRecord, CategoryRecord, MonthRecord } from '../../types/domain'

function monthIdFromDate(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  return `${year}-${String(month).padStart(2, '0')}`
}

function monthLabel(date = new Date()) {
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(date)
}

export async function ensureCurrentMonth() {
  const now = new Date()
  const id = monthIdFromDate(now)
  const existing = await db.months.get(id)

  if (!existing) {
    const month: MonthRecord = {
      id,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      label: monthLabel(now),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
    await db.months.add(month)
  }

  return id
}

export async function seedDefaults() {
  const accountsCount = await db.accounts.count()
  const categoriesCount = await db.categories.count()

  if (accountsCount === 0) {
    const accounts: AccountRecord[] = [
      { id: crypto.randomUUID(), name: 'Основной', percent: 50, color: '#4f98a3', archived: false },
      { id: crypto.randomUUID(), name: 'Подушка', percent: 30, color: '#6daa45', archived: false },
      { id: crypto.randomUUID(), name: 'Инвестиции', percent: 20, color: '#e8af34', archived: false }
    ]
    await db.accounts.bulkAdd(accounts)
  }

  if (categoriesCount === 0) {
    const categories: CategoryRecord[] = [
      { id: crypto.randomUUID(), name: 'Продукты', color: '#4f98a3', archived: false },
      { id: crypto.randomUUID(), name: 'Дом', color: '#bb653b', archived: false },
      { id: crypto.randomUUID(), name: 'Транспорт', color: '#5591c7', archived: false },
      { id: crypto.randomUUID(), name: 'Досуг', color: '#a86fdf', archived: false }
    ]
    await db.categories.bulkAdd(categories)
  }
}
