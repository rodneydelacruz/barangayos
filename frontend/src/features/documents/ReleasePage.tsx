import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { useState, useEffect, useMemo } from 'react'
import { Check, DollarSign } from 'lucide-react'
import { getDocuments, updateDocument, getDocumentFee, type ApiDocument } from '@/api/documents'
import { createRevenue } from '@/api/revenues'
import { getFundSources, type ApiFundSource } from '@/api/fundSources'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { documentStatusColors } from '@/lib/statusStyles'

export default function ReleasePage() {
  const today = () => new Date().toISOString().split('T')[0]
  const [docs, setDocs] = useState<ApiDocument[]>([])
  const [fundSources, setFundSources] = useState<ApiFundSource[]>([])
  const [loading, setLoading] = useState(true)
  const [releaseDoc, setReleaseDoc] = useState<ApiDocument | null>(null)
  const [receivedBy, setReceivedBy] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [orNo, setOrNo] = useState('')
  const [paymentDate, setPaymentDate] = useState(today())
  const [fundSource, setFundSource] = useState('')
  const [source, setSource] = useState('')
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  useBodyScrollLock(releaseDoc !== null)

  useEffect(() => {
    Promise.all([
      getDocuments(),
      getFundSources().catch(() => [] as ApiFundSource[]),
    ]).then(([d, fs]) => {
      setDocs(d)
      setFundSources(fs)
      if (fs.length > 0) setFundSource(fs[0].id)
    }).catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const forRelease = useMemo(() => {
    return docs.filter((d) => d.status === 'for_release')
  }, [docs])

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
    setFundSource(fundSources.length > 0 ? fundSources[0].id : '')
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

      if (releaseDoc.payment_status === 'unpaid' && parseFloat(paymentAmount) > 0) {
        try {
          await createRevenue({
            revenue_date: paymentDate,
            fund_source: fundSource || undefined,
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

  const releaseColumns: Column<ApiDocument>[] = [
    { key: 'control_number', label: 'Control #', sortable: true, filterType: 'text',
      filterValue: (d) => `#${d.queue_number}`,
      render: (d) => `#${d.queue_number}` },
    { key: 'resident_name', label: 'Resident', sortable: true, filterType: 'text',
      render: (d) => d.resident_name },
    { key: 'document_type', label: 'Type', hideBelow: 'sm', filterType: 'select',
      filterOptions: [
        { label: 'Barangay Clearance', value: 'barangay_clearance' },
        { label: 'Business Permit', value: 'business_permit' },
        { label: 'Certificate of Indigency', value: 'certificate_of_indigency' },
        { label: 'Certificate of Residency', value: 'certificate_of_residency' },
        { label: 'Certificate of Good Moral', value: 'certificate_of_good_moral' },
        { label: 'Cedula', value: 'cedula' },
        { label: 'Other', value: 'other' },
      ] },
    { key: 'purpose', label: 'Purpose', filterType: 'text' },
    { key: 'status', label: 'Status',
      render: (d) => (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${documentStatusColors[d.status] ?? ''}`}>
          {d.status.replace(/_/g, ' ')}
        </span>
      ),
      filterType: 'select',
      filterOptions: [
        { label: 'Pending', value: 'pending' }, { label: 'Processing', value: 'processing' },
        { label: 'For Release', value: 'for_release' }, { label: 'Released', value: 'released' },
        { label: 'Cancelled', value: 'cancelled' },
      ] },
    { key: 'actions', label: '', className: 'w-24 text-right',
      render: (d) => (
        <Button size="sm" className="h-7 gap-1 px-2 text-xs w-20" onClick={(e) => { e.stopPropagation(); openReleaseDialog(d) }}>
          {d.payment_status === 'unpaid' ? <DollarSign className="size-3.5" /> : <Check className="size-3.5" />}
          {d.payment_status === 'unpaid' ? 'Collect' : 'Release'}
        </Button>
      ) },
  ]

  return (
    <>
      <PageHeader title="Document Release"/>

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

      <Card lifted={false} className="shadow-none">
        
        <CardContent className="p-0">
          <DataTable
            columns={releaseColumns}
            data={forRelease}
            loading={loading}
            emptyState={
              <EmptyState
                title="No documents ready for release."
                description='Documents marked as "For Release" in the Document Queue will appear here.'
              />
            }
            toolbar
            exportable
            rowKey={(d) => d.id}
          />
        </CardContent>
      </Card>

      {releaseDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closeReleaseDialog} aria-hidden="true" />
          <div className="relative w-full max-w-md rounded-lg bg-card p-6 shadow-xl motion-slide-up motion-fade-in max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-sm font-semibold text-foreground">
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
                        <Label htmlFor="fund-source">Fund Source *</Label>
                        <Select value={fundSource} onValueChange={setFundSource}>
                          <option value="">Select fund source</option>
                          {fundSources.map((fs) => (
                            <option key={fs.id} value={fs.id}>{fs.name}</option>
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
              <Button size="sm" onClick={confirmRelease} disabled={!receivedBy.trim() || (releaseDoc.payment_status === 'unpaid' && !fundSource)} className="px-4">
                {releaseDoc.payment_status === 'unpaid' ? 'Collect & Release' : 'Confirm Release'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={closeReleaseDialog} className="px-4">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
