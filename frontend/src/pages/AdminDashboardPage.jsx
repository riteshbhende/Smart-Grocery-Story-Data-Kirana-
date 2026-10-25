import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Boxes,
  AlertTriangle,
  ShoppingCart,
  Wallet,
  TrendingUp,
  RefreshCw,
  PackageCheck,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react'
import { getApiErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import {
  getAdminDashboard,
  getAdminProducts,
  getAdminSellerOrders,
} from '../services/adminService'
import { getUdharSummary, getUdharKhata } from '../services/udharService'
import { formatPrice } from '../utils/format'

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [udharSummary, setUdharSummary] = useState(null)
  const [udharAccounts, setUdharAccounts] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboardData = async () => {
    setLoading(true)
    setError('')

    const results = await Promise.allSettled([
      getAdminDashboard(),
      getAdminProducts(),
      getAdminSellerOrders(),
      getUdharSummary(),
      getUdharKhata(),
    ])

    const [sumRes, prodRes, ordRes, udhSumRes, udhAccRes] = results

    if (sumRes.status === 'fulfilled') {
      setSummary(sumRes.value)
    }
    if (prodRes.status === 'fulfilled') {
      setProducts(prodRes.value || [])
    }
    if (ordRes.status === 'fulfilled') {
      setOrders(ordRes.value || [])
    }
    if (udhSumRes.status === 'fulfilled') {
      setUdharSummary(udhSumRes.value)
    }
    if (udhAccRes.status === 'fulfilled') {
      setUdharAccounts(udhAccRes.value || [])
    }

    // Check if critical calls failed
    const failures = results.filter((r) => r.status === 'rejected')
    if (failures.length > 0 && sumRes.status === 'rejected') {
      setError(getApiErrorMessage(sumRes.reason, 'Could not connect to grocery backend API.'))
    }

    setLoading(false)
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Calculate Today's Orders from real backend orders
  const todayStr = new Date().toISOString().split('T')[0]
  const todayOrders = orders.filter((o) => {
    if (!o.orderedAt) return false
    return o.orderedAt.startsWith(todayStr)
  })

  // Low stock products from real inventory
  const lowStockItems = products.filter((p) => {
    const qty = Number(p.quantity ?? p.stock ?? 0)
    return qty > 0 && qty <= 3
  })

  // Customer dues list
  const pendingDuesAccounts = udharAccounts
    .filter((a) => (Number(a.currentDue) || 0) > 0)
    .sort((a, b) => (Number(b.currentDue) || 0) - (Number(a.currentDue) || 0))

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-emerald-900/10 bg-gradient-to-r from-emerald-900 via-green-900 to-emerald-950 p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 border border-amber-400/30 px-3.5 py-1 text-xs font-black text-amber-300 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Shree Data Kirana Shop Administration
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
              Store Management Dashboard
            </h1>
            <p className="mt-2 text-sm sm:text-base text-emerald-100/80 max-w-2xl">
              Live shop overview powered by backend inventory, order processing, and digital Udhar Khata ledger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={loadDashboardData}
              variant="secondary"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link
              to="/admin/products"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-emerald-950 transition shadow-xs"
            >
              Manage Catalog
            </Link>
            <Link
              to="/admin/udhar-khata"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-emerald-950 hover:bg-slate-50 transition shadow-xs flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-800" />
              Udhar Khata
            </Link>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={loadDashboardData}>
            Retry API
          </Button>
        </div>
      )}

      {/* 4 Required KPI Summary Cards */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Products */}
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Products</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold">
              <Boxes className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950">
            {loading ? (
              <span className="inline-block w-12 h-8 bg-slate-100 rounded-md animate-pulse" />
            ) : summary ? (
              summary.totalProducts ?? products.length
            ) : (
              products.length || '--'
            )}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>In active inventory</span>
            <Link to="/admin/products" className="font-semibold text-emerald-700 hover:underline">
              View all →
            </Link>
          </div>
        </article>

        {/* 2. Low-Stock Products */}
        <article className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Low-Stock Products</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 font-bold">
              <AlertTriangle className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-black text-amber-600">
            {loading ? (
              <span className="inline-block w-12 h-8 bg-slate-100 rounded-md animate-pulse" />
            ) : summary ? (
              summary.lowStockProducts ?? lowStockItems.length
            ) : (
              lowStockItems.length
            )}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Quantity ≤ 3 units</span>
            <span className="font-semibold text-amber-700">Needs Reorder</span>
          </div>
        </article>

        {/* 3. Today's Orders */}
        <article className="rounded-2xl border border-sky-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Today&apos;s Orders</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 font-bold">
              <ShoppingCart className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-black text-sky-900">
            {loading ? (
              <span className="inline-block w-12 h-8 bg-slate-100 rounded-md animate-pulse" />
            ) : orders.length > 0 ? (
              todayOrders.length > 0 ? todayOrders.length : `${orders.length} total`
            ) : (
              summary?.pendingProducts ? `${summary.pendingProducts} pending` : '0'
            )}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Store orders</span>
            <Link to="/admin/seller-orders" className="font-semibold text-sky-700 hover:underline">
              Orders list →
            </Link>
          </div>
        </article>

        {/* 4. Pending Udhar Amount */}
        <article className="rounded-2xl border border-rose-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Udhar Amount</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 font-bold">
              <Wallet className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-black text-rose-600">
            {loading ? (
              <span className="inline-block w-20 h-8 bg-slate-100 rounded-md animate-pulse" />
            ) : udharSummary ? (
              formatPrice(udharSummary.totalPendingDue)
            ) : (
              '₹0'
            )}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{pendingDuesAccounts.length} customer(s) due</span>
            <Link to="/admin/udhar-khata" className="font-semibold text-rose-600 hover:underline">
              Khata Ledger →
            </Link>
          </div>
        </article>
      </section>

      {/* Tables Section: Orders, Low Stock, and Customer Dues */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Orders Table */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Recent Customer Orders</h3>
                <p className="text-xs text-slate-500">Real-time orders processed through backend</p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {orders.length} Orders
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              {loading ? (
                <div className="space-y-2 py-4">
                  <div className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                  <div className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                </div>
              ) : orders.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No customer orders received yet.
                </p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Total</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.slice(0, 6).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2.5 font-bold text-slate-800">
                          {order.customerName || 'Shopper'}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{order.productName}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-700">{order.quantity}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">
                          {formatPrice(order.totalPrice || order.unitPrice * order.quantity)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              order.status === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Link
              to="/seller/orders"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
            >
              Open Full Orders Center <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* Low-Stock & Inventory Alerts */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Low-Stock Alert Watchlist</h3>
                <p className="text-xs text-slate-500">Products with 3 or fewer units remaining</p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {lowStockItems.length} Low Stock
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              {loading ? (
                <div className="space-y-2 py-4">
                  <div className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                  <div className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                </div>
              ) : lowStockItems.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  Inventory is well stocked! No low-stock items detected.
                </p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Remaining Units</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lowStockItems.slice(0, 6).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2.5 font-bold text-slate-800 capitalize">{item.name}</td>
                        <td className="px-3 py-2.5 text-slate-500">{item.category}</td>
                        <td className="px-3 py-2.5">
                          <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                            {item.quantity ?? item.stock} units
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Link
                            to="/admin/products"
                            className="text-xs font-bold text-emerald-700 hover:underline"
                          >
                            Update Stock
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Link
              to="/admin/products"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
            >
              Manage Inventory Catalog <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </div>

      {/* Pending Customer Udhar Dues Snapshot */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-800" />
              Pending Customer Dues (Digital Udhar Khata)
            </h3>
            <p className="text-xs text-slate-500">
              Outstanding balances due for settlement at Shree Data Kirana
            </p>
          </div>
          <Link
            to="/admin/udhar-khata"
            className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1 self-start sm:self-auto"
          >
            Open Complete Khata Ledger
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          {pendingDuesAccounts.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No outstanding customer dues recorded. All khata accounts are settled!
            </p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="px-4 py-2.5">Customer Name</th>
                  <th className="px-4 py-2.5">Contact</th>
                  <th className="px-4 py-2.5">Credit Limit</th>
                  <th className="px-4 py-2.5">Outstanding Due</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingDuesAccounts.slice(0, 5).map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{acc.customerName}</td>
                    <td className="px-4 py-3 text-slate-500">{acc.phone || '--'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{formatPrice(acc.creditLimit)}</td>
                    <td className="px-4 py-3 font-black text-rose-600 text-sm">{formatPrice(acc.currentDue)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {acc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/admin/udhar-khata"
                        className="font-bold text-emerald-800 hover:underline"
                      >
                        Record Payment →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
