import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Menu, MapPin } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import OfflineIndicator from '@/offline/OfflineIndicator'
import { Toaster } from '@/components/ui/toast'
import { getAllSettings } from '@/api/settings'

const STORAGE_KEY = 'barangayos-sidebar-pinned'

export default function Layout() {
  const [pinned, setPinned] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored !== null ? stored === 'true' : true
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const [settings, setSettings] = useState<Record<string, any>>({})

  useEffect(() => {
    getAllSettings().then(setSettings).catch(() => {})
  }, [])

  function togglePinned() {
    setPinned((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  const brgyName = settings.barangay_name ?? ''
  const municipality = settings.municipality_city ?? ''
  const province = settings.province ?? ''
  const region = settings.region ?? ''

  return (
    <div className="grid min-h-screen grid-cols-[auto_1fr]">
      <header className="sticky top-0 z-50 col-span-full flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Open sidebar"
        >
          <Menu className="size-5" />
        </button>
        <img
          src="/logo.png"
          alt="BarangayOS"
          className="size-8 shrink-0 rounded-md object-contain"
        />
        <span className="font-display text-sm font-semibold">BarangayOS</span>
      </header>

      <Sidebar pinned={pinned} onTogglePin={togglePinned} mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />
      <main className="col-start-2 flex min-w-0 flex-col">
        {/* Desktop sticky header strip */}
        {brgyName && (
          <div className="sticky top-0 z-30 hidden border-b bg-card px-5 py-2 md:flex md:items-center md:justify-between motion-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-barangay/10">
                <img
                  src="/logo.png"
                  alt=""
                  className="size-5 object-contain"
                />
              </div>
              <h1 className="font-display text-lg font-bold text-foreground tracking-tight">
                Barangay {brgyName}
                {municipality && (
                  <span className="mx-1.5 font-normal text-muted-foreground/60">|</span>
                )}
                <span className="text-sm font-semibold text-muted-foreground">
                  {[municipality, province].filter(Boolean).join(', ')}
                </span>
                {region && (
                  <>
                    <span className="mx-1.5 font-normal text-muted-foreground/40">·</span>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {region}
                    </span>
                  </>
                )}
                <span className="mx-1.5 font-normal text-muted-foreground/40">·</span>
                <span className="text-sm font-semibold text-muted-foreground">
                  Philippines
                </span>
              </h1>
            </div>
            <div className="hidden items-center gap-2.5 md:flex">
              <a
                href="https://github.com/rodneydelacruz/barangayos/blob/main/docs/PRIVACY_NOTICE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 underline decoration-blue-600/30 transition-colors hover:text-blue-800 hover:decoration-blue-800 dark:text-blue-400 dark:decoration-blue-400/30 dark:hover:text-blue-300 dark:hover:decoration-blue-300"
              >
                Privacy Notice
              </a>
              <span className="text-xs text-muted-foreground/40">·</span>
              <a
                href="https://github.com/rodneydelacruz/barangayos/blob/main/docs/TERMS_OF_USE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 underline decoration-blue-600/30 transition-colors hover:text-blue-800 hover:decoration-blue-800 dark:text-blue-400 dark:decoration-blue-400/30 dark:hover:text-blue-300 dark:hover:decoration-blue-300"
              >
                Terms of Use
              </a>
              <span className="text-xs text-muted-foreground/40">·</span>
              <a
                href="https://github.com/rodneydelacruz/barangayos/blob/main/docs/DATA_PROCESSING_AGREEMENT.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 underline decoration-blue-600/30 transition-colors hover:text-blue-800 hover:decoration-blue-800 dark:text-blue-400 dark:decoration-blue-400/30 dark:hover:text-blue-300 dark:hover:decoration-blue-300"
              >
                DPA
              </a>
            </div>
          </div>
        )}
        <div key={location.pathname} className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8 motion-fade-in motion-slide-up">
          <Outlet />
        </div>
        <OfflineIndicator />
        <Toaster position="bottom-right" richColors closeButton />
      </main>
    </div>
  )
}
