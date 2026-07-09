/// <reference path="../pb_data/types.d.ts" />

// Phase 9b: Migrate existing uppercase ethnicity values to mixed-case
// Run AFTER Phase 9 has updated the SelectField values.
// Maps old uppercase values → new mixed-case values.

const ethnicityMap = {
  "AETA": "Aeta", "AGTA": "Agta", "ATI": "Ati",
  "AYTA MAG-ANTSI": "Ayta Mag-antsi", "AYTA MAGBUKON": "Ayta Magbukon",
  "AYTA MAG-INDI": "Ayta Mag-indi", "AYTA ABELLEN": "Ayta Abellen",
  "BADJAO": "Badjao", "BAGOBO": "Bagobo", "BAGO": "Bago",
  "BALANGAO": "Balangao", "BATAK": "Batak", "B'LAAN": "B'laan",
  "BUGKALOT": "Bugkalot", "BUKIDNON": "Bukidnon", "BONTOC": "Bontoc",
  "DUMAGAT": "Dumagat", "GADDANG": "Gaddang",
  "HANUNUO MANGYAN": "Hanunuo Mangyan", "HIGAONON": "Higaonon",
  "ILONGOT": "Ilongot", "IFUGAO": "Ifugao", "IRAYA MANGYAN": "Iraya Mangyan",
  "ISNEG": "Isneg", "ITAWIS": "Itawis", "IVATAN": "Ivatan",
  "IWAK": "Iwak", "JAMA MAPUN": "Jama Mapun", "KABIHUG": "Kabihug",
  "KALAGAN": "Kalagan", "KALANGUYA": "Kalanguya", "KALINGA": "Kalinga",
  "KANKANAEY": "Kankanaey", "KAOLO": "Kaolo", "KE'NEY": "Ke'ney",
  "KINARAY-A": "Kinaray-a", "KOLIBUGAN": "Kolibugan", "KAGAYANEN": "Kagayanen",
  "LAMBANGIAN": "Lambangian", "LANGILAN MANOBO": "Langilan Manobo",
  "MAGUINDANAO": "Maguindanao", "MANDAYA": "Mandaya", "MAMANWA": "Mamanwa",
  "MANSAKA": "Mansaka", "MANOBO": "Manobo", "MANGYAN": "Mangyan",
  "MATIGSALUG": "Matigsalug", "MOLBOG": "Molbog", "PALAWANO": "Palawano",
  "PANAY BUKIDNON": "Panay Bukidnon", "PALA'WAN": "Pala'wan",
  "PANKALIS": "Pankalis", "REMONTADO": "Remontado",
  "SAMA BANGUINGUI": "Sama Banguingui", "SAMA DILAUT": "Sama Dilaut",
  "SUBANON": "Subanon", "TAGBANWA": "Tagbanwa", "TAGAKAULO": "Tagakaulo",
  "TEDURAY": "Teduray", "T'BOLI": "T'boli", "TALAANDIG": "Talaandig",
  "TAU'T BATU": "Tau't Batu", "TINGGUIAN": "Tingguian", "TINGGIAN": "Tinggian",
  "TUMANDOK": "Tumandok", "UBO": "Ubo", "YAKAN": "Yakan",
  "OTHER LOCAL ETHNICITY": "Other Local Ethnicity",
  "OTHER FOREIGN ETHNICITY": "Other Foreign Ethnicity",
  "NOT REPORTED": "Not Reported",
}

migrate((app) => {
  const allRes = app.findAllRecords("residents");
  let updated = 0;

  for (const rec of allRes) {
    const val = rec.getString("ethnicity");
    if (!val) continue;

    const mapped = ethnicityMap[val.toUpperCase()];
    if (mapped && mapped !== val) {
      rec.set("ethnicity", mapped);
      app.save(rec);
      updated++;
    }
  }

  console.log(`residents: ${updated} ethnicity values migrated to mixed-case`);
  console.log("Phase 9b complete");
});
