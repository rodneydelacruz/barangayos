import { useState, useEffect } from 'react'
import { queueSize } from './queue'
import { toast } from '@/lib/toast'
import { onSyncStatusChange, flushQueue, type SyncStatus } from './syncManager'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function OfflineIndicator() {
  const [count, setCount] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')

  useEffect(() => {
    function handleOnline() { toast.success('Back online — changes will sync automatically.') }
    function handleOffline() { toast.error('You are offline. Changes will be saved locally.') }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const updateCount = async () => setCount(await queueSize())
    updateCount()

    const handleOnline = async () => {
      setOnline(true)
      await flushQueue()
      updateCount()
    }
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const unsubscribe = onSyncStatusChange((status) => {
      setSyncStatus(status)
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribe()
    }
  }, [])

  const handleSync = async () => {
    await flushQueue()
    setCount(await queueSize())
  }

  if (online && count === 0) return null

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 animate-fade-in-up">
      {!online && (
        <Badge variant="destructive">Offline</Badge>
      )}
      {count > 0 && (
        <Badge
          variant="secondary"
          className={cn(
            syncStatus === 'syncing' && 'animate-pulse',
          )}
        >
          {syncStatus === 'syncing'
            ? 'Syncing...'
            : `${count} pending`}
        </Badge>
      )}
      {count > 0 && syncStatus === 'idle' && online && (
        <Button size="sm" variant="outline" onClick={handleSync}>
          Sync now
        </Button>
      )}
    </div>
  )
}
