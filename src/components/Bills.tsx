import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bell, BellRing, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Pencil, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDueBillReminders, isBillReminders, markBillNotificationSent, saveBill, setBillStatus, validateBill, type BillForm, type BillFormErrors, type BillReminder } from '../lib/bills'
import './bills.css'

const storageKey = 'chamnay.bill-reminders.v1'
const money = (amount: number) => `$${amount.toFixed(2)}`
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

function localDateTime(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function formForDate(dueDate: string): BillForm {
  const alertAt = new Date(`${dueDate}T09:00`)
  if (alertAt.getTime() <= Date.now()) {
    alertAt.setTime(Date.now())
    alertAt.setDate(alertAt.getDate() + 1)
    alertAt.setHours(9, 0, 0, 0)
  }
  return { name: '', amount: '', dueDate, alertAt: localDateTime(alertAt) }
}

function defaultForm(): BillForm {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return formForDate(dateKey(tomorrow))
}

function readBills(): BillReminder[] {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const parsed: unknown = JSON.parse(saved)
      if (isBillReminders(parsed)) return parsed
    }
  } catch { /* Browser storage may be disabled. */ }
  return []
}

function formatDueDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatAlertTime(value: string) {
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

async function notify(bill: BillReminder): Promise<boolean> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false
  const options = { body: `${money(bill.amount)} is due ${formatDueDate(bill.dueDate)}.` }
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(`Bill reminder: ${bill.name}`, options)
      return true
    }
  } catch { /* Fall back to the page notification where supported. */ }
  try {
    new Notification(`Bill reminder: ${bill.name}`, options)
    return true
  } catch { /* The browser may block notifications in an inactive tab. */ }
  return false
}

export function Bills({ active = true }: { active?: boolean }) {
  const [bills, setBills] = useState<BillReminder[]>(readBills)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()))
  const [today, setToday] = useState(() => dateKey(new Date()))
  const [form, setForm] = useState<BillForm>(defaultForm)
  const [errors, setErrors] = useState<BillFormErrors>({})
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const formDialog = useRef<HTMLDialogElement>(null)
  const [notice, setNotice] = useState('')
  const [showAllClosed, setShowAllClosed] = useState(false)
  const pendingNotifications = useRef(new Set<string>())
  const upcoming = bills.filter(bill => bill.status === 'upcoming').sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const closed = bills.filter(bill => bill.status !== 'upcoming')
  const visibleClosed = showAllClosed ? closed : closed.slice(0, 5)
  const firstWeekday = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay()
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate()
  const calendarCellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7
  const calendarDates = Array.from({ length: calendarCellCount }, (_, index) => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index - firstWeekday + 1))
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(bills)) } catch { /* Browser storage may be disabled. */ }
  }, [bills])

  useEffect(() => {
    let timer = 0
    const updateAtMidnight = () => {
      const now = new Date()
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = window.setTimeout(() => {
        setToday(dateKey(new Date()))
        updateAtMidnight()
      }, midnight.getTime() - now.getTime() + 1000)
    }
    updateAtMidnight()
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const dialog = formDialog.current
    if (!dialog) return
    if (formOpen && !dialog.open) dialog.showModal()
    else if (!formOpen && dialog.open) dialog.close()
  }, [formOpen])

  useEffect(() => {
    const checkDueReminders = () => {
      const due = getDueBillReminders(bills)
      due.forEach(bill => {
        if (pendingNotifications.current.has(bill.id)) return
        pendingNotifications.current.add(bill.id)
        void notify(bill).then(sent => {
          if (sent) setBills(current => markBillNotificationSent(current, bill.id, new Date().toISOString()))
        }).finally(() => pendingNotifications.current.delete(bill.id))
      })
    }
    checkDueReminders()
    const cancelTimers = bills.filter(bill => bill.status === 'upcoming' && !bill.notificationSentAt).map(bill => {
      const initialDelay = new Date(bill.alertAt).getTime() - Date.now()
      if (!Number.isFinite(initialDelay) || initialDelay <= 0) return () => {}
      let timer = 0
      const checkTime = () => {
        const delay = new Date(bill.alertAt).getTime() - Date.now()
        if (delay <= 0) {
          checkDueReminders()
          return
        }
        timer = window.setTimeout(checkTime, Math.min(delay, 2_147_000_000))
      }
      checkTime()
      return () => window.clearTimeout(timer)
    })
    window.addEventListener('focus', checkDueReminders)
    document.addEventListener('visibilitychange', checkDueReminders)
    return () => {
      cancelTimers.forEach(cancel => cancel())
      window.removeEventListener('focus', checkDueReminders)
      document.removeEventListener('visibilitychange', checkDueReminders)
    }
  }, [bills])

  async function requestNotificationPermission() {
    if (typeof Notification === 'undefined') {
      setNotice('This browser does not support notifications. Your bill is still saved.')
      return
    }
    if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission()
        setNotice(permission === 'granted' ? 'Notifications are on for this browser.' : 'Notifications are off. You can still see your bill reminders here.')
      } catch {
        setNotice('Notification permission could not be requested. Your bill is still saved.')
      }
    } else if (Notification.permission === 'denied') {
      setNotice('Notifications are blocked in this browser. You can change this in browser settings.')
    } else {
      setNotice('Notifications are on for this browser.')
    }
  }

  async function addBill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateBill(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    await requestNotificationPermission()
    setBills(old => saveBill(old, form, editId ?? crypto.randomUUID()))
    setForm(defaultForm())
    setErrors({})
    setEditId(null)
    setFormOpen(false)
  }

  function closeBill(id: string, status: 'paid' | 'dismissed') {
    setBills(old => setBillStatus(old, id, status))
  }

  function updateClosedBillStatus(id: string, status: 'upcoming' | 'paid' | 'dismissed') {
    setBills(old => setBillStatus(old, id, status))
  }

  function chooseDate(date: Date) {
    const value = dateKey(date)
    setSelectedDate(value)
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    setEditId(null)
    setForm(formForDate(value))
    setErrors({})
    setFormOpen(true)
  }

  function editReminder(bill: BillReminder) {
    const date = new Date(`${bill.dueDate}T12:00:00`)
    setSelectedDate(bill.dueDate)
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    setEditId(bill.id)
    setForm({ name: bill.name, amount: String(bill.amount), dueDate: bill.dueDate, alertAt: bill.alertAt })
    setErrors({})
    setFormOpen(true)
  }

  function moveMonth(offset: number) {
    setVisibleMonth(month => new Date(month.getFullYear(), month.getMonth() + offset, 1))
  }

  return <section className="bills-page" hidden={!active} aria-labelledby="bills-title">
    <div className="bills-header"><div><h1 id="bills-title">Bill reminders</h1><p>Select a day to add a bill and choose when to be reminded.</p></div></div>
    {notice && <p className="bill-notice" role="status"><Bell size={16} />{notice}<button aria-label="Dismiss notification message" onClick={() => setNotice('')}><X size={15} /></button></p>}
    <section className="calendar" aria-label="Bill due date calendar">
      <div className="calendar-toolbar"><div className="calendar-month"><CalendarDays size={19} /><h2>{visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2></div><div className="calendar-controls"><button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft size={19} /></button><button type="button" className="calendar-today" onClick={() => { const now = new Date(); setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDate(today) }}>Today</button><button type="button" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight size={19} /></button><Button className="calendar-add" onClick={() => { setEditId(null); setForm(formForDate(selectedDate)); setErrors({}); setFormOpen(true) }} aria-label={`Add bill due ${formatDueDate(selectedDate)}`}><Plus size={17} /><span>Add bill</span></Button></div></div>
      <div className="calendar-weekdays" aria-hidden="true">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">{calendarDates.map(date => {
        const value = dateKey(date)
        const dayBills = upcoming.filter(bill => bill.dueDate === value)
        const currentMonth = date.getMonth() === visibleMonth.getMonth()
        const dateLabel = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        return <button type="button" key={value} className={`calendar-day${currentMonth ? '' : ' outside-month'}${value === selectedDate ? ' selected' : ''}${value === today ? ' is-today' : ''}`} onClick={() => chooseDate(date)} aria-label={`${dateLabel}${dayBills.length ? `, ${dayBills.length} ${dayBills.length === 1 ? 'bill' : 'bills'} due` : ''}. Add bill reminder`} aria-pressed={value === selectedDate}>
          <span className="calendar-day-number">{date.getDate()}</span>{dayBills.length > 0 && <span className="calendar-markers" aria-hidden="true">{dayBills.slice(0, 3).map(bill => <i key={bill.id} />)}{dayBills.length > 3 && <small>+{dayBills.length - 3}</small>}</span>}
        </button>
      })}</div>
    </section>
    <dialog ref={formDialog} className="bill-dialog" aria-labelledby="new-bill-title" onCancel={event => { event.preventDefault(); setFormOpen(false) }} onClick={event => { if (event.target === event.currentTarget) setFormOpen(false) }}>
      <form className="bill-form" onSubmit={addBill} noValidate>
      <div className="bill-form-heading"><div><h2 id="new-bill-title">{editId ? 'Edit bill reminder' : 'New bill reminder'}</h2><p>Choose when you’d like to be notified.</p></div><button type="button" aria-label="Close form" onClick={() => setFormOpen(false)}><X size={18} /></button></div>
      <label>Bill name<input autoFocus value={form.name} aria-invalid={!!errors.name} onChange={event => { setForm({ ...form, name: event.target.value }); setErrors(old => ({ ...old, name: undefined })) }} placeholder="e.g. Internet bill" />{errors.name && <small>{errors.name}</small>}</label>
      <div className="bill-form-row"><label>Amount<input type="number" min="0.01" step="0.01" inputMode="decimal" value={form.amount} aria-invalid={!!errors.amount} onChange={event => { setForm({ ...form, amount: event.target.value }); setErrors(old => ({ ...old, amount: undefined })) }} placeholder="0.00" />{errors.amount && <small>{errors.amount}</small>}</label><label>Due date<input type="date" value={form.dueDate} aria-invalid={!!errors.dueDate} onChange={event => { setForm({ ...form, dueDate: event.target.value }); setErrors(old => ({ ...old, dueDate: undefined })) }} />{errors.dueDate && <small>{errors.dueDate}</small>}</label></div>
      <label>Alert time<input type="datetime-local" value={form.alertAt} aria-invalid={!!errors.alertAt} onChange={event => { setForm({ ...form, alertAt: event.target.value }); setErrors(old => ({ ...old, alertAt: undefined })) }} />{errors.alertAt && <small>{errors.alertAt}</small>}</label>
      <div className="bill-form-actions"><Button type="button" className="bill-cancel" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" className="bill-save">{editId ? 'Save changes' : 'Save reminder'}</Button></div>
      </form>
    </dialog>
    <div className="bill-section-heading"><div><h2>To pay</h2><span>{upcoming.length} {upcoming.length === 1 ? 'bill' : 'bills'}</span></div>{typeof Notification !== 'undefined' && Notification.permission === 'granted' && <span className="notification-enabled"><BellRing size={14} /> Alerts on</span>}</div>
    {upcoming.length ? <div className="bill-list">{upcoming.map(bill => <article className="bill-row" key={bill.id}><span className="bill-symbol"><Clock3 size={19} /></span><div className="bill-detail"><strong>{bill.name}</strong><span>Due {formatDueDate(bill.dueDate)} · Alert {formatAlertTime(bill.alertAt)}</span></div><strong className="bill-amount">{money(bill.amount)}</strong><div className="bill-row-actions"><button type="button" className="edit-action" aria-label={`Edit ${bill.name}`} onClick={() => editReminder(bill)}><Pencil size={15} /></button><button type="button" className="paid-action" onClick={() => closeBill(bill.id, 'paid')}><Check size={15} /> Paid</button><button type="button" className="dismiss-action" aria-label={`Dismiss ${bill.name}`} onClick={() => closeBill(bill.id, 'dismissed')}><X size={15} /></button></div></article>)}</div> : <div className="bill-empty"><span><Bell size={21} /></span><h3>No bills to pay</h3><p>Add a reminder to keep your next due date in view.</p><Button className="empty-add-bill" onClick={() => { setEditId(null); setForm(defaultForm()); setErrors({}); setFormOpen(true) }}>Add a bill</Button></div>}
    {closed.length > 0 && <section className="closed-bills" aria-labelledby="closed-bills-title"><h2 id="closed-bills-title">Recently closed</h2>{visibleClosed.map(bill => <article className="closed-bill" key={bill.id}><span className={`closed-status ${bill.status}`}>{bill.status === 'paid' ? 'Paid' : 'Dismissed'}</span><strong>{bill.name}</strong><span className="closed-amount">{money(bill.amount)}</span><div className="closed-bill-actions"><button type="button" className="closed-status-action" aria-label={`Mark ${bill.name} as ${bill.status === 'paid' ? 'dismissed' : 'paid'}`} onClick={() => updateClosedBillStatus(bill.id, bill.status === 'paid' ? 'dismissed' : 'paid')}>Mark {bill.status === 'paid' ? 'dismissed' : 'paid'}</button><button type="button" className="reopen-action" aria-label={`Reopen ${bill.name}`} onClick={() => updateClosedBillStatus(bill.id, 'upcoming')}>Reopen</button></div></article>)}{closed.length > 5 && <button type="button" className="closed-bills-toggle" aria-expanded={showAllClosed} onClick={() => setShowAllClosed(value => !value)}>{showAllClosed ? 'Show less' : `See more (${closed.length - 5})`}</button>}</section>}
    <p className="bill-footnote">Reminders use this browser’s notifications. Keep Chamnay open around the alert time for the most reliable delivery.</p>
  </section>
}
