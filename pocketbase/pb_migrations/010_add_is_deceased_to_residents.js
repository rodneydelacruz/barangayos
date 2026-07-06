migrate((db) => {
  const collection = dao.findCollectionByNameOrId("residents")
  collection.schema.addField(new SchemaField({
    name: "is_deceased",
    type: "bool",
    required: false,
    default: false,
  }))
  dao.saveCollection(collection)
}, (db) => {
  const collection = dao.findCollectionByNameOrId("residents")
  collection.schema.removeField("is_deceased")
  dao.saveCollection(collection)
})
