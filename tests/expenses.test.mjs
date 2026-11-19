import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { transformWithOxc } from 'vite'

const source = readFileSync(new URL('../src/lib/expenses.ts', import.meta.url), 'utf8')
const { code } = await transformWithOxc(source, 'expenses.ts')
const { validateEntry, saveEntry, deleteEntry, getSummary, monthlySpending, newestFirst, isWithinDateRange, filterEntries, localDate } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

const base = [
  { id: 'income', title: 'Allowance', category: 'Income', date: '2026-11-01', amount: 200, kind: 'income' },
  { id: 'expense', title: 'Lunch', category: 'Food', date: '2026-11-02', amount: 10, kind: 'expense' },
]
const form = { title: 'Coffee', category: 'Food', amount: '4.50', date: '2026-11-04', kind: 'expense' }
const summary = entries => getSummary(entries, base, 300, '2026-11')

test('validates blank details, invalid dates, and amounts that are not above zero', () => {
  assert.deepEqual(validateEntry({ ...form, title: ' ', category: '', amount: '0', date: '' }), {
    title: 'Enter a title.', amount: 'Enter an amount above zero, with up to two decimal places.', category: 'Choose a category.', date: 'Choose a valid date.',
  })
  for (const amount of ['-1', 'abc', '', '0.001']) assert.ok(validateEntry({ ...form, amount }).amount)
  assert.ok(validateEntry({ ...form, date: '2026-02-30' }).date)
  assert.deepEqual(validateEntry(form), {})
})

test('entries can use today but cannot be saved with a future date', () => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  assert.equal(validateEntry({ ...form, date: localDate(today) }).date, undefined)
  assert.equal(validateEntry({ ...form, date: localDate(tomorrow) }).date, 'Choose today or an earlier date.')
})

test('adding, editing, and deleting an expense update balance and monthly spending', () => {
  const added = saveEntry(base, form, 'new')
  assert.deepEqual(summary(added), { balance: 295.5, spent: 14.5 })
  const edited = saveEntry(added, { ...form, title: 'Dinner', amount: '8', category: 'Other', date: '2026-11-05' }, 'new')
  assert.equal(edited.find(item => item.id === 'new').title, 'Dinner')
  assert.equal(edited.find(item => item.id === 'new').category, 'Other')
  assert.equal(edited.find(item => item.id === 'new').date, '2026-11-05')
  assert.deepEqual(summary(edited), { balance: 292, spent: 18 })
  assert.deepEqual(summary(deleteEntry(edited, 'new')), { balance: 300, spent: 10 })
})

test('editing an existing expense and moving an expense to another month recalculate totals', () => {
  const edited = saveEntry(base, { ...form, amount: '6', date: '2026-10-20' }, 'expense')
  assert.deepEqual(summary(edited), { balance: 304, spent: 0 })
  assert.deepEqual(summary(deleteEntry(base, 'expense')), { balance: 310, spent: 0 })
})

test('income changes balance without changing spending', () => {
  const added = saveEntry(base, { ...form, kind: 'income', category: 'Income', amount: '25' }, 'extra-income')
  assert.deepEqual(summary(added), { balance: 325, spent: 10 })
})

test('home summary and Spending use the same recorded expense total', () => {
  const entries = saveEntry(base, form, 'new')
  assert.equal(summary(entries).spent, monthlySpending(entries, '2026-11'))
  assert.equal(monthlySpending(entries, '2026-10'), 0)
  assert.equal(monthlySpending(deleteEntry(entries, 'expense'), '2026-11'), 4.5)
})

test('history shows saved entries newest first without changing their stored order', () => {
  const older = { ...base[1], id: 'older', date: '2026-10-30' }
  const sameDay = { ...base[1], id: 'same-day', date: '2026-11-04' }
  const saved = saveEntry([older, sameDay, ...base], form, 'new')
  assert.deepEqual(newestFirst(saved).map(entry => entry.id), ['new', 'same-day', 'expense', 'income', 'older'])
  assert.deepEqual(saved.map(entry => entry.id), ['new', 'older', 'same-day', 'income', 'expense'])
})

test('date range includes both selected days and works across months', () => {
  assert.equal(isWithinDateRange('2026-10-31', '2026-10-31', '2026-11-02'), true)
  assert.equal(isWithinDateRange('2026-11-02', '2026-10-31', '2026-11-02'), true)
  assert.equal(isWithinDateRange('2026-10-30', '2026-10-31', '2026-11-02'), false)
  assert.equal(isWithinDateRange('2026-11-03', '2026-10-31', '2026-11-02'), false)
  assert.equal(isWithinDateRange('2026-11-03', '', ''), true)
})

test('date and category filters return every matching entry across months', () => {
  const entries = [
    ...base,
    { id: 'oct-food', title: 'October meal', category: 'Food', date: '2026-10-31', amount: 5, kind: 'expense' },
    { id: 'nov-food', title: 'November meal', category: 'Food', date: '2026-11-03', amount: 6, kind: 'expense' },
    { id: 'nov-ride', title: 'Ride', category: 'Transport', date: '2026-11-03', amount: 2, kind: 'expense' },
  ]
  assert.deepEqual(filterEntries(entries, '2026-10-31', '2026-11-03', 'Food').map(entry => entry.id), ['nov-food', 'expense', 'oct-food'])
  assert.deepEqual(filterEntries(entries, '', '', 'Food').map(entry => entry.id), ['nov-food', 'expense', 'oct-food'])
  assert.deepEqual(filterEntries(entries, '2026-11-03', '2026-11-03', 'all').map(entry => entry.id), ['nov-food', 'nov-ride'])
})
