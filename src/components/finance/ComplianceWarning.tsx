import { AlertTriangle } from 'lucide-react'

interface Warning {
  type: string
  fund_source?: string
  code?: string
  required?: number
  actual?: number
  shortfall?: number
  ps_total?: number
  cap?: number
  excess?: number
}

interface ComplianceWarningProps {
  warnings: Warning[]
}

export function ComplianceWarning({ warnings }: ComplianceWarningProps) {
  if (!warnings?.length) return null
  const f = (n: number) => '₱' + n.toLocaleString()
  return (
    <div className="space-y-2 mb-4">
      {warnings.map((w, i) => (
        <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="text-sm">
            {w.type === 'statutory_shortfall' && (
              <p><strong>{w.fund_source}</strong> ({w.code}): Appropriated {f(w.actual!)}, minimum required {f(w.required!)} — short {f(w.shortfall!)}</p>
            )}
            {w.type === 'ps_cap_exceeded' && (
              <p><strong>PS Cap Exceeded:</strong> Total PS ({f(w.ps_total!)}) exceeds 55% limit ({f(w.cap!)}) by {f(w.excess!)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
