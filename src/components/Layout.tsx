import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Menu } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import OfflineIndicator from '@/offline/OfflineIndicator'
import { Toaster } from '@/components/ui/toast'

const STORAGE_KEY = 'barangayos-sidebar-pinned'

export default function Layout() {
  const [pinned, setPinned] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored !== null ? stored === 'true' : true
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  function togglePinned() {
    setPinned((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

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
        <div className="flex size-8 items-center justify-center rounded-md bg-[#C9953E] text-xs font-bold text-white">
          B
        </div>
        <span className="text-sm font-semibold">BarangayOS</span>
      </header>

      <Sidebar pinned={pinned} onTogglePin={togglePinned} mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />
      <main className="col-start-2 flex min-w-0 flex-col">
        <div key={location.pathname} className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8 motion-fade-in motion-slide-up">
          <Outlet />
        </div>
        <OfflineIndicator />
        <Toaster position="bottom-right" richColors closeButton />
      </main>
    </div>
  )
}
