export type Transaction = {
  id: string
  title: string
  category: string
  date: string
  amount: number
  kind: 'income' | 'expense'
}

export const demoTransactions: Transaction[] = [
  { id: 't1', title: 'Lunch at Green Bowl', category: 'Food', date: 'Today, 12:35 PM', amount: 6.5, kind: 'expense' },
  { id: 't2', title: 'Monthly allowance', category: 'Income', date: 'Today, 9:10 AM', amount: 220, kind: 'income' },
  { id: 't3', title: 'Tuk-tuk ride', category: 'Transport', date: 'Yesterday', amount: 2.25, kind: 'expense' },
  { id: 't4', title: 'Coffee with Dara', category: 'Food', date: 'Yesterday', amount: 3.75, kind: 'expense' },
]

export const demoBudget = {
  balance: 384.5,
  monthlyBudget: 500,
  spent: 115.5,
  savingsTarget: 300,
  savingsCurrent: 180,
}
