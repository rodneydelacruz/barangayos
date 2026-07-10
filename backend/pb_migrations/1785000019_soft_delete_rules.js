/// <reference path="../pb_data/types.d.ts" />

// ============================================================
// Soft-delete / safe-delete rules for households and residents
// Restrict delete to admin role only.
// Client-side checks prevent deletion when dependent records exist.
// ============================================================

migrate((app) => {
  // ---- Households: admin-only delete ----
  const hh = app.findCollectionByNameOrId("households");
  hh.deleteRule = "@request.auth.role = \"admin\"";
  app.save(hh);
  console.log("households: deleteRule restricted to admin");

  // ---- Residents: admin-only delete ----
  const res = app.findCollectionByNameOrId("residents");
  res.deleteRule = "@request.auth.role = \"admin\"";
  app.save(res);
  console.log("residents: deleteRule restricted to admin");
});
