import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { transformWithOxc } from 'vite'

const source = readFileSync(new URL('../src/lib/expenses.ts', import.meta.url), 'utf8')
const { code } = await transformWithOxc(source, 'expenses.ts')
const { validateEntry, saveEntry, deleteEntry, getSummary, filterEntries, rangeBounds, NO_FILTERS } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

const base = [
  { id: 'income', title: 'Allowance', categoryId: null, date: '2026-11-01', amount: 200, kind: 'income' },
  { id: 'expense', title: 'Lunch', categoryId: 'food', date: '2026-11-02', amount: 10, kind: 'expense' },
]
const form = { title: 'Coffee', categoryId: 'food', amount: '4.50', date: '2026-11-04', kind: 'expense' }
const summary = entries => getSummary(entries, base, 300, 100, '2026-11')

test('validates blank details, invalid dates, and amounts that are not above zero', () => {
  assert.deepEqual(validateEntry({ ...form, title: ' ', categoryId: '', amount: '0', date: '' }), {
    title: 'Enter a title.', amount: 'Enter an amount above zero, with up to two decimal places.', categoryId: 'Choose a category.', date: 'Choose a valid date.',
  })
  for (const amount of ['-1', 'abc', '', '0.001']) assert.ok(validateEntry({ ...form, amount }).amount)
  assert.ok(validateEntry({ ...form, date: '2026-02-30' }).date)
  assert.deepEqual(validateEntry(form), {})
})

test('adding, editing, and deleting an expense update balance and monthly spending', () => {
  const added = saveEntry(base, form, 'new')
  assert.deepEqual(summary(added), { balance: 295.5, spent: 104.5 })
  const edited = saveEntry(added, { ...form, title: 'Dinner', amount: '8', categoryId: 'other', date: '2026-11-05' }, 'new')
  assert.equal(edited.find(item => item.id === 'new').title, 'Dinner')
  assert.equal(edited.find(item => item.id === 'new').categoryId, 'other')
  assert.equal(edited.find(item => item.id === 'new').date, '2026-11-05')
  assert.deepEqual(summary(edited), { balance: 292, spent: 108 })
  assert.deepEqual(summary(deleteEntry(edited, 'new')), { balance: 300, spent: 100 })
})

test('editing an existing expense and moving an expense to another month recalculate totals', () => {
  const edited = saveEntry(base, { ...form, amount: '6', date: '2026-10-20' }, 'expense')
  assert.deepEqual(summary(edited), { balance: 304, spent: 90 })
  assert.deepEqual(summary(deleteEntry(base, 'expense')), { balance: 310, spent: 90 })
})

test('income changes balance without changing spending', () => {
  const added = saveEntry(base, { ...form, kind: 'income', categoryId: '', amount: '25' }, 'extra-income')
  assert.equal(added[0].categoryId, null)
  assert.deepEqual(summary(added), { balance: 325, spent: 100 })
})


test('lists entries newest date first, keeping saved order within a day', () => {
  const entries = [
    { id: 'old', title: 'Old', categoryId: 'food', date: '2026-11-01', amount: 1, kind: 'expense' },
    { id: 'late', title: 'Late add', categoryId: 'food', date: '2026-11-10', amount: 1, kind: 'expense' },
    { id: 'mid', title: 'Mid', categoryId: 'food', date: '2026-11-05', amount: 1, kind: 'expense' },
    { id: 'late2', title: 'Same day', categoryId: 'food', date: '2026-11-10', amount: 1, kind: 'expense' },
  ]
  assert.deepEqual(filterEntries(entries, NO_FILTERS, '2026-11-17').map(e => e.id), ['late', 'late2', 'mid', 'old'])
})

test('date ranges: this week runs Monday to Sunday, this month, and chosen dates in either order', () => {
  // 2026-11-17 is a Tuesday
  assert.deepEqual(rangeBounds({ ...NO_FILTERS, range: 'week' }, '2026-11-17'), ['2026-11-16', '2026-11-22'])
  assert.deepEqual(rangeBounds({ ...NO_FILTERS, range: 'week' }, '2026-11-22'), ['2026-11-16', '2026-11-22'])
  assert.deepEqual(rangeBounds({ ...NO_FILTERS, range: 'month' }, '2026-11-17'), ['2026-11-01', '2026-11-31'])
  assert.deepEqual(rangeBounds({ ...NO_FILTERS, range: 'custom', from: '2026-11-10', to: '2026-11-02' }, '2026-11-17'), ['2026-11-02', '2026-11-10'])
  const entries = [
    { id: 'a', title: 'A', categoryId: 'food', date: '2026-11-15', amount: 1, kind: 'expense' },
    { id: 'b', title: 'B', categoryId: 'food', date: '2026-11-16', amount: 1, kind: 'expense' },
    { id: 'c', title: 'C', categoryId: 'food', date: '2026-10-31', amount: 1, kind: 'expense' },
  ]
  assert.deepEqual(filterEntries(entries, { ...NO_FILTERS, range: 'week' }, '2026-11-17').map(e => e.id), ['b'])
  assert.deepEqual(filterEntries(entries, { ...NO_FILTERS, range: 'month' }, '2026-11-17').map(e => e.id), ['b', 'a'])
  assert.deepEqual(filterEntries(entries, { ...NO_FILTERS, range: 'custom', from: '2026-11-01', to: '' }, '2026-11-17').map(e => e.id), ['b', 'a'])
})

test('category filter shows entries from any picked category and leaves out income', () => {
  const entries = [
    { id: 'food', title: 'Food', categoryId: 'food', date: '2026-11-03', amount: 1, kind: 'expense' },
    { id: 'bus', title: 'Bus', categoryId: 'transport', date: '2026-11-02', amount: 1, kind: 'expense' },
    { id: 'gift', title: 'Gift', categoryId: 'gifts', date: '2026-11-01', amount: 1, kind: 'expense' },
    { id: 'pay', title: 'Pay', categoryId: null, date: '2026-11-04', amount: 1, kind: 'income' },
  ]
  assert.deepEqual(filterEntries(entries, { ...NO_FILTERS, categoryIds: ['food', 'transport'] }, '2026-11-17').map(e => e.id), ['food', 'bus'])
  assert.equal(filterEntries(entries, { ...NO_FILTERS, categoryIds: ['food'], range: 'today' }, '2026-11-17').length, 0)
})
