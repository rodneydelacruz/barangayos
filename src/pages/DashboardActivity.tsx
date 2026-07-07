import { useState } from 'react'
import { Link } from 'react-router'
import { Clock, ChevronDown, FileText, Users, DoorOpen, Package, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ApiActivity } from '@/api/activity'
const collectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  blotter_records: FileText,
  residents: Users,
  document_requests: FileText,
  visitors: DoorOpen,
  assets: Package,
  meetings: Calendar,
}

interface DashboardActivityProps {
  activities: ApiActivity[]
  config?: Record<string, unknown>
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ngayon lang'
  if (mins < 60) return `${mins}m ang nakalipas`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} oras ang nakalipas`
  const days = Math.floor(hours / 24)
  return `${days} araw ang nakalipas`
}

export default function DashboardActivity(props: DashboardActivityProps) {
  const { activities, config } = props
  const pageSize = (config?.pageSize as number) ?? 5
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const visible = activities.slice(0, visibleCount)
  const hasMore = visibleCount < activities.length

  return (
    <Card className="motion-fade-in motion-slide-up" style={{ animationDelay: '100ms' }}>
      <CardContent className="p-5">
        <h2 className="font-display text-sm font-semibold text-foreground">Mga Kamakailang Gawain</h2>

        {activities.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground/60">
            Wala pang naitalang aktibidad.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {visible.map((act) => {
              const Icon = collectionIcons[act.collection] ?? Clock
              return (
                <li key={act.id} className="flex items-start gap-3 text-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-foreground">{act.details}</p>
                    <p className="text-xs text-muted-foreground/60">
                      {act.user_name} — {timeAgo(act.created)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <div className={hasMore ? 'mt-3 space-y-3' : 'mt-3 border-t pt-3'}>
          {hasMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleCount((prev) => Math.min(prev + pageSize, activities.length))}
              className="w-full gap-2 text-xs"
            >
              <ChevronDown className="size-3.5" />
              Mag-load ng Higit Pa ({activities.length - visibleCount} natitira)
            </Button>
          )}
          <Link to="/logs/activity">
            <Button variant="ghost" size="sm" className="w-full text-xs">Tingnan Lahat ng Aktibidad</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
