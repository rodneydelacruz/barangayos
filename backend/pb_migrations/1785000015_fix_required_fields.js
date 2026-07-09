/// <reference path="../pb_data/types.d.ts" />

// Phase 7: Fix PocketBase required field quirks + add "Others (specify)" text fields
// - PocketBase BoolField with required:true rejects false — make them optional
// - PocketBase NumberField with required:true rejects 0 — make optional
// - Add _other text fields for conditional "Others (specify)" inputs

migrate((app) => {
  const res = app.findCollectionByNameOrId("residents");

  // Fix BoolFields: PocketBase v0.39 treats false as "blank" for required booleans
  const boolFixes = ["registered_voter", "resident_voter", "data_privacy_consent"];
  for (const name of boolFixes) {
    const f = res.fields.find(f => f.name === name);
    if (f) {
      f.required = false;
      console.log(`residents: ${name} set to required=false`);
    }
  }

  // Fix NumberField: PocketBase v0.39 treats 0 as "blank" for required numbers
  const nf = res.fields.find(f => f.name === "last_voted_year");
  if (nf) {
    nf.required = false;
    console.log("residents: last_voted_year set to required=false");
  }

  // Add _other text fields for "Others (specify)" conditional inputs
  const existingFieldNames = {};
  for (const f of res.fields) existingFieldNames[f.name] = true;

  if (!existingFieldNames["gender_other"]) {
    const gf = new TextField();
    gf.name = "gender_other";
    gf.required = false;
    gf.max = 255;
    res.fields.push(gf);
    console.log("residents: added gender_other");
  }

  if (!existingFieldNames["religion_other"]) {
    const rf = new TextField();
    rf.name = "religion_other";
    rf.required = false;
    rf.max = 255;
    res.fields.push(rf);
    console.log("residents: added religion_other");
  }

  app.save(res);
  console.log("Phase 7 complete");
});
