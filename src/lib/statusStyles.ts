export const documentStatusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  processing: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
  for_release: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  released: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50',
  cancelled: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30',
}

export const blotterStatusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  hearing: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
  settled: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  escalated: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/30',
  dismissed: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30',
}

export const meetingStatusColors: Record<string, string> = {
  scheduled: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50',
  ongoing: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  adjourned: 'bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/50',
}

export const meetingTypeColors: Record<string, string> = {
  regular: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
  special: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  emergency: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30',
}

export const agendaStatusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  discussed: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  deferred: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
}

export const assetConditionColors: Record<string, string> = {
  new: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  good: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
  fair: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  poor: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/30',
  damaged: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30',
  disposed: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/50',
}

export const assetStatusColors: Record<string, string> = {
  available: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  assigned: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
  disposed: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/50',
}

export const tagColors: Record<string, string> = {
  is_voter: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
  is_4ps: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  is_senior: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  is_pwd: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/30',
  is_deceased: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/50',
}
