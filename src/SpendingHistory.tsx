import { useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Transaction } from './data/demo'
import { localDate, newestFirst } from './lib/expenses'
import './spending-history.css'

const palette: Record<string, string> = {
  Food: '#c88998',
  Transport: '#f6ad96',
  Shopping: '#f7d59e',
  Bills: '#90a0b8',
  Other: '#bba7b9',
}

const cash = (amount: number) => `$${amount.toFixed(2)}`
const monthLabel = (month: string) => new Date(`${month}-01T12:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
const fullDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const dayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' })

type Props = {
  entries: Transaction[]
  onAdd: () => void
  onEdit: (entry: Transaction) => void
  onDelete: (entry: Transaction) => void
}

function Trend({ entries, month }: { entries: Transaction[]; month: string }) {
  const today = localDate()
  const last = month === today.slice(0, 7) ? new Date(`${today}T12:00:00`) : new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0, 12)
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(last)
    date.setDate(last.getDate() - 6 + index)
    return { key: localDate(date), label: dayName(date) }
  })
  const values = days.map(day => entries.filter(entry => entry.date === day.key).reduce((sum, entry) => sum + entry.amount, 0))
  const peak = Math.max(80, Math.ceil(Math.max(...values) / 20) * 20)
  const points = values.map((value, index) => `${45 + index * 72},${145 - value / peak * 120}`).join(' ')
  const area = `45,145 ${points} 477,145`
  const hasData = values.some(Boolean)

  return <section className="spending-panel trend-panel" aria-labelledby="trend-title">
    <div className="spending-panel-heading"><div><h2 id="trend-title">Spending curve</h2><p>Daily spending across the last seven days</p></div><span className="panel-period">Last 7 days</span></div>
    <div className="trend-plot">
      <svg viewBox="0 0 500 190" role="img" aria-label={hasData ? `Daily spending over seven days: ${values.map((value, index) => `${days[index].label} ${cash(value)}`).join(', ')}` : 'No spending in the last seven days'} preserveAspectRatio="none">
        {[0, 1, 2, 3].map(index => <g key={index}><line className="trend-grid" x1="45" x2="477" y1={25 + index * 40} y2={25 + index * 40} /><text className="trend-y" x="0" y={29 + index * 40}>{cash(index === 3 ? 0 : peak * (4 - index) / 4).replace('.00', '')}</text></g>)}
        {hasData ? <><polygon points={area} fill="#f7e9ed" /><polyline points={points} fill="none" stroke="#b45f78" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />{values.map((value, index) => <circle key={days[index].key} cx={45 + index * 72} cy={145 - value / peak * 120} r="3.8" fill="#fffdfa" stroke="#b45f78" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />)}</> : <><line className="trend-zero" x1="45" x2="477" y1="145" y2="145" /><text className="trend-empty" x="261" y="91" textAnchor="middle">Add an expense to see your trend</text></>}
        {days.map((day, index) => <text className="trend-x" key={day.key} x={45 + index * 72} y="179" textAnchor="middle">{day.label}</text>)}
      </svg>
    </div>
  </section>
}

function Categories({ entries, month }: { entries: Transaction[]; month: string }) {
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0)
  const groups = Object.entries(entries.reduce<Record<string, number>>((totals, entry) => {
    totals[entry.category] = (totals[entry.category] ?? 0) + entry.amount
    return totals
  }, {})).sort((a, b) => b[1] - a[1])
  let angle = 0
  const segments = groups.map(([category, amount]) => {
    const start = angle
    angle += amount / total * 360
    return `${palette[category] ?? palette.Other} ${start}deg ${angle}deg`
  })

  return <section className="spending-panel categories-panel" aria-labelledby="categories-title"><div className="spending-panel-heading"><div><h2 id="categories-title">Where it went</h2><p>Spending by category</p></div></div>
    <div className="categories-content"><div className="category-donut" role="img" aria-label={total ? groups.map(([name, amount]) => `${name} ${Math.round(amount / total * 100)}%`).join(', ') : 'No spending categories yet'} style={{ background: total ? `conic-gradient(${segments.join(', ')})` : '#eae3de' }}><div><strong>{total ? `$${Math.round(total)}` : '$0'}</strong><small>this month</small></div></div>
      {groups.length ? <ul className="category-legend">{groups.map(([category, amount]) => <li key={category}><span className="category-color" style={{ background: palette[category] ?? palette.Other }} /><strong>{category}</strong><span>{Math.round(amount / total * 100)}%</span></li>)}</ul> : <p className="category-empty"><strong>No categories</strong><span>to show yet</span></p>}
    </div>
    <span className="sr-only">{monthLabel(month)} category totals</span>
  </section>
}

export default function SpendingHistory({ entries, onAdd, onEdit, onDelete }: Props) {
  const expenses = useMemo(() => newestFirst(entries.filter(entry => entry.kind === 'expense')), [entries])
  const todayMonth = localDate().slice(0, 7)
  const months = useMemo(() => [...new Set([todayMonth, ...expenses.map(entry => entry.date.slice(0, 7))])].sort().reverse(), [expenses, todayMonth])
  const [month, setMonth] = useState(todayMonth)
  const [dateFilter, setDateFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [limit, setLimit] = useState(4)
  const monthly = expenses.filter(entry => entry.date.startsWith(month))
  const spent = monthly.reduce((sum, entry) => sum + entry.amount, 0)
  const topCategory = Object.entries(monthly.reduce<Record<string, number>>((totals, entry) => {
    totals[entry.category] = (totals[entry.category] ?? 0) + entry.amount
    return totals
  }, {})).sort((a, b) => b[1] - a[1])[0]
  const categories = [...new Set(expenses.map(entry => entry.category))].sort()
  const filtered = expenses.filter(entry => (dateFilter === 'all' || entry.date.startsWith(dateFilter)) && (categoryFilter === 'all' || entry.category === categoryFilter))
  const shown = filtered.slice(0, limit)
  const resetLimit = () => setLimit(4)

  return <div className="spending-page">
    <div className="spending-header"><div><p className="spending-kicker">Your money / Spending</p><h1>Spending history</h1><p className="spending-subtitle">See where your money went, one day at a time.</p></div><div className="spending-header-actions"><label className="spending-select"><span className="sr-only">Summary month</span><select value={month} onChange={event => setMonth(event.target.value)}>{months.map(item => <option key={item} value={item}>{monthLabel(item)}</option>)}</select></label><button className="spending-primary" onClick={onAdd}>+ Add expense</button></div></div>
    <section className="spending-stats" aria-label="Spending summary"><article className="spending-stat spent-stat"><span>Spent this month</span><strong>{cash(spent)}</strong><small>{new Date(`${month}-01T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</small><i className="stat-orbit one" /><i className="stat-orbit two" /></article><article className="spending-stat"><span>Transactions</span><strong>{monthly.length}</strong><small>Recorded this month</small><i className="stat-sparkle">✦</i></article><article className="spending-stat"><span>Top category</span><strong>{topCategory?.[0] ?? '—'}</strong><small>{topCategory ? `${cash(topCategory[1])} · ${Math.round(topCategory[1] / spent * 100)}% of spending` : 'No category yet'}</small><i className="stat-sparkle">✦</i></article></section>
    <div className="spending-charts"><Trend entries={monthly} month={month} /><Categories entries={monthly} month={month} /></div>
    <section className="spending-expenses" aria-labelledby="past-expenses-title"><div className="expenses-heading"><div><h2 id="past-expenses-title">Past expenses</h2><p>Newest first · date, category, name and amount</p></div><button className="mobile-add-expense" onClick={onAdd}>+ Add expense</button><div className="expense-filters"><label className="spending-select"><span className="sr-only">Filter expense dates</span><select value={dateFilter} onChange={event => { setDateFilter(event.target.value); resetLimit() }}><option value="all">All dates</option>{months.map(item => <option key={item} value={item}>{monthLabel(item)}</option>)}</select></label><label className="spending-select"><span className="sr-only">Filter expense categories</span><select value={categoryFilter} onChange={event => { setCategoryFilter(event.target.value); resetLimit() }}><option value="all">All categories</option>{categories.map(item => <option key={item}>{item}</option>)}</select></label></div></div>
      {filtered.length ? <div className="expenses-card"><div className="expenses-table-heading"><span>Expense</span><span>Category</span><span>Date</span><span>Amount</span></div><div className="expenses-list">{shown.map(entry => <div className="expense-row" key={entry.id}><div className="expense-name"><span className={`expense-avatar category-${entry.category.toLowerCase()}`}>{entry.title.charAt(0).toUpperCase()}</span><div><strong>{entry.title}</strong><small>{entry.category} · {fullDate(entry.date)}</small></div></div><span className="expense-category">{entry.category}</span><time dateTime={entry.date}>{fullDate(entry.date)}</time><strong className="expense-value">−{cash(entry.amount)}</strong><div className="expense-row-actions"><button aria-label={`Edit ${entry.title}`} title="Edit expense" onClick={() => onEdit(entry)}><Pencil size={15} /></button><button aria-label={`Delete ${entry.title}`} title="Delete expense" onClick={() => onDelete(entry)}><Trash2 size={15} /></button></div></div>)}</div><div className="expenses-footer"><span>Showing {shown.length} of {filtered.length} expenses</span>{shown.length < filtered.length && <button onClick={() => setLimit(old => old + 10)}>Load older expenses ↓</button>}</div></div> : <div className="expenses-empty"><div className="empty-wallet" aria-hidden="true"><span /><i /></div><h3>{expenses.length ? 'No matching expenses' : 'No expenses yet'}</h3><p>{expenses.length ? 'Try another date or category to find your expenses.' : 'Add your first expense to start your spending story.'}</p>{!expenses.length && <button className="spending-primary" onClick={onAdd}>+ Add first expense</button>}</div>}
    </section>
  </div>
}
