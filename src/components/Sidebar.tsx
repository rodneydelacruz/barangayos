import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  LayoutDashboard,
  FileText,
  Settings,
  PanelRightClose,
  PanelRightOpen,
  LogOut,
  Users,
  Home,
  ClipboardList,
  CheckSquare,
  ClipboardCheck,
  DoorOpen,
} from 'lucide-react'
import { getCurrentUser, logout, type Role } from '@/auth/session'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[]
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'viewer'] },
    ],
  },
  {
    label: 'Residents',
    items: [
      { to: '/residents', label: 'Resident Profiles', icon: Users, roles: ['admin', 'staff', 'viewer'] },
      { to: '/households', label: 'Households', icon: Home, roles: ['admin', 'staff'] },
    ],
  },
  {
    label: 'Documents',
    items: [
      { to: '/documents', label: 'Document Queue', icon: ClipboardList, roles: ['admin', 'staff'] },
      { to: '/documents/release', label: 'Document Release', icon: CheckSquare, roles: ['admin', 'staff'] },
    ],
  },
  {
    label: 'Records',
    items: [
      { to: '/records', label: 'Blotter Records', icon: FileText, roles: ['admin', 'staff', 'viewer'] },
    ],
  },
  {
    label: 'Logs',
    items: [
      { to: '/logs/activity', label: 'Activity Log', icon: ClipboardCheck, roles: ['admin', 'staff'] },
      { to: '/logs/visitors', label: 'Visitor Log', icon: DoorOpen, roles: ['admin', 'staff'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/settings', label: 'System Settings', icon: Settings, roles: ['admin'] },
    ],
  },
]

function ActiveDot() {
  return (
    <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-gold transition-all duration-200" />
  )
}

interface SidebarProps {
  pinned: boolean
  onTogglePin: () => void
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
}

export default function Sidebar({ pinned, onTogglePin, mobileOpen, onMobileOpenChange }: SidebarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const { theme } = useTheme()

  useEffect(() => {
    onMobileOpenChange(false)
  }, [location.pathname])

  useEffect(() => {
    if (mobileOpen) {
      document.documentElement.classList.add('overflow-hidden')
    } else {
      document.documentElement.classList.remove('overflow-hidden')
    }
    return () => { document.documentElement.classList.remove('overflow-hidden') }
  }, [mobileOpen])

  function handleLogout() {
    setShowLogoutConfirm(true)
  }

  function confirmLogout() {
    logout()
    setShowLogoutConfirm(false)
    navigate('/login')
  }

  function isActive(path: string) {
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  }

  return (
    <>
      <aside
        className={cn(
          'z-40 flex flex-col border-r bg-background transition-all duration-200',
          pinned ? 'w-60' : 'w-16',
          mobileOpen ? 'fixed inset-y-0 left-0 translate-x-0' : 'fixed inset-y-0 left-0 -translate-x-full',
          'md:relative md:inset-auto md:translate-x-0',
        )}
      >
        <div className={cn(
          'flex items-center border-b transition-all duration-200',
          pinned || mobileOpen ? 'h-14 gap-3 px-4' : 'h-14 justify-center',
        )}>
          {(pinned || mobileOpen) ? (
            <>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#C9953E] text-xs font-bold text-white">
                B
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                Barangay System
              </span>
            </>
          ) : null}
          {pinned && !mobileOpen ? (
            <button
              type="button"
              onClick={onTogglePin}
              className="ml-auto hidden size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:flex"
              aria-label="Collapse sidebar"
              title="Collapse to icons"
            >
              <PanelRightClose className="size-4" />
            </button>
          ) : !pinned && !mobileOpen ? (
            <button
              type="button"
              onClick={onTogglePin}
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <PanelRightOpen className="size-4" />
            </button>
          ) : null}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className={cn('space-y-6', pinned ? 'px-3' : 'px-2')}>
            {navGroups.map((group) => {
              const visibleItems = group.items.filter((item) => user && item.roles.includes(user.role))
              if (visibleItems.length === 0) return null

              return (
                <div key={group.label}>
                  {pinned && (
                    <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                      {group.label}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon
                      const active = isActive(item.to)

                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={cn(
                            'relative flex items-center rounded-md text-sm font-medium transition-colors',
                            pinned
                              ? 'h-9 gap-3 px-3'
                              : 'h-10 justify-center',
                            active
                              ? 'bg-[#C9953E]/10 text-[#C9953E] dark:bg-[#D4A84B]/10 dark:text-[#D4A84B]'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                          )}
                          title={!pinned ? item.label : undefined}
                        >
                          {active && !pinned && <ActiveDot />}
                          <Icon className="size-4 shrink-0" />
                          {pinned && <span className="truncate">{item.label}</span>}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </nav>

        <div className="border-t">
          <div className={cn('py-3', pinned ? 'space-y-2 px-4' : 'flex flex-col items-center gap-2')}>
            <div className={cn('flex items-center', pinned ? 'gap-2' : 'flex-col gap-1')}>
              <ThemeToggle />
              {pinned && (
                <span className="text-[11px] text-muted-foreground capitalize">
                  {theme} mode
                </span>
              )}
            </div>

            {user && (
              <div className={cn(
                'flex',
                pinned ? 'items-center gap-2' : 'flex-col items-center gap-1',
              )}>
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                  title={user.name ?? user.email}
                >
                  {(user.name ?? user.email).charAt(0).toUpperCase()}
                </div>
                {pinned && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{user.name ?? user.email}</p>
                    <p className="truncate text-[11px] text-muted-foreground capitalize">{user.role}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive"
                  aria-label="Logout"
                  title="Logout"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 motion-fade-in md:hidden"
          onClick={() => onMobileOpenChange(false)}
          aria-hidden="true"
        />
      )}

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Sign out"
        message="Are you sure you want to sign out? You will need to sign in again to access the system."
        confirmLabel="Sign out"
        destructive
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  )
}
