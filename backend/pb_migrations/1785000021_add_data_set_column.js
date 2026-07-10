/// <reference path="../pb_data/types.d.ts" />

// Fix M1: Add data_set column to all three BIPS collections
// The spec requires an explicit metadata attribute marking data_set = "BIPS"
// on each stored record. Previously the frontend sent data_set: "BIPS" on every
// API call but PocketBase silently dropped it — no column existed to store it.

migrate((app) => {
  const collections = ["households", "household_members", "migrant_info"];

  for (const name of collections) {
    const coll = app.findCollectionByNameOrId(name);
    const hasDataSet = coll.fields.some((f) => f.name === "data_set");

    if (hasDataSet) {
      console.log(`${name}: data_set already exists, skipping`);
      continue;
    }

    const f = new TextField();
    f.name = "data_set";
    f.required = true;
    f.max = 10;
    coll.fields.push(f);
    app.save(coll);

    // Backfill existing records
    const records = app.findAllRecords(name);
    let count = 0;
    for (const rec of records) {
      if (!rec.getString("data_set")) {
        rec.set("data_set", "BIPS");
        app.save(rec);
        count++;
      }
    }

    console.log(`${name}: data_set field added, ${count} existing records backfilled`);
  }

  console.log("Fix M1 complete: data_set column added to all BIPS collections");
});
