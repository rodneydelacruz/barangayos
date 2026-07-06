export const documentStatusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  processing: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
  for_release: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  released: 'bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50',
  cancelled: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30',
}

export const blotterStatusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  hearing: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
  settled: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  escalated: 'bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/30',
  dismissed: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30',
}

export const meetingStatusColors: Record<string, string> = {
  scheduled: 'bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50',
  ongoing: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  adjourned: 'bg-gray-200 text-gray-700 border border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/50',
}

export const meetingTypeColors: Record<string, string> = {
  regular: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
  special: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  emergency: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30',
}

export const agendaStatusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  discussed: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  deferred: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
}

export const assetConditionColors: Record<string, string> = {
  new: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  good: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
  fair: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  poor: 'bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/30',
  damaged: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30',
  disposed: 'bg-gray-200 text-gray-700 border border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/50',
}

export const assetStatusColors: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  assigned: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
  disposed: 'bg-gray-200 text-gray-700 border border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/50',
}

export const tagColors: Record<string, string> = {
  is_voter: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
  is_4ps: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  is_senior: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  is_pwd: 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/30',
  is_deceased: 'bg-gray-200 text-gray-700 border border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/50',
}
