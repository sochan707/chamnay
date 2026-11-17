import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { transformWithOxc } from 'vite'

const source = readFileSync(new URL('../src/lib/bills.ts', import.meta.url), 'utf8')
const { code } = await transformWithOxc(source, 'bills.ts')
const { validateBill, saveBill, setBillStatus, isBillReminders, getDueBillReminders, markBillNotificationSent } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

const form = { name: 'Electricity', amount: '23.50', dueDate: '2026-12-01', alertAt: '2026-11-30T09:00' }
const now = new Date('2026-11-15T00:00:00').getTime()

test('validates required bill details and a future alert time', () => {
  assert.deepEqual(validateBill({ ...form, name: ' ', amount: '0', dueDate: '2026-02-30', alertAt: '' }, now), {
    name: 'Enter a bill name.', amount: 'Enter an amount above zero, with up to two decimal places.', dueDate: 'Choose a valid due date.', alertAt: 'Choose a valid alert time.',
  })
  assert.ok(validateBill({ ...form, alertAt: '2026-11-14T09:00' }, now).alertAt)
  assert.deepEqual(validateBill(form, now), {})
})

test('creates bill reminders and moves paid or dismissed bills out of the upcoming list', () => {
  const bills = saveBill([], form, 'bill-1')
  assert.deepEqual(bills[0], { id: 'bill-1', name: 'Electricity', amount: 23.5, dueDate: '2026-12-01', alertAt: '2026-11-30T09:00', status: 'upcoming' })
  const edited = saveBill(bills, { ...form, name: 'Water', amount: '30' }, 'bill-1')
  assert.equal(edited.length, 1)
  assert.equal(edited[0].name, 'Water')
  assert.equal(edited[0].amount, 30)
  const paid = setBillStatus(bills, 'bill-1', 'paid')
  assert.equal(paid[0].status, 'paid')
  assert.equal(setBillStatus(paid, 'bill-1', 'dismissed')[0].status, 'dismissed')
  assert.equal(setBillStatus(paid, 'bill-1', 'upcoming')[0].status, 'upcoming')
  assert.equal(setBillStatus(bills, 'bill-1', 'dismissed')[0].status, 'dismissed')
  assert.equal(isBillReminders(bills), true)
  assert.equal(isBillReminders([{ ...bills[0], status: 'unknown' }]), false)
})

test('delivers a due reminder once and retains its sent state', () => {
  const bills = saveBill([], form, 'bill-1')
  const dueAt = new Date(form.alertAt).getTime()
  assert.deepEqual(getDueBillReminders(bills, dueAt), bills)
  const sent = markBillNotificationSent(bills, 'bill-1', new Date(dueAt).toISOString())
  assert.deepEqual(getDueBillReminders(sent, dueAt + 1), [])
  assert.equal(saveBill(sent, form, 'bill-1')[0].notificationSentAt, new Date(dueAt).toISOString())
  assert.equal(saveBill(sent, { ...form, alertAt: '2026-11-30T10:00' }, 'bill-1')[0].notificationSentAt, undefined)
  assert.deepEqual(getDueBillReminders([sent[0], { ...sent[0], id: 'bill-2', status: 'paid', notificationSentAt: undefined }], dueAt), [])
})
