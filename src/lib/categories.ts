import type { Transaction } from '../data/demo'

export const CATEGORY_ICON_KEYS = [
  'tag', 'utensils', 'bus', 'receipt', 'shopping-bag', 'shapes',
  'heart', 'book', 'gamepad', 'home', 'gift', 'coffee',
] as const

export const CATEGORY_COLOR_KEYS = ['rose', 'peach', 'amber', 'sage', 'blue', 'lavender'] as const

export type CategoryIconKey = typeof CATEGORY_ICON_KEYS[number]
export type CategoryColorKey = typeof CATEGORY_COLOR_KEYS[number]
export type CategorySource = 'system' | 'custom'

export type Category = {
  id: string
  name: string
  icon: CategoryIconKey
  color: CategoryColorKey
  source: CategorySource
}

export type CategoryInput = Pick<Category, 'name' | 'icon' | 'color'>
export type CategoryErrors = Partial<Record<keyof CategoryInput, string>>

export const defaultCategories: Category[] = [
  { id: 'food', name: 'Food', icon: 'utensils', color: 'peach', source: 'system' },
  { id: 'transport', name: 'Transport', icon: 'bus', color: 'blue', source: 'system' },
  { id: 'bills', name: 'Bills', icon: 'receipt', color: 'amber', source: 'system' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: 'lavender', source: 'system' },
  { id: 'other', name: 'Other', icon: 'shapes', color: 'sage', source: 'system' },
  { id: 'uncategorized', name: 'Uncategorized', icon: 'tag', color: 'rose', source: 'system' },
]

const iconKeys = new Set<string>(CATEGORY_ICON_KEYS)
const colorKeys = new Set<string>(CATEGORY_COLOR_KEYS)

export function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Category>
  return typeof item.id === 'string' && item.id.length > 0
    && typeof item.name === 'string' && item.name.trim().length > 0
    && typeof item.icon === 'string' && iconKeys.has(item.icon)
    && typeof item.color === 'string' && colorKeys.has(item.color)
    && (item.source === 'system' || item.source === 'custom')
}

export function validateCategory(input: CategoryInput, categories: Category[], editingId?: string): CategoryErrors {
  const errors: CategoryErrors = {}
  const name = input.name.trim()
  if (!name) errors.name = 'Enter a category name.'
  else if (name.length > 30) errors.name = 'Use 30 characters or fewer.'
  else if (categories.some(category => category.id !== editingId && category.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) errors.name = 'That category name is already in use.'
  if (!iconKeys.has(input.icon)) errors.icon = 'Choose an icon.'
  if (!colorKeys.has(input.color)) errors.color = 'Choose a color.'
  return errors
}

export function addCustomCategory(categories: Category[], input: CategoryInput, id: string): Category[] {
  if (Object.keys(validateCategory(input, categories)).length) return categories
  return [...categories, { id, name: input.name.trim(), icon: input.icon, color: input.color, source: 'custom' }]
}

export function updateCustomCategory(categories: Category[], id: string, input: CategoryInput): Category[] {
  const existing = categories.find(category => category.id === id)
  if (!existing || existing.source !== 'custom' || Object.keys(validateCategory(input, categories, id)).length) return categories
  return categories.map(category => category.id === id ? { ...category, name: input.name.trim(), icon: input.icon, color: input.color } : category)
}

export function removeCustomCategory(categories: Category[], entries: Transaction[], id: string, destinationId: string) {
  const target = categories.find(category => category.id === id)
  const destination = categories.find(category => category.id === destinationId)
  if (!target || target.source !== 'custom' || !destination || destination.id === target.id) return { categories, entries }
  return {
    categories: categories.filter(category => category.id !== id),
    entries: entries.map(entry => entry.kind === 'expense' && entry.categoryId === id ? { ...entry, categoryId: destinationId } : entry),
  }
}

export function findCategory(categories: Category[], id: string | null): Category {
  return categories.find(category => category.id === id)
    ?? categories.find(category => category.id === 'uncategorized')
    ?? defaultCategories.at(-1)!
}

export function categoryIdFromLegacyName(name: string): string {
  const match = defaultCategories.find(category => category.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase())
  return match?.id ?? 'uncategorized'
}
