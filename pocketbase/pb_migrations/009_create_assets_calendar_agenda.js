migrate((app) => {
  let users = app.findCollectionByNameOrId("users")

  // --- Create meetings (referenced by agenda_items and calendar_events) ---
  const meetings = new Collection({
    name: "meetings",
    type: "base",
    listRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    viewRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    updateRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    deleteRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    fields: [
      { type: "text", name: "title", required: true, max: 255 },
      { type: "date", name: "meeting_date", required: true },
      { type: "text", name: "location", max: 255 },
      { type: "select", name: "meeting_type", required: true, values: ["regular", "special", "emergency"] },
      { type: "select", name: "status", required: true, values: ["scheduled", "ongoing", "adjourned"] },
      { type: "text", name: "notes", max: 5000 },
    ],
    indexes: [
      "CREATE INDEX idx_meetings_date ON meetings (meeting_date)",
      "CREATE INDEX idx_meetings_status ON meetings (status)",
    ],
  })

  app.save(meetings)

  // --- Create agenda_items (depends on meetings) ---
  const agendaItems = new Collection({
    name: "agenda_items",
    type: "base",
    listRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    viewRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    updateRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    deleteRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    fields: [
      { type: "relation", name: "meeting_id", required: true, collectionId: meetings.id, maxSelect: 1, cascadeDelete: true },
      { type: "text", name: "title", required: true, max: 255 },
      { type: "text", name: "description", max: 5000 },
      { type: "number", name: "sort_order" },
      { type: "select", name: "status", required: true, values: ["pending", "discussed", "deferred"] },
      { type: "text", name: "minutes", max: 10000 },
      { type: "text", name: "submitted_by", max: 255 },
      { type: "autodate", name: "submitted_at", onCreate: true, onUpdate: false },
    ],
    indexes: [
      "CREATE INDEX idx_agenda_meeting ON agenda_items (meeting_id)",
      "CREATE INDEX idx_agenda_sort ON agenda_items (sort_order)",
    ],
  })

  app.save(agendaItems)

  // --- Create calendar_events (depends on meetings for agenda_ref) ---
  const calendarEvents = new Collection({
    name: "calendar_events",
    type: "base",
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    updateRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    deleteRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    fields: [
      { type: "text", name: "title", required: true, max: 255 },
      { type: "text", name: "description", max: 5000 },
      { type: "select", name: "event_type", required: true, values: ["barangay_event", "hearing", "council_meeting", "holiday", "other"] },
      { type: "date", name: "start_datetime", required: true },
      { type: "date", name: "end_datetime" },
      { type: "bool", name: "all_day" },
      { type: "text", name: "location", max: 255 },
      { type: "relation", name: "agenda_ref", collectionId: meetings.id, maxSelect: 1 },
      { type: "text", name: "notes", max: 5000 },
    ],
    indexes: [
      "CREATE INDEX idx_calendar_start ON calendar_events (start_datetime)",
      "CREATE INDEX idx_calendar_type ON calendar_events (event_type)",
    ],
  })

  app.save(calendarEvents)

  // --- Create assets (depends on users) ---
  const assets = new Collection({
    name: "assets",
    type: "base",
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
    fields: [
      { type: "text", name: "name", required: true, max: 255 },
      { type: "select", name: "asset_type", required: true, values: ["equipment", "furniture", "it_equipment", "vehicle", "facility", "tool", "other"] },
      { type: "text", name: "description", max: 5000 },
      { type: "text", name: "serial_number", max: 100 },
      { type: "date", name: "purchase_date" },
      { type: "number", name: "purchase_cost" },
      { type: "number", name: "current_value" },
      { type: "select", name: "condition", required: true, values: ["new", "good", "fair", "poor", "damaged", "disposed"] },
      { type: "select", name: "status", required: true, values: ["available", "assigned", "disposed"] },
      { type: "relation", name: "assigned_to", collectionId: users.id, maxSelect: 1 },
      { type: "text", name: "location", max: 255 },
      { type: "text", name: "image_url", max: 500 },
      { type: "text", name: "notes", max: 2000 },
    ],
    indexes: [
      "CREATE INDEX idx_assets_asset_type ON assets (asset_type)",
      "CREATE INDEX idx_assets_condition ON assets (condition)",
      "CREATE INDEX idx_assets_status ON assets (status)",
    ],
  })

  app.save(assets)
}, (app) => {
  let assets = app.findCollectionByNameOrId("assets")
  app.delete(assets)

  let calendarEvents = app.findCollectionByNameOrId("calendar_events")
  app.delete(calendarEvents)

  let agendaItems = app.findCollectionByNameOrId("agenda_items")
  app.delete(agendaItems)

  let meetings = app.findCollectionByNameOrId("meetings")
  app.delete(meetings)
})
