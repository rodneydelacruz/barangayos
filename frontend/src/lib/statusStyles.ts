export const documentStatusColors: Record<string, string> = {
  pending: 'bg-amber-200 text-amber-900 border border-amber-400 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/30',
  processing: 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30',
  for_release: 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30',
  released: 'bg-slate-300 text-slate-900 border border-slate-400 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700/50',
  cancelled: 'bg-red-200 text-red-900 border border-red-400 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800/30',
}

export const blotterStatusColors: Record<string, string> = {
  pending: 'bg-amber-200 text-amber-900 border border-amber-400 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/30',
  hearing: 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30',
  settled: 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30',
  escalated: 'bg-orange-200 text-orange-900 border border-orange-400 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800/30',
  dismissed: 'bg-red-200 text-red-900 border border-red-400 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800/30',
}

export const meetingStatusColors: Record<string, string> = {
  scheduled: 'bg-slate-300 text-slate-900 border border-slate-400 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700/50',
  ongoing: 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30',
  adjourned: 'bg-gray-300 text-gray-900 border border-gray-400 dark:bg-gray-800/70 dark:text-gray-400 dark:border-gray-700/50',
}

export const meetingTypeColors: Record<string, string> = {
  regular: 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30',
  special: 'bg-amber-200 text-amber-900 border border-amber-400 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/30',
  emergency: 'bg-red-200 text-red-900 border border-red-400 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800/30',
}

export const agendaStatusColors: Record<string, string> = {
  pending: 'bg-amber-200 text-amber-900 border border-amber-400 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/30',
  discussed: 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30',
  deferred: 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30',
}

export const assetConditionColors: Record<string, string> = {
  new: 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30',
  good: 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30',
  fair: 'bg-amber-200 text-amber-900 border border-amber-400 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/30',
  poor: 'bg-orange-200 text-orange-900 border border-orange-400 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800/30',
  damaged: 'bg-red-200 text-red-900 border border-red-400 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800/30',
  disposed: 'bg-gray-300 text-gray-900 border border-gray-400 dark:bg-gray-800/70 dark:text-gray-400 dark:border-gray-700/50',
}

export const assetStatusColors: Record<string, string> = {
  available: 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30',
  assigned: 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30',
  disposed: 'bg-gray-300 text-gray-900 border border-gray-400 dark:bg-gray-800/70 dark:text-gray-400 dark:border-gray-700/50',
}

export const tagColors: Record<string, string> = {
  registered_voter: 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30',
  four_ps: 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30',
  senior_citizen: 'bg-amber-200 text-amber-900 border border-amber-400 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/30',
  pwd: 'bg-purple-200 text-purple-900 border border-purple-400 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800/30',
  is_deceased: 'bg-gray-300 text-gray-900 border border-gray-400 dark:bg-gray-800/70 dark:text-gray-400 dark:border-gray-700/50',
}

export const appropriationStatusColors: Record<string, string> = {
  pending: 'bg-amber-200 text-amber-900 border border-amber-400 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/30',
  obligated: 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
  partially_disbursed: 'bg-purple-200 text-purple-900 border border-purple-400 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/30',
  fully_disbursed: 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
}
