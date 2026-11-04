import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { transformWithOxc } from 'vite'

const source = readFileSync(new URL('../src/lib/expenses.ts', import.meta.url), 'utf8')
const { code } = await transformWithOxc(source, 'expenses.ts')
const { validateEntry, saveEntry, deleteEntry, getSummary } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

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
