import { useState, useEffect } from 'react'
import { Users, FileText, Scale, Clock } from 'lucide-react'
import type { DashboardStats } from './hooks/useDashboardData'

function formatDate(): string {
  const d = new Date()
  const months = ['Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo', 'Hulyo', 'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre']
  return `Ika-${d.getDate()} ng ${months[d.getMonth()]}, ${d.getFullYear()}`
}

function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Magandang umaga'
  if (hour < 18) return 'Magandang hapon'
  return 'Magandang gabi'
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
}

interface DashboardHeroProps {
  userName: string
  role: string
  stats: DashboardStats
}

export default function DashboardHero({ userName, role, stats }: DashboardHeroProps) {
  const [clock, setClock] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const pills = [
    { label: 'Kabuuang Residente', value: stats.residents, icon: Users },
    { label: 'Nakabinbing Dokumento', value: stats.pendingDocuments, icon: FileText },
    { label: 'Aktibong Kaso', value: stats.blotterActive, icon: Scale },
  ]

  return (
    <div className="rounded-xl border border-border border-t-2 border-gold bg-card shadow-sm motion-fade-in motion-slide-up">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {getTimeGreeting()}, {userName}!
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{formatDate()}</p>
            <div className="mt-2">
              <span className="inline-flex items-center rounded-md bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-gold capitalize">
                {role}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span className="font-mono tabular-nums">{formatClock(clock)}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {pills.map((pill) => {
            const Icon = pill.icon
            return (
              <div key={pill.label} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-gold/10">
                  <Icon className="size-4 text-gold" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none text-foreground tabular-nums">{pill.value}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{pill.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
