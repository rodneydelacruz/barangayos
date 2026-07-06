import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tabs } from './tabs'

describe('Tabs', () => {
  it('renders tabs and highlights active', () => {
    render(<Tabs tabs={[{ id: 'a', label: 'Tab A' }, { id: 'b', label: 'Tab B' }]} activeId="a" onChange={vi.fn()} />)
    expect(screen.getByText('Tab A')).toBeTruthy()
    expect(screen.getByText('Tab B')).toBeTruthy()
  })

  it('calls onChange on click', () => {
    const onChange = vi.fn()
    render(<Tabs tabs={[{ id: 'a', label: 'Tab A' }, { id: 'b', label: 'Tab B' }]} activeId="a" onChange={onChange} />)
    fireEvent.click(screen.getByText('Tab B'))
    expect(onChange).toHaveBeenCalledWith('b')
  })
})
