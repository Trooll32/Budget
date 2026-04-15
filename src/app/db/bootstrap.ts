import { db } from './client'
import type { AccountRecord, CategoryRecord, MonthRecord } from '../../types/domain'

export function monthIdFromDate(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  return `${year}-${String(month).padStart(2, '0')}`
}

function monthLabel(date = new Date()) {
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(date)
}

function makeMonthRecord(date: Date): MonthRecord {
  return {
    id: monthIdFromDate(date),
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    label: monthLabel(date),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Ensure all months from APP_START_YEAR up to current month exist in DB.
 * We use a fixed start: January of the year when the app first ran
 * (determined by the oldest month in DB, or current year if empty).
 */
const APP_START_YEAR = 2024 // change if needed

export async function ensureCurrentMonth(): Promise<string> {
  const now = new Date()
  const currentId = monthIdFromDate(now)

  // Find the earliest existing month to use as the start boundary
  const oldest = await db.months.orderBy('id').first()
  const startYear = oldest ? parseInt(oldest.id.split('-')[0]) : APP_START_YEAR
  const startMonth = oldest ? parseInt(oldest.id.split('-')[1]) : 1

  // Generate every month from start up to (and including) current month
  const cursor = new Date(startYear, startMonth - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 1)

  while (cursor <= end) {
    const id = monthIdFromDate(cursor)
    const existing = await db.months.get(id)
    if (!existing) {
      await db.months.add(makeMonthRecord(new Date(cursor)))
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return currentId
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
