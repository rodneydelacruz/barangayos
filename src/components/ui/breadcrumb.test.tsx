import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Breadcrumb } from './breadcrumb'

describe('Breadcrumb', () => {
  it('renders all items', () => {
    render(
      <MemoryRouter>
        <Breadcrumb items={[{ href: '/', label: 'Home' }, { label: 'Current' }]} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Home')).toBeTruthy()
    expect(screen.getByText('Current')).toBeTruthy()
  })
})
