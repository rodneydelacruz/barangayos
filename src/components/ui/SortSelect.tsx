import { ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select } from './select'

interface SortOption {
  value: string
  label: string
}

interface SortSelectProps {
  value: string
  onChange: (value: string) => void
  options: SortOption[]
}

export function SortSelect({ value, onChange, options }: SortSelectProps) {
  function toggleDirection() {
    if (value.startsWith('-')) {
      onChange(value.slice(1))
    } else {
      onChange(`-${value}`)
    }
  }

  const baseValue = value.startsWith('-') ? value.slice(1) : value
  const isDesc = value.startsWith('-')

  return (
    <div className="flex items-center gap-1.5">
      <Select value={baseValue} onValueChange={(v) => onChange(isDesc ? `-${v}` : v)} className="h-9 w-44 text-sm">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </Select>
      <button
        type="button"
        onClick={toggleDirection}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground motion-press"
        title={isDesc ? 'Sort ascending' : 'Sort descending'}
      >
        <ArrowUpDown className={cn('size-3.5', isDesc && 'rotate-180')} />
      </button>
    </div>
  )
}
