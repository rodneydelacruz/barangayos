import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable } from './data-table'

interface Item { id: string; name: string; role: string }

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role' },
]

const data: Item[] = [
  { id: '1', name: 'Alice', role: 'Admin' },
  { id: '2', name: 'Bob', role: 'Staff' },
]

describe('DataTable', () => {
  it('renders data rows', () => {
    render(<DataTable columns={columns} data={data} rowKey={(i) => i.id} />)
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0)
  })

  it('shows loading skeleton', () => {
    const { container } = render(<DataTable columns={columns} data={[]} loading rowKey={(i) => i.id} />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('shows empty state when no data', () => {
    render(<DataTable columns={columns} data={[]} rowKey={(i) => i.id} emptyState={<p>No items</p>} />)
    expect(screen.getByText('No items')).toBeTruthy()
  })

  it('calls onSort when sortable header clicked', () => {
    const onSort = vi.fn()
    render(<DataTable columns={columns} data={data} onSort={onSort} rowKey={(i) => i.id} />)
    fireEvent.click(screen.getByRole('columnheader', { name: 'Name' }))
    expect(onSort).toHaveBeenCalledWith('name')
  })

  it('calls onRowClick when row clicked', () => {
    const onRowClick = vi.fn()
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} rowKey={(i) => i.id} />)
    fireEvent.click(screen.getAllByText('Alice')[0])
    expect(onRowClick).toHaveBeenCalledWith(data[0])
  })
})
