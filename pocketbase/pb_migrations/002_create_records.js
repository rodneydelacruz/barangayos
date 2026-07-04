migrate((app) => {
  let users = app.findCollectionByNameOrId("users")

  let collection = new Collection({
    name: "records",
    type: "base",
    listRule: '@request.auth.role != ""',
    viewRule: '@request.auth.role != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "staff"',
    updateRule: '@request.auth.role = "admin" || (@request.auth.role = "staff" && @request.auth.id = created_by)',
    deleteRule: '@request.auth.role = "admin"',
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
        name: "title",
        required: true,
        max: 255,
      },
      {
        type: "select",
        name: "status",
        required: true,
        values: ["pending", "approved", "rejected"],
        defaultValue: "pending",
      },
      {
        type: "relation",
        name: "created_by",
        collectionId: users.id,
        required: false,
        maxSelect: 1,
      },
    ],
  })

  app.save(collection)
}, (app) => {
  let collection = app.findCollectionByNameOrId("records")
  app.delete(collection)
})
