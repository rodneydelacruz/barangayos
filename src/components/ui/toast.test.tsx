import { describe, it, expect, vi } from 'vitest'
import { toast } from '@/lib/toast'

const mockSonner = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('sonner', () => mockSonner)

describe('toast', () => {
  it('calls sonner on success', () => {
    toast.success('Saved')
    expect(mockSonner.toast.success).toHaveBeenCalledWith('Saved', undefined)
  })

  it('calls sonner on error', () => {
    toast.error('Failed')
    expect(mockSonner.toast.error).toHaveBeenCalledWith('Failed', undefined)
  })

  it('calls sonner on info with options', () => {
    const opts = { duration: 8000 }
    toast.info('Something', opts)
    expect(mockSonner.toast.info).toHaveBeenCalledWith('Something', opts)
  })
})
