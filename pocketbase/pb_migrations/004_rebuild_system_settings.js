migrate((app) => {
  let old = app.findCollectionByNameOrId("system_settings")
  app.delete(old)

  let collection = new Collection({
    name: "system_settings",
    type: "base",
    listRule: "@request.auth.role != \"\"",
    viewRule: "@request.auth.role != \"\"",
    createRule: "@request.auth.role = \"admin\"",
    updateRule: "@request.auth.role = \"admin\"",
    deleteRule: "@request.auth.role = \"admin\"",
    fields: [
      {
        type: "autodate",
        name: "created",
        system: true,
        onCreate: true,
        onUpdate: false,
      },
      {
        type: "autodate",
        name: "updated",
        system: true,
        onCreate: true,
        onUpdate: true,
      },
      {
        type: "text",
        name: "key",
        required: true,
        unique: true,
      },
      {
        type: "json",
        name: "value",
      },
    ],
  })

  app.save(collection)

  let saved = app.findCollectionByNameOrId("system_settings")

  let defaults = {
    barangay_name: "Barangay Poblacion",
    municipality_city: "Local Municipality",
    province: "",
    region: "",
    postal_code: "",
    contact_number: "",
    barangay_captain: "",
    barangay_secretary: "",
    barangay_treasurer: "",
    purok_options: JSON.stringify(["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5", "Sitio Central"]),
    incident_types: JSON.stringify(["Noise Complaint", "Boundary Dispute", "Theft", "Physical Altercation", "Family Matter", "Vandalism"]),
  }

  for (let [key, value] of Object.entries(defaults)) {
    let record = new Record(saved, {
      key: key,
      value: value,
    })
    app.save(record)
  }
}, (app) => {
  let collection = app.findCollectionByNameOrId("system_settings")
  app.delete(collection)
})
