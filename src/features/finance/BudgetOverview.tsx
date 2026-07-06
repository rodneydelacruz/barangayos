import { useState, useEffect } from 'react'
import { DollarSign } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FiscalYearSelector } from '@/components/finance/FiscalYearSelector'
import { ExpenseClassCard } from '@/components/finance/ExpenseClassCard'
import { ComplianceWarning } from '@/components/finance/ComplianceWarning'
import { KpiChart } from '@/components/finance/KpiChart'
import { getAppropriations, type ApiAppropriation } from '@/api/appropriations'
import { getFundSources, type ApiFundSource } from '@/api/fundSources'
import { getIncomeAccounts, type ApiIncomeAccount } from '@/api/incomeAccounts'
import { getDisbursements, type ApiDisbursement } from '@/api/disbursements'
import { getRevenues, type ApiRevenue } from '@/api/revenues'
import { getFinanceConfig, type ComplianceWarningItem } from '@/api/settings'

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
  const [year, setYear] = useState(new Date().getFullYear())
  const [appropriations, setAppropriations] = useState<ApiAppropriation[]>([])
  const [fundSources, setFundSources] = useState<ApiFundSource[]>([])
  const [incomeAccounts, setIncomeAccounts] = useState<ApiIncomeAccount[]>([])
  const [disbursements, setDisbursements] = useState<ApiDisbursement[]>([])
  const [revenues, setRevenues] = useState<ApiRevenue[]>([])
  const [loading, setLoading] = useState(true)
  const [complianceWarnings, setComplianceWarnings] = useState<ComplianceWarningItem[]>([])

  async function load() {
    setLoading(true)
    try {
      const [apprs, funds, accts, disc, revs] = await Promise.all([
        getAppropriations(year),
        getFundSources(year),
        getIncomeAccounts(year),
        getDisbursements(),
        getRevenues(),
      ])
      setAppropriations(apprs)
      setFundSources(funds)
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
    setLoading(false)
  }

  useEffect(() => { load() }, [year])

  const psItems = appropriations.filter((a) => a.expense_class === 'PS')
  const mooeItems = appropriations.filter((a) => a.expense_class === 'MOOE')
  const coItems = appropriations.filter((a) => a.expense_class === 'CO')

  const psAppropriated = psItems.reduce((s, a) => s + a.appropriated_amount, 0)
  const psObligated = psItems.reduce((s, a) => s + (a.obligated_amount || 0), 0)
  const psDisbursed = psItems.reduce((s, a) => s + (a.disbursed_amount || 0), 0)
  const mooeAppropriated = mooeItems.reduce((s, a) => s + a.appropriated_amount, 0)
  const mooeObligated = mooeItems.reduce((s, a) => s + (a.obligated_amount || 0), 0)
  const mooeDisbursed = mooeItems.reduce((s, a) => s + (a.disbursed_amount || 0), 0)
  const coAppropriated = coItems.reduce((s, a) => s + a.appropriated_amount, 0)
  const coObligated = coItems.reduce((s, a) => s + (a.obligated_amount || 0), 0)
  const coDisbursed = coItems.reduce((s, a) => s + (a.disbursed_amount || 0), 0)

  const totalAppropriated = psAppropriated + mooeAppropriated + coAppropriated
  const totalObligated = psObligated + mooeObligated + coObligated
  const totalDisbursed = psDisbursed + mooeDisbursed + coDisbursed
  const totalIncome = incomeAccounts.reduce((s, a) => s + a.budgeted_amount, 0)

  const disbursementTrend = aggregateDaily(disbursements, 'disbursement_date')
  const revenueTrend = aggregateDaily(revenues, 'revenue_date')
  const utilizationData = buildDateRange(30).map((date) => {
    const rate = totalDisbursed > 0 && totalObligated > 0 ? Math.round((totalDisbursed / totalObligated) * 100) : 0
    return { date, value: rate }
  })

  return (
    <div>
      <PageHeader title="Budget Overview">
        <div className="flex items-center gap-4">
          <FiscalYearSelector value={year} onChange={setYear} />
        </div>
      </PageHeader>
      <Breadcrumb items={[
        { href: '/finance/budget', label: 'Finance' },
        { label: 'Budget Overview' },
      ]} className="mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Total Income', value: totalIncome },
          { label: 'Appropriated', value: totalAppropriated },
          { label: 'Obligated', value: totalObligated },
          { label: 'Disbursed', value: totalDisbursed },
          { label: 'Balance', value: totalAppropriated - totalDisbursed },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-lg border bg-card text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold">₱{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
      <ComplianceWarning warnings={complianceWarnings} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ExpenseClassCard title="PS (Personnel Services)" appropriated={psAppropriated} obligated={psObligated} disbursed={psDisbursed} itemCount={psItems.length} />
        <ExpenseClassCard title="MOOE (Maintenance & Other Operating Expenses)" appropriated={mooeAppropriated} obligated={mooeObligated} disbursed={mooeDisbursed} itemCount={mooeItems.length} />
        <ExpenseClassCard title="CO (Capital Outlay)" appropriated={coAppropriated} obligated={coObligated} disbursed={coDisbursed} itemCount={coItems.length} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiChart title="Disbursements (30 days)" type="bar" data={disbursementTrend} color="#C9953E" format="currency" />
        <KpiChart title="Revenue (30 days)" type="bar" data={revenueTrend} color="#22C55E" format="currency" />
        <KpiChart title="Utilization Rate (30 days)" type="line" data={utilizationData} color="#3B82F6" format="number" />
      </div>
    </div>
  )
}