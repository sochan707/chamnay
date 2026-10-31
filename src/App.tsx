import { useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router'
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, CalendarDays, ChartNoAxesColumn, ChevronDown, CircleHelp, CreditCard, House, Menu, Plus, Search, Settings2, Sparkles, Wallet, X } from 'lucide-react'
import { demoBudget, demoTransactions } from './data/demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const navItems = [
  { label: 'Overview', to: '/', icon: House },
  { label: 'Transactions', to: '/transactions', icon: CreditCard },
  { label: 'Budgets', to: '/budgets', icon: ChartNoAxesColumn },
  { label: 'Savings goals', to: '/savings', icon: Wallet },
]
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const currentPage = navItems.find((item) => item.to === location.pathname)?.label ?? 'Overview'
  return (
    <div className="min-h-screen bg-background text-foreground">
      {menuOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/30 md:hidden" onClick={() => setMenuOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar px-4 py-5 transition-transform md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex items-center justify-between px-2">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><Wallet size={21} /></span>
            <span><span className="block text-lg font-bold tracking-tight">chamnay</span><span className="block text-xs text-muted-foreground">money, made clearer</span></span>
          </Link>
          <button className="rounded-lg p-2 text-muted-foreground md:hidden" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={19} /></button>
        </div>
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Workspace</p>
        <nav className="space-y-1" aria-label="Main navigation">
          {navItems.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon size={18} />{label}</NavLink>)}
        </nav>
        <div className="mt-auto space-y-1 border-t border-border pt-4">
          <a href="#help" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"><CircleHelp size={18} />Help center</a>
          <a href="#settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"><Settings2 size={18} />Settings</a>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-muted/70 p-3"><div className="grid size-9 place-items-center rounded-full bg-[#e3eee5] text-sm font-semibold text-primary">SM</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">Sarin Meas</p><p className="text-xs text-muted-foreground">Free plan</p></div><ChevronDown size={16} className="text-muted-foreground" /></div>
        </div>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:px-9">
          <div className="flex items-center gap-3"><button className="rounded-xl p-2 hover:bg-muted md:hidden" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={20} /></button><div><p className="text-xs text-muted-foreground">Good morning, Sarin</p><h1 className="text-lg font-semibold">{currentPage}</h1></div></div>
          <div className="flex items-center gap-2"><button aria-label="Search" className="hidden rounded-xl p-2.5 text-muted-foreground hover:bg-muted sm:block"><Search size={18} /></button><button aria-label="Notifications" className="relative rounded-xl p-2.5 text-muted-foreground hover:bg-muted"><Bell size={18} /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-500" /></button><Button className="hidden sm:inline-flex"><Plus size={17} />Add transaction</Button></div>
        </header>
        <main className="mx-auto max-w-[1440px] px-4 py-7 md:px-9 md:py-9"><Routes><Route element={<Overview />} path="/" /><Route element={<Placeholder />} path="/transactions" /><Route element={<Placeholder />} path="/budgets" /><Route element={<Placeholder />} path="/savings" /><Route element={<Placeholder />} path="*" /></Routes></main>
      </div>
    </div>
  )
}

function Overview() {
  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted-foreground">Saturday, October 31, 2026</p><h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Your money at a glance</h2><p className="mt-1 text-sm text-muted-foreground">Here’s what’s happening with your budget this month.</p></div><Button variant="outline" className="w-fit"><CalendarDays size={17} />October 2026<ChevronDown size={15} /></Button></div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Budget summary">
      <Card className="overflow-hidden border-0 bg-primary text-primary-foreground shadow-md"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-white/80">Available balance</CardTitle><span className="rounded-xl bg-white/15 p-2"><Wallet size={18} /></span></CardHeader><CardContent><p className="text-3xl font-bold tracking-tight">{currency.format(demoBudget.balance)}</p><div className="mt-4 flex items-center gap-1.5 text-xs text-white/80"><ArrowUpRight size={14} />You’re on track this month</div><div className="mt-5 h-1.5 rounded-full bg-white/20"><div className="h-full w-[68%] rounded-full bg-white" /></div></CardContent></Card>
      <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Monthly spending</CardTitle><span className="rounded-xl bg-amber-50 p-2 text-amber-700"><ChartNoAxesColumn size={18} /></span></CardHeader><CardContent><p className="text-3xl font-bold tracking-tight">{currency.format(demoBudget.spent)}<span className="text-base font-medium text-muted-foreground"> / {currency.format(demoBudget.monthlyBudget)}</span></p><div className="mt-4 h-2 rounded-full bg-muted"><div className="h-full w-[23%] rounded-full bg-amber-500" /></div><p className="mt-2 text-xs text-muted-foreground">23% of your monthly budget used</p></CardContent></Card>
      <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Savings goal</CardTitle><span className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><Sparkles size={18} /></span></CardHeader><CardContent><p className="text-3xl font-bold tracking-tight">{currency.format(demoBudget.savingsCurrent)}<span className="text-base font-medium text-muted-foreground"> / {currency.format(demoBudget.savingsTarget)}</span></p><div className="mt-4 h-2 rounded-full bg-muted"><div className="h-full w-[60%] rounded-full bg-emerald-600" /></div><p className="mt-2 text-xs text-muted-foreground">You’re 60% of the way there</p></CardContent></Card>
    </section>
    <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Recent transactions</CardTitle><p className="mt-1 text-sm text-muted-foreground">Your latest money in and out</p></div><Link to="/transactions" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">See all<ArrowRight size={15} /></Link></CardHeader><CardContent className="space-y-1">{demoTransactions.map((transaction) => <div className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-muted/60" key={transaction.id}><span className={`grid size-10 place-items-center rounded-xl ${transaction.kind === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{transaction.kind === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{transaction.title}</p><p className="text-xs text-muted-foreground">{transaction.category} · {transaction.date}</p></div><p className={`text-sm font-semibold ${transaction.kind === 'income' ? 'text-emerald-700' : 'text-foreground'}`}>{transaction.kind === 'income' ? '+' : '−'}{currency.format(transaction.amount)}</p></div>)}</CardContent></Card>
      <div className="space-y-5"><Card className="bg-[#f1f5ef]"><CardContent className="p-5"><div className="flex items-start justify-between"><div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary">UPCOMING</span><h3 className="mt-4 text-lg font-bold">Phone bill</h3><p className="mt-1 text-sm text-muted-foreground">Due in 3 days · Nov 3</p></div><span className="rounded-xl bg-white p-2.5 text-primary"><Bell size={18} /></span></div><div className="mt-5 flex items-center justify-between border-t border-primary/10 pt-4"><span className="text-sm text-muted-foreground">Amount</span><span className="text-lg font-bold">$18.00</span></div></CardContent></Card><Card><CardContent className="flex items-center gap-4 p-5"><div className="grid size-11 place-items-center rounded-2xl bg-violet-50 text-violet-700"><Sparkles size={20} /></div><div className="flex-1"><p className="font-semibold">Small steps add up</p><p className="mt-1 text-sm text-muted-foreground">You’ve saved $42 more than last month.</p></div></CardContent></Card></div>
    </section>
    <p className="text-center text-xs text-muted-foreground">Sample dashboard data for demonstration · No personal financial data is stored</p>
  </div>
}

function Placeholder() {
  const location = useLocation()
  const title = navItems.find((item) => item.to === location.pathname)?.label ?? 'Page not found'
  return <Card className="mx-auto max-w-xl"><CardContent className="flex flex-col items-center px-6 py-14 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Wallet size={24} /></span><h2 className="mt-5 text-xl font-bold">{title}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">This part of Chamnay is planned for a future prototype step. Your sample overview is ready to explore.</p><Link to="/"><Button className="mt-6">Back to overview</Button></Link></CardContent></Card>
}

export default function App() {
  return <AppLayout />
}
