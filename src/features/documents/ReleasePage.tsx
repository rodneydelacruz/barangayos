import { useState, useEffect, useMemo } from 'react'
import { Check, Search, DollarSign } from 'lucide-react'
import { getDocuments, updateDocument, getDocumentFee, type ApiDocument } from '@/api/documents'
import { getIncomeAccounts } from '@/api/incomeAccounts'
import { createRevenue } from '@/api/revenues'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-200 text-amber-900 border border-amber-400 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/30',
  processing: 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30',
  for_release: 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30',
  released: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-200 text-red-900 border border-red-400 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800/30',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  for_release: 'For Release',
  released: 'Released',
  cancelled: 'Cancelled',
}

export default function ReleasePage() {
  const today = () => new Date().toISOString().split('T')[0]
  const [docs, setDocs] = useState<ApiDocument[]>([])
  const [incomeAccounts, setIncomeAccounts] = useState<Array<{ id: string; coa_code: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [releaseDoc, setReleaseDoc] = useState<ApiDocument | null>(null)
  const [receivedBy, setReceivedBy] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [orNo, setOrNo] = useState('')
  const [paymentDate, setPaymentDate] = useState(today())
  const [incomeAccount, setIncomeAccount] = useState('')
  const [source, setSource] = useState('')
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getDocuments(),
      getIncomeAccounts().catch(() => []),
    ])
      .then(([d, accts]) => {
        setDocs(d)
        setIncomeAccounts(accts)
        if (accts.length > 0) setIncomeAccount(accts[0].id)
      })
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

  async function openReleaseDialog(doc: ApiDocument) {
    setReleaseDoc(doc)
    setReceivedBy('')
    setOrNo(doc.or_no || '')
    setPaymentDate(today())
    setSource(`Document fee — ${doc.document_type.replace(/_/g, ' ')} (#${doc.queue_number})`)
    setRemarks('')
    if (doc.payment_amount) {
      setPaymentAmount(String(doc.payment_amount))
    } else if (doc.payment_status === 'unpaid') {
      const fee = await getDocumentFee(doc.document_type)
      setPaymentAmount(fee > 0 ? String(fee) : '')
    } else {
      setPaymentAmount('')
    }
  }

  function closeReleaseDialog() {
    setReleaseDoc(null)
    setReceivedBy('')
    setPaymentAmount('')
    setOrNo('')
    setPaymentDate(today())
    setIncomeAccount(incomeAccounts.length > 0 ? incomeAccounts[0].id : '')
    setSource('')
    setRemarks('')
  }

  async function confirmRelease() {
    if (!releaseDoc || !receivedBy.trim()) return
    const payload: Partial<Record<string, unknown>> = {
      status: 'released',
      received_by: receivedBy.trim(),
      released_at: new Date().toISOString(),
    }
    if (releaseDoc.payment_status === 'unpaid' && paymentAmount) {
      const pa = parseFloat(paymentAmount)
      if (pa > 0) {
        payload.payment_status = 'paid'
        payload.payment_amount = pa
        payload.or_no = orNo.trim() || undefined
        payload.payment_date = paymentDate
      }
    }
    try {
      await updateDocument(releaseDoc.id, payload)

      if (releaseDoc.payment_status === 'unpaid' && parseFloat(paymentAmount) > 0 && incomeAccount) {
        try {
          await createRevenue({
            revenue_date: paymentDate,
            income_account: incomeAccount,
            category: 'document_fee',
            source: source || `Document fee — ${releaseDoc.document_type.replace(/_/g, ' ')} (#${releaseDoc.queue_number})`,
            amount: parseFloat(paymentAmount),
            document_request: releaseDoc.id,
            or_no: orNo.trim() || undefined,
            remarks: remarks || undefined,
          })
        } catch (_) {}
      }

      const refreshed = await getDocuments()
      setDocs(refreshed)
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
        <div className="mb-4 rounded-md bg-emerald-200 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-300 motion-fade-in">
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
                    <th className="hidden px-4 py-3 lg:table-cell sm:px-6">Payment</th>
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
                        <span className={cn('inline-flex rounded-md px-3.5 py-0.5 text-xs font-bold', statusColors[d.status])}>
                          {statusLabels[d.status]}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 lg:table-cell sm:px-6">
                        <span className={cn('inline-flex rounded-md px-3 py-0.5 text-xs font-bold', {
                          'bg-amber-100 text-amber-800': d.payment_status === 'unpaid',
                          'bg-emerald-100 text-emerald-800': d.payment_status === 'paid',
                          'bg-muted text-muted-foreground': d.payment_status === 'waived' || !d.payment_status,
                        })}>
                          {d.payment_status === 'unpaid' ? 'Unpaid' : d.payment_status === 'paid' ? 'Paid' : 'Waived'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-right">
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={() => openReleaseDialog(d)}
                        >
                          {d.payment_status === 'unpaid' ? <DollarSign className="size-3.5" /> : <Check className="size-3.5" />}
                          {d.payment_status === 'unpaid' ? 'Collect' : 'Release'}
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
          <div className="relative w-full max-w-md rounded-lg bg-card p-6 shadow-xl motion-slide-up motion-fade-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-semibold text-foreground">
              {releaseDoc.payment_status === 'unpaid' ? 'Collect Payment & Release' : 'Release Document'}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Releasing #{releaseDoc.queue_number} — {releaseDoc.resident_name}
            </p>

            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="received-by">Received by *</Label>
                <Input
                  id="received-by"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Full name of recipient"
                  autoFocus
                />
              </div>

              {releaseDoc.payment_status === 'unpaid' && (
                <>
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-3">Payment Details</p>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="payment-amount">Payment Amount</Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
                          <Input
                            id="payment-amount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="pl-6"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment-date">Payment Date</Label>
                        <Input
                          id="payment-date"
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="or-no">O.R. #</Label>
                        <Input
                          id="or-no"
                          value={orNo}
                          onChange={(e) => setOrNo(e.target.value)}
                          placeholder="Official receipt number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="income-account">Income Account *</Label>
                        <Select value={incomeAccount} onValueChange={setIncomeAccount}>
                          <option value="">Select income account</option>
                          {incomeAccounts.map((a) => (
                            <option key={a.id} value={a.id}>{a.coa_code} — {a.name}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="source">Source</Label>
                        <Input
                          id="source"
                          value={source}
                          onChange={(e) => setSource(e.target.value)}
                          placeholder="e.g. Document fee — Barangay Clearance"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Input
                          id="remarks"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Optional notes"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <Button onClick={confirmRelease} disabled={!receivedBy.trim() || (releaseDoc.payment_status === 'unpaid' && !incomeAccount)}>
                {releaseDoc.payment_status === 'unpaid' ? 'Collect & Release' : 'Confirm Release'}
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
