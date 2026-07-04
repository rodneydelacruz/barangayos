migrate((app) => {
  let users = app.findCollectionByNameOrId("users")

  users.fields.add(new SelectField({
    name: "role",
    required: true,
    values: ["admin", "staff", "viewer"],
    defaultValue: "viewer",
  }))

  users.listRule = '@request.auth.role = "admin"'
  users.viewRule = '@request.auth.role = "admin" || @request.auth.id = id'
  users.createRule = '@request.auth.role = "admin"'
  users.updateRule = '@request.auth.role = "admin"'
  users.deleteRule = '@request.auth.role = "admin"'

  app.save(users)
}, (app) => {
  let users = app.findCollectionByNameOrId("users")

  let field = users.fields.find((f) => f.name === "role")
  if (field) users.fields.remove(field.id)

  users.listRule = null
  users.viewRule = null
  users.createRule = null
  users.updateRule = null
  users.deleteRule = null

  app.save(users)
})
