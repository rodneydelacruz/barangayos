import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Users, ClipboardList, FileText, Package, DoorOpen,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Tabs } from '@/components/ui/tabs'
import {
  getDemographicsReport,
  getDocumentsReport,
  getBlotterReport,
  getAssetsReport,
  getVisitorsReport,
  getOverviewReport,
  type DemographicsReport,
  type DocumentsReport,
  type BlotterReport,
  type AssetsReport,
  type VisitorsReport,
  type OverviewReport,
} from '@/api/reports'
import ExportBar from './ExportBar'

type TabId = 'overview' | 'demographics' | 'documents' | 'blotter' | 'assets' | 'visitors'

const REPORT_TABS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="size-3.5" /> },
  { id: 'demographics', label: 'Demographics', icon: <Users className="size-3.5" /> },
  { id: 'documents', label: 'Documents', icon: <ClipboardList className="size-3.5" /> },
  { id: 'blotter', label: 'Blotter', icon: <FileText className="size-3.5" /> },
  { id: 'assets', label: 'Assets', icon: <Package className="size-3.5" /> },
  { id: 'visitors', label: 'Visitors', icon: <DoorOpen className="size-3.5" /> },
]

function StatCard({ label, value, icon: Icon, color }: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <Card className="overflow-hidden motion-lift">
      <div className="h-1 w-full bg-gold/60" />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">{label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          </div>
          <Icon className={cn('size-5 shrink-0 mt-0.5', color)} />
        </div>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full bg-gold/60" />
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-7 w-16 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}

function BarChart({ items, total, color = '#C9953E' }: {
  items: { label: string; count: number }[]
  total: number
  color?: string
}) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground/60">No data</p>
  }
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-28 text-xs font-medium truncate text-foreground">{item.label}</span>
          <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500"
              style={{
                width: `${total > 0 ? (item.count / total) * 100 : 0}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span className="w-8 text-right text-xs font-semibold text-foreground">{item.count}</span>
        </div>
      ))}
    </div>
  )
}

function BarChartSkeleton() {
  return (
    <div className="space-y-1.5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          <div className="flex-1 h-5 animate-pulse rounded bg-muted" />
          <div className="h-3 w-8 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

function SectionCard({ title, children, className }: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn('motion-fade-in motion-slide-up', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewReport | null>(null)
  const [demographics, setDemographics] = useState<DemographicsReport | null>(null)
  const [documents, setDocuments] = useState<DocumentsReport | null>(null)
  const [blotter, setBlotter] = useState<BlotterReport | null>(null)
  const [assets, setAssets] = useState<AssetsReport | null>(null)
  const [visitors, setVisitors] = useState<VisitorsReport | null>(null)
  const [loadedTabs, setLoadedTabs] = useState<Set<TabId>>(new Set())

  const loadTab = useCallback(async (tab: TabId) => {
    if (loadedTabs.has(tab)) return
    setLoading(true)
    try {
      switch (tab) {
        case 'overview': {
          const data = await getOverviewReport()
          setOverview(data)
          break
        }
        case 'demographics': {
          const data = await getDemographicsReport()
          setDemographics(data)
          break
        }
        case 'documents': {
          const data = await getDocumentsReport()
          setDocuments(data)
          break
        }
        case 'blotter': {
          const data = await getBlotterReport()
          setBlotter(data)
          break
        }
        case 'assets': {
          const data = await getAssetsReport()
          setAssets(data)
          break
        }
        case 'visitors': {
          const data = await getVisitorsReport()
          setVisitors(data)
          break
        }
      }
      setLoadedTabs((prev) => new Set(prev).add(tab))
    } catch {
      // Report functions already catch internally, but guard anyway
    } finally {
      setLoading(false)
    }
  }, [loadedTabs])

  useEffect(() => {
    loadTab(activeTab)
  }, [activeTab, loadTab])

  const sortedEntries = (record: Record<string, number>): { label: string; count: number }[] =>
    Object.entries(record)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)

  function renderTabContent() {
    if (loading) {
      switch (activeTab) {
        case 'overview':
          return (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {[1,2,3,4,5].map((i) => <StatCardSkeleton key={i} />)}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard title=""><BarChartSkeleton /></SectionCard>
                <SectionCard title=""><BarChartSkeleton /></SectionCard>
              </div>
            </div>
          )
        default:
          return (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1,2,3,4].map((i) => <StatCardSkeleton key={i} />)}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard title=""><BarChartSkeleton /></SectionCard>
                <SectionCard title=""><BarChartSkeleton /></SectionCard>
              </div>
            </div>
          )
      }
    }

    switch (activeTab) {
      case 'overview':
        if (!overview) return null
        return renderOverview(overview)
      case 'demographics':
        if (!demographics) return null
        return renderDemographics(demographics)
      case 'documents':
        if (!documents) return null
        return renderDocuments(documents)
      case 'blotter':
        if (!blotter) return null
        return renderBlotter(blotter)
      case 'assets':
        if (!assets) return null
        return renderAssets(assets)
      case 'visitors':
        if (!visitors) return null
        return renderVisitors(visitors)
    }
  }

  function renderOverview(data: OverviewReport) {
    const d = data.demographics
    const docs = data.documents
    const b = data.blotter
    const a = data.assets
    const v = data.visitors
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Total Residents" value={d.total} icon={Users} color="text-barangay" />
          <StatCard label="Document Requests" value={docs.total} icon={ClipboardList} color="text-gold" />
          <StatCard label="Blotter Cases" value={b.total} icon={FileText} color="text-red-pinoy" />
          <StatCard label="Total Assets" value={a.total} icon={Package} color="text-emerald-500" />
          <StatCard label="Visitor Entries" value={v.total} icon={DoorOpen} color="text-blue-500" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Residents by Purok (Top 5)">
            <BarChart items={sortedEntries(d.byPurok).slice(0, 5)} total={d.total} />
          </SectionCard>
          <SectionCard title="Documents by Status">
            <BarChart items={sortedEntries(docs.byStatus)} total={docs.total} />
          </SectionCard>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Blotter by Status">
            <BarChart items={sortedEntries(b.byStatus)} total={b.total} />
          </SectionCard>
          <SectionCard title="Visitors by Purpose">
            <BarChart items={sortedEntries(v.byPurpose)} total={v.total} />
          </SectionCard>
        </div>
      </div>
    )
  }

  function renderDemographics(data: DemographicsReport) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Total Residents" value={data.total} icon={Users} color="text-barangay" />
          <StatCard label="Voters" value={data.voters} icon={Users} color="text-blue-500" />
          <StatCard label="Seniors" value={data.senior} icon={Users} color="text-amber-500" />
          <StatCard label="PWD" value={data.pwd} icon={Users} color="text-red-pinoy" />
          <StatCard label="4Ps" value={data.fourPs} icon={Users} color="text-emerald-500" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="By Purok">
            <BarChart items={sortedEntries(data.byPurok)} total={data.total} />
          </SectionCard>
          <SectionCard title="By Gender">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Male</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{data.byGender.male}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Female</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{data.byGender.female}</p>
                </CardContent>
              </Card>
            </div>
          </SectionCard>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="By Civil Status">
            <BarChart items={sortedEntries(data.byCivilStatus)} total={data.total} />
          </SectionCard>
          <SectionCard title="Age Groups">
            <BarChart
              items={[
                { label: 'Under 18', count: data.ageGroups.under18 },
                { label: 'Adult (18-59)', count: data.ageGroups.adult },
                { label: 'Senior (60+)', count: data.ageGroups.senior },
              ]}
              total={data.total}
            />
          </SectionCard>
        </div>
      </div>
    )
  }

  function renderDocuments(data: DocumentsReport) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard label="Total Requests" value={data.total} icon={ClipboardList} color="text-barangay" />
          <StatCard label="Today's Requests" value={data.todayRequests} icon={ClipboardList} color="text-gold" />
          {sortedEntries(data.byStatus).slice(0, 2).map((s) => (
            <StatCard key={s.label} label={s.label} value={s.count} icon={ClipboardList} color="text-muted-foreground" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="By Status">
            <BarChart items={sortedEntries(data.byStatus)} total={data.total} />
          </SectionCard>
          <SectionCard title="By Document Type">
            <BarChart items={sortedEntries(data.byType)} total={data.total} />
          </SectionCard>
        </div>
      </div>
    )
  }

  function renderBlotter(data: BlotterReport) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total Cases" value={data.total} icon={FileText} color="text-barangay" />
          {sortedEntries(data.byStatus).slice(0, 2).map((s) => (
            <StatCard key={s.label} label={s.label} value={s.count} icon={FileText} color="text-muted-foreground" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="By Status">
            <BarChart items={sortedEntries(data.byStatus)} total={data.total} />
          </SectionCard>
          <SectionCard title="By Incident Type">
            <BarChart items={sortedEntries(data.byIncidentType)} total={data.total} />
          </SectionCard>
        </div>
      </div>
    )
  }

  function renderAssets(data: AssetsReport) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard label="Total Assets" value={data.total} icon={Package} color="text-barangay" />
          <StatCard label="Total Value" value={`₱${data.totalValue.toLocaleString()}`} icon={Package} color="text-gold" />
          {sortedEntries(data.byCondition).slice(0, 2).map((c) => (
            <StatCard key={c.label} label={c.label} value={c.count} icon={Package} color="text-muted-foreground" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard title="By Type">
            <BarChart items={sortedEntries(data.byType)} total={data.total} />
          </SectionCard>
          <SectionCard title="By Condition">
            <BarChart items={sortedEntries(data.byCondition)} total={data.total} />
          </SectionCard>
          <SectionCard title="By Status">
            <BarChart items={sortedEntries(data.byStatus)} total={data.total} />
          </SectionCard>
        </div>
      </div>
    )
  }

  function renderVisitors(data: VisitorsReport) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total Visits" value={data.total} icon={DoorOpen} color="text-barangay" />
          <StatCard label="Active Now" value={data.activeVisits} icon={DoorOpen} color="text-emerald-500" />
        </div>
        <SectionCard title="By Purpose">
          <BarChart items={sortedEntries(data.byPurpose)} total={data.total} />
        </SectionCard>
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Reports Dashboard" subtitle="Summary and insights across all barangay data" />

      <div className="mb-6 flex items-center justify-between">
        <Tabs tabs={REPORT_TABS} activeId={activeTab} onChange={(id) => setActiveTab(id as TabId)} className="border-bamboo/40" />
        <ExportBar activeTab={activeTab} />
      </div>

      {/* Tab content */}
      {renderTabContent()}
    </>
  )
}
