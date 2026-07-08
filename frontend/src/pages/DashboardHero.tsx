import { useState, useEffect } from 'react'
import { Clock, MapPin, SlidersHorizontal } from 'lucide-react'
import { getAllSettings } from '@/api/settings'

function formatClock(date: Date): string {
  return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
}

interface DashboardHeroProps {
  onCustomize?: () => void
}

export default function DashboardHero({ onCustomize }: DashboardHeroProps) {
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

  const locationParts = [municipality, province].filter(Boolean)
  const locationStr = locationParts.length > 0 ? `, ${locationParts.join(', ')}` : ''

  return (
    <div className="overflow-hidden border border-border bg-card motion-fade-in motion-slide-up">
      <div className="p-3">
        {/* Header: barangay name + clock + customize */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {brgyName && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                Barangay {brgyName}{locationStr}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span className="font-mono tabular-nums">{formatClock(clock)}</span>
            </div>
            <span className="text-muted-foreground/30">|</span>
            <button
              type="button"
              onClick={onCustomize}
              className="flex items-center gap-1 rounded px-1.5 py-1 text-blue-600 underline decoration-blue-600/30 transition-colors hover:text-blue-800 hover:decoration-blue-800 dark:text-blue-400 dark:decoration-blue-400/30 dark:hover:text-blue-300 dark:hover:decoration-blue-300"
              title="Customize dashboard"
            >
              <SlidersHorizontal className="size-3" />
              <span>Customize</span>
            </button>
          </div>
        </div>

        {/* Location bar */}
        {brgyName && (
          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
            <MapPin className="size-3" />
            Brgy. {brgyName}{locationStr}
          </div>
        )}
      </div>
    </div>
  )
}
