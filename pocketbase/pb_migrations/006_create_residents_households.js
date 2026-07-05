migrate((app) => {
  const households = new Collection({
    name: "households",
    type: "base",
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    updateRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    deleteRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    fields: [
      { type: "text", name: "household_number", required: true, max: 50 },
      { type: "text", name: "purok", max: 100 },
      { type: "text", name: "head_name", required: true, max: 255 },
      { type: "text", name: "address", max: 500 },
      { type: "text", name: "notes", max: 2000 },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_households_number ON households (household_number)",
      "CREATE INDEX idx_households_purok ON households (purok)",
    ],
  })

  app.save(households)

  const residents = new Collection({
    name: "residents",
    type: "base",
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    updateRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    deleteRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    fields: [
      { type: "text", name: "first_name", required: true, max: 255 },
      { type: "text", name: "last_name", required: true, max: 255 },
      { type: "text", name: "middle_name", max: 255 },
      { type: "select", name: "suffix", values: ["\u2014", "Jr.", "Sr.", "II", "III", "IV"] },
      { type: "date", name: "birth_date" },
      { type: "number", name: "age" },
      { type: "select", name: "gender", values: ["male", "female"] },
      { type: "text", name: "contact_number", max: 20 },
      { type: "relation", name: "household_id", collectionId: households.id, maxSelect: 1 },
      { type: "text", name: "purok", max: 100 },
      { type: "select", name: "civil_status", values: ["single", "married", "widowed", "separated"] },
      { type: "text", name: "occupation", max: 255 },
      { type: "text", name: "nationality", max: 100 },
      { type: "bool", name: "is_voter" },
      { type: "bool", name: "is_4ps" },
      { type: "bool", name: "is_senior" },
      { type: "bool", name: "is_pwd" },
      { type: "select", name: "blood_type", values: ["\u2014", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
      { type: "text", name: "notes", max: 2000 },
    ],
    indexes: [
      "CREATE INDEX idx_residents_name ON residents (last_name, first_name)",
      "CREATE INDEX idx_residents_purok ON residents (purok)",
      "CREATE INDEX idx_residents_household ON residents (household_id)",
    ],
  })

  app.save(residents)
}, (app) => {
  let residents = app.findCollectionByNameOrId("residents")
  app.delete(residents)

  let households = app.findCollectionByNameOrId("households")
  app.delete(households)
})
