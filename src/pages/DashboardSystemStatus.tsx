import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Server, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { checkApiReachable } from '@/lib/apiConfig'
import { cn } from '@/lib/utils'

export default function DashboardSystemStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  const [pbReachable, setPbReachable] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      doCheck()
    }
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    async function doCheck() {
      setChecking(true)
      const ok = await checkApiReachable()
      setPbReachable(ok)
      setChecking(false)
    }

    if (navigator.onLine) doCheck()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const statusColor = pbReachable === null
    ? 'bg-muted-foreground/40'
    : pbReachable && online
      ? 'bg-emerald-500'
      : 'bg-red-pinoy'

  const statusLabel = !online
    ? 'Offline'
    : checking
      ? 'Checking...'
      : pbReachable
        ? 'Online'
        : 'Server Unreachable'

  const StatusIcon = online ? Wifi : WifiOff

  return (
    <Card className="motion-fade-in motion-slide-up rounded-lg" style={{ animationDelay: '200ms' }}>
      <CardContent className="p-5">
        <h2 className="font-display text-sm font-semibold text-foreground">System Status</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Server className="size-3.5" />
              Database
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', statusColor)} />
              <span className="text-xs font-medium text-foreground">{statusLabel}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <StatusIcon className="size-3.5" />
              Network
            </div>
            <span className={cn(
              'text-xs font-medium',
              online ? 'text-emerald-500' : 'text-red-pinoy',
            )}>
              {online ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Package className="size-3.5" />
              Version
            </div>
            <span className="text-xs font-medium text-foreground">{__APP_VERSION__}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
