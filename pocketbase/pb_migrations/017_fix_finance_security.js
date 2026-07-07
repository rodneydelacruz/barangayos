/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const adminOnly = '@request.auth.role = "admin"'
  const withCollection = (name, handler) => {
    try {
      const col = app.findCollectionByNameOrId(name)
      handler(col)
      app.save(col)
    } catch (e) {
      console.log("Cannot update " + name + ": " + e.message)
    }
  }

  // 1. Restrict deleteRule to admin-only on all 5 mutable finance collections
  for (const name of ["income_accounts", "revenues", "fund_sources", "appropriations", "disbursements"]) {
    withCollection(name, (col) => {
      col.deleteRule = adminOnly
    })
  }

  // 2. Restrict fund_sources updateRule to admin-only (balance manipulation protection)
  withCollection("fund_sources", (fs) => {
    fs.updateRule = adminOnly
  })

  // 3. Restrict finance_audit_logs listRule/viewRule to admin or staff
  withCollection("finance_audit_logs", (audit) => {
    audit.listRule = '@request.auth.role = "admin" || @request.auth.role = "staff"'
    audit.viewRule = '@request.auth.role = "admin" || @request.auth.role = "staff"'
  })
}, (app) => {
  // revert: restore original rules
  const origDelete = '@request.auth.role = "admin" || @request.auth.role = "staff"'
  const withCollection = (name, handler) => {
    try {
      const col = app.findCollectionByNameOrId(name)
      handler(col)
      app.save(col)
    } catch (e) {
      console.log("Cannot revert " + name + ": " + e.message)
    }
  }
  for (const name of ["income_accounts", "revenues", "fund_sources", "appropriations", "disbursements"]) {
    withCollection(name, (col) => {
      col.deleteRule = origDelete
    })
  }

  withCollection("fund_sources", (fs) => {
    fs.updateRule = origDelete
  })

  withCollection("finance_audit_logs", (audit) => {
    audit.listRule = '@request.auth.id != ""'
    audit.viewRule = '@request.auth.id != ""'
  })
})
