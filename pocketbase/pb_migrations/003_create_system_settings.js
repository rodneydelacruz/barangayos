migrate((app) => {
  let collection = new Collection({
    name: "system_settings",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
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
        type: "text",
        name: "barangay_name",
        required: true,
        defaultValue: "Barangay Poblacion",
      },
      {
        type: "text",
        name: "municipality_city",
        required: true,
        defaultValue: "Local Municipality",
      },
      {
        type: "json",
        name: "purok_options",
        required: false,
      },
      {
        type: "json",
        name: "incident_types",
        required: false,
      },
    ],
  })

  app.save(collection)

  let savedCollection = app.findCollectionByNameOrId("system_settings")
  let record = new Record(savedCollection, {
    "key": "barangay_config",
    "barangay_name": "Barangay Poblacion",
    "municipality_city": "Local Municipality",
    "purok_options": JSON.stringify(["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5", "Sitio Central"]),
    "incident_types": JSON.stringify(["Noise Complaint", "Boundary Dispute", "Theft", "Physical Altercation", "Family Matter", "Vandalism"]),
  })
  app.save(record)
}, (app) => {
  let collection = app.findCollectionByNameOrId("system_settings")
  app.delete(collection)
})
