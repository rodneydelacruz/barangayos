// Audit log hook placeholder
// Logs write operations to a dedicated audit collection or external log.
//
// Example:
//
// onRecordAfterCreate((e) => {
//   const log = $app.dao().findCollectionByNameOrId('audit_log')
//   if (log) {
//     $app.dao().saveRecord(log, new Record(log, {
//       collection: e.collection.name,
//       recordId: e.record.id,
//       action: 'create',
//       user: e.record.get('created_by') ?? '',
//     }))
//   }
// })
