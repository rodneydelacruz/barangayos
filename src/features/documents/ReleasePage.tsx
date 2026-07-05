import { useState, useEffect, useMemo } from 'react'
import { Check, Search } from 'lucide-react'
import { getDocuments, updateDocument, type ApiDocument } from '@/api/documents'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  processing: 'bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  for_release: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  released: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  for_release: 'For Release',
  released: 'Released',
  cancelled: 'Cancelled',
}

export default function ReleasePage() {
  const [docs, setDocs] = useState<ApiDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [releaseDoc, setReleaseDoc] = useState<ApiDocument | null>(null)
  const [receivedBy, setReceivedBy] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    getDocuments()
      .then(setDocs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const forRelease = useMemo(() => {
    return docs.filter((d) => d.status === 'for_release')
  }, [docs])

  const filteredRelease = useMemo(() => {
    if (!search) return forRelease
    const q = search.toLowerCase()
    return forRelease.filter(
      (d) =>
        d.queue_number.toLowerCase().includes(q) ||
        d.resident_name.toLowerCase().includes(q),
    )
  }, [forRelease, search])

  function openReleaseDialog(doc: ApiDocument) {
    setReleaseDoc(doc)
    setReceivedBy('')
  }

  function closeReleaseDialog() {
    setReleaseDoc(null)
    setReceivedBy('')
  }

  async function confirmRelease() {
    if (!releaseDoc || !receivedBy.trim()) return
    try {
      const updated = await updateDocument(releaseDoc.id, {
        status: 'released',
        received_by: receivedBy.trim(),
        released_at: new Date().toISOString(),
      })
      setDocs((prev) => prev.map((d) => (d.id === releaseDoc.id ? updated : d)))
      setSuccessMsg(`Document #${releaseDoc.queue_number} released to ${receivedBy.trim()}.`)
      closeReleaseDialog()
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release document')
    }
  }

  return (
    <>
      <PageHeader title="Document Release" subtitle="Release completed documents to residents." />

      {successMsg && (
        <div className="mb-4 rounded-md bg-emerald-100 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 motion-fade-in">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive motion-fade-in">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by queue # or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-60 max-w-full pl-8 text-sm"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {forRelease.length} document{forRelease.length !== 1 ? 's' : ''} ready for release
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>For Release</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4 sm:p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded border p-3 motion-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : forRelease.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No documents ready for release.</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Documents marked as "For Release" in the Document Queue will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                    <th className="px-4 py-3 sm:px-6">Queue #</th>
                    <th className="px-4 py-3 sm:px-6">Resident</th>
                    <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Document Type</th>
                    <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Status</th>
                    <th className="px-4 py-3 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={filteredRelease.length === 0 ? 'hidden' : ''}>
                  {filteredRelease.map((d, i) => (
                    <tr
                      key={d.id}
                      className="border-b last:border-b-0 even:bg-muted/20 motion-fade-in motion-slide-up"
                      style={{ '--stagger-index': i } as React.CSSProperties}
                    >
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm font-medium text-foreground">
                        #{d.queue_number}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm text-foreground">
                        {d.resident_name}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell sm:px-6 text-sm capitalize text-muted-foreground">
                        {d.document_type.replace(/_/g, ' ')}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell sm:px-6">
                        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[d.status])}>
                          {statusLabels[d.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-right">
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={() => openReleaseDialog(d)}
                        >
                          <Check className="size-3.5" />
                          Release
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRelease.length === 0 && forRelease.length > 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">No documents match your search.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {releaseDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closeReleaseDialog} aria-hidden="true" />
          <div className="relative w-full max-w-sm rounded-lg bg-card p-6 shadow-xl motion-slide-up motion-fade-in">
            <h2 className="text-sm font-semibold text-foreground">Release Document</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Releasing #{releaseDoc.queue_number} — {releaseDoc.resident_name}
            </p>

            <div className="mt-4 space-y-2">
              <Label htmlFor="received-by">Received by *</Label>
              <Input
                id="received-by"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Full name of recipient"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmRelease()
                }}
              />
            </div>

            <div className="mt-5 flex gap-2">
              <Button onClick={confirmRelease} disabled={!receivedBy.trim()}>
                Confirm Release
              </Button>
              <Button type="button" variant="outline" onClick={closeReleaseDialog}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
