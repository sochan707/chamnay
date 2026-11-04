import { demoTransactions, type Transaction } from '../data/demo'
import { categoryIdFromLegacyName, defaultCategories, isCategory, type Category } from './categories'
import { localDate } from './expenses'

export const LEDGER_KEY_V1 = 'chamnay.ledger.v1'
export const LEDGER_KEY_V2 = 'chamnay.ledger.v2'

export type LedgerV2 = {
  version: 2
  entries: Transaction[]
  startingEntries: Transaction[]
  startingMonth: string
  categories: Category[]
}

type StorageReader = Pick<Storage, 'getItem'>
type StorageWriter = Pick<Storage, 'setItem'>

function isBaseTransaction(value: unknown): value is Omit<Transaction, 'categoryId'> & { categoryId?: unknown; category?: unknown } {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Transaction>
  return typeof item.id === 'string' && typeof item.title === 'string' && typeof item.date === 'string'
    && typeof item.amount === 'number' && Number.isFinite(item.amount)
    && (item.kind === 'expense' || item.kind === 'income')
}

function normalizeV2Transactions(value: unknown, categoryIds: Set<string>): Transaction[] | null {
  if (!Array.isArray(value) || !value.every(isBaseTransaction)) return null
  return value.map(item => ({
    id: item.id,
    title: item.title,
    date: item.date,
    amount: item.amount,
    kind: item.kind,
    categoryId: item.kind === 'income' ? null : typeof item.categoryId === 'string' && categoryIds.has(item.categoryId) ? item.categoryId : 'uncategorized',
  }))
}

function normalizeV1Transactions(value: unknown): Transaction[] | null {
  if (!Array.isArray(value) || !value.every(isBaseTransaction)) return null
  return value.map(item => {
    const legacyCategory = typeof item.category === 'string' ? item.category : ''
    return {
      id: item.id,
      title: item.title,
      date: item.date,
      amount: item.amount,
      kind: item.kind,
      categoryId: item.kind === 'income' ? null : categoryIdFromLegacyName(legacyCategory),
    }
  })
}

export function createInitialLedger(): LedgerV2 {
  return {
    version: 2,
    entries: demoTransactions.map(entry => ({ ...entry })),
    startingEntries: demoTransactions.map(entry => ({ ...entry })),
    startingMonth: localDate().slice(0, 7),
    categories: defaultCategories.map(category => ({ ...category })),
  }
}

export function parseLedgerV2(value: unknown): LedgerV2 | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Partial<LedgerV2>
  if (item.version !== 2 || typeof item.startingMonth !== 'string' || !Array.isArray(item.categories)) return null
  const customCategories = item.categories.filter(isCategory).filter(category => category.source === 'custom' && !defaultCategories.some(system => system.id === category.id))
  const categories = [...defaultCategories.map(category => ({ ...category })), ...customCategories]
  const categoryIds = new Set(categories.map(category => category.id))
  const entries = normalizeV2Transactions(item.entries, categoryIds)
  const startingEntries = normalizeV2Transactions(item.startingEntries, categoryIds)
  if (!entries || !startingEntries) return null
  return { version: 2, entries, startingEntries, startingMonth: item.startingMonth, categories }
}

export function migrateLedgerV1(value: unknown): LedgerV2 | null {
  if (!value || typeof value !== 'object') return null
  const item = value as { entries?: unknown; startingEntries?: unknown; startingMonth?: unknown }
  if (typeof item.startingMonth !== 'string') return null
  const entries = normalizeV1Transactions(item.entries)
  const startingEntries = normalizeV1Transactions(item.startingEntries)
  if (!entries || !startingEntries) return null
  return { version: 2, entries, startingEntries, startingMonth: item.startingMonth, categories: defaultCategories.map(category => ({ ...category })) }
}

export function readLedger(storage: StorageReader = localStorage): LedgerV2 {
  try {
    const v2 = storage.getItem(LEDGER_KEY_V2)
    if (v2) {
      const parsed = parseLedgerV2(JSON.parse(v2))
      if (parsed) return parsed
    }
    const v1 = storage.getItem(LEDGER_KEY_V1)
    if (v1) {
      const migrated = migrateLedgerV1(JSON.parse(v1))
      if (migrated) return migrated
    }
  } catch { /* Browser storage may be disabled or contain invalid JSON. */ }
  return createInitialLedger()
}

export function writeLedger(ledger: LedgerV2, storage: StorageWriter = localStorage): void {
  try { storage.setItem(LEDGER_KEY_V2, JSON.stringify(ledger)) } catch { /* Browser storage may be disabled. */ }
}
