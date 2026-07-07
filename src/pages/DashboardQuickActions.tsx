import { Link } from 'react-router'
import { FileText, Users, DoorOpen, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Role } from '@/auth/session'

interface DashboardQuickActionsProps {
  role: Role
}

const actionsByRole: Record<Role, { label: string; to: string; icon: React.ComponentType<{ className?: string }> }[]> = {
  admin: [
    { label: 'New Document Request', to: '/documents', icon: FileText },
    { label: 'New Blotter Record', to: '/records', icon: FileText },
    { label: 'New Resident', to: '/residents', icon: Users },
    { label: 'Schedule Meeting', to: '/agenda', icon: Calendar },
  ],
  staff: [
    { label: 'New Blotter Record', to: '/records', icon: FileText },
    { label: 'New Document Request', to: '/documents', icon: FileText },
    { label: 'Log Visitor', to: '/logs/visitors', icon: DoorOpen },
  ],
  viewer: [
    { label: 'Browse Residents', to: '/residents', icon: Users },
    { label: 'View Reports', to: '/reports', icon: FileText },
  ],
}

export default function DashboardQuickActions({ role }: DashboardQuickActionsProps) {
  const actions = actionsByRole[role] ?? []

  return (
    <Card className="motion-fade-in motion-slide-up rounded-lg" style={{ animationDelay: '200ms' }}>
      <CardContent className="p-5">
        <h2 className="font-display text-sm font-semibold text-foreground">Mabilis na Access</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.to + action.label} to={action.to} className="block">
                <Button variant="outline" size="sm" className="w-full justify-center gap-2 motion-press sm:justify-start">
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{action.label}</span>
                </Button>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
