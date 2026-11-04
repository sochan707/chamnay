import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router'
import {
  BookOpen, Bus, Coffee, Gamepad2, Gift, HeartPulse, House, Pencil, Plus,
  ReceiptText, Shapes, ShoppingBag, Tag, Trash2, Utensils, X, type LucideIcon,
} from 'lucide-react'
import { demoBudget, type Transaction } from './data/demo'
import {
  CATEGORY_COLOR_KEYS, CATEGORY_ICON_KEYS, addCustomCategory, findCategory,
  removeCustomCategory, updateCustomCategory, validateCategory,
  type Category, type CategoryColorKey, type CategoryErrors, type CategoryIconKey, type CategoryInput,
} from './lib/categories'
import { deleteEntry, getSummary, localDate, saveEntry, validateEntry, type EntryForm, type FormErrors } from './lib/expenses'
import { readLedger, writeLedger, type LedgerV2 } from './lib/ledger'
import { Button } from '@/components/ui/button'
import './home.css'

const figmaIcon = (n: number) => `/figma/icon-${n}.svg`
const money = (n: number) => `${n < 0 ? '−' : ''}$${Math.abs(n).toFixed(2)}`
const nav = [
  { label: 'Home', to: '/', icon: 16 },
  { label: 'Bills', to: '/bills', icon: 17 },
  { label: 'Savings', to: '/savings', icon: 18 },
  { label: 'Settings', to: '/settings', icon: 19 },
]

const categoryIcons: Record<CategoryIconKey, LucideIcon> = {
  tag: Tag, utensils: Utensils, bus: Bus, receipt: ReceiptText, 'shopping-bag': ShoppingBag, shapes: Shapes,
  heart: HeartPulse, book: BookOpen, gamepad: Gamepad2, home: House, gift: Gift, coffee: Coffee,
}

const iconLabels: Record<CategoryIconKey, string> = {
  tag: 'Tag', utensils: 'Food', bus: 'Transport', receipt: 'Receipt', 'shopping-bag': 'Shopping', shapes: 'Shapes',
  heart: 'Health', book: 'Education', gamepad: 'Entertainment', home: 'Home', gift: 'Gift', coffee: 'Coffee',
}

const colorLabels: Record<CategoryColorKey, string> = {
  rose: 'Rose', peach: 'Peach', amber: 'Amber', sage: 'Sage', blue: 'Blue', lavender: 'Lavender',
}

function Brand() {
  return <Link className="brand" to="/" aria-label="Chamnay home"><span className="brand-mark"><img src={figmaIcon(15)} alt="" /><i /></span><span className="brand-name">chamnay<span>.</span></span></Link>
}

function Navigation({ mobile = false }: { mobile?: boolean }) {
  return <nav className={mobile ? 'mobile-nav' : 'side-nav'} aria-label="Main navigation">{nav.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><img src={figmaIcon(item.icon)} alt="" /><span>{item.label}</span></NavLink>)}</nav>
}

function Modal({ children, onClose, labelledBy, describedBy, role = 'dialog', className = '' }: {
  children: ReactNode
  onClose: () => void
  labelledBy: string
  describedBy?: string
  role?: 'dialog' | 'alertdialog'
  className?: string
}) {
  const panelRef = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])') ?? [])
    const focusTimer = window.setTimeout(() => (panel?.querySelector<HTMLElement>('[data-autofocus]') ?? focusable()[0] ?? panel)?.focus(), 0)
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); onCloseRef.current(); return }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items.at(-1)!
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [])
  return <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section ref={panelRef} tabIndex={-1} className={`entry-dialog ${className}`.trim()} role={role} aria-modal="true" aria-labelledby={labelledBy} aria-describedby={describedBy}>{children}</section></div>
}

function CategoryMark({ category, size = 'normal' }: { category: Category; size?: 'normal' | 'small' }) {
  const Icon = categoryIcons[category.icon]
  return <span className={`category-mark ${size === 'small' ? 'small' : ''}`} data-color={category.color} aria-hidden="true"><Icon /></span>
}

function Shell() {
  const location = useLocation()
  const page = nav.find(item => item.to === location.pathname)?.label ?? 'Home'
  const [ledger, setLedger] = useState<LedgerV2>(readLedger)
  useEffect(() => writeLedger(ledger), [ledger])
  return <div className="app-shell"><aside className="sidebar"><Brand /><p className="tagline">A little space for your money</p><Navigation /><div className="sidebar-note"><span><img src={figmaIcon(20)} alt="" /></span><strong>Small steps count.</strong><small>One clear day at a time.</small></div></aside><div className="main-shell"><header className="topbar"><div className="mobile-brand"><Brand /></div><div className="breadcrumb">Your space <span>/</span> {page}</div><div className="profile"><span>Sarin Meas</span><b>SM</b></div></header><main className="page"><Routes><Route path="/" element={<Home ledger={ledger} setLedger={setLedger} />} /><Route path="/settings" element={<Settings ledger={ledger} setLedger={setLedger} />} /><Route path="/bills" element={<Planned title="Bills" />} /><Route path="/savings" element={<Planned title="Savings" />} /><Route path="*" element={<Planned title="Page not found" />} /></Routes></main></div><Navigation mobile /></div>
}

function Planned({ title }: { title: string }) {
  return <section className="planned"><h1>{title}</h1><p>This part of Chamnay is planned for a future prototype step.</p><Link to="/">Back to Home</Link></section>
}

function Summary({ balance, spent }: { balance: number; spent: number }) {
  const percent = Math.round(spent / demoBudget.monthlyBudget * 100)
  return <section className="summary" aria-label="Monthly money summary"><div className="balance"><div className="balance-copy"><span>Available balance</span><strong>{money(balance)}</strong><p>Here’s what you have left to work with.</p></div><div className="balance-art" aria-hidden="true"><img src={figmaIcon(2)} alt="" /><i className="bubble small" /><i className="bubble medium" /><i className="bubble large" /></div></div><div className="plan"><div className="plan-values"><div><span>Spent this month</span><strong>{money(spent)}</strong></div><div><span>Monthly plan</span><strong>{money(demoBudget.monthlyBudget)}</strong></div></div><div className="progress-label"><span>Budget used</span><strong>{percent}%</strong></div><div className="progress"><span style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} /></div></div></section>
}

function displayDate(date: string, today: string) {
  if (date === today) return 'Today'
  const yesterday = new Date(`${today}T12:00:00`)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date === localDate(yesterday)) return 'Yesterday'
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function emptyEntry(today: string): EntryForm {
  return { title: '', categoryId: '', amount: '', kind: 'expense', date: today }
}

function Home({ ledger, setLedger }: { ledger: LedgerV2; setLedger: React.Dispatch<React.SetStateAction<LedgerV2>> }) {
  const navigate = useNavigate()
  const { entries, startingEntries, startingMonth, categories } = ledger
  const setEntries = (update: (entries: Transaction[]) => Transaction[]) => setLedger(old => ({ ...old, entries: update(old.entries) }))
  const [dateFilter, setDateFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<EntryForm>(() => emptyEntry(localDate()))
  const [errors, setErrors] = useState<FormErrors>({})
  const [dialog, setDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const today = localDate()
  const month = today.slice(0, 7)
  const summary = getSummary(entries, startingEntries, demoBudget.balance, startingMonth === month ? demoBudget.spent : 0, month)
  const activeCategoryFilter = categoryFilter === 'all' || categories.some(category => category.id === categoryFilter) ? categoryFilter : 'all'
  const visible = useMemo(() => entries.filter(entry => {
    const dateMatches = dateFilter === 'all' || (dateFilter === 'today' && entry.date === today) || (dateFilter === 'yesterday' && displayDate(entry.date, today) === 'Yesterday')
    return dateMatches && (activeCategoryFilter === 'all' || entry.categoryId === activeCategoryFilter)
  }), [entries, dateFilter, activeCategoryFilter, today])

  function open(entry?: Transaction) {
    setEditId(entry?.id ?? null)
    setForm(entry ? { title: entry.title, categoryId: entry.categoryId ?? '', amount: String(entry.amount), kind: entry.kind, date: entry.date } : emptyEntry(today))
    setErrors({})
    setDialog(true)
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateEntry(form)
    if (form.kind === 'expense' && form.categoryId && !categories.some(category => category.id === form.categoryId)) nextErrors.categoryId = 'Choose an available category.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setEntries(old => saveEntry(old, form, editId ?? crypto.randomUUID()))
    setDialog(false)
  }

  function confirmDelete() {
    if (deleteTarget) setEntries(old => deleteEntry(old, deleteTarget.id))
    setDeleteTarget(null)
  }

  function manageCategories() {
    const blank = emptyEntry(today)
    const isDirty = form.title !== blank.title || form.amount !== blank.amount || form.categoryId !== blank.categoryId || form.kind !== blank.kind || form.date !== blank.date
    if (isDirty && !window.confirm('Discard this entry and manage categories?')) return
    setDialog(false)
    navigate('/settings#categories')
  }

  const selectedCategory = form.categoryId ? findCategory(categories, form.categoryId) : null
  return <>
    <Summary {...summary} />
    <div className="lower"><section className="activity" aria-labelledby="activity-title"><div className="activity-heading"><h2 id="activity-title">Money in &amp; out</h2><Button className="add-entry" onClick={() => open()}><img src={figmaIcon(3)} alt="" />Add entry</Button></div><div className="filters"><div className="filter-group"><label className="filter"><img src={figmaIcon(4)} alt="" /><select aria-label="Filter by date" value={dateFilter} onChange={event => setDateFilter(event.target.value)}><option value="all">All dates</option><option value="today">Today</option><option value="yesterday">Yesterday</option></select><img className="chevron" src={figmaIcon(5)} alt="" /></label><label className="filter"><select aria-label="Filter by category" value={activeCategoryFilter} onChange={event => setCategoryFilter(event.target.value)}><option value="all">All categories</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select><img className="chevron" src={figmaIcon(5)} alt="" /></label></div><div className="month"><img src={figmaIcon(1)} alt="" /><span>{new Date(`${today}T12:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span></div></div><div className="entry-list">{visible.length ? visible.map(entry => {
      const category = findCategory(categories, entry.categoryId)
      return <div className="entry" key={entry.id}>{entry.kind === 'income' ? <span className="entry-icon income"><img src={figmaIcon(9)} alt="" /></span> : <CategoryMark category={category} />}<div className="entry-info"><strong>{entry.title}</strong><small>{entry.kind === 'income' ? 'Income source' : category.name} · {displayDate(entry.date, today)}</small></div><strong className={`entry-amount ${entry.kind}`}>{entry.kind === 'income' ? '+' : '−'}{money(entry.amount)}</strong><div className="entry-actions"><button aria-label={`Edit ${entry.title}`} onClick={() => open(entry)}><img src={figmaIcon(7)} alt="" /></button><button aria-label={`Delete ${entry.title}`} onClick={() => setDeleteTarget(entry)}><img src={figmaIcon(8)} alt="" /></button></div></div>
    }) : <p className="entry-empty">No entries match these filters.</p>}</div></section><aside className="ahead" aria-labelledby="ahead-title"><div className="ahead-heading"><h2 id="ahead-title">A little look ahead</h2><img src={figmaIcon(10)} alt="" /></div><div className="ahead-grid"><article className="ahead-card bill"><span className="ahead-icon"><img src={figmaIcon(11)} alt="" /></span><small>Coming up</small><h3>Phone bill</h3><p>Due Nov 3</p><strong className="bill-amount">$18.00</strong><Link to="/bills">View bills <img src={figmaIcon(12)} alt="" /></Link></article><article className="ahead-card savings"><span className="ahead-icon"><img src={figmaIcon(13)} alt="" /></span><small>Savings goal</small><h3>$180.00 <span>of $300.00</span></h3><div className="savings-progress"><span /></div><Link to="/savings">See your goal <img src={figmaIcon(14)} alt="" /></Link></article></div></aside></div>
    <p className="sample-note">Sample starting figures for this prototype. Your changes are saved in this browser.</p>
    {dialog && <EntryDialog editId={editId} form={form} setForm={setForm} errors={errors} setErrors={setErrors} categories={categories} selectedCategory={selectedCategory} onClose={() => setDialog(false)} onSubmit={save} onManage={manageCategories} />}
    {deleteTarget && <Modal onClose={() => setDeleteTarget(null)} labelledBy="confirm-title" describedBy="confirm-description" role="alertdialog" className="confirm-dialog"><h2 id="confirm-title">Delete entry?</h2><p id="confirm-description">Delete “{deleteTarget.title}”? This cannot be undone.</p><div className="confirm-actions"><Button type="button" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button type="button" className="delete-confirm" onClick={confirmDelete}>Delete entry</Button></div></Modal>}
  </>
}

function EntryDialog({ editId, form, setForm, errors, setErrors, categories, selectedCategory, onClose, onSubmit, onManage }: {
  editId: string | null
  form: EntryForm
  setForm: React.Dispatch<React.SetStateAction<EntryForm>>
  errors: FormErrors
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>
  categories: Category[]
  selectedCategory: Category | null
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onManage: () => void
}) {
  return <Modal onClose={onClose} labelledBy="dialog-title"><div className="dialog-heading"><h2 id="dialog-title">{editId ? 'Edit entry' : 'Add entry'}</h2><button aria-label="Close" onClick={onClose}><X size={18} /></button></div><form noValidate onSubmit={onSubmit}><label>Title<input data-autofocus value={form.title} aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-error' : undefined} onChange={event => { setForm({ ...form, title: event.target.value }); setErrors(old => ({ ...old, title: undefined })) }} placeholder="What was it for?" />{errors.title && <small className="field-error" id="title-error" role="alert">{errors.title}</small>}</label><div className="form-row"><label>Amount<input type="number" inputMode="decimal" min="0.01" step="0.01" value={form.amount} aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 'amount-error' : undefined} onChange={event => { setForm({ ...form, amount: event.target.value }); setErrors(old => ({ ...old, amount: undefined })) }} placeholder="0.00" />{errors.amount && <small className="field-error" id="amount-error" role="alert">{errors.amount}</small>}</label><label>Type<select value={form.kind} onChange={event => setForm({ ...form, kind: event.target.value as Transaction['kind'], categoryId: event.target.value === 'income' ? '' : form.categoryId })}><option value="expense">Expense</option><option value="income">Income</option></select></label></div>{form.kind === 'expense' && <div className="category-field"><div className="category-label-row"><label htmlFor="entry-category">Category</label><button type="button" className="manage-categories-link" onClick={onManage}>Manage categories</button></div><div className="category-select-row">{selectedCategory && <CategoryMark category={selectedCategory} size="small" />}<select id="entry-category" value={form.categoryId} aria-invalid={!!errors.categoryId} aria-describedby={errors.categoryId ? 'category-error' : undefined} onChange={event => { setForm({ ...form, categoryId: event.target.value }); setErrors(old => ({ ...old, categoryId: undefined })) }}><option value="">Choose a category</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>{errors.categoryId && <small className="field-error" id="category-error" role="alert">{errors.categoryId}</small>}</div>}<label>Date<input type="date" value={form.date} aria-invalid={!!errors.date} aria-describedby={errors.date ? 'date-error' : undefined} onChange={event => { setForm({ ...form, date: event.target.value }); setErrors(old => ({ ...old, date: undefined })) }} />{errors.date && <small className="field-error" id="date-error" role="alert">{errors.date}</small>}</label><Button type="submit" className="save-entry">{editId ? 'Save changes' : 'Save entry'}</Button></form></Modal>
}

const emptyCategoryInput: CategoryInput = { name: '', icon: 'tag', color: 'rose' }

function Settings({ ledger, setLedger }: { ledger: LedgerV2; setLedger: React.Dispatch<React.SetStateAction<LedgerV2>> }) {
  const [editor, setEditor] = useState<{ id: string | null; input: CategoryInput } | null>(null)
  const [errors, setErrors] = useState<CategoryErrors>({})
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [destinationId, setDestinationId] = useState('uncategorized')
  const customCount = ledger.categories.filter(category => category.source === 'custom').length
  const affectedCount = deleteTarget ? ledger.entries.filter(entry => entry.kind === 'expense' && entry.categoryId === deleteTarget.id).length : 0

  function openEditor(category?: Category) {
    setErrors({})
    setEditor(category ? { id: category.id, input: { name: category.name, icon: category.icon, color: category.color } } : { id: null, input: emptyCategoryInput })
  }

  function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editor) return
    const nextErrors = validateCategory(editor.input, ledger.categories, editor.id ?? undefined)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setLedger(old => ({ ...old, categories: editor.id ? updateCustomCategory(old.categories, editor.id, editor.input) : addCustomCategory(old.categories, editor.input, crypto.randomUUID()) }))
    setEditor(null)
  }

  function askDelete(category: Category) {
    setDestinationId('uncategorized')
    setDeleteTarget(category)
  }

  function confirmCategoryDelete() {
    if (!deleteTarget) return
    setLedger(old => {
      const next = removeCustomCategory(old.categories, old.entries, deleteTarget.id, destinationId)
      const startingEntries = old.startingEntries.map(entry => entry.kind === 'expense' && entry.categoryId === deleteTarget.id ? { ...entry, categoryId: destinationId } : entry)
      return { ...old, categories: next.categories, entries: next.entries, startingEntries }
    })
    setDeleteTarget(null)
  }

  return <section className="settings-page" aria-labelledby="settings-title"><header className="settings-heading"><div><h1 id="settings-title">Make every expense feel familiar.</h1><p>Use ready-made categories or add your own, so each entry is easy to spot later.</p></div><Button className="add-category" onClick={() => openEditor()}><Plus size={17} />Add category</Button></header><div className="category-panel" id="categories"><div className="category-panel-heading"><div><h2>Expense categories</h2><p>{ledger.categories.length} categories · {customCount} personal</p></div><span className="settings-note">Saved in this browser</span></div><div className="category-list">{ledger.categories.map(category => <div className="category-row" key={category.id}><CategoryMark category={category} /><div className="category-row-copy"><strong>{category.name}</strong><small>{category.source === 'system' ? 'Ready-made' : 'Personal category'}</small></div>{category.source === 'custom' && <div className="category-actions"><button aria-label={`Edit ${category.name}`} onClick={() => openEditor(category)}><Pencil size={16} /></button><button aria-label={`Delete ${category.name}`} onClick={() => askDelete(category)}><Trash2 size={16} /></button></div>}</div>)}</div></div><p className="settings-footnote">Ready-made categories stay available so expenses always have a dependable home. Uncategorized is used when no better match exists.</p>
    {editor && <CategoryEditor editor={editor} setEditor={setEditor} errors={errors} setErrors={setErrors} onClose={() => setEditor(null)} onSubmit={saveCategory} />}
    {deleteTarget && <Modal onClose={() => setDeleteTarget(null)} labelledBy="delete-category-title" describedBy="delete-category-description" role="alertdialog" className="confirm-dialog"><h2 id="delete-category-title">Where should these expenses go?</h2><p id="delete-category-description">“{deleteTarget.name}” is used by {affectedCount} {affectedCount === 1 ? 'expense' : 'expenses'}. Choose a new category before deleting it.</p><label className="reassign-field">Move expenses to<select data-autofocus value={destinationId} onChange={event => setDestinationId(event.target.value)}>{ledger.categories.filter(category => category.id !== deleteTarget.id).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><div className="confirm-actions"><Button type="button" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button type="button" className="delete-confirm" onClick={confirmCategoryDelete}>Move and delete</Button></div></Modal>}
  </section>
}

function CategoryEditor({ editor, setEditor, errors, setErrors, onClose, onSubmit }: {
  editor: { id: string | null; input: CategoryInput }
  setEditor: React.Dispatch<React.SetStateAction<{ id: string | null; input: CategoryInput } | null>>
  errors: CategoryErrors
  setErrors: React.Dispatch<React.SetStateAction<CategoryErrors>>
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return <Modal onClose={onClose} labelledBy="category-dialog-title"><div className="dialog-heading"><h2 id="category-dialog-title">{editor.id ? 'Edit category' : 'Add category'}</h2><button aria-label="Close" onClick={onClose}><X size={18} /></button></div><form noValidate onSubmit={onSubmit}><label>Name<input data-autofocus maxLength={30} value={editor.input.name} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'category-name-error' : 'category-name-help'} onChange={event => { setEditor({ ...editor, input: { ...editor.input, name: event.target.value } }); setErrors(old => ({ ...old, name: undefined })) }} placeholder="e.g. Study supplies" /><small id="category-name-help" className="field-help">Up to 30 characters</small>{errors.name && <small className="field-error" id="category-name-error" role="alert">{errors.name}</small>}</label><fieldset className="choice-field"><legend>Icon</legend><div className="icon-choices">{CATEGORY_ICON_KEYS.map(iconKey => {
    const Icon = categoryIcons[iconKey]
    return <button key={iconKey} type="button" aria-label={iconLabels[iconKey]} aria-pressed={editor.input.icon === iconKey} onClick={() => setEditor({ ...editor, input: { ...editor.input, icon: iconKey } })}><Icon /></button>
  })}</div>{errors.icon && <small className="field-error" role="alert">{errors.icon}</small>}</fieldset><fieldset className="choice-field"><legend>Color</legend><div className="color-choices">{CATEGORY_COLOR_KEYS.map(colorKey => <button key={colorKey} type="button" data-color={colorKey} aria-label={colorLabels[colorKey]} aria-pressed={editor.input.color === colorKey} onClick={() => setEditor({ ...editor, input: { ...editor.input, color: colorKey } })}><span /></button>)}</div>{errors.color && <small className="field-error" role="alert">{errors.color}</small>}</fieldset><div className="category-preview"><span>Preview</span><CategoryMark category={{ id: 'preview', ...editor.input, source: 'custom' }} /><strong>{editor.input.name.trim() || 'New category'}</strong></div><Button type="submit" className="save-entry">{editor.id ? 'Save changes' : 'Add category'}</Button></form></Modal>
}

export default Shell
