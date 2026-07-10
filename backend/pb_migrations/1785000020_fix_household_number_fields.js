/// <reference path="../pb_data/types.d.ts" />

// Fix: PocketBase NumberField with required:true rejects 0 as "blank"
// — make no_of_families, no_of_household_members, no_of_migrants optional
// so that auto-calculated 0 counts pass validation (same pattern as
// 1785000015_fix_required_fields.js applied to residents).

migrate((app) => {
  const hh = app.findCollectionByNameOrId("households");

  const fieldsToFix = ["no_of_families", "no_of_household_members", "no_of_migrants"];

  for (const name of fieldsToFix) {
    const f = hh.fields.find((f) => f.name === name);
    if (f) {
      f.required = false;
      console.log(`households: ${name} set to required=false`);
    }
  }

  app.save(hh);
  console.log("households number fields fixed");
});
