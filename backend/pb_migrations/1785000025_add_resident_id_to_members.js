/// <reference path="../pb_data/types.d.ts" />

// Add resident_id relation field to household_members for bidirectional linking
// between resident profiles and household member records.
// Backfill existing records by matching first_name + last_name.

migrate((app) => {
  const membersColl = app.findCollectionByNameOrId("household_members");
  const residentsColl = app.findCollectionByNameOrId("residents");

  // --- Add resident_id field if it doesn't exist ---
  const hasField = membersColl.fields.some((f) => f.name === "resident_id");
  if (!hasField) {
    const f = new RelationField();
    f.name = "resident_id";
    f.collectionId = residentsColl.id;
    f.required = false;
    f.maxSelect = 1;
    f.cascadeDelete = false; // handled by app logic, not DB cascade
    membersColl.fields.push(f);
    app.save(membersColl);
    console.log("household_members: resident_id field added");
  } else {
    console.log("household_members: resident_id already exists, skipping");
  }

  // --- Backfill existing records by matching first_name + last_name ---
  const members = app.findAllRecords("household_members");
  const residents = app.findAllRecords("residents");

  let count = 0;
  for (const member of members) {
    if (member.getString("resident_id")) continue;

    const mFirstName = member.getString("first_name");
    const mLastName = member.getString("last_name");
    if (!mFirstName || !mLastName) continue;

    const match = residents.find(
      (r) => r.getString("first_name") === mFirstName && r.getString("last_name") === mLastName,
    );
    if (match) {
      member.set("resident_id", match.id);
      app.save(member);
      count++;
    }
  }

  console.log(`Backfilled ${count} household_members with resident_id`);
});
