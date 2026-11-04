import type { Transaction } from '../data/demo'

export type EntryForm = {
  title: string
  amount: string
  category: string
  date: string
  kind: Transaction['kind']
}

export type FormErrors = Partial<Record<keyof EntryForm, string>>

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function validateEntry(form: EntryForm): FormErrors {
  const errors: FormErrors = {}
  const amount = Number(form.amount)
  if (!form.title.trim()) errors.title = 'Enter a title.'
  if (!/^\d+(\.\d{1,2})?$/.test(form.amount.trim()) || !Number.isFinite(amount) || amount <= 0) errors.amount = 'Enter an amount above zero, with up to two decimal places.'
  if (!form.category.trim()) errors.category = 'Choose a category.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date) || Number.isNaN(new Date(`${form.date}T12:00:00`).getTime()) || localDate(new Date(`${form.date}T12:00:00`)) !== form.date) errors.date = 'Choose a valid date.'
  return errors
}

export function saveEntry(entries: Transaction[], form: EntryForm, id: string): Transaction[] {
  const entry: Transaction = { id, title: form.title.trim(), amount: Number(form.amount), category: form.category, date: form.date, kind: form.kind }
  return entries.some(item => item.id === id)
    ? entries.map(item => item.id === id ? entry : item)
    : [entry, ...entries]
}

export function deleteEntry(entries: Transaction[], id: string): Transaction[] {
  return entries.filter(item => item.id !== id)
}

const total = (entries: Transaction[], kind: Transaction['kind'], month?: string) =>
  entries.filter(entry => entry.kind === kind && (!month || entry.date.startsWith(month))).reduce((sum, entry) => sum + entry.amount, 0)

export function getSummary(entries: Transaction[], startingEntries: Transaction[], startingBalance: number, startingSpent: number, month: string) {
  const incomeDelta = total(entries, 'income') - total(startingEntries, 'income')
  const expenseDelta = total(entries, 'expense') - total(startingEntries, 'expense')
  const monthlyExpenseDelta = total(entries, 'expense', month) - total(startingEntries, 'expense', month)
  return {
    balance: Math.round((startingBalance + incomeDelta - expenseDelta) * 100) / 100,
    spent: Math.round((startingSpent + monthlyExpenseDelta) * 100) / 100,
  }
}
