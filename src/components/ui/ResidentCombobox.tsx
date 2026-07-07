import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Input } from './input'
import { getResidents, type ApiResident } from '@/api/residents'

let cached: ApiResident[] | null = null
let loading: Promise<ApiResident[]> | null = null

function loadResidents(): Promise<ApiResident[]> {
  if (cached) return Promise.resolve(cached)
  if (loading) return loading
  loading = getResidents().then((r) => { cached = r; loading = null; return r }).catch((e) => { loading = null; throw e })
  return loading
}

interface ResidentComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSelectResident?: (resident: ApiResident) => void
}

export function ResidentCombobox({ value, onChange, placeholder = 'Type or search resident...', onSelectResident }: ResidentComboboxProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<ApiResident[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!query || query.length < 3) { setResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const all = await loadResidents()
        const q = query.toLowerCase()
        setResults(all.filter((r) =>
          `${r.first_name} ${r.last_name} ${r.middle_name}`.toLowerCase().includes(q),
        ).slice(0, 10))
      } catch { setResults([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  function handleSelect(r: ApiResident) {
    const name = `${r.first_name} ${r.last_name}`
    setQuery(name)
    onChange(name)
    onSelectResident?.(r)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-9 pl-8 text-sm"
        />
        {value && value === query && (
          <button
            type="button"
            onClick={() => { setQuery(''); onChange('') }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-lg text-muted-foreground hover:text-foreground leading-none"
            aria-label="Clear"
          >×</button>
        )}
      </div>
      {open && query && results.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-background shadow-lg">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelect(r)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <span className="font-medium">{r.first_name} {r.last_name}</span>
              {r.purok && <span className="ml-auto text-xs text-muted-foreground">{r.purok}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
