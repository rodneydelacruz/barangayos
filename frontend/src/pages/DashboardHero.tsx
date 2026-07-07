import { useState, useEffect } from 'react'
import { Users, Scale, Clock, MapPin, Phone, UserCheck } from 'lucide-react'
import { getAllSettings } from '@/api/settings'
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

export default function DashboardHero({ userName, stats }: DashboardHeroProps) {
  const [clock, setClock] = useState(new Date())
  const [settings, setSettings] = useState<Record<string, any>>({})

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    getAllSettings().then(setSettings).catch(() => {})
  }, [])

  const brgyName = settings.barangay_name ?? ''
  const municipality = settings.municipality_city ?? ''
  const province = settings.province ?? ''
  const contact = settings.contact_number ?? ''
  const captain = settings.barangay_captain ?? ''
  const secretary = settings.barangay_secretary ?? ''
  const treasurer = settings.barangay_treasurer ?? ''

  const locationParts = [municipality, province].filter(Boolean)
  const locationStr = locationParts.length > 0 ? `, ${locationParts.join(', ')}` : ''

  return (
    <div className="border border-border bg-card motion-fade-in motion-slide-up">
      <div className="p-5">
        {/* Top row: greeting + clock */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-8 shrink-0 bg-gold" aria-hidden="true" />
              <div>
                <h1 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {getTimeGreeting()}, {userName}!
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatDate()}{brgyName ? ` — Barangay ${brgyName}${locationStr}` : ''}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Clock className="size-3.5" />
            <span className="font-mono tabular-nums">{formatClock(clock)}</span>
          </div>
        </div>

        {/* Stat pills */}
        {stats.residents > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="flex items-center gap-3 border border-border bg-muted/20 px-4 py-3">
              <div className="flex size-10 items-center justify-center bg-gold/10">
                <Users className="size-4 text-gold" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none text-foreground tabular-nums">{stats.residents.toLocaleString()}</p>
                <p className="mt-0.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Kabuuang Residente</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border border-border bg-muted/20 px-4 py-3">
              <div className="flex size-10 items-center justify-center bg-gold/10">
                <UserCheck className="size-4 text-gold" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none text-foreground tabular-nums">{stats.voters.toLocaleString()}</p>
                <p className="mt-0.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Mga Botante</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border border-border bg-muted/20 px-4 py-3">
              <div className="flex size-10 items-center justify-center bg-gold/10">
                <Scale className="size-4 text-gold" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none text-foreground tabular-nums">{stats.blotterActive}</p>
                <p className="mt-0.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Aktibong Kaso</p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom info bar */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/50 pt-3 text-xs text-muted-foreground">
          {contact && (
            <span className="inline-flex items-center gap-1">
              <Phone className="size-3" />
              {contact}
            </span>
          )}
          {captain && (
            <span>
              <span className="font-medium text-foreground">{captain}</span> — Kapitan
            </span>
          )}
          {secretary && (
            <span>
              <span className="font-medium text-foreground">{secretary}</span> — Kalihim
            </span>
          )}
          {treasurer && (
            <span>
              <span className="font-medium text-foreground">{treasurer}</span> — Ingat-yaman
            </span>
          )}
          {brgyName && (
            <span className="inline-flex items-center gap-1 ml-auto">
              <MapPin className="size-3" />
              Brgy. {brgyName}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
