import { useState, useEffect } from 'react'
import { Users, Scale, Clock, MapPin, Phone, UserCheck, UserPlus } from 'lucide-react'
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

interface StatBlockProps {
  icon: React.ElementType
  value: string | number
  label: string
  hint: string
  iconBg: string
  iconColor: string
  delay: number
}

function StatBlock({ icon: Icon, value, label, hint, iconBg, iconColor, delay }: StatBlockProps) {
  return (
    <div
      className="flex items-center gap-3 border border-border bg-muted/20 px-4 py-3 motion-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div className={`flex size-10 shrink-0 items-center justify-center ${iconBg}`}>
        <Icon className={`size-4 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none text-foreground tabular-nums">{value}</p>
        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-px text-[10px] leading-none text-text-subtle">{hint}</p>
      </div>
    </div>
  )
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
    <div className="overflow-hidden border border-border bg-card motion-fade-in motion-slide-up">
      {/* Tri-color civic stripe — red, gold, blue like the Philippine flag */}
      <div className="flex h-[3px] overflow-hidden" aria-hidden="true">
        <div className="h-full w-[34%] bg-red-pinoy" />
        <div className="h-full w-[32%] bg-gold" />
        <div className="h-full w-[34%] bg-barangay" />
      </div>

      <div className="p-5 pt-4">
        {/* Header: barangay letterhead + greeting + clock */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {brgyName && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                Barangay {brgyName}{locationStr}
              </p>
            )}
            
            
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span className="font-mono tabular-nums">{formatClock(clock)}</span>
          </div>
        </div>

        {/* Four-stat grid — the vital pulse of the barangay */}
        {stats.residents > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBlock
              icon={Users}
              value={stats.residents.toLocaleString()}
              label="Nakatala"
              hint="Kabuuang residente"
              iconBg="bg-barangay/10"
              iconColor="text-barangay"
              delay={0}
            />
            <StatBlock
              icon={UserCheck}
              value={stats.voters.toLocaleString()}
              label="Botante"
              hint="Rehistradong botante"
              iconBg="bg-gold/10"
              iconColor="text-gold"
              delay={100}
            />
            <StatBlock
              icon={Scale}
              value={stats.blotterActive}
              label="Aktibong Kaso"
              hint="Nangangailangan ng aksyon"
              iconBg="bg-red-pinoy/10"
              iconColor="text-red-pinoy"
              delay={200}
            />
            <StatBlock
              icon={UserPlus}
              value={stats.visitorsToday}
              label="Bisita Ngayon"
              hint="Ngayong araw na ito"
              iconBg="bg-narra/10"
              iconColor="text-narra"
              delay={300}
            />
          </div>
        )}

        {/* Officials info bar — like the names posted at the hall entrance */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/40 pt-3 text-xs text-muted-foreground">
          {contact && (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="size-3" />
              {contact}
            </span>
          )}
          <span className="hidden text-text-subtle sm:inline">|</span>
          {captain && (
            <span>
              <span className="font-medium text-foreground">{captain}</span>
              <span className="text-text-subtle"> — Punong Barangay</span>
            </span>
          )}
          {secretary && (
            <>
              <span className="hidden text-text-subtle sm:inline">|</span>
              <span>
                <span className="font-medium text-foreground">{secretary}</span>
                <span className="text-text-subtle"> — Kalihim</span>
              </span>
            </>
          )}
          {treasurer && (
            <>
              <span className="hidden text-text-subtle sm:inline">|</span>
              <span>
                <span className="font-medium text-foreground">{treasurer}</span>
                <span className="text-text-subtle"> — Ingat-yaman</span>
              </span>
            </>
          )}
          {brgyName && (
            <span className="ml-auto inline-flex items-center gap-1.5">
              <MapPin className="size-3" />
              Brgy. {brgyName}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
