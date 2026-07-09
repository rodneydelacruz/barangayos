/// <reference path="../pb_data/types.d.ts" />

// Phase 8: Add government_assistance_other text field for "Others (specify)"
// custom input in Government Assistance Programs multi-select.

migrate((app) => {
  const res = app.findCollectionByNameOrId("residents");

  const existingFieldNames = {};
  for (const f of res.fields) existingFieldNames[f.name] = true;

  if (!existingFieldNames["government_assistance_other"]) {
    const gf = new TextField();
    gf.name = "government_assistance_other";
    gf.required = false;
    gf.max = 255;
    res.fields.push(gf);
    console.log("residents: added government_assistance_other");
  } else {
    console.log("residents: government_assistance_other already exists");
  }

  // Also add occupation field if missing (the old migration may have skipped
  // it if the collection was already restructured)
  if (!existingFieldNames["occupation"] && !existingFieldNames["profession_occupation"]) {
    const occ = new TextField();
    occ.name = "profession_occupation";
    occ.required = false;
    occ.max = 255;
    res.fields.push(occ);
    console.log("residents: added profession_occupation");
  }

  app.save(res);
  console.log("Phase 8 complete");
});
