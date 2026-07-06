import { Link } from 'react-router'
import { AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DashboardTask } from './hooks/useDashboardData'

interface DashboardTasksProps {
  tasks: DashboardTask[]
}

const priorityConfig = {
  urgent: { icon: AlertCircle, color: 'text-red-pinoy', bg: 'bg-red-50 dark:bg-red-500/10' },
  normal: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
}

export default function DashboardTasks({ tasks }: DashboardTasksProps) {
  return (
    <Card className="motion-fade-in motion-slide-up">
      <CardContent className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          Ang Iyong mga Gawain
          <span className="text-[10px] font-normal text-muted-foreground/60">Ngayong araw</span>
        </h2>

        {tasks.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircle className="size-7 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Maayos ang lahat!</p>
              <p className="mt-1 text-xs text-muted-foreground/60">Walang nakabinbing gawain para sa iyo.</p>
            </div>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {tasks.map((task, idx) => {
              const cfg = priorityConfig[task.priority]
              const Icon = cfg.icon
              return (
                <li key={task.id}>
                  <Link
                    to={task.link}
                    className="flex items-start gap-4 rounded-xl p-4 text-sm transition-colors hover:bg-accent"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', cfg.bg)}>
                      <Icon className={cn('size-4', cfg.color)} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{task.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground/70">{task.description}</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {tasks.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <Link to="/records">
              <Button variant="ghost" size="sm" className="w-full text-xs">Tingnan Lahat</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
