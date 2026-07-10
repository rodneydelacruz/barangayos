/// <reference path="../pb_data/types.d.ts" />

// DILG / BIMS National Indicators
// Adds 4 required infrastructure/service fields to the households collection
// and seeds the corresponding lookup groups for the frontend dropdowns.

migrate((app) => {
  const hhColl = app.findCollectionByNameOrId("households");

  const fields = [
    {
      name: "water_system",
      required: false,
      values: [
        "Level I (Point Source)",
        "Level II (Communal Faucet)",
        "Level III (Individual Connection)",
        "Others",
      ],
    },
    {
      name: "waste_disposal",
      required: false,
      values: [
        "Garbage Collection",
        "Composting",
        "Burning",
        "Open Dumping",
        "Others",
      ],
    },
    {
      name: "power_supply",
      required: false,
      values: [
        "Electric Connection",
        "Solar",
        "Generator",
        "None",
        "Others",
      ],
    },
    {
      name: "toilet_type",
      required: false,
      values: [
        "Water-Sealed",
        "Antipolo",
        "Pit Latrine",
        "None",
        "Others",
      ],
    },
  ];

  for (const def of fields) {
    const existing = hhColl.fields.find((f) => f.name === def.name);
    if (existing) {
      console.log(`households: ${def.name} already exists, skipping`);
      continue;
    }
    const f = new SelectField();
    f.name = def.name;
    f.required = def.required;
    f.values = def.values;
    hhColl.fields.push(f);
    console.log(`households: added ${def.name} field`);
  }

  app.save(hhColl);
  console.log("DILG/BIMS National Indicator fields added to households");

  // ── Seed lookup groups ──────────────────────────────────────────
  const lkColl = app.findCollectionByNameOrId("lookups");

  const lookupData = [
    {
      group: "water_system",
      values: [
        { label: "Level I (Point Source)" },
        { label: "Level II (Communal Faucet)" },
        { label: "Level III (Individual Connection)" },
        { label: "Others" },
      ],
      description: "DILG/BIMS — water system type",
    },
    {
      group: "waste_disposal",
      values: [
        { label: "Garbage Collection" },
        { label: "Composting" },
        { label: "Burning" },
        { label: "Open Dumping" },
        { label: "Others" },
      ],
      description: "DILG/BIMS — waste disposal method",
    },
    {
      group: "power_supply",
      values: [
        { label: "Electric Connection" },
        { label: "Solar" },
        { label: "Generator" },
        { label: "None" },
        { label: "Others" },
      ],
      description: "DILG/BIMS — power supply type",
    },
    {
      group: "toilet_type",
      values: [
        { label: "Water-Sealed" },
        { label: "Antipolo" },
        { label: "Pit Latrine" },
        { label: "None" },
        { label: "Others" },
      ],
      description: "DILG/BIMS — toilet facility type",
    },
  ];

  for (const entry of lookupData) {
    const existing = app
      .findRecordsByFilter(
        "lookups",
        `group = "${entry.group}"`,
        undefined,
        0,
        1,
      );
    if (existing.length > 0) {
      console.log(`lookups: "${entry.group}" already exists, skipping`);
      continue;
    }
    const rec = new Record(lkColl);
    rec.set("group", entry.group);
    rec.set("values", entry.values);
    rec.set("description", entry.description);
    app.save(rec);
    console.log(`lookups: seeded "${entry.group}"`);
  }

  console.log("DILG/BIMS National Indicator lookups seeded");
});
