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
import { AssetsPage } from '@/features/assets'
import { CalendarPage } from '@/features/calendar'
import { AgendaPage } from '@/features/agenda'
import { ReportsPage } from '@/features/reports'
import { BudgetOverview, RevenueTracking, FundSources, Disbursements, FinanceAudit } from '@/features/finance'

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
        <Route
          path="assets"
          element={
            <ProtectedRoute roles={['admin']}>
              <AssetsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="calendar"
          element={
            <ProtectedRoute roles={['admin', 'staff', 'viewer']}>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="agenda"
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <AgendaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance/budget"
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <BudgetOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance/revenues"
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <RevenueTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance/funds"
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <FundSources />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance/disbursements"
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <Disbursements />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance/audit"
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <FinanceAudit />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}
