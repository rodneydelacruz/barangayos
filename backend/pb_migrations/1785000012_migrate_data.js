/// <reference path="../pb_data/types.d.ts" />

// Phase 4: Migrate existing data
// Set defaults for new required fields on existing records

migrate((app) => {
  // Migrate existing households
  const allHH = app.findAllRecords("households");
  let hhCount = 0;
  for (const rec of allHH) {
    let needsSave = false;

    if (!rec.getString("region")) { rec.set("region", "to-fill"); needsSave = true; }
    if (!rec.getString("province")) { rec.set("province", "to-fill"); needsSave = true; }
    if (!rec.getString("city_municipality")) { rec.set("city_municipality", "to-fill"); needsSave = true; }
    if (!rec.getString("barangay")) { rec.set("barangay", "to-fill"); needsSave = true; }
    if (!rec.getString("household_complete_address")) { rec.set("household_complete_address", "to-fill"); needsSave = true; }
    if (!rec.get("no_of_families")) { rec.set("no_of_families", 1); needsSave = true; }
    if (!rec.get("no_of_household_members")) { rec.set("no_of_household_members", 1); needsSave = true; }
    if (!rec.get("no_of_migrants")) { rec.set("no_of_migrants", 1); needsSave = true; }
    if (!rec.getString("household_type")) { rec.set("household_type", "Nuclear Family"); needsSave = true; }
    if (!rec.getString("tenure_status")) { rec.set("tenure_status", "Owner"); needsSave = true; }
    if (!rec.getString("household_unit")) { rec.set("household_unit", "Single House"); needsSave = true; }

    if (needsSave) { app.save(rec); hhCount++; }
  }
  console.log(`households: ${hhCount} records migrated`);

  // Migrate existing residents
  const allRes = app.findAllRecords("residents");
  let resCount = 0;
  for (const rec of allRes) {
    let needsSave = false;

    if (!rec.getString("type_of_resident")) { rec.set("type_of_resident", "Non-migrant"); needsSave = true; }
    if (!rec.get("date_of_birth")) { rec.set("date_of_birth", "2000-01-01"); needsSave = true; }
    if (!rec.getString("place_of_birth")) { rec.set("place_of_birth", "to-fill"); needsSave = true; }
    if (!rec.getString("sex")) { rec.set("sex", "Male"); needsSave = true; }
    if (!rec.getString("civil_status")) { rec.set("civil_status", "Single/Never Married"); needsSave = true; }
    if (!rec.getString("nationality")) { rec.set("nationality", "Filipino Citizen"); needsSave = true; }
    if (!rec.getString("religion")) { rec.set("religion", "Roman Catholic"); needsSave = true; }
    if (!rec.getString("region")) { rec.set("region", "to-fill"); needsSave = true; }
    if (!rec.getString("province")) { rec.set("province", "to-fill"); needsSave = true; }
    if (!rec.getString("city_municipality")) { rec.set("city_municipality", "to-fill"); needsSave = true; }
    if (!rec.getString("barangay")) { rec.set("barangay", "to-fill"); needsSave = true; }

    // Bool fields default to false in PocketBase, no need to explicitly set

    if (needsSave) { app.save(rec); resCount++; }
  }
  console.log(`residents: ${resCount} records migrated`);

  console.log("Phase 4 complete");
});
