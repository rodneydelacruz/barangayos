/// <reference path="../pb_data/types.d.ts" />

// ============================================================
// LGUSS-BIMS Resident Profiling Module Migration
// Phases 2-5 (Phase 1 in 1785000008)
// ============================================================

// ---- Phase 2: Residents ----

migrate((app) => {
  const res = app.findCollectionByNameOrId("residents");
  const hasTypeOfResident = res.fields.some(f => f.name === "type_of_resident");

  if (hasTypeOfResident) {
    console.log("residents: already restructured, skipping");
    return;
  }

  const db = app.db();

  // Step A: Remove old SQL indexes
  const resDrop = res.indexes.filter(idx =>
    idx.includes("purok") || idx.includes("is_voter") || idx.includes("birth_date") ||
    idx.includes("gender") || idx.includes("civil_status") || idx.includes("blood_type") ||
    idx.includes("nationality") || idx.includes("occupation")
  );
  for (const idx of resDrop) {
    const match = idx.match(/CREATE(?: UNIQUE)? INDEX\s+(\S+)\s+ON/i);
    if (match) {
      try { db.dropIndex(match[1]); console.log("dropped residents index:", match[1]); } catch (e) { console.log("drop error:", e.message); }
    }
  }

  // Step B: Update collection's index list
  res.indexes = res.indexes.filter(idx =>
    !idx.includes("purok") && !idx.includes("is_voter") && !idx.includes("birth_date") &&
    !idx.includes("gender") && !idx.includes("civil_status") && !idx.includes("blood_type") &&
    !idx.includes("nationality") && !idx.includes("occupation")
  );

  // Remove old fields
  for (const name of ["suffix", "contact_number", "is_voter", "is_4ps", "is_senior", "is_pwd", "occupation", "notes", "gender", "birth_date", "purok", "nationality", "civil_status", "blood_type"]) {
    const fi = res.fields.findIndex(f => f.name === name);
    if (fi > -1) res.fields.splice(fi, 1);
  }

  // Add Inhabitant fields
  for (const d of [
    { ctor: "SelectField", name: "type_of_resident", required: true, values: ["Non-migrant","Migrant","Transient"] },
    { ctor: "TextField", name: "philsys_card_no", required: false, max: 19 },
    { ctor: "TextField", name: "ext_name", required: false, max: 20 },
    { ctor: "DateField", name: "date_of_birth", required: true },
    { ctor: "NumberField", name: "age", required: false },
    { ctor: "TextField", name: "place_of_birth", required: true, max: 255 },
    { ctor: "TextField", name: "residence_of_mother_upon_birth", required: false, max: 255 },
    { ctor: "SelectField", name: "sex", required: true, values: ["Male","Female"] },
    { ctor: "SelectField", name: "gender", required: false, values: ["Lesbian","Gay","Bisexual","Transgender","Queer","Intersex","Asexual","Others (specify)"] },
    { ctor: "SelectField", name: "civil_status", required: true, values: ["Single/Never Married","Married","Common Law/Live-in","Widowed","Divorced","Separated","Annulled","Unknown"] },
    { ctor: "BoolField", name: "pregnant_woman", required: false },
    { ctor: "SelectField", name: "highest_educational_attainment", required: false, values: ["No education","Pre-school","Elementary Level","Elementary Graduate","High School Level","High School Graduate","Junior HS","Junior HS Graduate","Senior HS Level","Senior HS Graduate","Vocational/Tech","College Level","College Graduate","Post-graduate"] },
    { ctor: "TextField", name: "profession_occupation", required: false, max: 255 },
    { ctor: "TextField", name: "mother_maiden_first_name", required: false, max: 255 },
    { ctor: "TextField", name: "mother_maiden_middle_name", required: false, max: 255 },
    { ctor: "TextField", name: "mother_maiden_last_name", required: false, max: 255 },
    { ctor: "EmailField", name: "email_address", required: false },
    { ctor: "TextField", name: "mobile_number", required: false, max: 11 },
    { ctor: "TextField", name: "tel_number", required: false, max: 20 },
    { ctor: "TextField", name: "region", required: true, max: 255 },
    { ctor: "TextField", name: "province", required: true, max: 255 },
    { ctor: "TextField", name: "city_municipality", required: true, max: 255 },
    { ctor: "TextField", name: "barangay", required: true, max: 255 },
    { ctor: "TextField", name: "sitio_purok", required: false, max: 255 },
    { ctor: "TextField", name: "house_block_lot_no", required: false, max: 255 },
    { ctor: "TextField", name: "street_name", required: false, max: 255 },
    { ctor: "TextField", name: "subdivision_village", required: false, max: 255 },
    { ctor: "TextField", name: "zip_code", required: false, max: 10 },
    { ctor: "SelectField", name: "blood_type", required: false, values: ["A+","A-","O+","O-","B+","B-","AB+","AB-"] },
    { ctor: "NumberField", name: "height_m", required: false },
    { ctor: "NumberField", name: "weight_kg", required: false },
    { ctor: "SelectField", name: "complexion", required: false, values: ["Fair","Medium","Dark"] },
    { ctor: "SelectField", name: "nationality", required: true, values: ["Filipino Citizen","Dual Citizen","Foreign Citizen","No Citizenship"] },
    { ctor: "SelectField", name: "ethnicity", required: false, values: ["AETA","AGTA","ATI","AYTA MAG-ANTSI","AYTA MAGBUKON","AYTA MAG-INDI","AYTA ABELLEN","BADJAO","BAGOBO","BAGO","BALANGAO","BATAK","B'LAAN","BUGKALOT","BUKIDNON","BONTOC","DUMAGAT","GADDANG","HANUNUO MANGYAN","HIGAONON","ILONGOT","IFUGAO","IRAYA MANGYAN","ISNEG","ITAWIS","IVATAN","IWAK","JAMA MAPUN","KABIHUG","KALAGAN","KALANGUYA","KALINGA","KANKANAEY","KAOLO","KE'NEY","KINARAY-A","KOLIBUGAN","KAGAYANEN","LAMBANGIAN","LANGILAN MANOBO","MAGUINDANAO","MANDAYA","MAMANWA","MANSAKA","MANOBO","MANGYAN","MATIGSALUG","MOLBOG","PALAWANO","PANAY BUKIDNON","PALA'WAN","PANKALIS","REMONTADO","SAMA BANGUINGUI","SAMA DILAUT","SUBANON","TAGBANWA","TAGAKAULO","TEDURAY","T'BOLI","TALAANDIG","TAU'T BATU","TINGGUIAN","TINGGIAN","TUMANDOK","UBO","YAKAN","OTHER LOCAL ETHNICITY","OTHER FOREIGN ETHNICITY","NOT REPORTED"] },
    { ctor: "SelectField", name: "religion", required: true, values: ["Roman Catholic","Islam","Iglesia ni Cristo","Christian","Aglipayan Church","Seventh-day Adventist","Bible Baptist Church","Jehovah's Witnesses","Church of Jesus Christ of Latter-day Saints","United Church of Christ in the Philippines","Others (specify)"] },
    { ctor: "BoolField", name: "registered_voter", required: true },
    { ctor: "BoolField", name: "resident_voter", required: true },
    { ctor: "NumberField", name: "last_voted_year", required: true },
    { ctor: "JSONField", name: "government_assistance_programs", required: false },
    { ctor: "BoolField", name: "employed", required: false },
    { ctor: "BoolField", name: "unemployed", required: false },
    { ctor: "BoolField", name: "ofw", required: false },
    { ctor: "BoolField", name: "indigenous_people", required: false },
    { ctor: "BoolField", name: "student", required: false },
    { ctor: "BoolField", name: "out_of_school_children", required: false },
    { ctor: "BoolField", name: "out_of_school_youth", required: false },
    { ctor: "BoolField", name: "migrant", required: false },
    { ctor: "BoolField", name: "refugee", required: false },
    { ctor: "BoolField", name: "senior_citizen", required: false },
    { ctor: "BoolField", name: "pwd", required: false },
    { ctor: "BoolField", name: "single_solo_parent", required: false },
    { ctor: "BoolField", name: "data_privacy_consent", required: true },
    { ctor: "DateField", name: "consent_signature_date", required: false },
  ]) { res.fields.push(makeField(d)); }

  app.save(res);
  console.log("residents restructured");
});

// ---- Phase 3: New Collections ----

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
});

// ---- Phase 4: Migrate existing data ----

migrate((app) => {
  // Migrate existing households: set defaults for new required fields
  const allHH = app.findAllRecords("households");
  for (const rec of allHH) {
    let needsSave = false;

    if (!rec.getString("region")) { rec.set("region", ""); needsSave = true; }
    if (!rec.getString("province")) { rec.set("province", ""); needsSave = true; }
    if (!rec.getString("city_municipality")) { rec.set("city_municipality", ""); needsSave = true; }
    if (!rec.getString("barangay")) { rec.set("barangay", ""); needsSave = true; }
    if (!rec.getString("household_complete_address")) { rec.set("household_complete_address", ""); needsSave = true; }
    if (!rec.get("no_of_families")) { rec.set("no_of_families", 1); needsSave = true; }
    if (!rec.get("no_of_household_members")) { rec.set("no_of_household_members", 1); needsSave = true; }
    if (!rec.get("no_of_migrants")) { rec.set("no_of_migrants", 0); needsSave = true; }
    if (!rec.getString("household_type")) { rec.set("household_type", "Nuclear Family"); needsSave = true; }
    if (!rec.getString("tenure_status")) { rec.set("tenure_status", "Owner"); needsSave = true; }
    if (!rec.getString("household_unit")) { rec.set("household_unit", "Single House"); needsSave = true; }

    if (needsSave) app.save(rec);
  }
  console.log("households: existing data migrated");

  // Migrate existing residents
  const allRes = app.findAllRecords("residents");
  for (const rec of allRes) {
    let needsSave = false;

    if (!rec.getString("type_of_resident")) { rec.set("type_of_resident", "Non-migrant"); needsSave = true; }
    if (!rec.get("date_of_birth")) {
      rec.set("date_of_birth", "2000-01-01");
      needsSave = true;
    }
    if (!rec.getString("place_of_birth")) { rec.set("place_of_birth", ""); needsSave = true; }
    if (!rec.getString("sex")) { rec.set("sex", "Male"); needsSave = true; }
    if (!rec.getString("civil_status")) { rec.set("civil_status", "Single/Never Married"); needsSave = true; }
    if (!rec.getString("nationality")) { rec.set("nationality", "Filipino Citizen"); needsSave = true; }
    if (!rec.getString("religion")) { rec.set("religion", "Roman Catholic"); needsSave = true; }
    if (!rec.get("registered_voter")) { rec.set("registered_voter", false); needsSave = true; }
    if (!rec.get("resident_voter")) { rec.set("resident_voter", false); needsSave = true; }
    if (!rec.get("last_voted_year")) { rec.set("last_voted_year", 0); needsSave = true; }
    if (!rec.get("data_privacy_consent")) { rec.set("data_privacy_consent", false); needsSave = true; }

    if (needsSave) app.save(rec);
  }
  console.log("residents: existing data migrated");
});

// ---- Phase 5: Seed lookup data ----

migrate((app) => {
  const lkColl = app.findCollectionByNameOrId("lookups");

  const seedData = [
    {
      group: "relationship_to_head",
      values: ["1:Head","2a:Spouse","2b:Head/Spouse(common-law)","3:Son/Daughter(legitimate)","4:Son/Daughter(illegitimate)","5:Son/Daughter(step)","6:Son/Daughter(adopted)","7:Son/Daughter(foster)","8:Son-in-law/Daughter-in-law","9:Grandson/Granddaughter","10:Father/Mother","11:Brother/Sister","12:Nephew/Niece","13:Relative(non-family)","14:Domestichelper","15:Nanny","16:Driver","17:Guard","18:Helper(non-domestic)","19:Househelper","20:Labandera","21:Houseboy","22:Waiter","23:Security Guard","24:Caregiver","25:Assistant","26:Otherrelative"],
      description: "Family relationship codes from CBMS Form A1"
    },
    {
      group: "source_of_income",
      values: ["1:Wage/Salary","2:Self-employment","3:Business","4:Remittances(international)","5:Remittances(domestic)","6:Pension","7:Governmentassistance","8:Others"],
      description: "Income source codes from CBMS Form A1"
    },
    {
      group: "reason_for_leaving",
      values: ["1:Lackofemployment","2:Lookforabetterjob","3:Transferofemployment","4:Posting/Retirement","5:Education/Training","6:Marriage/FamilyReasons","7:PeaceandOrder","8:ArmedConflict","9:Disaster","10:Eviction","11:EnvironmentalDegradation","12:Harassment/Discrimination","13:Illness","14:Death","15:Transferofresidence","16:Others"],
      description: "Reasons for leaving previous residence"
    },
    {
      group: "reason_for_transferring",
      values: ["1:Employment","2:Education","3:Marriage/Familyreasons","4:Transferofresidence","5:Others"],
      description: "Reasons for transferring to current barangay"
    },
  ];

  const existing = app.findAllRecords("lookups");
  const existingGroups = {};
  for (const r of existing) existingGroups[r.getString("group")] = true;

  for (const s of seedData) {
    if (existingGroups[s.group]) continue;
    const rec = new Record(lkColl);
    rec.set("group", s.group);
    rec.set("values", s.values);
    rec.set("description", s.description);
    app.save(rec);
  }
  console.log("lookups seeded");
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
