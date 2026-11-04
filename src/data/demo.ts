export type Transaction = {
  id: string
  title: string
  categoryId: string | null
  date: string
  amount: number
  kind: 'income' | 'expense'
}

const dateOffset = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const demoTransactions: Transaction[] = [
  { id: 't1', title: 'Lunch at Green Bowl', categoryId: 'food', date: dateOffset(0), amount: 6.5, kind: 'expense' },
  { id: 't2', title: 'Monthly allowance', categoryId: null, date: dateOffset(0), amount: 220, kind: 'income' },
  { id: 't3', title: 'Tuk-tuk ride', categoryId: 'transport', date: dateOffset(-1), amount: 2.25, kind: 'expense' },
  { id: 't4', title: 'Coffee with Dara', categoryId: 'food', date: dateOffset(-1), amount: 3.75, kind: 'expense' },
]

export const demoBudget = {
  balance: 384.5,
  monthlyBudget: 500,
  spent: 115.5,
  savingsTarget: 300,
  savingsCurrent: 180,
}
