import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Apple,
  Milk,
  Cake,
  Coffee,
  Cookie,
  Home as HomeIcon,
  Wheat,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  SlidersHorizontal,
  Star,
  BookOpen,
  ChevronRight,
  Truck,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react'
import { getApiErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import SmartInsightCard from '../components/ui/SmartInsightCard'
import { useToast } from '../components/ui/toast'
import {
  createGrocery,
  createSellerOrder,
  getCatalog,
  getCategories,
  getGroceries,
  getSellerProducts,
} from '../services/groceryService'
import { getSession } from '../utils/session'
import { getNaturalExpiryDate, formatExpiryDate, normalizeKey } from '../utils/expiry'
import { buildHomeSmartBuySuggestions } from '../utils/smartSuggestions'
import { useSmartRules } from '../context/SmartRulesContext'
import { formatPrice } from '../utils/format'
import StoreLogoBadge from '../components/ui/StoreLogoBadge'

const AVAILABILITY_THRESHOLD = 3

const initialQuickAddDraft = {
  quantity: 1,
  purchased: true,
  expiryDate: '',
  paymentMethod: 'GPAY',
  upiId: '',
  paymentVerified: false,
}

const initialSellerPaymentDraft = {
  paymentMethod: 'GPAY',
  upiId: '',
  paymentVerified: false,
}

const paymentMethodOptions = [
  { value: 'GPAY', label: 'Google Pay UPI' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'COD', label: 'Cash on Delivery' },
]

const upiPattern = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/

const resolveAvailability = (quantity) => {
  if (quantity <= 0) return 'OUT_OF_STOCK'
  if (quantity <= AVAILABILITY_THRESHOLD - 1) return 'LOW_STOCK'
  return 'IN_STOCK'
}

const stockToneByAvailability = {
  IN_STOCK: {
    label: 'In Stock',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    quantityText: 'text-emerald-700',
  },
  LOW_STOCK: {
    label: 'Low Stock',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    quantityText: 'text-amber-700',
  },
  OUT_OF_STOCK: {
    label: 'Out of Stock',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    quantityText: 'text-rose-700',
  },
}

const CATEGORY_CARDS = [
  {
    id: 'PRODUCE',
    name: 'Fruits & Vegetables',
    subtitle: 'Fresh greens, farm potatoes, onions & seasonal fruits',
    icon: Apple,
    colorClasses: 'from-emerald-500/10 to-green-500/20 text-emerald-800 border-emerald-200 hover:border-emerald-400',
    accentBg: 'bg-emerald-600',
    badge: 'Farm Fresh',
  },
  {
    id: 'DAIRY',
    name: 'Dairy Products',
    subtitle: 'Pure milk, fresh paneer, curd, butter & desi ghee',
    icon: Milk,
    colorClasses: 'from-sky-500/10 to-blue-500/20 text-sky-800 border-sky-200 hover:border-sky-400',
    accentBg: 'bg-sky-600',
    badge: 'Daily Morning',
  },
  {
    id: 'BAKERY',
    name: 'Bakery',
    subtitle: 'Fresh sandwich breads, brown loaves, pav & rusks',
    icon: Cake,
    colorClasses: 'from-amber-500/10 to-yellow-500/20 text-amber-900 border-amber-200 hover:border-amber-400',
    accentBg: 'bg-amber-600',
    badge: 'Fresh Baked',
  },
  {
    id: 'BEVERAGES',
    name: 'Beverages',
    subtitle: 'Premium tea, roasted coffee, juices & cold drinks',
    icon: Coffee,
    colorClasses: 'from-purple-500/10 to-violet-500/20 text-purple-900 border-purple-200 hover:border-purple-400',
    accentBg: 'bg-purple-600',
    badge: 'Popular',
  },
  {
    id: 'SNACKS',
    name: 'Snacks',
    subtitle: 'Crispy namkeens, digestive biscuits & light snacks',
    icon: Cookie,
    colorClasses: 'from-orange-500/10 to-amber-500/20 text-orange-900 border-orange-200 hover:border-orange-400',
    accentBg: 'bg-orange-600',
    badge: 'Quick Bites',
  },
  {
    id: 'HOUSEHOLD',
    name: 'Household Essentials',
    subtitle: 'Washing powders, detergents, floor cleaners & soaps',
    icon: HomeIcon,
    colorClasses: 'from-teal-500/10 to-cyan-500/20 text-teal-900 border-teal-200 hover:border-teal-400',
    accentBg: 'bg-teal-600',
    badge: 'Home Care',
  },
  {
    id: 'ESSENTIALS',
    name: 'Grains & Pulses',
    subtitle: 'Chakki fresh atta, basmati rice, lentils, dal & spices',
    icon: Wheat,
    colorClasses: 'from-yellow-500/10 to-amber-500/20 text-yellow-950 border-yellow-200 hover:border-yellow-400',
    accentBg: 'bg-amber-700',
    badge: 'Pantry Core',
  },
]

const resolveCatalogImage = (item) => {
  if (item.imageUrl && item.imageUrl.startsWith('http')) return item.imageUrl
  const lower = ((item.name || '') + ' ' + (item.category || '')).toLowerCase()
  if (lower.includes('milk') || lower.includes('dairy') || lower.includes('paneer') || lower.includes('curd') || lower.includes('amul')) {
    return 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80'
  }
  if (lower.includes('bread') || lower.includes('toast') || lower.includes('bun') || lower.includes('bakery')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80'
  }
  if (lower.includes('egg')) {
    return 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80'
  }
  if (lower.includes('apple') || lower.includes('banana') || lower.includes('fruit') || lower.includes('mango') || lower.includes('orange') || lower.includes('produce') || lower.includes('vegetable')) {
    return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80'
  }
  if (lower.includes('coffee') || lower.includes('tea') || lower.includes('chai') || lower.includes('beverage')) {
    return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80'
  }
  if (lower.includes('rice') || lower.includes('atta') || lower.includes('flour') || lower.includes('dal') || lower.includes('pulse')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80'
  }
  if (lower.includes('chip') || lower.includes('snack') || lower.includes('biscuit') || lower.includes('cookie') || lower.includes('chocolate')) {
    return 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&q=80'
  }
  if (lower.includes('clean') || lower.includes('detergent') || lower.includes('dish') || lower.includes('soap') || lower.includes('household')) {
    return 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&q=80'
  }
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'
}

function HomePage() {
  const { token } = getSession()
  const isLoggedIn = !!token
  const toast = useToast()
  const navigate = useNavigate()
  const { rules } = useSmartRules()

  const [myItems, setMyItems] = useState([])
  const [catalogItems, setCatalogItems] = useState([])
  const [catalogCategories, setCatalogCategories] = useState([])
  const [sellerProducts, setSellerProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [sortBy, setSortBy] = useState('DEFAULT')

  const [sellerOrderQuantities, setSellerOrderQuantities] = useState({})
  const [sellerOrderSubmittingId, setSellerOrderSubmittingId] = useState(null)
  const [sellerOrderTarget, setSellerOrderTarget] = useState(null)
  const [sellerPaymentDraft, setSellerPaymentDraft] = useState(initialSellerPaymentDraft)
  const [sellerPaymentProcessing, setSellerPaymentProcessing] = useState(false)

  const [quickAddTarget, setQuickAddTarget] = useState(null)
  const [quickAddDraft, setQuickAddDraft] = useState(initialQuickAddDraft)
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false)
  const [quickPaymentProcessing, setQuickPaymentProcessing] = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()
  const catalogFilters = {
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
  }

  const naturalQuickExpiryDate =
    quickAddDraft.purchased && quickAddTarget
      ? getNaturalExpiryDate(quickAddTarget.name, quickAddTarget.category, rules)
      : null
  const displayedQuickExpiryDate = quickAddDraft.expiryDate || naturalQuickExpiryDate || ''

  const quickBuyPrice = quickAddTarget
    ? Number.isFinite(Number(quickAddTarget.price)) && quickAddTarget.price !== null
      ? Number(quickAddTarget.price)
      : rules?.price?.[normalizeKey(quickAddTarget.name)] ?? rules?.price?.[normalizeKey(quickAddTarget.category)] ?? 99
    : 0
  const quickBuyTotal = quickBuyPrice * Math.max(Number(quickAddDraft.quantity) || 0, 0)

  const quickNeedsUpi = quickAddDraft.paymentMethod === 'UPI' || quickAddDraft.paymentMethod === 'GPAY'
  const quickNeedsMockPayment = quickAddDraft.paymentMethod === 'GPAY'
  const upiIdIsValid = !quickNeedsUpi || upiPattern.test(quickAddDraft.upiId.trim())
  const quickPaymentReady = !quickNeedsMockPayment || quickAddDraft.paymentVerified

  const sellerNeedsUpi = sellerPaymentDraft.paymentMethod === 'UPI' || sellerPaymentDraft.paymentMethod === 'GPAY'
  const sellerNeedsMockPayment = sellerPaymentDraft.paymentMethod === 'GPAY'
  const sellerUpiIdIsValid = !sellerNeedsUpi || upiPattern.test(sellerPaymentDraft.upiId.trim())
  const sellerPaymentReady = !sellerNeedsMockPayment || sellerPaymentDraft.paymentVerified

  const loadHomeData = async () => {
    setLoading(true)
    setError('')
    try {
      const fetchPromises = [getCategories(), getCatalog(catalogFilters), getSellerProducts()]
      if (isLoggedIn) {
        fetchPromises.push(getGroceries())
      }

      const results = await Promise.all(fetchPromises)
      setCatalogCategories(results[0])
      setCatalogItems(results[1])
      setSellerProducts(results[2])
      if (isLoggedIn && results[3]) {
        setMyItems(results[3])
      } else {
        setMyItems([])
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load store data right now. Please check connection.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHomeData()
  }, [searchParams])

  const handleOpenQuickAdd = (item) => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    setQuickAddTarget(item)
    setQuickAddDraft(initialQuickAddDraft)
    setError('')
  }

  const handleCloseQuickAdd = () => {
    setQuickAddTarget(null)
    setQuickAddDraft(initialQuickAddDraft)
    setQuickAddSubmitting(false)
    setQuickPaymentProcessing(false)
  }

  const handleQuickAddChange = (event) => {
    const { name, value, type, checked } = event.target
    setQuickAddDraft((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'paymentMethod' || name === 'upiId' ? { paymentVerified: false } : {}),
    }))
  }

  const handleMockQuickPayment = () => {
    if (!upiIdIsValid) {
      setError('Enter a valid UPI ID to continue with Google Pay.')
      return
    }

    setError('')
    setQuickPaymentProcessing(true)

    window.setTimeout(() => {
      setQuickAddDraft((current) => ({ ...current, paymentVerified: true }))
      setQuickPaymentProcessing(false)
      toast.success('Google Pay verification successful.')
    }, 1200)
  }

  const handleQuickAddSubmit = async (event) => {
    event.preventDefault()
    if (!quickAddTarget) return

    if (quickNeedsUpi && !upiIdIsValid) {
      setError('Enter a valid UPI ID to continue with this purchase.')
      return
    }

    if (!quickPaymentReady) {
      setError('Verify the demo Google Pay payment before completing this purchase.')
      return
    }

    setQuickAddSubmitting(true)
    setError('')

    try {
      await createGrocery({
        name: quickAddTarget.name,
        category: quickAddTarget.category,
        quantity: Number(quickAddDraft.quantity),
        purchased: quickAddDraft.purchased,
        expiryDate: quickAddDraft.purchased ? displayedQuickExpiryDate || null : null,
      })
      await loadHomeData()
      window.dispatchEvent(new Event('grocery-data-changed'))
      toast.success(`${quickAddTarget.name} added to your order successfully!`)
      handleCloseQuickAdd()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, `Could not complete the purchase for ${quickAddTarget.name}.`))
      toast.error(`Could not complete purchase for ${quickAddTarget.name}.`)
    } finally {
      setQuickAddSubmitting(false)
    }
  }

  const handleSellerOrderQuantityChange = (productId, value) => {
    setSellerOrderQuantities((current) => ({
      ...current,
      [productId]: value,
    }))
  }

  const handleOpenSellerOrder = (product) => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    setSellerOrderTarget(product)
    setSellerPaymentDraft(initialSellerPaymentDraft)
    setSellerPaymentProcessing(false)
    setSellerOrderQuantities((current) => ({
      ...current,
      [product.id]: current[product.id] ?? 1,
    }))
    setError('')
  }

  const handleCloseSellerOrder = () => {
    setSellerOrderTarget(null)
    setSellerOrderSubmittingId(null)
    setSellerPaymentDraft(initialSellerPaymentDraft)
    setSellerPaymentProcessing(false)
  }

  const handleSellerPaymentChange = (event) => {
    const { name, value } = event.target
    setSellerPaymentDraft((current) => ({
      ...current,
      [name]: value,
      ...(name === 'paymentMethod' || name === 'upiId' ? { paymentVerified: false } : {}),
    }))
  }

  const handleMockSellerPayment = () => {
    if (!sellerUpiIdIsValid) {
      setError('Enter a valid UPI ID to continue with Google Pay.')
      return
    }

    setError('')
    setSellerPaymentProcessing(true)

    window.setTimeout(() => {
      setSellerPaymentDraft((current) => ({ ...current, paymentVerified: true }))
      setSellerPaymentProcessing(false)
      toast.success('Google Pay verification successful.')
    }, 1200)
  }

  const handleSellerOrder = async (product) => {
    const quantity = Math.max(Number(sellerOrderQuantities[product.id]) || 1, 1)

    if (quantity > product.stock) {
      setError(`Only ${product.stock} unit(s) of ${product.name} are available.`)
      return
    }

    if (sellerNeedsUpi && !sellerUpiIdIsValid) {
      setError('Enter a valid UPI ID to continue with this seller order.')
      return
    }

    if (!sellerPaymentReady) {
      setError('Verify the demo Google Pay payment before placing this seller order.')
      return
    }

    setSellerOrderSubmittingId(product.id)
    setError('')

    try {
      await createSellerOrder(product.id, { quantity })
      await loadHomeData()
      toast.success(`${product.name} order sent to Shree Data Kirana counter!`)
      setSellerOrderQuantities((current) => ({ ...current, [product.id]: 1 }))
      setSellerOrderTarget(null)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, `Could not order ${product.name}.`))
      toast.error(`Could not order ${product.name}.`)
    } finally {
      setSellerOrderSubmittingId(null)
    }
  }

  const selectCategory = (categoryId) => {
    const params = new URLSearchParams(searchParams)
    if (params.get('category') === categoryId) {
      params.delete('category')
    } else {
      params.set('category', categoryId)
    }
    setSearchParams(params, { replace: true })
    setTimeout(() => {
      document.getElementById('shop-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Sorted catalog items
  const sortedCatalogItems = useMemo(() => {
    const items = [...catalogItems]
    if (sortBy === 'PRICE_ASC') {
      return items.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
    }
    if (sortBy === 'PRICE_DESC') {
      return items.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
    }
    if (sortBy === 'NAME_ASC') {
      return items.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }
    return items
  }, [catalogItems, sortBy])

  const smartBuySuggestions = buildHomeSmartBuySuggestions(myItems, sellerProducts)

  return (
    <div className="space-y-12">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-gradient-to-br from-emerald-900 via-green-900 to-emerald-950 p-6 sm:p-10 lg:p-12 text-white shadow-xl">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 border border-amber-400/40 px-3.5 py-1 text-xs font-black text-amber-300 uppercase tracking-widest shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Your Trusted Neighborhood Kirana
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
                Welcome to <br />
                <span className="text-amber-400 drop-shadow-xs">Shree Data Kirana</span>
              </h1>
              <p className="text-base sm:text-lg text-emerald-100/90 font-medium max-w-xl leading-relaxed">
                Everything you need for your home, all in one place.
              </p>
            </div>

            {/* Value Proposition Pills */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs font-semibold text-emerald-100 border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                100% Fresh Farm Produce
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs font-semibold text-emerald-100 border border-white/10">
                <Truck className="w-4 h-4 text-amber-300" />
                Quick Counter Pickup & Delivery
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs font-semibold text-emerald-100 border border-white/10">
                <BookOpen className="w-4 h-4 text-emerald-300" />
                Digital Udhar Khata Available
              </span>
            </div>

            {/* Hero Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#shop-catalog"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 px-6 py-3.5 text-sm sm:text-base font-black shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShoppingBag className="w-5 h-5 text-emerald-950" />
                Explore Products
              </a>

              <Link
                to="/shopping-list"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 px-6 py-3.5 text-sm sm:text-base font-bold backdrop-blur-sm transition-all"
              >
                View My Orders
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/udhar-khata"
                className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-300 hover:text-amber-200 underline decoration-amber-400/50 underline-offset-4 ml-1"
              >
                <BookOpen className="w-4 h-4" />
                Open Udhar Khata →
              </Link>
            </div>
          </div>

          {/* Hero Right Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="overflow-hidden rounded-3xl border-2 border-white/20 bg-emerald-950/40 shadow-2xl">
                <img
                  src="/images/grocery_hero.jpg"
                  alt="Fresh groceries at Shree Data Kirana"
                  className="h-72 sm:h-80 lg:h-96 w-full object-cover transition-transform duration-700 hover:scale-105"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'
                  }}
                />
              </div>

              {/* Floating Badge 1: Fresh Daily */}
              <div className="absolute -bottom-4 -left-4 sm:left-4 rounded-2xl border border-white/30 bg-white/95 p-3.5 shadow-xl text-slate-900 backdrop-blur-md flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase text-emerald-800">Direct From Source</p>
                  <p className="text-xs font-semibold text-slate-700">Daily Fresh Vegetables & Dairy</p>
                </div>
              </div>

              {/* Floating Badge 2: Local Prices */}
              <div className="absolute -top-3 -right-3 rounded-2xl border border-amber-400/50 bg-amber-400 text-emerald-950 p-2.5 shadow-lg flex items-center gap-2">
                <Star className="w-4 h-4 fill-emerald-950" />
                <span className="text-xs font-black uppercase tracking-wider">Best Kirana Rates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Product Categories Section */}
      <section id="categories" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Explore Department Aisles
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Product Categories
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select any category to browse fresh inventory and daily staples.
            </p>
          </div>

          {searchParams.get('category') && (
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams)
                params.delete('category')
                setSearchParams(params, { replace: true })
              }}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 underline"
            >
              Clear Category Filter ({searchParams.get('category')})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          {CATEGORY_CARDS.map((cat) => {
            const isSelected = searchParams.get('category') === cat.id
            const Icon = cat.icon

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.id)}
                className={`relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer group ${
                  isSelected
                    ? 'ring-2 ring-emerald-700 border-emerald-700 bg-emerald-50/90 shadow-md'
                    : `bg-white ${cat.colorClasses} shadow-xs hover:shadow-md hover:-translate-y-0.5`
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-xs transition-transform group-hover:scale-110 ${cat.accentBg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/80 border border-slate-200/60 text-slate-600">
                    {cat.badge}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight group-hover:text-emerald-800 transition">
                    {cat.name}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {cat.subtitle}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-800">
                  <span>{isSelected ? 'Viewing' : 'Browse'}</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={() => setError('')}>
            Dismiss
          </Button>
        </div>
      )}

      {/* 3. Product Catalog Section */}
      <section id="shop-catalog" className="space-y-6 pt-2">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-800">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
              Verified Kirana Inventory
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Fresh Grocery Products
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Handpicked everyday staples with authentic quality, live stock availability, and transparent local rates.
            </p>
          </div>

          {/* Catalog Controls: Sort & Filter */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-600">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 shadow-2xs"
              >
                <option value="DEFAULT">Featured / Recommended</option>
                <option value="PRICE_ASC">Price: Low to High</option>
                <option value="PRICE_DESC">Price: High to Low</option>
                <option value="NAME_ASC">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Pills Display */}
        {(catalogFilters.category || catalogFilters.search) && (
          <div className="flex flex-wrap items-center gap-2 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 text-xs text-emerald-900">
            <span className="font-bold">Active Filter:</span>
            {catalogFilters.category && (
              <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 font-bold">
                Category: {catalogFilters.category}
              </span>
            )}
            {catalogFilters.search && (
              <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 font-bold">
                Search: &ldquo;{catalogFilters.search}&rdquo;
              </span>
            )}
            <button
              onClick={() => {
                const params = new URLSearchParams()
                setSearchParams(params, { replace: true })
              }}
              className="ml-auto font-bold text-emerald-800 hover:underline"
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedCatalogItems.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
              <p className="text-base font-bold text-slate-800">No grocery products found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No items match your search or selected category in Shree Data Kirana catalog.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams()
                  setSearchParams(params, { replace: true })
                }}
              >
                View All Products
              </Button>
            </div>
          )}

          {sortedCatalogItems.map((item) => {
            const itemKey = `${item.category}-${item.name}`
            const quantity = Number(item.availableQuantity) || 0
            const availability = item.availability || resolveAvailability(quantity)
            const stockTone = stockToneByAvailability[availability] || stockToneByAvailability.OUT_OF_STOCK
            const displayPrice =
              Number.isFinite(Number(item.price)) && item.price !== null
                ? Number(item.price)
                : rules?.price?.[normalizeKey(item.name)] ?? rules?.price?.[normalizeKey(item.category)] ?? 99

            const itemImage = resolveCatalogImage(item)

            return (
              <article
                key={itemKey}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all duration-200 hover:shadow-lg hover:border-emerald-300"
              >
                <div>
                  {/* Product Image Box */}
                  <div className="relative mb-3.5 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                    <img
                      src={itemImage}
                      alt={item.name}
                      className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'
                      }}
                    />

                    {/* Store Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <StoreLogoBadge storeName="Shree Data Kirana" />
                    </div>

                    {/* Availability Tag */}
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs ${stockTone.badge}`}
                      >
                        {stockTone.label}
                      </span>
                    </div>

                    {/* Low Stock Counter Alert if Supported by Backend Data */}
                    {quantity > 0 && quantity <= AVAILABILITY_THRESHOLD && (
                      <div className="absolute bottom-2 left-2 right-2 bg-amber-500/95 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg text-center backdrop-blur-xs flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-slate-950" />
                        Only {quantity} left in shop!
                      </div>
                    )}
                  </div>

                  {/* Category & Stock Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 border border-emerald-100">
                      {item.category}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {quantity > 0 ? `${quantity} in stock` : 'Restocking soon'}
                    </span>
                  </div>

                  {/* Product Title */}
                  <h3 className="mt-2 text-base font-bold text-slate-950 capitalize line-clamp-1 group-hover:text-emerald-800 transition">
                    {item.name}
                  </h3>

                  {/* Price Row */}
                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <div>
                      <p className="text-2xl font-black tracking-tight text-slate-900">
                        {formatPrice(displayPrice, item.currency || 'INR')}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">Direct Kirana Price</p>
                    </div>

                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Best Deal
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenQuickAdd(item)}
                    disabled={availability === 'OUT_OF_STOCK'}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-black transition text-center shadow-xs flex items-center justify-center gap-1.5 ${
                      availability === 'OUT_OF_STOCK'
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : 'bg-emerald-800 hover:bg-emerald-700 text-white active:scale-95'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {availability === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Add to Cart / Buy'}
                  </button>

                  <Link
                    to="/price-compare"
                    state={{ queryText: item.name }}
                    className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2.5 text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-2xs"
                    title="Compare item prices"
                  >
                    Compare
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* 4. Smart Suggestions Section (if user has active grocery tracking) */}
      {smartBuySuggestions.length > 0 && (
        <section className="rounded-3xl border border-emerald-100 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Smart Restock Queue
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                Recommended for your Home
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Based on low stock and expiry tracking in your inventory.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
              {smartBuySuggestions.length} items to reorder
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {smartBuySuggestions.map((suggestion) => (
              <SmartInsightCard
                key={suggestion.id}
                {...suggestion}
                onAction={() => {
                  if (suggestion.actionTarget === 'seller-market') {
                    document.getElementById('seller-market')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    return
                  }
                  if (suggestion.actionTarget === 'dashboard-reminders') {
                    navigate('/dashboard', { state: { openSection: 'kitchen-reminders' } })
                    return
                  }
                  navigate('/shopping-list')
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. Seller & Shop Counter Order Section */}
      {sellerProducts.length > 0 && (
        <section id="seller-market" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-800">
                <StoreLogoBadge storeName="Shree Data Kirana" />
                Fresh Store Counter
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                Direct Counter Products
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Live packaged grocery stock available at the shop counter.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              {sellerProducts.length} live products
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sellerProducts.map((product) => {
              const isSubmitting = sellerOrderSubmittingId === product.id
              const quantity = Number(product.stock) || 0
              const availability = resolveAvailability(quantity)
              const stockTone = stockToneByAvailability[availability] || stockToneByAvailability.OUT_OF_STOCK

              return (
                <article
                  key={product.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-lg bg-emerald-100/70 px-2.5 py-0.5 text-xs font-bold text-emerald-900 uppercase">
                        {product.category}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${stockTone.badge}`}>
                        {stockTone.label}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-900">{product.name}</h3>

                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-2xl font-black text-slate-950">{formatPrice(product.price)}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Counter Price</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${stockTone.quantityText}`}>
                          {quantity > 0 ? `${quantity} available` : 'Sold out'}
                        </p>
                        <p className="text-[10px] text-slate-400">Available Stock</p>
                      </div>
                    </div>

                    {product.expiryDate && (
                      <p className="mt-2 text-xs font-semibold text-emerald-700">
                        Expires on {new Date(`${product.expiryDate}T00:00:00`).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenSellerOrder(product)}
                    disabled={isSubmitting || availability === 'OUT_OF_STOCK'}
                    className={`mt-4 w-full rounded-xl py-2.5 text-xs font-bold transition ${
                      isSubmitting || availability === 'OUT_OF_STOCK'
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-800 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    {isSubmitting ? 'Sending Order...' : availability === 'OUT_OF_STOCK' ? 'Unavailable' : 'Order From Counter'}
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* Modal: Quick Buy / Add to Cart */}
      {quickAddTarget && (
        <Modal
          open={Boolean(quickAddTarget)}
          title={`Order ${quickAddTarget.name}`}
          description={`Category: ${quickAddTarget.category} | Store: Shree Data Kirana`}
          onClose={handleCloseQuickAdd}
          footer={null}
        >
          <form className="space-y-4" onSubmit={handleQuickAddSubmit}>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-600">Unit Price:</span>
                <span className="text-lg font-bold text-slate-950">{formatPrice(quickBuyPrice)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Available stock: {quickAddTarget.availableQuantity ?? 'Ample'}</span>
                <span>Fast Counter Dispatch</span>
              </div>
            </div>

            <div>
              <Input
                label="Quantity"
                name="quantity"
                type="number"
                min="1"
                value={quickAddDraft.quantity}
                onChange={handleQuickAddChange}
                required
                inputClassName="focus:border-emerald-500"
              />
            </div>

            <Input
              as="select"
              label="Payment Method"
              name="paymentMethod"
              value={quickAddDraft.paymentMethod}
              onChange={handleQuickAddChange}
              inputClassName="focus:border-emerald-500"
            >
              {paymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>

            {quickNeedsUpi && (
              <Input
                label={quickAddDraft.paymentMethod === 'GPAY' ? 'Google Pay UPI ID' : 'UPI ID'}
                name="upiId"
                value={quickAddDraft.upiId}
                onChange={handleQuickAddChange}
                placeholder="name@upi"
                error={quickAddDraft.upiId && !upiIdIsValid ? 'Enter a valid UPI ID (e.g. name@bank).' : ''}
                inputClassName="focus:border-emerald-500"
                required
              />
            )}

            {quickNeedsMockPayment && (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Google Pay Demo Verification</p>
                    <p className="text-[11px] text-slate-500">Quick simulated verification for instant ordering.</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      quickAddDraft.paymentVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-sky-700'
                    }`}
                  >
                    {quickAddDraft.paymentVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="sky"
                  size="sm"
                  fullWidth
                  className="mt-3 rounded-xl"
                  disabled={quickPaymentProcessing || !upiIdIsValid}
                  onClick={handleMockQuickPayment}
                >
                  {quickPaymentProcessing ? 'Verifying UPI...' : 'Simulate Google Pay'}
                </Button>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-xl text-emerald-800">{formatPrice(quickBuyTotal)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {quickAddDraft.quantity} x {formatPrice(quickBuyPrice)} via {quickAddDraft.paymentMethod}
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={handleCloseQuickAdd}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold"
                disabled={quickAddSubmitting || !upiIdIsValid || !quickPaymentReady}
              >
                {quickAddSubmitting ? 'Confirming Order...' : 'Confirm Grocery Order'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Seller Order */}
      {sellerOrderTarget && (
        <Modal
          open={Boolean(sellerOrderTarget)}
          title={`Counter Order: ${sellerOrderTarget.name}`}
          description={`Stock: ${sellerOrderTarget.stock} units | Shree Data Kirana`}
          onClose={handleCloseSellerOrder}
          footer={null}
        >
          <div className="space-y-4">
            <Input
              label="Order Quantity"
              type="number"
              min="1"
              max={sellerOrderTarget.stock}
              value={sellerOrderQuantities[sellerOrderTarget.id] ?? 1}
              onChange={(e) => handleSellerOrderQuantityChange(sellerOrderTarget.id, e.target.value)}
            />

            <Input
              as="select"
              label="Payment Method"
              name="paymentMethod"
              value={sellerPaymentDraft.paymentMethod}
              onChange={handleSellerPaymentChange}
            >
              {paymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>

            {sellerNeedsUpi && (
              <Input
                label="UPI ID"
                name="upiId"
                value={sellerPaymentDraft.upiId}
                onChange={handleSellerPaymentChange}
                placeholder="name@upi"
                error={sellerPaymentDraft.upiId && !sellerUpiIdIsValid ? 'Enter a valid UPI ID.' : ''}
                required
              />
            )}

            {sellerNeedsMockPayment && (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3">
                <Button
                  type="button"
                  variant="sky"
                  size="sm"
                  fullWidth
                  disabled={sellerPaymentProcessing || !sellerUpiIdIsValid}
                  onClick={handleMockSellerPayment}
                >
                  {sellerPaymentProcessing ? 'Verifying...' : 'Verify UPI Payment'}
                </Button>
              </div>
            )}

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                <span>Counter Bill Total:</span>
                <span className="text-xl text-emerald-800">
                  {formatPrice(
                    Number(sellerOrderTarget.price) * Math.max(Number(sellerOrderQuantities[sellerOrderTarget.id]) || 1, 1),
                  )}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={handleCloseSellerOrder}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold"
                disabled={
                  sellerOrderSubmittingId === sellerOrderTarget.id ||
                  sellerOrderTarget.stock <= 0 ||
                  !sellerUpiIdIsValid ||
                  !sellerPaymentReady
                }
                onClick={() => handleSellerOrder(sellerOrderTarget)}
              >
                {sellerOrderSubmittingId === sellerOrderTarget.id ? 'Sending Order...' : 'Send Counter Order'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default HomePage
