import type { RecordModel } from 'pocketbase';
import { getClient } from './client';

export interface LookupOption {
  label: string;
  code?: string;
}

export interface ApiLookup extends RecordModel {
  group: string;
  values: LookupOption[];
}

export async function getLookup(group: string): Promise<LookupOption[]> {
  try {
    const r = await getClient().collection('lookups').getFirstListItem<ApiLookup>(
      `group = "${group}"`, { requestKey: `lk-${group}` },
    );
    return r.values || [];
  } catch {
    return [];
  }
}

export async function getAllLookups(): Promise<Record<string, LookupOption[]>> {
  const all = await getClient().collection('lookups').getFullList<ApiLookup>({ requestKey: 'all-lookups' });
  const map: Record<string, LookupOption[]> = {};
  for (const item of all) map[item.group] = item.values;
  return map;
}
