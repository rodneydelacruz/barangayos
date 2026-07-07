import { BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface BarItem {
  label: string
  count: number
  color: string
}

interface DashboardChartProps {
  title: string
  items: BarItem[]
  total: number
  config?: Record<string, unknown>
}

export default function DashboardChart({ title, items, total, config }: DashboardChartProps) {
  const chartType = (config?.chartType as string) ?? 'bar'
  const maxCount = Math.max(...items.map((i) => i.count), 1)

  function renderDonut() {
    const donutTotal = items.reduce((s, i) => s + i.count, 0) || 1
    let cumulativeAngle = 0
    return (
      <div className="flex items-center justify-center gap-4">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="48" fill="none" stroke="var(--color-muted)" strokeWidth="16" />
          {items.map((item) => {
            const angle = (item.count / donutTotal) * 360
            const startAngle = cumulativeAngle
            cumulativeAngle += angle
            if (angle === 0) return null
            const startRad = ((startAngle - 90) * Math.PI) / 180
            const endRad = ((startAngle + angle - 90) * Math.PI) / 180
            const x1 = 60 + 48 * Math.cos(startRad)
            const y1 = 60 + 48 * Math.sin(startRad)
            const x2 = 60 + 48 * Math.cos(endRad)
            const y2 = 60 + 48 * Math.sin(endRad)
            const largeArc = angle > 180 ? 1 : 0
            return (
              <path
                key={item.label}
                d={`M 60 60 L ${x1} ${y1} A 48 48 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={item.color}
              />
            )
          })}
          <circle cx="60" cy="60" r="32" fill="var(--color-card)" />
        </svg>
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-foreground">{item.label}</span>
              <span className="font-medium text-muted-foreground tabular-nums">{Math.round((item.count / donutTotal) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderBar() {
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="w-24 truncate text-xs font-medium text-foreground">{item.label}</span>
            <div className="relative flex-1">
              <div className="h-5 rounded-sm bg-muted">
                <div
                  className="h-full rounded-sm transition-all duration-700 ease-out"
                  style={{
                    width: `${(item.count / maxCount) * 100}%`,
                    backgroundColor: item.color,
                    minWidth: item.count > 0 ? '4px' : '0',
                  }}
                />
              </div>
            </div>
            <span className="w-7 text-right text-xs font-semibold text-foreground">{item.count}</span>
          </div>
        ))}
        <p className="pt-1 text-[10px] text-muted-foreground/60">Kabuuang bilang: {total}</p>
      </div>
    )
  }

  return (
    <Card className="motion-fade-in motion-slide-up rounded-lg" style={{ animationDelay: '150ms' }}>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-semibold text-foreground">{title}</h2>
        </div>
        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground/60">No data available</p>
        ) : chartType === 'donut' ? (
          renderDonut()
        ) : (
          renderBar()
        )}
      </CardContent>
    </Card>
  )
}
