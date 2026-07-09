import { ClientResponseError } from 'pocketbase'
import { getClient } from './client'

export class ApiError extends Error {
  status?: number
  original?: unknown

  constructor(message: string, status?: number, original?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.original = original
  }
}

export function handleApiError(err: unknown): ApiError {
  if (err instanceof ClientResponseError) {
    const status = err.status
    let message = err.message ?? 'Unknown API error'

    if (status === 429) {
      message = 'Rate limit exceeded. Please wait before retrying.'
    } else if (status === 403) {
      message = 'You do not have permission to perform this action.'
    } else if (status === 401) {
      getClient().authStore.clear()
      message = 'Your session has expired. Please sign in again.'
    } else if (status === 400) {
      // Extract field-level validation errors for a more helpful message
      const response = err.data ?? {}
      const fieldErrors: string[] = []
      const data = response.data ?? {}
      for (const [field, detail] of Object.entries(data)) {
        const d = detail as { code?: string; message?: string }
        if (d?.message) fieldErrors.push(`${field}: ${d.message}`)
      }
      if (fieldErrors.length > 0) {
        message = `Validation failed: ${fieldErrors.join('; ')}`
      }
    }

    return new ApiError(message, status, err)
  }

  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return new ApiError('Network error. Operation will be queued offline.')
  }

  return new ApiError(
    err instanceof Error ? err.message : 'Unknown error',
    undefined,
    err,
  )
}

export function shouldRetry(err: ApiError): boolean {
  if (err.status === 429) return true
  if (err.status === 503) return true
  return false
}

export function retryDelay(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 30000)
}
