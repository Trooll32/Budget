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
      { id: crypto.randomUUID(), name: 'Накопления', percent: 30, color: '#58d67b', archived: false },
      { id: crypto.randomUUID(), name: 'Бытовой', percent: 35, color: '#8b6cff', archived: false },
      { id: crypto.randomUUID(), name: 'Инвестиции', percent: 20, color: '#7ce5e0', archived: false },
      { id: crypto.randomUUID(), name: 'Путешествия', percent: 15, color: '#ff9a5c', archived: false }
    ]
    await db.accounts.bulkAdd(accounts)
  }

  if (categoriesCount === 0) {
    const categories: CategoryRecord[] = [
      { id: crypto.randomUUID(), name: 'Продукты', color: '#8b6cff', archived: false },
      { id: crypto.randomUUID(), name: 'Дом', color: '#58d67b', archived: false },
      { id: crypto.randomUUID(), name: 'Транспорт', color: '#7ce5e0', archived: false },
      { id: crypto.randomUUID(), name: 'Рестораны', color: '#ff9a5c', archived: false },
      { id: crypto.randomUUID(), name: 'Подписки', color: '#ff6d8a', archived: false }
    ]
    await db.categories.bulkAdd(categories)
  }
}

export async function resetAllData() {
  await db.transaction('rw', db.months, db.accounts, db.categories, db.incomes, db.expenses, async () => {
    await db.months.clear()
    await db.accounts.clear()
    await db.categories.clear()
    await db.incomes.clear()
    await db.expenses.clear()
  })
  await seedDefaults()
  await ensureCurrentMonth()
}
