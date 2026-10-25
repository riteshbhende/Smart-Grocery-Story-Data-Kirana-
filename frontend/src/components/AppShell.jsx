import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  Clock,
  Grid2x2,
  Grip,
  Home,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Package2,
  ShoppingCart,
  Search,
  Settings,
  LayoutGrid,
  Menu,
  X,
  BookOpen,
  ShoppingBag,
  Store,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Button from './ui/Button'
import { useToast } from './ui/toast'
import { acknowledgeExpiryAlert, getExpiryAlerts, getGroceries } from '../services/groceryService'
import { clearSession, getSession } from '../utils/session'
import RecipeModal from './RecipeModal'
import StoreLogo from './ui/StoreLogo'
import StoreFooter from './StoreFooter'

const AVAILABILITY_THRESHOLD = 3
const POPUP_DURATION_MS = 7000

function getPopupCountdown(now, startedAt, durationMs) {
  const elapsed = now - startedAt
  const remainingMs = Math.max(durationMs - elapsed, 0)

  return {
    progressPercent: durationMs === 0 ? 0 : (remainingMs / durationMs) * 100,
  }
}

function buildNotifications(items, expiryAlerts) {
  const availableItems = items
    .filter((item) => !item.purchased && item.quantity >= AVAILABILITY_THRESHOLD)
    .sort((first, second) => second.quantity - first.quantity)
  const lowStockItems = items
    .filter((item) => !item.purchased && item.quantity > 0 && item.quantity < AVAILABILITY_THRESHOLD)
    .sort((first, second) => first.quantity - second.quantity)

  const availabilityNotification =
    availableItems.length > 0
      ? [
          {
            id: 'availability',
            type: 'availability',
            title: 'Availability Alert',
            message: `${availableItems.length} items are available in stock`,
            actionLabel: 'Open Inventory',
          },
        ]
      : []

  const lowStockNotifications = lowStockItems.map((item) => ({
    id: `low-stock-${item.id}`,
    itemId: item.id,
    type: 'low-stock',
    title: `${item.name} is running low`,
    message: `${item.category} | Only ${item.quantity} ${item.quantity === 1 ? 'unit' : 'units'} left`,
    actionLabel: 'Open Inventory',
  }))

  const expiryNotifications = expiryAlerts.map((alert) => ({
    id: `expiry-${alert.itemId}`,
    itemId: alert.itemId,
    type: 'expiry',
    title: alert.itemName,
    message: `${alert.category} | ${alert.message}`,
    actionLabel: 'Open Reminder',
  }))

  return [...expiryNotifications, ...lowStockNotifications, ...availabilityNotification]
}

const CATEGORY_ITEMS = [
  { id: 'PRODUCE', label: 'Fruits & Vegetables' },
  { id: 'DAIRY', label: 'Dairy Products' },
  { id: 'BAKERY', label: 'Bakery' },
  { id: 'BEVERAGES', label: 'Beverages' },
  { id: 'SNACKS', label: 'Snacks' },
  { id: 'HOUSEHOLD', label: 'Household Essentials' },
  { id: 'ESSENTIALS', label: 'Grains & Pulses' },
]

function AppShell() {
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { username, token, role } = getSession()
  const isLoggedIn = !!token
  const isShopAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN'
  const isSeller = role === 'SELLER'

  const appsRef = useRef(null)
  const accountRef = useRef(null)
  const bellRef = useRef(null)
  const [bellOpen, setBellOpen] = useState(false)
  const [appsOpen, setAppsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [popupOpen, setPopupOpen] = useState(false)
  const [popupStartedAt, setPopupStartedAt] = useState(0)
  const [now, setNow] = useState(0)
  const [recipeModalOpen, setRecipeModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)

    if (location.pathname !== '/') {
      navigate('/?' + params.toString())
      setTimeout(() => {
        document.getElementById('shop-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    } else {
      setSearchParams(params, { replace: true })
      document.getElementById('shop-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const toggleCategory = (id) => {
    const params = new URLSearchParams(searchParams)
    if (!id) {
      params.delete('category')
    } else {
      const currentCategories = params.getAll('category')
      if (currentCategories.includes(id)) {
        params.delete('category')
        currentCategories.filter((c) => c !== id).forEach((c) => params.append('category', c))
      } else {
        params.append('category', id)
      }
    }

    if (location.pathname !== '/') {
      navigate('/?' + params.toString())
      setTimeout(() => {
        document.getElementById('shop-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    } else {
      setSearchParams(params, { replace: true })
      document.getElementById('shop-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleNavClick = (targetHash) => {
    if (location.pathname !== '/') {
      navigate('/' + targetHash)
    } else {
      const element = document.querySelector(targetHash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    setMenuOpen(false)
  }

  const refreshNotifications = async () => {
    try {
      const [itemsResponse, expiryAlertsResponse] = await Promise.all([
        getGroceries(),
        getExpiryAlerts(),
      ])

      setNotifications(buildNotifications(itemsResponse, expiryAlertsResponse))
    } catch {
      setNotifications([])
    }
  }

  const closeMenus = () => {
    setBellOpen(false)
    setAppsOpen(false)
    setAccountOpen(false)
  }

  const handleLogout = () => {
    clearSession()
    navigate('/')
  }

  const handleOpenShortcut = ({ to, end, state }) => {
    closeMenus()
    navigate(to, { state, replace: Boolean(end && location.pathname === to) })
  }

  const handleOpenNotification = (notification) => {
    closeMenus()

    if (notification.type === 'expiry') {
      navigate('/dashboard', { state: { openSection: 'kitchen-reminders' } })
      return
    }

    navigate('/inventory')
  }

  const handleDeleteNotification = async (notification) => {
    if (notification.type !== 'expiry' || !notification.itemId) {
      return
    }

    try {
      await acknowledgeExpiryAlert(notification.itemId)
      await refreshNotifications()
      window.dispatchEvent(new Event('grocery-data-changed'))
      toast.success('Notification removed.')
    } catch {
      await refreshNotifications()
      toast.error('Could not remove this notification.')
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 250)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return
    let cancelled = false

    Promise.all([getGroceries(), getExpiryAlerts()])
      .then(([itemsResponse, expiryAlertsResponse]) => {
        if (cancelled) return
        setNotifications(buildNotifications(itemsResponse, expiryAlertsResponse))
      })
      .catch(() => {
        if (!cancelled) setNotifications([])
      })

    return () => {
      cancelled = true
    }
  }, [isLoggedIn, location.pathname])

  useEffect(() => {
    if (!popupOpen) return undefined

    const remainingMs = Math.max(POPUP_DURATION_MS - (Date.now() - popupStartedAt), 0)
    const timeoutId = window.setTimeout(() => {
      setPopupOpen(false)
    }, remainingMs)

    return () => window.clearTimeout(timeoutId)
  }, [popupOpen, popupStartedAt])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!bellRef.current?.contains(event.target)) setBellOpen(false)
      if (!appsRef.current?.contains(event.target)) setAppsOpen(false)
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const popupCountdown = getPopupCountdown(now, popupStartedAt, POPUP_DURATION_MS)
  const accountLabel = username || 'User'
  const accountInitial = accountLabel.charAt(0).toUpperCase() || 'U'

  const activeCategories = searchParams.getAll('category')
  const activeFilterCount = activeCategories.length + (searchParams.get('search') ? 1 : 0)

  const navigationLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '#shop-catalog', label: 'Products', isHash: true },
    { to: '#categories', label: 'Categories', isHash: true },
    { to: '/inventory', label: 'Inventory', requiresAuth: true },
    { to: '/shopping-list', label: 'Orders' },
    { to: '/udhar-khata', label: 'Udhar Khata', isBadge: true },
  ]

  const appItems = [
    { to: '/', label: 'Store Home', icon: Home },
    { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/inventory', label: 'Inventory', icon: Package2 },
    { to: '/shopping-list', label: 'Orders Queue', icon: ShoppingCart },
    { to: '/udhar-khata', label: 'Udhar Khata', icon: BookOpen },
    {
      label: 'Smart Picks',
      icon: Lightbulb,
      to: '/dashboard',
      state: { openSection: 'recommendations' },
    },
    {
      label: 'Expiry Alerts',
      icon: Clock,
      to: '/dashboard',
      state: { openSection: 'kitchen-reminders' },
    },
    { label: 'Settings', icon: Settings, to: '/settings' },
  ]

  return (
    <div className='min-h-screen bg-[#fcfbf7] text-slate-900 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900'>
      {/* Expiry / System Notification Popup if Triggered */}
      {popupOpen && notifications.length > 0 && (
        <>
          <button
            type='button'
            aria-label='Close notifications popup'
            onClick={() => setPopupOpen(false)}
            className='fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-xs'
          />
          <section className='fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 sm:p-6 sm:pt-24'>
            <div className='w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl'>
              <div className='border-b border-slate-200 px-5 py-4'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='text-xs font-bold uppercase tracking-wider text-emerald-800'>Store Alerts</p>
                    <h2 className='mt-1 text-xl font-bold text-slate-950'>Notifications</h2>
                  </div>
                  <Button variant='secondary' size='sm' onClick={() => setPopupOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>

              <div className='max-h-[65vh] space-y-3 overflow-y-auto px-5 py-4'>
                {notifications.map((notification) => (
                  <article
                    key={`popup-${notification.id}`}
                    className='rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p className='text-sm font-bold text-slate-900'>{notification.title}</p>
                        <p className='mt-1 text-xs text-slate-500'>{notification.message}</p>
                      </div>
                      {notification.type === 'expiry' && (
                        <Button
                          type='button'
                          onClick={() => handleDeleteNotification(notification)}
                          variant='danger'
                          size='sm'
                        >
                          Dismiss
                        </Button>
                      )}
                    </div>
                    <Button
                      type='button'
                      onClick={() => handleOpenNotification(notification)}
                      variant='secondary'
                      size='sm'
                      className='mt-3'
                    >
                      {notification.actionLabel}
                    </Button>
                  </article>
                ))}
              </div>

              <div className='h-1.5 bg-slate-100'>
                <div
                  className='h-full bg-emerald-600 transition-[width] duration-200'
                  style={{ width: `${popupCountdown.progressPercent}%` }}
                />
              </div>
            </div>
          </section>
        </>
      )}

      {/* Main Sticky Navbar */}
      <header className='sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs'>
        <div className='mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3.5'>
          
          {/* Top Brand Logo and Mobile Action Row */}
          <div className="flex items-center justify-between">
            <StoreLogo size="md" />

            {/* Mobile menu and bell toggles */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                type="button"
                onClick={() => {
                  setBellOpen((current) => !current)
                  setMenuOpen(false)
                }}
                className='flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 relative'
              >
                <Bell className='h-4 w-4' />
                {notifications.length > 0 && (
                  <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white'>
                    {notifications.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-700 hover:bg-slate-100 transition border border-slate-200 bg-slate-50"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className='hidden lg:flex items-center gap-1 xl:gap-2'>
            {navigationLinks.map((link) => {
              if (link.isHash) {
                return (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => handleNavClick(link.to)}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/70 transition-all cursor-pointer"
                  >
                    {link.label}
                  </button>
                )
              }

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-1.5 rounded-lg transition-all text-sm font-semibold ${
                      isActive
                        ? 'text-emerald-950 bg-emerald-100/70 font-bold'
                        : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/70'
                    }`
                  }
                >
                  <span>{link.label}</span>
                  {link.isBadge && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-amber-400 text-emerald-950">
                      Khata
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Search Bar for Groceries */}
          <div className="w-full md:w-64 lg:w-72 xl:w-80">
            <div className='relative w-full'>
              <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-700' />
              <input
                type='text'
                value={searchParams.get('search') || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder='Search groceries, pulses, snacks...'
                className='w-full rounded-xl bg-slate-50 py-2 pl-10 pr-9 text-xs sm:text-sm font-medium outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-700/20 border border-slate-200 placeholder:text-slate-400 hover:border-slate-300'
              />
              {searchParams.get('search') && (
                <button
                  type="button"
                  onClick={() => updateFilter('search', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {/* Quick Admin/Seller Portal Link if Authorized */}
            {isShopAdmin && (
              <NavLink
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-300" />
                Shop Admin
              </NavLink>
            )}

            {isSeller && (
              <NavLink
                to="/seller"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Store className="w-3.5 h-3.5 text-amber-300" />
                Seller Portal
              </NavLink>
            )}

            {/* Notification Bell */}
            <div className='relative' ref={bellRef}>
              <button
                type='button'
                aria-label='Open notifications'
                onClick={() => {
                  setBellOpen((current) => !current)
                  setAppsOpen(false)
                  setAccountOpen(false)
                }}
                className='flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 relative shadow-xs'
              >
                <Bell className='h-4 w-4' />
                {notifications.length > 0 && (
                  <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white'>
                    {notifications.length}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className='absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl'>
                  <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                    <div>
                      <p className='text-xs font-bold uppercase tracking-wider text-emerald-800'>Store Notifications</p>
                      <p className='text-xs text-slate-500'>Stock & Expiry Alerts</p>
                    </div>
                    <Button type='button' onClick={() => setBellOpen(false)} variant='secondary' size='sm'>
                      Close
                    </Button>
                  </div>

                  <div className='mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1'>
                    {notifications.length === 0 ? (
                      <p className='py-6 text-center text-xs text-slate-400'>
                        All good! No alerts right now.
                      </p>
                    ) : (
                      notifications.map((notification) => (
                        <article
                          key={notification.id}
                          className='rounded-xl border border-slate-100 bg-slate-50/80 p-3'
                        >
                          <div className='flex items-start justify-between gap-2'>
                            <div>
                              <p className='text-xs font-bold text-slate-900'>{notification.title}</p>
                              <p className='mt-0.5 text-[11px] text-slate-500'>{notification.message}</p>
                            </div>
                            {notification.type === 'expiry' && (
                              <button
                                type='button'
                                onClick={() => handleDeleteNotification(notification)}
                                className='text-[10px] text-rose-600 hover:underline font-semibold'
                              >
                                Dismiss
                              </button>
                            )}
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Navigation Shortcuts Grid */}
            <div className='relative' ref={appsRef}>
              <button
                type='button'
                onClick={() => {
                  setAppsOpen((current) => !current)
                  setBellOpen(false)
                  setAccountOpen(false)
                }}
                className={`flex items-center justify-center w-10 h-10 rounded-xl border text-slate-700 transition shadow-xs ${
                  appsOpen
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
                title="Store Shortcuts"
              >
                <Grip className='h-4 w-4' />
              </button>

              {appsOpen && (
                <div className='absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl'>
                  <p className='text-xs font-bold uppercase tracking-wider text-emerald-800'>Store Shortcuts</p>
                  <p className='text-xs text-slate-500 mb-3'>Quick access to store modules</p>

                  <div className='grid grid-cols-3 gap-2'>
                    {appItems.map((item) => (
                      <button
                        key={item.label}
                        type='button'
                        onClick={() => handleOpenShortcut(item)}
                        className='flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-center transition hover:bg-emerald-50 hover:border-emerald-200 group'
                      >
                        <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 group-hover:bg-emerald-700 group-hover:text-white transition shadow-2xs'>
                          <item.icon className='h-4 w-4' />
                        </span>
                        <span className='text-[11px] font-semibold text-slate-700'>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Login or User Avatar */}
            {!isLoggedIn ? (
              <NavLink
                to="/login"
                className="flex items-center justify-center h-10 px-4 rounded-xl font-bold text-xs bg-emerald-800 text-white hover:bg-emerald-700 transition shadow-xs"
              >
                Log In
              </NavLink>
            ) : (
              <div className='relative flex items-center pl-2' ref={accountRef}>
                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen((current) => !current)
                    setBellOpen(false)
                    setAppsOpen(false)
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition shadow-xs ${
                    accountOpen
                      ? 'border-emerald-700 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className='flex h-7 w-7 items-center justify-center rounded-full bg-emerald-800 text-xs font-extrabold text-amber-300'>
                    {accountInitial}
                  </span>
                  <span className='text-xs font-bold text-slate-800 max-w-20 truncate'>
                    {accountLabel}
                  </span>
                </button>

                {accountOpen && (
                  <div className='absolute right-0 top-12 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl'>
                    <div className='flex items-center gap-3 border-b border-slate-100 pb-3'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-800 text-base font-bold text-amber-300'>
                        {accountInitial}
                      </div>
                      <div>
                        <p className='text-sm font-bold text-slate-900'>{accountLabel}</p>
                        <p className='text-[11px] text-slate-500 capitalize'>
                          {role ? role.toLowerCase().replace('_', ' ') : 'Shopper'}
                        </p>
                      </div>
                    </div>

                    <div className='mt-3 space-y-1'>
                      <button
                        type='button'
                        onClick={() => handleOpenShortcut({ to: '/dashboard' })}
                        className='w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 rounded-lg transition'
                      >
                        <LayoutDashboard className='h-4 w-4 text-emerald-700' />
                        My Dashboard
                      </button>

                      <button
                        type='button'
                        onClick={() => handleOpenShortcut({ to: '/udhar-khata' })}
                        className='w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 rounded-lg transition'
                      >
                        <BookOpen className='h-4 w-4 text-amber-600' />
                        Digital Udhar Khata
                      </button>

                      <button
                        type='button'
                        onClick={() => handleOpenShortcut({ to: '/settings' })}
                        className='w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 rounded-lg transition'
                      >
                        <Settings className='h-4 w-4 text-slate-500' />
                        Account Settings
                      </button>

                      {isShopAdmin && (
                        <button
                          type='button'
                          onClick={() => handleOpenShortcut({ to: '/admin' })}
                          className='w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 rounded-lg transition'
                        >
                          <ShieldCheck className='h-4 w-4 text-emerald-700' />
                          Shop Admin Center
                        </button>
                      )}

                      <div className='pt-2 border-t border-slate-100'>
                        <button
                          type='button'
                          onClick={handleLogout}
                          className='w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition'
                        >
                          <LogOut className='h-4 w-4' />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Category Pills Strip */}
        <div id="categories" className='hidden md:flex mx-auto w-full max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8 border-t border-slate-100 bg-[#fbfbf8]'>
          <div className='flex items-center gap-2 overflow-x-auto hide-scrollbar flex-1 py-0.5'>
            <button
              type='button'
              onClick={() => toggleCategory('')}
              className={`flex items-center px-3.5 py-1.5 rounded-xl whitespace-nowrap transition text-xs font-semibold border ${
                activeCategories.length === 0
                  ? 'bg-emerald-800 border-emerald-800 text-white shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              All Categories
            </button>

            {CATEGORY_ITEMS.map(({ id, label }) => {
              const isSelected = activeCategories.includes(id)
              return (
                <button
                  key={id}
                  type='button'
                  onClick={() => toggleCategory(id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl whitespace-nowrap transition text-xs font-semibold border ${
                    isSelected
                      ? 'bg-emerald-800 border-emerald-800 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {label}
                  {isSelected && <Check className="w-3 h-3 text-amber-300 ml-0.5" />}
                </button>
              )
            })}
          </div>

          {activeFilterCount > 0 && (
            <div className='flex items-center gap-2 shrink-0 pl-3'>
              <span className='flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black'>
                {activeFilterCount}
              </span>
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  params.delete('category')
                  params.delete('search')
                  setSearchParams(params, { replace: true })
                  if (location.pathname !== '/') navigate('/?' + params.toString())
                }}
                className='text-xs font-bold text-slate-600 hover:text-emerald-800 underline'
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="md:hidden flex flex-col gap-4 px-4 py-5 border-t border-slate-200 bg-white absolute w-full left-0 shadow-2xl z-50 max-h-[85vh] overflow-y-auto">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
              <StoreLogo size="sm" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <NavLink
                to="/"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800"
              >
                Home
              </NavLink>
              <button
                type="button"
                onClick={() => handleNavClick('#shop-catalog')}
                className="px-3 py-2 rounded-lg text-sm font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 text-left"
              >
                Products
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('#categories')}
                className="px-3 py-2 rounded-lg text-sm font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 text-left"
              >
                Categories
              </button>
              <NavLink
                to="/inventory"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800"
              >
                Inventory
              </NavLink>
              <NavLink
                to="/shopping-list"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800"
              >
                Orders Queue
              </NavLink>
              <NavLink
                to="/udhar-khata"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-bold text-emerald-800 bg-amber-50 flex items-center justify-between"
              >
                <span>Digital Udhar Khata</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400 text-emerald-950 font-black">
                  Khata
                </span>
              </NavLink>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Shop Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_ITEMS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      toggleCategory(id)
                      setMenuOpen(false)
                    }}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              {!isLoggedIn ? (
                <NavLink
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center w-full bg-emerald-800 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-xs"
                >
                  Log In / Sign Up
                </NavLink>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-50/60 rounded-xl text-xs text-slate-700">
                    Logged in as <strong>{accountLabel}</strong>
                  </div>
                  {isShopAdmin && (
                    <NavLink
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center w-full bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs"
                    >
                      Shop Admin Portal
                    </NavLink>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout()
                      setMenuOpen(false)
                    }}
                    className="flex items-center justify-center w-full bg-rose-50 text-rose-600 px-4 py-2.5 rounded-xl font-bold text-xs"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Body */}
      <div className='mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex-1 py-6'>
        <main className='min-w-0'>
          <Outlet />
        </main>
      </div>

      {/* Full Store Footer */}
      <StoreFooter />

      <RecipeModal isOpen={recipeModalOpen} onClose={() => setRecipeModalOpen(false)} />
    </div>
  )
}

export default AppShell