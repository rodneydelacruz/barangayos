/// <reference path="../pb_data/types.d.ts" />

// Phase 5: Seed lookup data

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

  let count = 0;
  for (const s of seedData) {
    if (existingGroups[s.group]) continue;
    const rec = new Record(lkColl);
    rec.set("group", s.group);
    rec.set("values", s.values);
    rec.set("description", s.description);
    app.save(rec);
    count++;
  }
  console.log(`lookups: ${count} new records seeded`);

  console.log("Phase 5 complete");
});
