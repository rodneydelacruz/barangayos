/// <reference path="../pb_data/types.d.ts" />

// ============================================================
// LGUSS-BIMS Phase 1: Restructure "households" collection
// ============================================================
// NOTE: If Phase 1 was already applied, this is a no-op.
// Checks for `region` field existence before running.
// ============================================================

migrate((app) => {
  const hh = app.findCollectionByNameOrId("households");
  const hasRegion = hh.fields.some(f => f.name === "region");

  if (hasRegion) {
    console.log("households: already restructured, skipping");
    return;
  }

  const db = app.db();

  // Step A: Remove old SQL indexes using raw DB API
  const hhDrop = hh.indexes.filter(idx =>
    idx.includes("purok") || idx.includes("head_name") || idx.includes("address")
  );
  for (const idx of hhDrop) {
    const match = idx.match(/CREATE(?: UNIQUE)? INDEX\s+(\S+)\s+ON/i);
    if (match) {
      try { db.dropIndex(match[1]); console.log("dropped index:", match[1]); } catch (e) { console.log("drop error:", e.message); }
    }
  }

  // Step B: Update collection's index list
  hh.indexes = hh.indexes.filter(idx =>
    !idx.includes("purok") && !idx.includes("head_name") && !idx.includes("address")
  );

  // Remove old fields
  for (const name of ["head_name", "notes", "purok", "address"]) {
    const fi = hh.fields.findIndex(f => f.name === name);
    if (fi > -1) hh.fields.splice(fi, 1);
  }

  // Add Form A1 fields
  for (const d of [
    { ctor: "TextField", name: "region", required: true, max: 255 },
    { ctor: "TextField", name: "province", required: true, max: 255 },
    { ctor: "TextField", name: "city_municipality", required: true, max: 255 },
    { ctor: "TextField", name: "barangay", required: true, max: 255 },
    { ctor: "TextField", name: "sitio_purok", required: false, max: 255 },
    { ctor: "TextField", name: "household_complete_address", required: true, max: 500 },
    { ctor: "NumberField", name: "no_of_families", required: true },
    { ctor: "NumberField", name: "no_of_household_members", required: true },
    { ctor: "NumberField", name: "no_of_migrants", required: true },
    { ctor: "SelectField", name: "household_type", required: true, values: ["Nuclear Family","Extended Family","Single/Solo Parent Family","Childless Family","Blended/Stepfamily","Single Person Household","Non-related Family","Others"] },
    { ctor: "TextField", name: "household_type_other", required: false, max: 255 },
    { ctor: "SelectField", name: "tenure_status", required: true, values: ["Owner","Renter","Others"] },
    { ctor: "TextField", name: "tenure_status_other", required: false, max: 255 },
    { ctor: "SelectField", name: "household_unit", required: true, values: ["Single House","Duplex","Townhouse/Rowhouse","Condominium","Apartment","Others"] },
    { ctor: "TextField", name: "household_unit_other", required: false, max: 255 },
    { ctor: "TextField", name: "household_name", required: false, max: 255 },
    { ctor: "NumberField", name: "monthly_income", required: false },
  ]) { hh.fields.push(makeField(d)); }

  app.save(hh);
  console.log("households restructured");
});

// ---- Helper ----

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
