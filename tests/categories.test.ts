import { describe, expect, it } from 'vitest'
import {
  addCustomCategory, defaultCategories, removeCustomCategory,
  updateCustomCategory, validateCategory, type CategoryInput,
} from '../src/lib/categories'
import { LEDGER_KEY_V1, LEDGER_KEY_V2, migrateLedgerV1, readLedger } from '../src/lib/ledger'

const input: CategoryInput = { name: 'Study supplies', icon: 'book', color: 'blue' }

describe('category rules', () => {
  it('adds and edits personal categories while preserving their stable id', () => {
    const added = addCustomCategory(defaultCategories, input, 'study')
    expect(added.at(-1)).toMatchObject({ id: 'study', ...input, source: 'custom' })
    const edited = updateCustomCategory(added, 'study', { ...input, name: 'Course materials', color: 'lavender' })
    expect(edited.at(-1)).toMatchObject({ id: 'study', name: 'Course materials', color: 'lavender' })
  })

  it('rejects blank, long, and duplicate category names', () => {
    expect(validateCategory({ ...input, name: ' ' }, defaultCategories).name).toBe('Enter a category name.')
    expect(validateCategory({ ...input, name: 'x'.repeat(31) }, defaultCategories).name).toBe('Use 30 characters or fewer.')
    expect(validateCategory({ ...input, name: ' food ' }, defaultCategories).name).toBe('That category name is already in use.')
  })

  it('protects ready-made categories and reassigns expenses before deleting a personal category', () => {
    const categories = addCustomCategory(defaultCategories, input, 'study')
    const entries = [{ id: 'one', title: 'Notebook', categoryId: 'study', date: '2026-11-04', amount: 4, kind: 'expense' as const }]
    expect(updateCustomCategory(categories, 'food', { ...input, name: 'Meals' })).toEqual(categories)
    expect(removeCustomCategory(categories, entries, 'food', 'other')).toEqual({ categories, entries })
    const result = removeCustomCategory(categories, entries, 'study', 'uncategorized')
    expect(result.categories.some(category => category.id === 'study')).toBe(false)
    expect(result.entries[0].categoryId).toBe('uncategorized')
  })
})

describe('ledger migration and recovery', () => {
  it('migrates V1 names to stable ids and sends unknown names to Uncategorized', () => {
    const legacy = {
      entries: [
        { id: 'food-entry', title: 'Lunch', category: 'Food', date: '2026-11-04', amount: 4, kind: 'expense' },
        { id: 'unknown-entry', title: 'Mystery', category: 'Something new', date: '2026-11-04', amount: 2, kind: 'expense' },
        { id: 'income-entry', title: 'Allowance', category: 'Income', date: '2026-11-04', amount: 20, kind: 'income' },
      ],
      startingEntries: [],
      startingMonth: '2026-11',
    }
    const migrated = migrateLedgerV1(legacy)!
    expect(migrated.entries.map(entry => entry.categoryId)).toEqual(['food', 'uncategorized', null])
  })

  it('prefers valid V2 data, falls back from corrupt V2 to V1, and never throws on corrupt storage', () => {
    const legacy = { entries: [], startingEntries: [], startingMonth: '2026-11' }
    const storage = {
      getItem(key: string) {
        if (key === LEDGER_KEY_V2) return '{broken'
        if (key === LEDGER_KEY_V1) return JSON.stringify(legacy)
        return null
      },
    }
    expect(() => readLedger(storage)).not.toThrow()
    expect(readLedger(storage).version).toBe(2)
    expect(readLedger({ getItem: () => '{broken' }).categories).toHaveLength(defaultCategories.length)
  })
})
