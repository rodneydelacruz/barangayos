/// <reference path="../pb_data/types.d.ts" />

// Phase 9: Fix ethnicity SelectField values to match lookup labels (mixed-case)
// PocketBase SelectField values were set as ALL CAPS but the lookup seed data
// uses Mixed Case labels. The form sends the label value, so PocketBase was
// rejecting valid selections like "Agta" → "AGTA" mismatch.

migrate((app) => {
  const res = app.findCollectionByNameOrId("residents");

  const ethnicityField = res.fields.find(f => f.name === "ethnicity");
  if (ethnicityField) {
    ethnicityField.values = [
      "Aeta", "Agta", "Ati", "Ayta Mag-antsi", "Ayta Magbukon",
      "Ayta Mag-indi", "Ayta Abellen", "Badjao", "Bagobo", "Bago",
      "Balangao", "Batak", "B'laan", "Bugkalot", "Bukidnon",
      "Bontoc", "Dumagat", "Gaddang", "Hanunuo Mangyan", "Higaonon",
      "Ilongot", "Ifugao", "Iraya Mangyan", "Isneg", "Itawis",
      "Ivatan", "Iwak", "Jama Mapun", "Kabihug", "Kalagan",
      "Kalanguya", "Kalinga", "Kankanaey", "Kaolo", "Ke'ney",
      "Kinaray-a", "Kolibugan", "Kagayanen", "Lambangian",
      "Langilan Manobo", "Maguindanao", "Mandaya", "Mamanwa",
      "Mansaka", "Manobo", "Mangyan", "Matigsalug", "Molbog",
      "Palawano", "Panay Bukidnon", "Pala'wan", "Pankalis",
      "Remontado", "Sama Banguingui", "Sama Dilaut", "Subanon",
      "Tagbanwa", "Tagakaulo", "Teduray", "T'boli", "Talaandig",
      "Tau't Batu", "Tingguian", "Tinggian", "Tumandok", "Ubo",
      "Yakan", "Other Local Ethnicity", "Other Foreign Ethnicity",
      "Not Reported"
    ];
    console.log("residents: ethnicity values updated to mixed-case");
  } else {
    console.log("residents: ethnicity field not found — skipping");
  }

  app.save(res);
  console.log("Phase 9 complete");
});
