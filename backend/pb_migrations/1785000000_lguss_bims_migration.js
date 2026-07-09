/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const households = app.dao().findCollectionByNameOrId("households");

  // Remove old fields no longer in spec
  for (const name of ["head_name", "notes"]) {
    const f = households.fields.find((ff) => ff.name === name);
    if (f) households.fields.remove(f.id);
  }

  // Remove fields being renamed
  for (const name of ["purok", "address"]) {
    const f = households.fields.find((ff) => ff.name === name);
    if (f) households.fields.remove(f.id);
  }

  // Add Form A1 fields
  const newFields = [
    { type: "text", name: "region", required: true, max: 255 },
    { type: "text", name: "province", required: true, max: 255 },
    { type: "text", name: "city_municipality", required: true, max: 255 },
    { type: "text", name: "barangay", required: true, max: 255 },
    { type: "text", name: "sitio_purok", required: false, max: 255 },
    { type: "text", name: "household_complete_address", required: true, max: 500 },
    { type: "number", name: "no_of_families", required: true },
    { type: "number", name: "no_of_household_members", required: true },
    { type: "number", name: "no_of_migrants", required: true },
    { type: "select", name: "household_type", required: true, values: ["Nuclear Family", "Extended Family", "Single/Solo Parent Family", "Childless Family", "Blended/Stepfamily", "Single Person Household", "Non-related Family", "Others"] },
    { type: "text", name: "household_type_other", required: false, max: 255 },
    { type: "select", name: "tenure_status", required: true, values: ["Owner", "Renter", "Others"] },
    { type: "text", name: "tenure_status_other", required: false, max: 255 },
    { type: "select", name: "household_unit", required: true, values: ["Single House", "Duplex", "Townhouse/Rowhouse", "Condominium", "Apartment", "Others"] },
    { type: "text", name: "household_unit_other", required: false, max: 255 },
    { type: "text", name: "household_name", required: false, max: 255 },
    { type: "number", name: "monthly_income", required: false },
  ];
  for (const f of newFields) households.fields.add(f);

  app.dao().saveCollection(households);
  console.log("households restructured");
});

migrate((app) => {
  const residents = app.dao().findCollectionByNameOrId("residents");

  // Remove old fields
  for (const name of ["suffix", "contact_number", "is_voter", "is_4ps", "is_senior", "is_pwd", "occupation", "notes", "gender", "birth_date", "purok", "nationality", "civil_status", "blood_type"]) {
    const f = residents.fields.find((ff) => ff.name === name);
    if (f) residents.fields.remove(f.id);
  }

  // Add all Inhabitant fields (spec §1.2)
  const newFields = [
    // Classification
    { type: "select", name: "type_of_resident", required: true, values: ["Non-migrant", "Migrant", "Transient"] },
    // Personal Information
    { type: "text", name: "philsys_card_no", required: false, max: 19 },
    { type: "text", name: "ext_name", required: false, max: 20 },
    { type: "date", name: "date_of_birth", required: true },
    { type: "number", name: "age", required: false },
    { type: "text", name: "place_of_birth", required: true, max: 255 },
    { type: "text", name: "residence_of_mother_upon_birth", required: false, max: 255 },
    { type: "select", name: "sex", required: true, values: ["Male", "Female"] },
    { type: "select", name: "gender", required: false, values: ["Lesbian", "Gay", "Bisexual", "Transgender", "Queer", "Intersex", "Asexual", "Others (specify)"] },
    { type: "select", name: "civil_status", required: true, values: ["Single/Never Married", "Married", "Common Law/Live-in", "Widowed", "Divorced", "Separated", "Annulled", "Unknown"] },
    { type: "bool", name: "pregnant_woman", required: false },
    { type: "select", name: "highest_educational_attainment", required: false, values: ["No education", "Pre-school", "Elementary Level", "Elementary Graduate", "High School Level", "High School Graduate", "Junior HS", "Junior HS Graduate", "Senior HS Level", "Senior HS Graduate", "Vocational/Tech", "College Level", "College Graduate", "Post-graduate"] },
    { type: "text", name: "profession_occupation", required: false, max: 255 },
    { type: "text", name: "mother_maiden_first_name", required: false, max: 255 },
    { type: "text", name: "mother_maiden_middle_name", required: false, max: 255 },
    { type: "text", name: "mother_maiden_last_name", required: false, max: 255 },
    // Contact Details
    { type: "email", name: "email_address", required: false },
    { type: "text", name: "mobile_number", required: false, max: 11 },
    { type: "text", name: "tel_number", required: false, max: 20 },
    // Address
    { type: "text", name: "region", required: true, max: 255 },
    { type: "text", name: "province", required: true, max: 255 },
    { type: "text", name: "city_municipality", required: true, max: 255 },
    { type: "text", name: "barangay", required: true, max: 255 },
    { type: "text", name: "sitio_purok", required: false, max: 255 },
    { type: "text", name: "house_block_lot_no", required: false, max: 255 },
    { type: "text", name: "street_name", required: false, max: 255 },
    { type: "text", name: "subdivision_village", required: false, max: 255 },
    { type: "text", name: "zip_code", required: false, max: 10 },
    // Identity Information
    { type: "select", name: "blood_type", required: false, values: ["A+", "A-", "O+", "O-", "B+", "B-", "AB+", "AB-"] },
    { type: "number", name: "height_m", required: false },
    { type: "number", name: "weight_kg", required: false },
    { type: "select", name: "complexion", required: false, values: ["Fair", "Medium", "Dark"] },
    { type: "select", name: "nationality", required: true, values: ["Filipino Citizen", "Dual Citizen", "Foreign Citizen", "No Citizenship"] },
    { type: "select", name: "ethnicity", required: false, values: ["AETA","AGTA","ATI","AYTA MAG-ANTSI","AYTA MAGBUKON","AYTA MAG-INDI","AYTA ABELLEN","BADJAO","BAGOBO","BAGO","BALANGAO","BATAK","B'LAAN","BUGKALOT","BUKIDNON","BONTOC","DUMAGAT","GADDANG","HANUNUO MANGYAN","HIGAONON","ILONGOT","IFUGAO","IRAYA MANGYAN","ISNEG","ITAWIS","IVATAN","IWAK","JAMA MAPUN","KABIHUG","KALAGAN","KALANGUYA","KALINGA","KANKANAEY","KAOLO","KE'NEY","KINARAY-A","KOLIBUGAN","KAGAYANEN","LAMBANGIAN","LANGILAN MANOBO","MAGUINDANAO","MANDAYA","MAMANWA","MANSAKA","MANOBO","MANGYAN","MATIGSALUG","MOLBOG","PALAWANO","PANAY BUKIDNON","PALA'WAN","PANKALIS","REMONTADO","SAMA BANGUINGUI","SAMA DILAUT","SUBANON","TAGBANWA","TAGAKAULO","TEDURAY","T'BOLI","TALAANDIG","TAU'T BATU","TINGGUIAN","TINGGIAN","TUMANDOK","UBO","YAKAN","OTHER LOCAL ETHNICITY","OTHER FOREIGN ETHNICITY","NOT REPORTED"] },
    { type: "select", name: "religion", required: true, values: ["Roman Catholic","Islam","Iglesia ni Cristo","Christian","Aglipayan Church","Seventh-day Adventist","Bible Baptist Church","Jehovah's Witnesses","Church of Jesus Christ of Latter-day Saints","United Church of Christ in the Philippines","Others (specify)"] },
    // Voter Info
    { type: "bool", name: "registered_voter", required: true },
    { type: "bool", name: "resident_voter", required: true },
    { type: "number", name: "last_voted_year", required: true },
    // Beneficiary Info
    { type: "json", name: "government_assistance_programs", required: false },
    // Sectoral Info
    { type: "bool", name: "employed", required: false },
    { type: "bool", name: "unemployed", required: false },
    { type: "bool", name: "ofw", required: false },
    { type: "bool", name: "indigenous_people", required: false },
    { type: "bool", name: "student", required: false },
    { type: "bool", name: "out_of_school_children", required: false },
    { type: "bool", name: "out_of_school_youth", required: false },
    { type: "bool", name: "migrant", required: false },
    { type: "bool", name: "refugee", required: false },
    { type: "bool", name: "senior_citizen", required: false },
    { type: "bool", name: "pwd", required: false },
    { type: "bool", name: "single_solo_parent", required: false },
    // Consent
    { type: "bool", name: "data_privacy_consent", required: true },
    { type: "date", name: "consent_signature_date", required: false },
  ];
  for (const f of newFields) residents.fields.add(f);

  app.dao().saveCollection(residents);
  console.log("residents restructured");
});

migrate((app) => {
  const { Collection } = require("pocketbase/coll");

  // household_members
  const hm = new Collection("household_members");
  hm.type = "base";
  hm.listRule = hm.viewRule = "@request.auth.id != \"\"";
  hm.createRule = hm.updateRule = hm.deleteRule = "@request.auth.role = \"admin\" || @request.auth.role = \"staff\"";
  hm.fields.add({ type: "relation", name: "household_id", required: true, collectionId: "households", cascadeDelete: true, maxSelect: 1 });
  hm.fields.add({ type: "text", name: "last_name", required: true, max: 255 });
  hm.fields.add({ type: "text", name: "first_name", required: true, max: 255 });
  hm.fields.add({ type: "text", name: "middle_name", required: false, max: 255 });
  hm.fields.add({ type: "text", name: "ext_name", required: false, max: 20 });
  hm.fields.add({ type: "select", name: "relationship_to_head", required: true, values: ["1","2a","2b","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26"] });
  hm.fields.add({ type: "select", name: "source_of_income", required: false, values: ["1","2","3","4","5","6","7","8"] });
  hm.fields.add({ type: "number", name: "monthly_income", required: false });
  hm.fields.add({ type: "number", name: "sort_order", required: false });
  app.dao().saveCollection(hm);

  // migrant_info
  const mi = new Collection("migrant_info");
  mi.type = "base";
  mi.listRule = mi.viewRule = "@request.auth.id != \"\"";
  mi.createRule = mi.updateRule = mi.deleteRule = "@request.auth.role = \"admin\" || @request.auth.role = \"staff\"";
  mi.fields.add({ type: "relation", name: "household_id", required: true, collectionId: "households", cascadeDelete: true, maxSelect: 1 });
  mi.fields.add({ type: "text", name: "last_name", required: true, max: 255 });
  mi.fields.add({ type: "text", name: "first_name", required: true, max: 255 });
  mi.fields.add({ type: "text", name: "middle_name", required: false, max: 255 });
  mi.fields.add({ type: "text", name: "ext_name", required: false, max: 20 });
  mi.fields.add({ type: "text", name: "previous_residence", required: true, max: 500 });
  mi.fields.add({ type: "text", name: "length_of_stay_previous_barangay", required: true, max: 50 });
  mi.fields.add({ type: "select", name: "reason_for_leaving", required: true, values: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16"] });
  mi.fields.add({ type: "text", name: "reason_for_leaving_other", required: false, max: 255 });
  mi.fields.add({ type: "date", name: "date_of_transfer", required: true });
  mi.fields.add({ type: "select", name: "reason_for_transferring", required: true, values: ["1","2","3","4","5"] });
  mi.fields.add({ type: "text", name: "reason_for_transferring_other", required: false, max: 255 });
  mi.fields.add({ type: "text", name: "duration_of_stay_current_barangay", required: true, max: 50 });
  mi.fields.add({ type: "bool", name: "intention_to_return", required: true });
  app.dao().saveCollection(mi);

  // deceased_records
  const dr = new Collection("deceased_records");
  dr.type = "base";
  dr.listRule = dr.viewRule = "@request.auth.id != \"\"";
  dr.createRule = dr.updateRule = "@request.auth.role = \"admin\" || @request.auth.role = \"staff\"";
  dr.deleteRule = "@request.auth.role = \"admin\"";
  dr.fields.add({ type: "relation", name: "inhabitant_id", required: true, collectionId: "residents", cascadeDelete: false, maxSelect: 1 });
  dr.fields.add({ type: "date", name: "date_of_death", required: true });
  dr.fields.add({ type: "text", name: "immediate_cause_of_death", required: true, max: 500 });
  dr.fields.add({ type: "select", name: "underlying_cause_of_death", required: true, values: ["Mental","Physical","Infectious","Non-Infectious","Deficiency","Inherited","Degenerative","Social","Self-Inflicted","Others (specify)"] });
  dr.fields.add({ type: "text", name: "underlying_cause_other", required: false, max: 255 });
  app.dao().saveCollection(dr);

  // lookups
  const lk = new Collection("lookups");
  lk.type = "base";
  lk.listRule = lk.viewRule = "@request.auth.id != \"\"";
  lk.createRule = lk.updateRule = lk.deleteRule = "@request.auth.role = \"admin\"";
  lk.fields.add({ type: "text", name: "group", required: true, max: 100 });
  lk.fields.add({ type: "json", name: "values", required: true });
  lk.fields.add({ type: "text", name: "description", required: false, max: 500 });
  app.dao().saveCollection(lk);

  console.log("new collections created");
});

migrate((app) => {
  const lookupColl = app.dao().findCollectionByNameOrId("lookups");
  const lookupData = [
    { group: "household_type", values: [{label:"Nuclear Family"},{label:"Extended Family"},{label:"Single/Solo Parent Family"},{label:"Childless Family"},{label:"Blended/Stepfamily"},{label:"Single Person Household"},{label:"Non-related Family"},{label:"Others"}] },
    { group: "tenure_status", values: [{label:"Owner"},{label:"Renter"},{label:"Others"}] },
    { group: "household_unit", values: [{label:"Single House"},{label:"Duplex"},{label:"Townhouse/Rowhouse"},{label:"Condominium"},{label:"Apartment"},{label:"Others"}] },
    { group: "relationship_to_head", values: [{code:"1",label:"Household Head"},{code:"2a",label:"Spouse"},{code:"2b",label:"Common-law/Live-in Partner"},{code:"3",label:"Son"},{code:"4",label:"Daughter"},{code:"5",label:"Stepson"},{code:"6",label:"Stepdaughter"},{code:"7",label:"Son-in-law"},{code:"8",label:"Daughter-in-law"},{code:"9",label:"Grandson"},{code:"10",label:"Granddaughter"},{code:"11",label:"Father"},{code:"12",label:"Mother"},{code:"13",label:"Father-in-Law"},{code:"14",label:"Mother-in-Law"},{code:"15",label:"Brother"},{code:"16",label:"Sister"},{code:"17",label:"Brother-in-Law"},{code:"18",label:"Sister-in-Law"},{code:"19",label:"Uncle"},{code:"20",label:"Aunt"},{code:"21",label:"Nephew"},{code:"22",label:"Niece"},{code:"23",label:"Other relative"},{code:"24",label:"Boarder"},{code:"25",label:"Domestic Helper"},{code:"26",label:"Other non-relative"}] },
    { group: "source_of_income", values: [{code:"1",label:"Employment"},{code:"2",label:"Business"},{code:"3",label:"Remittance"},{code:"4",label:"Investments"},{code:"5",label:"Pension"},{code:"6",label:"Farming"},{code:"7",label:"Fishing"},{code:"8",label:"Others"}] },
    { group: "reason_for_leaving", values: [{code:"1",label:"Lack of employment"},{code:"2",label:"Perception of better income in other place"},{code:"3",label:"Schooling"},{code:"4",label:"Presence of relatives and friends in other place"},{code:"5",label:"Employment/Job relocation"},{code:"6",label:"Disaster-related relocation"},{code:"7",label:"Retirement"},{code:"8",label:"To live with parents"},{code:"9",label:"To live with children"},{code:"10",label:"Marriage"},{code:"11",label:"Annulment/Divorce/Separation"},{code:"12",label:"Commuting-related reasons"},{code:"13",label:"Health-related reasons"},{code:"14",label:"Peace and security"},{code:"15",label:"Climate-induced displacement"},{code:"16",label:"Others (specify)"}] },
    { group: "reason_for_transferring", values: [{code:"1",label:"Availability of jobs"},{code:"2",label:"Higher wage"},{code:"3",label:"Presence of schools or universities"},{code:"4",label:"Presence of relatives & friends in other place"},{code:"5",label:"Others (specify)"}] },
    { group: "gender_options", values: [{label:"Lesbian"},{label:"Gay"},{label:"Bisexual"},{label:"Transgender"},{label:"Queer"},{label:"Intersex"},{label:"Asexual"},{label:"Others (specify)"}] },
    { group: "civil_status", values: [{label:"Single/Never Married"},{label:"Married"},{label:"Common Law/Live-in"},{label:"Widowed"},{label:"Divorced"},{label:"Separated"},{label:"Annulled"},{label:"Unknown"}] },
    { group: "educational_attainment", values: [{label:"No education"},{label:"Pre-school"},{label:"Elementary Level"},{label:"Elementary Graduate"},{label:"High School Level"},{label:"High School Graduate"},{label:"Junior HS"},{label:"Junior HS Graduate"},{label:"Senior HS Level"},{label:"Senior HS Graduate"},{label:"Vocational/Tech"},{label:"College Level"},{label:"College Graduate"},{label:"Post-graduate"}] },
    { group: "blood_type", values: [{label:"A+"},{label:"A-"},{label:"O+"},{label:"O-"},{label:"B+"},{label:"B-"},{label:"AB+"},{label:"AB-"}] },
    { group: "nationality", values: [{label:"Filipino Citizen"},{label:"Dual Citizen"},{label:"Foreign Citizen"},{label:"No Citizenship"}] },
    { group: "religion", values: [{label:"Roman Catholic"},{label:"Islam"},{label:"Iglesia ni Cristo"},{label:"Christian"},{label:"Aglipayan Church"},{label:"Seventh-day Adventist"},{label:"Bible Baptist Church"},{label:"Jehovah's Witnesses"},{label:"Church of Jesus Christ of Latter-day Saints"},{label:"United Church of Christ in the Philippines"},{label:"Others (specify)"}] },
    { group: "government_assistance_program", values: [{label:"4Ps"},{label:"TUPAD"},{label:"SLP"},{label:"Others (specify)"}] },
    { group: "underlying_cause_of_death", values: [{label:"Mental"},{label:"Physical"},{label:"Infectious"},{label:"Non-Infectious"},{label:"Deficiency"},{label:"Inherited"},{label:"Degenerative"},{label:"Social"},{label:"Self-Inflicted"},{label:"Others (specify)"}] },
  ];

  for (const data of lookupData) {
    const record = new Record(lookupColl);
    record.set("group", data.group);
    record.set("values", data.values);
    app.dao().saveRecord(record);
  }

  // Migrate existing residents data
  const records = app.dao().findRecordsByExpr("residents");
  for (const rec of records) {
    // gender -> sex mapping
    const oldGender = rec.getString("gender");
    if (oldGender) rec.set("sex", oldGender === "male" ? "Male" : oldGender === "female" ? "Female" : oldGender);

    // voter split
    const oldVoter = rec.getBool("is_voter");
    rec.set("registered_voter", oldVoter);
    rec.set("resident_voter", oldVoter);

    // benefits/x-sector migration
    const programs = [];
    if (rec.getBool("is_4ps")) programs.push("4Ps");
    if (programs.length > 0) rec.set("government_assistance_programs", programs);
    if (rec.getBool("is_senior")) rec.set("senior_citizen", true);
    if (rec.getBool("is_pwd")) rec.set("pwd", true);

    // civil status mapping
    const csMap = {single:"Single/Never Married",married:"Married",widowed:"Widowed",separated:"Separated"};
    if (csMap[rec.getString("civil_status")]) rec.set("civil_status", csMap[rec.getString("civil_status")]);

    // defaults
    if (!rec.getString("type_of_resident")) rec.set("type_of_resident", "Non-migrant");
    if (!rec.getString("nationality")) rec.set("nationality", "Filipino Citizen");
    if (!rec.getString("date_of_birth")) rec.set("date_of_birth", rec.getString("birth_date"));

    app.dao().saveRecord(rec);
  }

  // Migrate existing households data
  const hhs = app.dao().findRecordsByExpr("households");
  for (const rec of hhs) {
    if (rec.getString("purok")) rec.set("sitio_purok", rec.getString("purok"));
    if (rec.getString("address")) rec.set("household_complete_address", rec.getString("address"));
    if (!rec.getString("region")) rec.set("region", "");
    if (!rec.getString("province")) rec.set("province", "");
    if (!rec.getString("city_municipality")) rec.set("city_municipality", "");
    if (!rec.getString("barangay")) rec.set("barangay", "");
    app.dao().saveRecord(rec);
  }

  console.log("lookups seeded, data migrated");
});

migrate((app) => {
  // Soft-delete: only admin can delete, and only if no dependents
  const hh = app.dao().findCollectionByNameOrId("households");
  hh.deleteRule = "@request.auth.role = \"admin\" && !household_members.household_id ?= id";
  app.dao().saveCollection(hh);

  const res = app.dao().findCollectionByNameOrId("residents");
  res.deleteRule = "@request.auth.role = \"admin\" && !deceased_records.inhabitant_id ?= id";
  app.dao().saveCollection(res);

  console.log("delete rules updated for soft-delete");
});
