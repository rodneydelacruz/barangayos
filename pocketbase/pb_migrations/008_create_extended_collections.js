migrate((app) => {
  let users = app.findCollectionByNameOrId("users")

  // --- Recreate blotter_records with new schema ---
  let oldBlotter = app.findCollectionByNameOrId("blotter_records")
  app.delete(oldBlotter)

  const blotter = new Collection({
    name: "blotter_records",
    type: "base",
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    updateRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    deleteRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    fields: [
      { type: "text", name: "case_number", required: true, max: 20 },
      { type: "select", name: "incident_type", required: true, values: ["blotter", "complaint", "dispute", "other"] },
      { type: "text", name: "complainant_name", required: true, max: 255 },
      { type: "text", name: "complainant_contact", max: 20 },
      { type: "text", name: "respondent_name", max: 255 },
      { type: "text", name: "respondent_contact", max: 20 },
      { type: "date", name: "incident_date" },
      { type: "text", name: "incident_location", max: 500 },
      { type: "text", name: "narrative", max: 5000 },
      { type: "select", name: "status", required: true, values: ["pending", "hearing", "settled", "escalated", "dismissed"] },
      { type: "text", name: "action_taken", max: 2000 },
      { type: "text", name: "involved_parties", max: 2000 },
      { type: "relation", name: "created_by", collectionId: users.id, maxSelect: 1 },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_blotter_case_number ON blotter_records (case_number)",
      "CREATE INDEX idx_blotter_status ON blotter_records (status)",
      "CREATE INDEX idx_blotter_date ON blotter_records (incident_date)",
    ],
  })

  app.save(blotter)

  // --- Create activity_logs ---
  const activityLogs = new Collection({
    name: "activity_logs",
    type: "base",
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text", name: "action", required: true, max: 20 },
      { type: "text", name: "collection", required: true, max: 50 },
      { type: "text", name: "record_id", max: 50 },
      { type: "text", name: "details", max: 2000 },
      { type: "text", name: "user_name", max: 255 },
    ],
    indexes: [
      "CREATE INDEX idx_activity_collection ON activity_logs (collection)",
    ],
  })

  app.save(activityLogs)

  // --- Create visitor_logs ---
  const visitorLogs = new Collection({
    name: "visitor_logs",
    type: "base",
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    updateRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    deleteRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    fields: [
      { type: "text", name: "visitor_name", required: true, max: 255 },
      { type: "text", name: "contact_number", max: 20 },
      { type: "text", name: "purpose", required: true, max: 2000 },
      { type: "text", name: "person_to_visit", max: 255 },
      { type: "autodate", name: "time_in", onCreate: true, onUpdate: false },
      { type: "date", name: "time_out" },
    ],
    indexes: [
      "CREATE INDEX idx_visitor_time_in ON visitor_logs (time_in)",
      "CREATE INDEX idx_visitor_time_out ON visitor_logs (time_out)",
    ],
  })

  app.save(visitorLogs)
}, (app) => {
  let visitorLogs = app.findCollectionByNameOrId("visitor_logs")
  app.delete(visitorLogs)

  let activityLogs = app.findCollectionByNameOrId("activity_logs")
  app.delete(activityLogs)

  let users = app.findCollectionByNameOrId("users")

  let currentBlotter = app.findCollectionByNameOrId("blotter_records")
  app.delete(currentBlotter)

  const blotter = new Collection({
    name: "blotter_records",
    type: "base",
    listRule: '@request.auth.role != ""',
    viewRule: '@request.auth.role != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    updateRule: '@request.auth.role = "admin" || (@request.auth.role = "staff" && @request.auth.id = created_by)',
    deleteRule: '@request.auth.role = "admin"',
    fields: [
      { type: "text", name: "title", required: true, max: 255 },
      { type: "select", name: "status", required: true, values: ["pending", "approved", "rejected"] },
      { type: "relation", name: "created_by", collectionId: users.id, maxSelect: 1 },
    ],
    indexes: [],
  })

  app.save(blotter)
})
