import { useState, useEffect } from 'react'
import { getCurrentUser, type AuthUser, type Role } from '@/auth/session'
import { getResidentsSummary } from '@/api/residents'
import { getBlottersSummary } from '@/api/blotter'
import { getDocumentsReport } from '@/api/reports'
import { getVisitorsReport } from '@/api/reports'
import { getAssetsReport } from '@/api/reports'
import { getActivities } from '@/api/activity'
import type { ApiActivity } from '@/api/activity'

export interface DashboardStats {
  residents: number
  voters: number
  pendingDocuments: number
  blotterActive: number
  blotterTotal: number
  visitorsToday: number
  visitorsActive: number
  assetsTotal: number
  assetsValue: number
  meetingsToday: number
  settledCases: number
  documentByStatus: Record<string, number>
  documentTotal: number
}

export interface DashboardTask {
  id: string
  priority: 'urgent' | 'normal' | 'info'
  title: string
  description: string
  link: string
}

export interface DashboardData {
  user: AuthUser | null
  timeGreeting: string
  stats: DashboardStats
  tasks: DashboardTask[]
  recentActivity: ApiActivity[]
  loading: boolean
}

function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Magandang umaga'
  if (hour < 18) return 'Magandang hapon'
  return 'Magandang gabi'
}

function buildTasksByRole(role: Role, stats: DashboardStats): DashboardTask[] {
  const tasks: DashboardTask[] = []

  if (role === 'admin') {
    if (stats.pendingDocuments > 0) {
      tasks.push({
        id: 'pending-docs',
        priority: 'urgent',
        title: `${stats.pendingDocuments} document request${stats.pendingDocuments > 1 ? 's' : ''} pending release`,
        description: 'Mga dokumentong naghihintay ng pag-release',
        link: '/documents',
      })
    }
    if (stats.blotterActive > 0) {
      tasks.push({
        id: 'active-blotter',
        priority: 'normal',
        title: `${stats.blotterActive} active blotter case${stats.blotterActive > 1 ? 's' : ''}`,
        description: 'Mga kasong nangangailangan ng aksyon',
        link: '/records',
      })
    }
    tasks.push({
      id: 'assets',
      priority: 'info',
      title: `${stats.assetsTotal} assets tracked`,
      description: `Kabuuang halaga: ₱${stats.assetsValue.toLocaleString()}`,
      link: '/assets',
    })
  } else if (role === 'staff') {
    if (stats.pendingDocuments > 0) {
      tasks.push({
        id: 'pending-docs',
        priority: 'urgent',
        title: `${stats.pendingDocuments} document request${stats.pendingDocuments > 1 ? 's' : ''} to process`,
        description: 'Nakapila para sa pagproseso',
        link: '/documents',
      })
    }
    if (stats.blotterActive > 0) {
      tasks.push({
        id: 'active-blotter',
        priority: 'normal',
        title: `${stats.blotterActive} blotter case${stats.blotterActive > 1 ? 's' : ''} to attend to`,
        description: 'Nakabinbing kaso para sa hearing o settlement',
        link: '/records',
      })
    }
    if (stats.visitorsActive > 0) {
      tasks.push({
        id: 'visitors',
        priority: 'normal',
        title: `${stats.visitorsActive} visitor${stats.visitorsActive > 1 ? 's' : ''} currently on-site`,
        description: 'Mga bisita na hindi pa naka-check out',
        link: '/logs/visitors',
      })
    }
  } else {
    tasks.push({
      id: 'reports',
      priority: 'info',
      title: `${stats.residents} residents registered`,
      description: 'Kabuuang bilang ng mga mamamayan ng barangay',
      link: '/reports',
    })
    tasks.push({
      id: 'records-browse',
      priority: 'info',
      title: `${stats.blotterTotal} blotter cases on record`,
      description: 'Tingnan ang mga tala ng kaso',
      link: '/records',
    })
  }

  return tasks
}

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    user: null,
    timeGreeting: '',
    stats: {
      residents: 0, voters: 0, pendingDocuments: 0, blotterActive: 0, blotterTotal: 0,
      visitorsToday: 0, visitorsActive: 0, assetsTotal: 0, assetsValue: 0,
      meetingsToday: 0, settledCases: 0,
      documentByStatus: {}, documentTotal: 0,
    },
    tasks: [],
    recentActivity: [],
    loading: true,
  })

  useEffect(() => {
    const user = getCurrentUser()

    Promise.all([
      getResidentsSummary().catch(() => ({ total: 0, voters: 0, seniors: 0, pwd: 0 })),
      getBlottersSummary().catch(() => ({ total: 0, pending: 0, hearing: 0, settled: 0, escalated: 0, dismissed: 0 })),
      getDocumentsReport().catch(() => ({ total: 0, byStatus: {}, byType: {}, todayRequests: 0 })),
      getVisitorsReport().catch(() => ({ total: 0, activeVisits: 0, byPurpose: {} })),
      getAssetsReport().catch(() => ({ total: 0, byType: {}, byCondition: {}, byStatus: {}, totalValue: 0 })),
      getActivities(1, 25).catch(() => ({ items: [], totalItems: 0, totalPages: 0 })),
    ]).then(([res, blot, docs, vis, assets, activity]) => {
      const stats: DashboardStats = {
        residents: res.total,
        voters: res.voters,
        pendingDocuments: docs.byStatus['pending'] ?? 0,
        blotterActive: (blot.pending ?? 0) + (blot.hearing ?? 0),
        blotterTotal: blot.total,
        visitorsToday: vis.total,
        visitorsActive: vis.activeVisits,
        assetsTotal: assets.total,
        assetsValue: assets.totalValue,
        meetingsToday: 0,
        settledCases: blot.settled ?? 0,
        documentByStatus: docs.byStatus,
        documentTotal: docs.total,
      }

      setData({
        user,
        timeGreeting: getTimeGreeting(),
        stats,
        tasks: user ? buildTasksByRole(user.role, stats) : [],
        recentActivity: activity.items,
        loading: false,
      })
    })
  }, [])

  return data
}
