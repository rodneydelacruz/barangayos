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
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  DoorOpen,
  Package,
  Calendar,
  BarChart3,
  Landmark,
  TrendingUp,
  Wallet,
  ArrowUpFromLine,
  ScrollText,
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
      { to: '/logs/visitors', label: 'Visitor Log', icon: DoorOpen, roles: ['admin', 'staff'] },
      { to: '/reports', label: 'Reports Dashboard', icon: BarChart3, roles: ['admin', 'staff'] },
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
    label: 'Finance',
    items: [
      { to: '/finance/budget', label: 'Budget Overview', icon: Landmark, roles: ['admin', 'staff'] },
      { to: '/finance/appropriations', label: 'Appropriations', icon: ClipboardList, roles: ['admin', 'staff'] },
      { to: '/finance/revenues', label: 'Revenue Tracking', icon: TrendingUp, roles: ['admin', 'staff'] },
      { to: '/finance/funds', label: 'Fund Sources', icon: Wallet, roles: ['admin', 'staff'] },
      { to: '/finance/disbursements', label: 'Disbursements', icon: ArrowUpFromLine, roles: ['admin', 'staff'] },
      { to: '/finance/audit', label: 'Finance Audit', icon: ScrollText, roles: ['admin', 'staff'] },
    ],
  },
  {
    label: 'Records',
    items: [
      { to: '/records', label: 'Blotter Records', icon: FileText, roles: ['admin', 'staff', 'viewer'] },
    ],
  },
  {
    label: 'Planning',
    items: [
      { to: '/calendar', label: 'Calendar', icon: Calendar, roles: ['admin', 'staff', 'viewer'] },
      { to: '/agenda', label: 'Agenda & Minutes', icon: FileText, roles: ['admin', 'staff'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/assets', label: 'Assets', icon: Package, roles: ['admin'] },
      { to: '/logs/activity', label: 'Audit Logs', icon: ClipboardCheck, roles: ['admin', 'staff'] },
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

  function handleLogout() {
    setShowLogoutConfirm(true)
  }

  function confirmLogout() {
    logout()
    setShowLogoutConfirm(false)
    navigate('/login')
  }

  function isActive(path: string) {
    return path === '/' ? location.pathname === '/' : location.pathname === path
  }

  return (
    <>
      <aside
        className={cn(
          'z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200',
          pinned ? 'w-60' : 'w-16',
          mobileOpen ? 'fixed inset-y-0 left-0 translate-x-0' : 'fixed inset-y-0 left-0 -translate-x-full',
          'md:sticky md:top-0 md:h-screen md:translate-x-0',
        )}
      >
        <div className={cn(
          'flex items-center border-b border-sidebar-border transition-all duration-200',
          pinned || mobileOpen ? 'h-14 gap-3 px-4' : 'h-14 justify-center',
        )}>
          {(pinned || mobileOpen) ? (
            <>
              <img
                src="/icon-logo.png"
                alt="BarangayOS"
                className="size-8 shrink-0 rounded-md object-contain"
              />
              <span className="font-display min-w-0 flex-1 truncate text-sm font-semibold text-sidebar-foreground">
                B-OS v1.0.1
              </span>
              {pinned && !mobileOpen && (
                <button
                  type="button"
                  onClick={onTogglePin}
                  className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  aria-label="Collapse sidebar"
                  title="Collapse to icons"
                >
                  <PanelRightClose className="size-4" />
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onTogglePin}
              className="flex size-8 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <PanelRightOpen className="size-4" />
            </button>
          )}
        </div>

        <nav className="sidebar-scroll flex-1 overflow-y-auto py-4">
          <div className={cn('space-y-6', pinned ? 'px-3' : 'px-2')}>
            {navGroups.map((group) => {
              const visibleItems = group.items.filter((item) => user && item.roles.includes(user.role))
              if (visibleItems.length === 0) return null

              return (
                <div key={group.label}>
                  {pinned && (
                    <p className="mb-1.5 px-1 font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted/80">
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
                            'relative flex items-center rounded-md font-display text-sm font-light tracking-wide transition-colors',
                            pinned
                              ? 'h-9 gap-3 px-3'
                              : 'h-10 justify-center',
                            active
                              ? 'bg-gold/10 text-gold'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
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

        <div className="border-t border-sidebar-border">
          <div className={cn('py-3', pinned ? 'space-y-2 px-4' : 'flex flex-col items-center gap-2')}>
            <div className={cn('flex items-center', pinned ? 'gap-2' : 'flex-col gap-1')}>
              <ThemeToggle />
              {pinned && (
                <span className="text-[11px] text-sidebar-muted capitalize">
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
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent/50 text-xs font-semibold text-sidebar-foreground"
                  title={user.name ?? user.email}
                >
                  {(user.name ?? user.email).charAt(0).toUpperCase()}
                </div>
                {pinned && (
                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate text-sm font-medium text-sidebar-foreground">{user.name ?? user.email}</p>
                    <p className="truncate text-[11px] text-sidebar-muted capitalize">{user.role}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-accent hover:text-destructive"
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
