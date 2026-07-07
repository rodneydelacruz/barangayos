import { PageHeader } from '@/components/ui/PageHeader'

export default function VisitorLogPage() {
  return (
    <div>
      <PageHeader title="Visitor Logs" subtitle="Track visitor entries and exits." />
      <div className="rounded-xl border border-bamboo/40 bg-card p-4 text-sm text-muted-foreground">
        Visitor logs are available from the reports dashboard while this page is being finalized.
      </div>
    </div>
  )
}
