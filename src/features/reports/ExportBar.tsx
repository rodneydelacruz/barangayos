import { useState, useRef, useEffect } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { exportWorkbook, type ExportCollection, type DateRange } from './useExportWorkbook'
import { toast } from '@/lib/toast'

const COLLECTION_MAP: Record<string, ExportCollection> = {
  demographics: 'residents',
  documents: 'documents',
  blotter: 'blotter',
  assets: 'assets',
  visitors: 'visitors',
}

const COLLECTION_LABELS: Record<string, string> = {
  demographics: 'Demographics',
  documents: 'Documents',
  blotter: 'Blotter',
  assets: 'Assets',
  visitors: 'Visitors',
}

export default function ExportBar({ activeTab }: { activeTab: string }) {
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState<string>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [exporting, setExporting] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const collection = COLLECTION_MAP[activeTab]
  if (!collection) return null

  async function handleExport() {
    let dateRange: DateRange
    if (preset === 'custom') {
      if (!from || !to) {
        toast.error('Please select both start and end dates.')
        return
      }
      if (from > to) {
        toast.error('Start date must be before end date.')
        return
      }
      dateRange = { preset: 'custom', from, to }
    } else {
      dateRange = { preset } as DateRange
    }

    setExporting(true)
    try {
      await exportWorkbook(collection, dateRange)
    } catch {
      toast.error('An error occurred while exporting.')
    } finally {
      setExporting(false)
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5"
      >
        <Download className="size-3.5" />
        Export
      </Button>

      {open && (
        <Card className="absolute right-0 top-full mt-2 z-50 w-72 shadow-lg">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
              Export {COLLECTION_LABELS[activeTab] ?? collection}
            </p>

            <Select value={preset} onValueChange={(v) => { setPreset(v); if (v !== 'custom') { setFrom(''); setTo('') } }}>
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom range</option>
            </Select>

            {preset === 'custom' && (
              <div className="space-y-2">
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Start date" />
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder="End date" />
              </div>
            )}

            <Button onClick={handleExport} disabled={exporting} className="w-full gap-1.5">
              <Download className="size-3.5" />
              {exporting ? 'Exporting...' : 'Download .xlsx'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
