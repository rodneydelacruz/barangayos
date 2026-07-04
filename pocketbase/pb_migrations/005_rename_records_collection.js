migrate((app) => {
  let collection = app.findCollectionByNameOrId("records")
  collection.name = "blotter_records"
  app.save(collection)
}, (app) => {
  let collection = app.findCollectionByNameOrId("blotter_records")
  collection.name = "records"
  app.save(collection)
})
