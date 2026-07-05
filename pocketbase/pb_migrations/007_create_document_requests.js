migrate((app) => {
  let users = app.findCollectionByNameOrId("users")
  let residents = app.findCollectionByNameOrId("residents")

  const collection = new Collection({
    name: "document_requests",
    type: "base",
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    updateRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    deleteRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    fields: [
      { type: "text", name: "queue_number", required: true, max: 10 },
      { type: "relation", name: "resident_id", required: true, collectionId: residents.id, maxSelect: 1 },
      { type: "text", name: "resident_name", required: true, max: 255 },
      { type: "select", name: "document_type", required: true, values: ["barangay_clearance", "business_permit", "certificate_of_indigency", "certificate_of_residency", "certificate_of_good_moral", "cedula", "other"] },
      { type: "text", name: "other_document_type", max: 255 },
      { type: "text", name: "purpose", required: true, max: 2000 },
      { type: "select", name: "status", required: true, values: ["pending", "processing", "for_release", "released", "cancelled"] },
      { type: "relation", name: "assigned_to", collectionId: users.id, maxSelect: 1 },
      { type: "text", name: "notes", max: 2000 },
      { type: "autodate", name: "requested_at", onCreate: true, onUpdate: false },
      { type: "date", name: "released_at" },
      { type: "text", name: "received_by", max: 255 },
    ],
    indexes: [
      "CREATE INDEX idx_docreq_queue ON document_requests (queue_number)",
      "CREATE INDEX idx_docreq_status ON document_requests (status)",
      "CREATE INDEX idx_docreq_type ON document_requests (document_type)",
      "CREATE INDEX idx_docreq_resident ON document_requests (resident_id)",
    ],
  })

  app.save(collection)
}, (app) => {
  let collection = app.findCollectionByNameOrId("document_requests")
  app.delete(collection)
})
