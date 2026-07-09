import { useState, useEffect } from 'react';
import { getLookup, type LookupOption } from '@/api/lookups';

const cache = new Map<string, LookupOption[]>();

export function useLookups(group: string | null) {
  const [data, setData] = useState<LookupOption[]>(() =>
    group && cache.has(group) ? cache.get(group)! : [],
  );
  const [loading, setLoading] = useState(!cache.has(group!));

  useEffect(() => {
    if (!group) { setData([]); setLoading(false); return; }
    if (cache.has(group)) { setData(cache.get(group)!); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    getLookup(group).then((v) => {
      if (cancelled) return;
      cache.set(group, v);
      setData(v);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [group]);

  return { data, loading };
}
