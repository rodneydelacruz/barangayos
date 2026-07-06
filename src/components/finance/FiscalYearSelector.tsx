import { Select } from '@/components/ui/select'

interface FiscalYearSelectorProps {
  value: number
  onChange: (year: number) => void
  years?: number[]
}

export function FiscalYearSelector({ value, onChange, years }: FiscalYearSelectorProps) {
  const currentYear = new Date().getFullYear()
  const yearOptions = years ?? [currentYear - 1, currentYear, currentYear + 1]
  return (
    <Select className="w-32" value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      {yearOptions.map((y) => (
        <option key={y} value={String(y)}>{y}</option>
      ))}
    </Select>
  )
}
