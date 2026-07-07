import { PageHeader } from '@/components/ui/PageHeader'

export default function ActivityPage() {
  return (
    <div>
      <PageHeader title="Activity Logs" subtitle="Recent system activity and audit trail." />
      <div className="rounded-xl border border-bamboo/40 bg-card p-4 text-sm text-muted-foreground">
        Activity logs are available from the reports dashboard while this page is being finalized.
      </div>
    </div>
  )
}
