import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import { addCustomCategory, defaultCategories } from '../src/lib/categories'
import { createInitialLedger, LEDGER_KEY_V2 } from '../src/lib/ledger'

function renderApp(route = '/') {
  return render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>)
}

describe('expense category experience', () => {
  it('offers ready-made categories and displays the selected category name and icon on an expense', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: /add entry/i }))
    const dialog = screen.getByRole('dialog', { name: /add entry/i })
    expect(within(dialog).getByRole('option', { name: 'Food' })).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText('Title'), 'Study snack')
    await user.type(within(dialog).getByLabelText('Amount'), '3.50')
    await user.selectOptions(within(dialog).getByLabelText('Category'), 'food')
    await user.click(within(dialog).getByRole('button', { name: /save entry/i }))
    const row = screen.getByText('Study snack').closest('.entry')!
    expect(within(row as HTMLElement).getByText(/Food/)).toBeInTheDocument()
    expect(row.querySelector('.category-mark svg')).toBeInTheDocument()
  })

  it('adds, validates, and edits a personal category from Settings', async () => {
    const user = userEvent.setup()
    renderApp('/settings')
    await user.click(screen.getByRole('button', { name: /add category/i }))
    const dialog = screen.getByRole('dialog', { name: /add category/i })
    await user.click(within(dialog).getByRole('button', { name: /add category/i }))
    expect(await within(dialog).findByText('Enter a category name.')).toBeInTheDocument()
    await user.type(within(dialog).getByRole('textbox', { name: /name/i }), 'Study supplies')
    await user.click(within(dialog).getByRole('button', { name: 'Education' }))
    await user.click(within(dialog).getByRole('button', { name: 'Blue' }))
    await user.click(within(dialog).getByRole('button', { name: /add category/i }))
    expect(screen.getByText('Study supplies')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /edit Study supplies/i }))
    const editDialog = screen.getByRole('dialog', { name: /edit category/i })
    await user.clear(within(editDialog).getByRole('textbox', { name: /name/i }))
    await user.type(within(editDialog).getByRole('textbox', { name: /name/i }), 'Course materials')
    await user.click(within(editDialog).getByRole('button', { name: /save changes/i }))
    expect(screen.getByText('Course materials')).toBeInTheDocument()
  })

  it('asks for a destination and reassigns linked expenses before deleting a personal category', async () => {
    const user = userEvent.setup()
    const ledger = createInitialLedger()
    ledger.categories = addCustomCategory(defaultCategories, { name: 'Study supplies', icon: 'book', color: 'blue' }, 'study')
    ledger.entries = [{ id: 'notebook', title: 'Notebook', categoryId: 'study', date: '2026-11-04', amount: 4, kind: 'expense' }]
    ledger.startingEntries = ledger.entries.map(entry => ({ ...entry }))
    localStorage.setItem(LEDGER_KEY_V2, JSON.stringify(ledger))
    renderApp('/settings')
    await user.click(screen.getByRole('button', { name: /delete Study supplies/i }))
    const dialog = screen.getByRole('alertdialog', { name: /where should these expenses go/i })
    expect(within(dialog).getByText(/used by 1 expense/i)).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Move expenses to')).toHaveValue('uncategorized')
    await user.click(within(dialog).getByRole('button', { name: /move and delete/i }))
    expect(screen.queryByText('Study supplies')).not.toBeInTheDocument()
    await user.click(screen.getAllByRole('link', { name: /home/i })[0])
    expect(screen.getByText(/Uncategorized ·/)).toBeInTheDocument()
  })

  it('keeps a personal category when deletion is canceled and warns before discarding a dirty entry', async () => {
    const user = userEvent.setup()
    const ledger = createInitialLedger()
    ledger.categories = addCustomCategory(defaultCategories, { name: 'Study supplies', icon: 'book', color: 'blue' }, 'study')
    localStorage.setItem(LEDGER_KEY_V2, JSON.stringify(ledger))
    renderApp('/settings')
    await user.click(screen.getByRole('button', { name: /delete Study supplies/i }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Study supplies')).toBeInTheDocument()
    await user.click(screen.getAllByRole('link', { name: /home/i })[0])
    await user.click(screen.getByRole('button', { name: /add entry/i }))
    await user.type(screen.getByLabelText('Title'), 'Draft')
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await user.click(screen.getByRole('button', { name: /manage categories/i }))
    expect(confirm).toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: /add entry/i })).toBeInTheDocument()
    confirm.mockRestore()
  })
})
