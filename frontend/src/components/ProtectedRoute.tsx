import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { verifyAuth, hasRole, type Role } from '@/auth/session'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: Role[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const [state, setState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    // Always re-verify on mount — don't trust synchronous isValid alone,
    // since localStorage may have stale data and the async authRefresh
    // needs to confirm before we let the user through.
    setState('loading')
    verifyAuth().then((ok) => {
      setState(ok ? 'authenticated' : 'unauthenticated')
    })
  }, [])

  if (state === 'loading') return null
  if (state === 'unauthenticated') return <Navigate to="/login" replace />
  if (roles && !hasRole(...roles)) return <Navigate to="/" replace />
  return <>{children}</>
}