import { useState, useEffect } from 'react'
import { Landmark } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getAppropriations } from '@/api/appropriations'
import { getIncomeAccounts } from '@/api/incomeAccounts'
import { getDisbursements } from '@/api/disbursements'

interface DashboardBudgetSnapshotProps {
  metric?: string
}

export default function DashboardBudgetSnapshot({ metric = 'balance' }: DashboardBudgetSnapshotProps) {
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalAppropriated, setTotalAppropriated] = useState(0)
  const [totalDisbursed, setTotalDisbursed] = useState(0)

  useEffect(() => {
    const year = new Date().getFullYear()
    Promise.all([
      getAppropriations(year),
      getIncomeAccounts(year),
      getDisbursements(),
    ]).then(([apprs, accts, disc]) => {
      setTotalAppropriated(apprs.reduce((s, a) => s + a.appropriated_amount, 0))
      setTotalIncome(accts.reduce((s, a) => s + a.budgeted_amount, 0))
      setTotalDisbursed(disc.reduce((s, d) => s + d.amount, 0))
    }).catch(() => {})
  }, [])

  const balance = totalAppropriated - totalDisbursed
  const utilization = totalAppropriated > 0 ? Math.round((totalDisbursed / totalAppropriated) * 100) : 0

  const highlightValue = metric === 'income' ? totalIncome : metric === 'disbursed' ? totalDisbursed : balance
  const highlightLabel = metric === 'income' ? 'Total Income' : metric === 'disbursed' ? 'Disbursed' : 'Balance'

  return (
    <Card variant="default">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Landmark className="size-3.5" />
          Budget Overview
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{highlightLabel}</p>
            <p className="text-lg font-bold text-foreground tabular-nums">₱{highlightValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Utilization</p>
            <p className="text-lg font-bold text-foreground tabular-nums">{utilization}%</p>
          </div>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
