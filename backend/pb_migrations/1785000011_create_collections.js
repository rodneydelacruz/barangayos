/// <reference path="../pb_data/types.d.ts" />

// Phase 3: Create new collections

migrate((app) => {
  const hhColl = app.findCollectionByNameOrId("households");
  const resColl = app.findCollectionByNameOrId("residents");

  // Check if collections already exist (idempotent)
  const existingNames = {};
  for (const c of app.findAllCollections()) existingNames[c.name] = true;

  // household_members
  if (!existingNames["household_members"]) {
    const hm = new Collection();
    hm.name = "household_members";
    hm.type = "base";
    hm.listRule = hm.viewRule = "@request.auth.id != \"\"";
    hm.createRule = hm.updateRule = hm.deleteRule = "@request.auth.role = \"admin\" || @request.auth.role = \"staff\"";
    for (const d of [
      { ctor: "RelationField", name: "household_id", required: true, collectionId: hhColl.id, maxSelect: 1, cascadeDelete: true },
      { ctor: "TextField", name: "last_name", required: true, max: 255 },
      { ctor: "TextField", name: "first_name", required: true, max: 255 },
      { ctor: "TextField", name: "middle_name", required: false, max: 255 },
      { ctor: "TextField", name: "ext_name", required: false, max: 20 },
      { ctor: "SelectField", name: "relationship_to_head", required: true, values: ["1","2a","2b","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26"] },
      { ctor: "SelectField", name: "source_of_income", required: false, values: ["1","2","3","4","5","6","7","8"] },
      { ctor: "NumberField", name: "monthly_income", required: false },
      { ctor: "NumberField", name: "sort_order", required: false },
    ]) hm.fields.push(makeField(d));
    app.save(hm);
    console.log("household_members created");
  } else {
    console.log("household_members: already exists");
  }

  // migrant_info
  if (!existingNames["migrant_info"]) {
    const mi = new Collection();
    mi.name = "migrant_info";
    mi.type = "base";
    mi.listRule = mi.viewRule = "@request.auth.id != \"\"";
    mi.createRule = mi.updateRule = mi.deleteRule = "@request.auth.role = \"admin\" || @request.auth.role = \"staff\"";
    for (const d of [
      { ctor: "RelationField", name: "household_id", required: true, collectionId: hhColl.id, maxSelect: 1, cascadeDelete: true },
      { ctor: "TextField", name: "last_name", required: true, max: 255 },
      { ctor: "TextField", name: "first_name", required: true, max: 255 },
      { ctor: "TextField", name: "middle_name", required: false, max: 255 },
      { ctor: "TextField", name: "ext_name", required: false, max: 20 },
      { ctor: "TextField", name: "previous_residence", required: true, max: 500 },
      { ctor: "TextField", name: "length_of_stay_previous_barangay", required: true, max: 50 },
      { ctor: "SelectField", name: "reason_for_leaving", required: true, values: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16"] },
      { ctor: "TextField", name: "reason_for_leaving_other", required: false, max: 255 },
      { ctor: "DateField", name: "date_of_transfer", required: true },
      { ctor: "SelectField", name: "reason_for_transferring", required: true, values: ["1","2","3","4","5"] },
      { ctor: "TextField", name: "reason_for_transferring_other", required: false, max: 255 },
      { ctor: "TextField", name: "duration_of_stay_current_barangay", required: true, max: 50 },
      { ctor: "BoolField", name: "intention_to_return", required: true },
    ]) mi.fields.push(makeField(d));
    app.save(mi);
    console.log("migrant_info created");
  } else {
    console.log("migrant_info: already exists");
  }

  // deceased_records
  if (!existingNames["deceased_records"]) {
    const dr = new Collection();
    dr.name = "deceased_records";
    dr.type = "base";
    dr.listRule = dr.viewRule = "@request.auth.id != \"\"";
    dr.createRule = dr.updateRule = "@request.auth.role = \"admin\" || @request.auth.role = \"staff\"";
    dr.deleteRule = "@request.auth.role = \"admin\"";
    for (const d of [
      { ctor: "RelationField", name: "inhabitant_id", required: true, collectionId: resColl.id, maxSelect: 1, cascadeDelete: false },
      { ctor: "DateField", name: "date_of_death", required: true },
      { ctor: "TextField", name: "immediate_cause_of_death", required: true, max: 500 },
      { ctor: "SelectField", name: "underlying_cause_of_death", required: true, values: ["Mental","Physical","Infectious","Non-Infectious","Deficiency","Inherited","Degenerative","Social","Self-Inflicted","Others (specify)"] },
      { ctor: "TextField", name: "underlying_cause_other", required: false, max: 255 },
    ]) dr.fields.push(makeField(d));
    app.save(dr);
    console.log("deceased_records created");
  } else {
    console.log("deceased_records: already exists");
  }

  // lookups
  if (!existingNames["lookups"]) {
    const lk = new Collection();
    lk.name = "lookups";
    lk.type = "base";
    lk.listRule = lk.viewRule = "@request.auth.id != \"\"";
    lk.createRule = lk.updateRule = lk.deleteRule = "@request.auth.role = \"admin\"";
    for (const d of [
      { ctor: "TextField", name: "group", required: true, max: 100 },
      { ctor: "JSONField", name: "values", required: true },
      { ctor: "TextField", name: "description", required: false, max: 500 },
    ]) lk.fields.push(makeField(d));
    app.save(lk);
    console.log("lookups created");
  } else {
    console.log("lookups: already exists");
  }

  console.log("Phase 3 complete");
});

function makeField(def) {
  let f;
  switch (def.ctor) {
    case "TextField": f = new TextField(); f.max = def.max != null ? def.max : 255; break;
    case "NumberField": f = new NumberField(); break;
    case "BoolField": f = new BoolField(); break;
    case "SelectField": f = new SelectField(); f.values = def.values || []; break;
    case "DateField": f = new DateField(); break;
    case "EmailField": f = new EmailField(); break;
    case "JSONField": f = new JSONField(); break;
    case "RelationField":
      f = new RelationField();
      f.maxSelect = def.maxSelect != null ? def.maxSelect : 1;
      f.collectionId = def.collectionId || "";
      f.cascadeDelete = def.cascadeDelete || false;
      break;
    default: f = new TextField();
  }
  f.name = def.name;
  f.required = def.required || false;
  return f;
}
