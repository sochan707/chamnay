import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router'
import { X } from 'lucide-react'
import { demoBudget, demoTransactions, type Transaction } from './data/demo'
import { deleteEntry, getSummary, localDate, saveEntry, validateEntry, type EntryForm, type FormErrors } from './lib/expenses'
import { Button } from '@/components/ui/button'
import './home.css'

const icon = (n: number) => `/figma/icon-${n}.svg`
const money = (n: number) => `${n < 0 ? '−' : ''}$${Math.abs(n).toFixed(2)}`
const storageKey = 'chamnay.ledger.v1'
type Ledger = { entries: Transaction[]; startingEntries: Transaction[]; startingMonth: string }
const categories = ['Food', 'Transport', 'Bills', 'Shopping', 'Income', 'Other']
const nav = [
  { label: 'Home', to: '/', icon: 16 },
  { label: 'Bills', to: '/bills', icon: 17 },
  { label: 'Savings', to: '/savings', icon: 18 },
  { label: 'Settings', to: '/settings', icon: 19 },
]

function isTransactions(value: unknown): value is Transaction[] {
  return Array.isArray(value) && value.every(item => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.category === 'string' && typeof item.date === 'string' && typeof item.amount === 'number' && Number.isFinite(item.amount) && (item.kind === 'expense' || item.kind === 'income'))
}

function readLedger(): Ledger {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const parsed: unknown = JSON.parse(saved)
      if (parsed && typeof parsed === 'object' && 'entries' in parsed && 'startingEntries' in parsed && 'startingMonth' in parsed && isTransactions(parsed.entries) && isTransactions(parsed.startingEntries) && typeof parsed.startingMonth === 'string') return parsed as Ledger
    }
  } catch { /* Browser storage may be disabled. */ }
  return { entries: demoTransactions, startingEntries: demoTransactions, startingMonth: localDate().slice(0, 7) }
}

function Brand() {
  return <Link className="brand" to="/" aria-label="Chamnay home"><span className="brand-mark"><img src={icon(15)} alt="" /><i /></span><span className="brand-name">chamnay<span>.</span></span></Link>
}

function Navigation({ mobile = false }: { mobile?: boolean }) {
  return <nav className={mobile ? 'mobile-nav' : 'side-nav'} aria-label="Main navigation">{nav.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><img src={icon(item.icon)} alt="" /><span>{item.label}</span></NavLink>)}</nav>
}

function Shell() {
  const location = useLocation()
  const page = nav.find(item => item.to === location.pathname)?.label ?? 'Home'
  return <div className="app-shell"><aside className="sidebar"><Brand /><p className="tagline">A little space for your money</p><Navigation /><div className="sidebar-note"><span><img src={icon(20)} alt="" /></span><strong>Small steps count.</strong><small>One clear day at a time.</small></div></aside><div className="main-shell"><header className="topbar"><div className="mobile-brand"><Brand /></div><div className="breadcrumb">Your space <span>/</span> {page}</div><div className="profile"><span>Sarin Meas</span><b>SM</b></div></header><main className="page"><Routes><Route path="/" element={<Home />} />{nav.slice(1).map(item => <Route key={item.to} path={item.to} element={<Planned title={item.label} />} />)}<Route path="*" element={<Planned title="Page not found" />} /></Routes></main></div><Navigation mobile /></div>
}

function Planned({ title }: { title: string }) {
  return <section className="planned"><h1>{title}</h1><p>This part of Chamnay is planned for a future prototype step.</p><Link to="/">Back to Home</Link></section>
}

function Summary({ balance, spent }: { balance: number; spent: number }) {
  const percent = Math.round(spent / demoBudget.monthlyBudget * 100)
  return <section className="summary" aria-label="Monthly money summary"><div className="balance"><div className="balance-copy"><span>Available balance</span><strong>{money(balance)}</strong><p>Here’s what you have left to work with.</p></div><div className="balance-art" aria-hidden="true"><img src={icon(2)} alt="" /><i className="bubble small" /><i className="bubble medium" /><i className="bubble large" /></div></div><div className="plan"><div className="plan-values"><div><span>Spent this month</span><strong>{money(spent)}</strong></div><div><span>Monthly plan</span><strong>{money(demoBudget.monthlyBudget)}</strong></div></div><div className="progress-label"><span>Budget used</span><strong>{percent}%</strong></div><div className="progress"><span style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} /></div></div></section>
}

function displayDate(date: string, today: string) {
  if (date === today) return 'Today'
  const yesterday = new Date(`${today}T12:00:00`)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date === localDate(yesterday)) return 'Yesterday'
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function Home() {
  const [ledger, setLedger] = useState<Ledger>(readLedger)
  const { entries, startingEntries, startingMonth } = ledger
  const setEntries = (update: (entries: Transaction[]) => Transaction[]) => setLedger(old => ({ ...old, entries: update(old.entries) }))
  const [dateFilter, setDateFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<EntryForm>({ title: '', category: '', amount: '', kind: 'expense', date: localDate() })
  const [errors, setErrors] = useState<FormErrors>({})
  const [dialog, setDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const today = localDate()
  const month = today.slice(0, 7)
  const summary = getSummary(entries, startingEntries, demoBudget.balance, startingMonth === month ? demoBudget.spent : 0, month)
  const visible = useMemo(() => entries.filter(entry => {
    const dateMatches = dateFilter === 'all' || (dateFilter === 'today' && entry.date === today) || (dateFilter === 'yesterday' && displayDate(entry.date, today) === 'Yesterday')
    return dateMatches && (categoryFilter === 'all' || entry.category === categoryFilter)
  }), [entries, dateFilter, categoryFilter, today])

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(ledger)) } catch { /* Browser storage may be disabled. */ }
  }, [ledger])

  function open(entry?: Transaction) {
    setEditId(entry?.id ?? null)
    setForm(entry ? { title: entry.title, category: entry.category, amount: String(entry.amount), kind: entry.kind, date: entry.date } : { title: '', category: '', amount: '', kind: 'expense', date: today })
    setErrors({})
    setDialog(true)
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateEntry(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setEntries(old => saveEntry(old, form, editId ?? crypto.randomUUID()))
    setDialog(false)
  }

  function confirmDelete() {
    if (deleteTarget) setEntries(old => deleteEntry(old, deleteTarget.id))
    setDeleteTarget(null)
  }

  return <>
    <div className="intro"><div><p className="greeting">Hi, Sarin <img src="/figma/sparkle-small.svg" alt="" /></p><h1>Your money, in view.</h1><p className="subtitle">A calm look at what came in and went out.</p></div><div className="month"><img src={icon(1)} alt="" /><span>{new Date(`${today}T12:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span></div></div>
    <Summary {...summary} />
    <div className="lower"><section className="activity" aria-labelledby="activity-title"><div className="activity-heading"><div><h2 id="activity-title">Money in &amp; out</h2><p>All your recent activity, in one place.</p></div><Button className="add-entry" onClick={() => open()}><img src={icon(3)} alt="" />Add entry</Button></div><div className="filters"><label className="filter"><img src={icon(4)} alt="" /><select aria-label="Filter by date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}><option value="all">All dates</option><option value="today">Today</option><option value="yesterday">Yesterday</option></select><img className="chevron" src={icon(5)} alt="" /></label><label className="filter"><select aria-label="Filter by category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="all">All categories</option>{categories.map(item => <option key={item}>{item}</option>)}</select><img className="chevron" src={icon(5)} alt="" /></label></div><div className="entry-list">{visible.length ? visible.map(entry => <div className="entry" key={entry.id}><span className={`entry-icon ${entry.kind}`}><img src={icon(entry.kind === 'income' ? 9 : 6)} alt="" /></span><div className="entry-info"><strong>{entry.title}</strong><small>{entry.category} · {displayDate(entry.date, today)}</small></div><strong className={`entry-amount ${entry.kind}`}>{entry.kind === 'income' ? '+' : '−'}{money(entry.amount)}</strong><div className="entry-actions"><button aria-label={`Edit ${entry.title}`} onClick={() => open(entry)}><img src={icon(7)} alt="" /></button><button aria-label={`Delete ${entry.title}`} onClick={() => setDeleteTarget(entry)}><img src={icon(8)} alt="" /></button></div></div>) : <p className="entry-empty">No entries match these filters.</p>}</div></section><aside className="ahead" aria-labelledby="ahead-title"><div className="ahead-heading"><h2 id="ahead-title">A little look ahead</h2><img src={icon(10)} alt="" /></div><div className="ahead-grid"><article className="ahead-card bill"><span className="ahead-icon"><img src={icon(11)} alt="" /></span><small>Coming up</small><h3>Phone bill</h3><p>Due Nov 3</p><strong className="bill-amount">$18.00</strong><Link to="/bills">View bills <img src={icon(12)} alt="" /></Link></article><article className="ahead-card savings"><span className="ahead-icon"><img src={icon(13)} alt="" /></span><small>Savings goal</small><h3>$180.00 <span>of $300.00</span></h3><div className="savings-progress"><span /></div><Link to="/savings">See your goal <img src={icon(14)} alt="" /></Link></article></div></aside></div>
    <p className="sample-note">Sample starting figures for this prototype. Your changes are saved in this browser.</p>
    {dialog && <div className="dialog-backdrop"><section className="entry-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="dialog-heading"><h2 id="dialog-title">{editId ? 'Edit entry' : 'Add entry'}</h2><button aria-label="Close" onClick={() => setDialog(false)}><X size={18} /></button></div><form noValidate onSubmit={save}><label>Title<input autoFocus value={form.title} aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-error' : undefined} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What was it for?" />{errors.title && <small className="field-error" id="title-error">{errors.title}</small>}</label><div className="form-row"><label>Amount<input type="number" min="0.01" step="0.01" value={form.amount} aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 'amount-error' : undefined} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />{errors.amount && <small className="field-error" id="amount-error">{errors.amount}</small>}</label><label>Type<select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as Transaction['kind'] })}><option value="expense">Expense</option><option value="income">Income</option></select></label></div><label>Category<select value={form.category} aria-invalid={!!errors.category} aria-describedby={errors.category ? 'category-error' : undefined} onChange={e => setForm({ ...form, category: e.target.value })}><option value="">Choose a category</option>{categories.map(item => <option key={item}>{item}</option>)}</select>{errors.category && <small className="field-error" id="category-error">{errors.category}</small>}</label><label>Date<input type="date" value={form.date} aria-invalid={!!errors.date} aria-describedby={errors.date ? 'date-error' : undefined} onChange={e => setForm({ ...form, date: e.target.value })} />{errors.date && <small className="field-error" id="date-error">{errors.date}</small>}</label><Button type="submit" className="save-entry">Save entry</Button></form></section></div>}
    {deleteTarget && <div className="dialog-backdrop"><section className="entry-dialog confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description"><h2 id="confirm-title">Delete entry?</h2><p id="confirm-description">Delete “{deleteTarget.title}”? This cannot be undone.</p><div className="confirm-actions"><Button type="button" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button type="button" className="delete-confirm" onClick={confirmDelete}>Delete entry</Button></div></section></div>}
  </>
}

export default Shell
