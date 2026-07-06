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
}

export default function DashboardChart({ title, items, total }: DashboardChartProps) {
  const maxCount = Math.max(...items.map((i) => i.count), 1)

  return (
    <Card className="motion-fade-in motion-slide-up" style={{ animationDelay: '150ms' }}>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground/60">No data available</p>
        ) : (
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
        )}
      </CardContent>
    </Card>
  )
}
