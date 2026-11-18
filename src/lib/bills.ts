export type BillStatus = 'upcoming' | 'paid' | 'dismissed'

export type BillReminder = {
  id: string
  name: string
  dueDate: string
  amount: number
  alertAt: string
  status: BillStatus
  notificationSentAt?: string
}

export type BillForm = {
  name: string
  dueDate: string
  amount: string
  alertAt: string
}

export type BillFormErrors = Partial<Record<keyof BillForm, string>>

export function isBillReminders(value: unknown): value is BillReminder[] {
  return Array.isArray(value) && value.every(item => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.dueDate === 'string' && typeof item.amount === 'number' && Number.isFinite(item.amount) && typeof item.alertAt === 'string' && (item.status === 'upcoming' || item.status === 'paid' || item.status === 'dismissed') && (item.notificationSentAt === undefined || typeof item.notificationSentAt === 'string'))
}

export function getDueBillReminders(bills: BillReminder[], now = Date.now()): BillReminder[] {
  return bills.filter(bill => bill.status === 'upcoming' && !bill.notificationSentAt && Number.isFinite(new Date(bill.alertAt).getTime()) && new Date(bill.alertAt).getTime() <= now)
}

export function markBillNotificationSent(bills: BillReminder[], id: string, sentAt: string): BillReminder[] {
  return bills.map(bill => bill.id === id ? { ...bill, notificationSentAt: sentAt } : bill)
}

export function validateBill(form: BillForm, now = Date.now()): BillFormErrors {
  const errors: BillFormErrors = {}
  const amount = Number(form.amount)
  if (!form.name.trim()) errors.name = 'Enter a bill name.'
  if (!/^\d+(\.\d{1,2})?$/.test(form.amount.trim()) || !Number.isFinite(amount) || amount <= 0) errors.amount = 'Enter an amount above zero, with up to two decimal places.'
  const dueDate = new Date(`${form.dueDate}T12:00:00`)
  const [year, month, day] = form.dueDate.split('-').map(Number)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dueDate) || Number.isNaN(dueDate.getTime()) || dueDate.getFullYear() !== year || dueDate.getMonth() + 1 !== month || dueDate.getDate() !== day) errors.dueDate = 'Choose a valid due date.'
  const alertDate = new Date(form.alertAt)
  if (!form.alertAt || Number.isNaN(alertDate.getTime())) errors.alertAt = 'Choose a valid alert time.'
  else if (alertDate.getTime() <= now) errors.alertAt = 'Choose a time in the future.'
  return errors
}

export function saveBill(bills: BillReminder[], form: BillForm, id: string): BillReminder[] {
  const existing = bills.find(item => item.id === id)
  const bill: BillReminder = { id, name: form.name.trim(), dueDate: form.dueDate, amount: Number(form.amount), alertAt: form.alertAt, status: existing?.status ?? 'upcoming', ...(existing?.alertAt === form.alertAt && existing.notificationSentAt ? { notificationSentAt: existing.notificationSentAt } : {}) }
  return existing ? bills.map(item => item.id === id ? bill : item) : [bill, ...bills]
}

export function setBillStatus(bills: BillReminder[], id: string, status: BillStatus): BillReminder[] {
  return bills.map(bill => bill.id === id ? { ...bill, status } : bill)
}
