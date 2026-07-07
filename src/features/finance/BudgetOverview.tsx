import { useState, useEffect } from 'react'
import { FiscalYearSelector } from '@/components/finance/FiscalYearSelector'
import { ExpenseClassCard } from '@/components/finance/ExpenseClassCard'
import { ComplianceWarning } from '@/components/finance/ComplianceWarning'
import { KpiChart } from '@/components/finance/KpiChart'
import { getAppropriations, type ApiAppropriation } from '@/api/appropriations'
import { getIncomeAccounts, type ApiIncomeAccount } from '@/api/incomeAccounts'
import { getDisbursements, type ApiDisbursement } from '@/api/disbursements'
import { getRevenues, type ApiRevenue } from '@/api/revenues'
import { getFinanceConfig, type ComplianceWarningItem } from '@/api/settings'
import { useWidgetConfig } from '@/components/dashboard/useWidgetConfig'
import { BUDGET_WIDGETS } from '@/components/dashboard/widgetRegistry'
import { WidgetSheet } from '@/components/dashboard/WidgetSheet'
import { useUserRole } from '@/auth/guards'

function buildDateRange(days = 30): string[] {
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function aggregateDaily<T extends { amount: number }>(
  records: (T & { disbursement_date?: string; revenue_date?: string })[],
  dateField: 'disbursement_date' | 'revenue_date',
): { date: string; value: number }[] {
  const map = new Map<string, number>()
  for (const r of records) {
    const d = r[dateField] || ''
    if (d) map.set(d, (map.get(d) || 0) + r.amount)
  }
  return buildDateRange(30).map((date) => ({ date, value: map.get(date) || 0 }))
}

export function BudgetOverview() {
  const role = useUserRole() ?? 'viewer'
  const { config, updateWidget, resetToDefaults, isVisible, getWidgetConfig } = useWidgetConfig('budget', role)
  const [sheetOpen, setSheetOpen] = useState(false)

  const [year, setYear] = useState(new Date().getFullYear())
  const [appropriations, setAppropriations] = useState<ApiAppropriation[]>([])
  const [incomeAccounts, setIncomeAccounts] = useState<ApiIncomeAccount[]>([])
  const [disbursements, setDisbursements] = useState<ApiDisbursement[]>([])
  const [revenues, setRevenues] = useState<ApiRevenue[]>([])
  const [complianceWarnings, setComplianceWarnings] = useState<ComplianceWarningItem[]>([])

  async function load() {
    try {
      const [apprs, accts, disc, revs] = await Promise.all([
        getAppropriations(year),
        getIncomeAccounts(year),
        getDisbursements(),
        getRevenues(),
      ])
      setAppropriations(apprs)
      setIncomeAccounts(accts)
      setDisbursements(disc)
      setRevenues(revs)
      const fc = await getFinanceConfig()
      if (fc?.complianceWarnings?.[String(year)]) {
        setComplianceWarnings(fc.complianceWarnings[String(year)])
      } else {
        setComplianceWarnings([])
      }
    } catch (_) {}
  }

  useEffect(() => { load() }, [year])

  const psItems = appropriations.filter((a) => a.expense_class === 'PS')
  const mooeItems = appropriations.filter((a) => a.expense_class === 'MOOE')
  const coItems = appropriations.filter((a) => a.expense_class === 'CO')

  const psAppropriated = psItems.reduce((s, a) => s + a.appropriated_amount, 0)
  const psDisbursed = psItems.reduce((s, a) => s + (a.disbursed_amount || 0), 0)
  const mooeAppropriated = mooeItems.reduce((s, a) => s + a.appropriated_amount, 0)
  const mooeDisbursed = mooeItems.reduce((s, a) => s + (a.disbursed_amount || 0), 0)
  const coAppropriated = coItems.reduce((s, a) => s + a.appropriated_amount, 0)
  const coDisbursed = coItems.reduce((s, a) => s + (a.disbursed_amount || 0), 0)

  const totalAppropriated = psAppropriated + mooeAppropriated + coAppropriated
  const totalDisbursed = psDisbursed + mooeDisbursed + coDisbursed
  const totalIncome = incomeAccounts.reduce((s, a) => s + a.budgeted_amount, 0)

  const disbursementTrend = aggregateDaily(disbursements, 'disbursement_date')
  const revenueTrend = aggregateDaily(revenues, 'revenue_date')
  const utilizationData = buildDateRange(30).map((date) => {
    const rate = totalAppropriated > 0 ? Math.round((totalDisbursed / totalAppropriated) * 100) : 0
    return { date, value: rate }
  })

  const statConfig = getWidgetConfig('stat-cards') as { metrics?: string[] } | undefined
  const selectedStats = statConfig?.metrics ?? ['income', 'appropriated', 'disbursed', 'balance', 'utilization']

  const expenseConfig = getWidgetConfig('expense-cards') as { detailMode?: string } | undefined
  const detailMode = (expenseConfig?.detailMode as 'detailed' | 'compact') ?? 'detailed'

  const statMap: Record<string, { label: string; value: number }> = {
    income: { label: 'Total Income', value: totalIncome },
    appropriated: { label: 'Appropriated', value: totalAppropriated },
    disbursed: { label: 'Disbursed', value: totalDisbursed },
    balance: { label: 'Balance', value: totalAppropriated - totalDisbursed },
    utilization: { label: 'Utilization Rate', value: totalAppropriated > 0 ? Math.round((totalDisbursed / totalAppropriated) * 100) : 0 },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Budget Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <FiscalYearSelector value={year} onChange={setYear} />
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>
            Customize
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {isVisible('stat-cards') && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {selectedStats.map((key: string) => {
              const s = statMap[key]
              if (!s) return null
              const isUtil = key === 'utilization'
              return (
                <div key={key} className="rounded-lg border border-border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {isUtil ? `${s.value}%` : `₱${s.value.toLocaleString()}`}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {isVisible('compliance-warnings') && <ComplianceWarning warnings={complianceWarnings} />}

        {isVisible('expense-cards') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ExpenseClassCard title="PS (Personnel Services)" appropriated={psAppropriated} obligated={psDisbursed} disbursed={psDisbursed} itemCount={psItems.length} detailMode={detailMode} />
            <ExpenseClassCard title="MOOE (Maintenance & Other Operating Expenses)" appropriated={mooeAppropriated} obligated={mooeDisbursed} disbursed={mooeDisbursed} itemCount={mooeItems.length} detailMode={detailMode} />
            <ExpenseClassCard title="CO (Capital Outlay)" appropriated={coAppropriated} obligated={coDisbursed} disbursed={coDisbursed} itemCount={coItems.length} detailMode={detailMode} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isVisible('disbursements-chart') && (
            <KpiChart title="Disbursements (30 days)" type={(getWidgetConfig('disbursements-chart') as { chartType?: 'bar' | 'line' | 'area' })?.chartType ?? 'bar'} data={disbursementTrend} color="#C9953E" format="currency" />
          )}
          {isVisible('revenue-chart') && (
            <KpiChart title="Revenue (30 days)" type={(getWidgetConfig('revenue-chart') as { chartType?: 'bar' | 'line' | 'area' })?.chartType ?? 'bar'} data={revenueTrend} color="#22C55E" format="number" />
          )}
          {isVisible('utilization-chart') && (
            <KpiChart title="Utilization Rate (30 days)" type={(getWidgetConfig('utilization-chart') as { chartType?: 'bar' | 'line' | 'area' })?.chartType ?? 'line'} data={utilizationData} color="#3B82F6" format="number" />
          )}
        </div>
      </div>

      <WidgetSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        widgets={BUDGET_WIDGETS}
        config={config}
        onUpdateWidget={updateWidget}
        onReset={resetToDefaults}
      />
    </div>
  )
}
