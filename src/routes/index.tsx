import { Routes, Route } from 'react-router'
import Layout from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import LoginPage from '@/auth/LoginPage'
import Dashboard from '@/pages/Dashboard'
import { RecordsPage } from '@/features/records'
import { ResidentsPage } from '@/features/residents'
import { HouseholdsPage } from '@/features/households'
import { DocumentsPage, ReleasePage } from '@/features/documents'
import { SystemSettings } from '@/features/settings'
import { ActivityPage, VisitorLogPage } from '@/features/logs'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="records"
          element={
            <ProtectedRoute roles={['admin', 'staff', 'viewer']}>
              <RecordsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute roles={['admin']}>
              <SystemSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="residents"
          element={
            <ProtectedRoute roles={['admin', 'staff', 'viewer']}>
              <ResidentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="households"
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <HouseholdsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="documents"
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="documents/release"
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <ReleasePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="logs/activity"
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <ActivityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="logs/visitors"
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <VisitorLogPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}
