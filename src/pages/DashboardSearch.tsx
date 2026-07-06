import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { Search, ExternalLink, Loader2 } from 'lucide-react'
import { useGlobalSearch } from './hooks/useGlobalSearch'

export default function DashboardSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { query, setQuery, results, searching, hasSearched } = useGlobalSearch()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setOpen(query.trim().length >= 2)
  }, [query])

  const totalResults = results.reduce((sum, g) => sum + g.items.length, 0)

  return (
    <div ref={dropdownRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Maghanap ng residente o dokumento..."
          className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none ring-1 ring-transparent transition-all focus:ring-2 focus:ring-gold/50"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && (
        <div className="absolute right-0 mt-1 w-full max-h-80 overflow-y-auto rounded-lg border border-border bg-card p-2 shadow-lg motion-fade-in z-50">
          {searching ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Naghahanap...
            </div>
          ) : totalResults === 0 && hasSearched ? (
            <p className="py-4 text-center text-xs text-muted-foreground/60">
              Walang nakitang tugma sa &quot;{query}&quot;
            </p>
          ) : (
            <div className="space-y-2">
              {results.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {group.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => { navigate(group.link); setOpen(false); setQuery('') }}
                      className="text-[10px] text-gold hover:underline"
                    >
                      Tingnan Lahat
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => { navigate(`${item.link}?selected=${item.id}`); setOpen(false); setQuery('') }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent"
                      >
                        <ExternalLink className="size-3 shrink-0 text-muted-foreground/60" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{item.title}</p>
                          {item.subtitle && (
                            <p className="truncate text-muted-foreground/60">{item.subtitle}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
