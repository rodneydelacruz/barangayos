/// <reference path="../pb_data/types.d.ts" />

// Phase 6: Seed remaining frontend lookup groups with correct {label, code} format
// Fixes the 4 previously seeded groups from string format to object format
// Seeds all 12 groups the frontend forms need

migrate((app) => {
  const lkColl = app.findCollectionByNameOrId("lookups");

  const seedData = [
    // ── Household form lookups ──

    {
      group: "household_type",
      values: [
        { label: "Nuclear Family" },
        { label: "Extended Family" },
        { label: "Single/Solo Parent Family" },
        { label: "Childless Family" },
        { label: "Blended/Stepfamily" },
        { label: "Single Person Household" },
        { label: "Non-related Family" },
        { label: "Others" },
      ],
      description: "CBMS Form A1 — household_type"
    },
    {
      group: "tenure_status",
      values: [
        { label: "Owner" },
        { label: "Renter" },
        { label: "Others" },
      ],
      description: "CBMS Form A1 — tenure_status"
    },
    {
      group: "household_unit",
      values: [
        { label: "Single House" },
        { label: "Duplex" },
        { label: "Townhouse/Rowhouse" },
        { label: "Condominium" },
        { label: "Apartment" },
        { label: "Others" },
      ],
      description: "CBMS Form A1 — household_unit"
    },

    // ── Household Members lookups (fix format: strings → objects) ──

    {
      group: "relationship_to_head",
      values: [
        { label: "Household Head", code: "1" },
        { label: "Spouse", code: "2a" },
        { label: "Common-law/Live-in Partner", code: "2b" },
        { label: "Son", code: "3" },
        { label: "Daughter", code: "4" },
        { label: "Stepson", code: "5" },
        { label: "Stepdaughter", code: "6" },
        { label: "Son-in-law", code: "7" },
        { label: "Daughter-in-law", code: "8" },
        { label: "Grandson", code: "9" },
        { label: "Granddaughter", code: "10" },
        { label: "Father", code: "11" },
        { label: "Mother", code: "12" },
        { label: "Father-in-Law", code: "13" },
        { label: "Mother-in-Law", code: "14" },
        { label: "Brother", code: "15" },
        { label: "Sister", code: "16" },
        { label: "Brother-in-Law", code: "17" },
        { label: "Sister-in-Law", code: "18" },
        { label: "Uncle", code: "19" },
        { label: "Aunt", code: "20" },
        { label: "Nephew", code: "21" },
        { label: "Niece", code: "22" },
        { label: "Other relative", code: "23" },
        { label: "Boarder", code: "24" },
        { label: "Domestic Helper", code: "25" },
        { label: "Other non-relative", code: "26" },
      ],
      description: "CBMS Form A1 — relationship codes (stored as code values)"
    },
    {
      group: "source_of_income",
      values: [
        { label: "Employment", code: "1" },
        { label: "Business", code: "2" },
        { label: "Remittance", code: "3" },
        { label: "Investments", code: "4" },
        { label: "Pension", code: "5" },
        { label: "Farming", code: "6" },
        { label: "Fishing", code: "7" },
        { label: "Others", code: "8" },
      ],
      description: "CBMS Form A1 — source_of_income codes"
    },

    // ── Migrant Info lookups (fix format: strings → objects) ──

    {
      group: "reason_for_leaving",
      values: [
        { label: "Lack of employment", code: "1" },
        { label: "Perception of better income in other place", code: "2" },
        { label: "Schooling", code: "3" },
        { label: "Presence of relatives and friends in other place", code: "4" },
        { label: "Employment/Job relocation", code: "5" },
        { label: "Disaster-related relocation", code: "6" },
        { label: "Retirement", code: "7" },
        { label: "To live with parents", code: "8" },
        { label: "To live with children", code: "9" },
        { label: "Marriage", code: "10" },
        { label: "Annulment/Divorce/Separation", code: "11" },
        { label: "Commuting-related reasons", code: "12" },
        { label: "Health-related reasons", code: "13" },
        { label: "Peace and security", code: "14" },
        { label: "Climate-induced displacement", code: "15" },
        { label: "Others (specify)", code: "16" },
      ],
      description: "CBMS Form A1 — reason_for_leaving codes"
    },
    {
      group: "reason_for_transferring",
      values: [
        { label: "Availability of jobs", code: "1" },
        { label: "Higher wage", code: "2" },
        { label: "Presence of schools or universities", code: "3" },
        { label: "Presence of relatives & friends in other place", code: "4" },
        { label: "Others (specify)", code: "5" },
      ],
      description: "CBMS Form A1 — reason_for_transferring codes"
    },

    // ── Resident form lookups ──

    {
      group: "gender_options",
      values: [
        { label: "Lesbian" },
        { label: "Gay" },
        { label: "Bisexual" },
        { label: "Transgender" },
        { label: "Queer" },
        { label: "Intersex" },
        { label: "Asexual" },
        { label: "Others (specify)" },
      ],
      description: "CBMS Form A2 — gender identity options"
    },
    {
      group: "civil_status",
      values: [
        { label: "Single/Never Married" },
        { label: "Married" },
        { label: "Common Law/Live-in" },
        { label: "Widowed" },
        { label: "Divorced" },
        { label: "Separated" },
        { label: "Annulled" },
        { label: "Unknown" },
      ],
      description: "CBMS Form A2 — civil_status options"
    },
    {
      group: "educational_attainment",
      values: [
        { label: "No education" },
        { label: "Pre-school" },
        { label: "Elementary Level" },
        { label: "Elementary Graduate" },
        { label: "High School Level" },
        { label: "High School Graduate" },
        { label: "Junior HS" },
        { label: "Junior HS Graduate" },
        { label: "Senior HS Level" },
        { label: "Senior HS Graduate" },
        { label: "Vocational/Tech" },
        { label: "College Level" },
        { label: "College Graduate" },
        { label: "Post-graduate" },
      ],
      description: "CBMS Form A2 — highest_educational_attainment"
    },
    {
      group: "blood_type",
      values: [
        { label: "A+" },
        { label: "A-" },
        { label: "B+" },
        { label: "B-" },
        { label: "AB+" },
        { label: "AB-" },
        { label: "O+" },
        { label: "O-" },
      ],
      description: "CBMS Form A2 — blood_type options"
    },
    {
      group: "nationality",
      values: [
        { label: "Filipino Citizen" },
        { label: "Dual Citizen" },
        { label: "Foreign Citizen" },
        { label: "No Citizenship" },
      ],
      description: "CBMS Form A2 — nationality options"
    },
    {
      group: "ethnicity",
      values: [
        { label: "Aeta" },
        { label: "Agta" },
        { label: "Ati" },
        { label: "Ayta Mag-antsi" },
        { label: "Ayta Magbukon" },
        { label: "Ayta Mag-Indi" },
        { label: "Ayta Abellen" },
        { label: "Badjao" },
        { label: "Bagobo" },
        { label: "Bago" },
        { label: "Balangao" },
        { label: "Batak" },
        { label: "B'laan" },
        { label: "Bugkalot" },
        { label: "Bukidnon" },
        { label: "Bontoc" },
        { label: "Dumagat" },
        { label: "Gaddang" },
        { label: "Hanunuo Mangyan" },
        { label: "Higaonon" },
        { label: "Ilongot" },
        { label: "Ifugao" },
        { label: "Iraya Mangyan" },
        { label: "Isneg" },
        { label: "Itawis" },
        { label: "Ivatan" },
        { label: "Iwak" },
        { label: "Jama Mapun" },
        { label: "Kabihug" },
        { label: "Kalagan" },
        { label: "Kalanguya" },
        { label: "Kalinga" },
        { label: "Kankanaey" },
        { label: "Kaolo" },
        { label: "Ke'ney" },
        { label: "Kinaray-a" },
        { label: "Kolibugan" },
        { label: "Kagayanen" },
        { label: "Lambangian" },
        { label: "Langilan Manobo" },
        { label: "Maguindanao" },
        { label: "Mandaya" },
        { label: "Mamanwa" },
        { label: "Mansaka" },
        { label: "Manobo" },
        { label: "Mangyan" },
        { label: "Matigsalug" },
        { label: "Molbog" },
        { label: "Palawano" },
        { label: "Panay Bukidnon" },
        { label: "Pala'wan" },
        { label: "Pankalis" },
        { label: "Remontado" },
        { label: "Sama Banguingui" },
        { label: "Sama Dilaut" },
        { label: "Subanon" },
        { label: "Tagbanwa" },
        { label: "Tagakaulo" },
        { label: "Teduray" },
        { label: "T'boli" },
        { label: "Talaandig" },
        { label: "Tau't Batu" },
        { label: "Tingguian" },
        { label: "Tinggian" },
        { label: "Tumandok" },
        { label: "Ubo" },
        { label: "Yakan" },
        { label: "Other Local Ethnicity" },
        { label: "Other Foreign Ethnicity" },
        { label: "Not Reported" },
      ],
      description: "CBMS Form A2 — ethnicity (70 options, searchable combobox)"
    },
    {
      group: "religion",
      values: [
        { label: "Roman Catholic" },
        { label: "Islam" },
        { label: "Iglesia ni Cristo" },
        { label: "Christian" },
        { label: "Aglipayan Church" },
        { label: "Seventh-day Adventist" },
        { label: "Bible Baptist Church" },
        { label: "Jehovah's Witnesses" },
        { label: "Church of Jesus Christ of Latter-day Saints" },
        { label: "United Church of Christ in the Philippines" },
        { label: "Others (specify)" },
      ],
      description: "CBMS Form A2 — religion options"
    },
    {
      group: "government_assistance_program",
      values: [
        { label: "4Ps" },
        { label: "TUPAD" },
        { label: "SLP" },
        { label: "Others (specify)" },
      ],
      description: "CBMS Form A2 — government assistance programs (multi-select)"
    },

    // ── Deceased Records lookups ──

    {
      group: "underlying_cause_of_death",
      values: [
        { label: "Mental" },
        { label: "Physical" },
        { label: "Infectious" },
        { label: "Non-Infectious" },
        { label: "Deficiency" },
        { label: "Inherited" },
        { label: "Degenerative" },
        { label: "Social" },
        { label: "Self-Inflicted" },
        { label: "Others (specify)" },
      ],
      description: "CBMS Form A3 — underlying_cause_of_death"
    },
  ];

  const existing = app.findAllRecords("lookups");
  const existingMap = {};
  for (const r of existing) existingMap[r.getString("group")] = r;

  let createCount = 0;
  let updateCount = 0;

  for (const s of seedData) {
    const existingRec = existingMap[s.group];
    if (existingRec) {
      // Update existing: fix format and values
      existingRec.set("values", s.values);
      existingRec.set("description", s.description || "");
      app.save(existingRec);
      updateCount++;
    } else {
      const rec = new Record(lkColl);
      rec.set("group", s.group);
      rec.set("values", s.values);
      rec.set("description", s.description || "");
      app.save(rec);
      createCount++;
    }
  }

  console.log(`lookups: ${createCount} new records created, ${updateCount} existing records updated`);
  console.log("Phase 6 complete — all frontend lookup groups seeded");
});
