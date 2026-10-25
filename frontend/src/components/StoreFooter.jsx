import React from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  Truck,
  Sparkles,
  CreditCard,
  Heart,
  ShoppingBag,
  BookOpen,
} from 'lucide-react'
import StoreLogo from './ui/StoreLogo'

export default function StoreFooter() {
  return (
    <footer className="mt-16 border-t border-emerald-900/10 bg-gradient-to-b from-white to-emerald-950/5 text-slate-700">
      {/* Trust Highlights Strip */}
      <div className="border-b border-emerald-900/10 bg-emerald-900 text-emerald-100 py-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-emerald-950 font-bold shrink-0 shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="font-bold text-white text-sm">100% Fresh & Authentic</p>
              <p className="text-xs text-emerald-200/80">Direct quality handpicked daily</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-emerald-950 font-bold shrink-0 shadow-sm">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <p className="font-bold text-white text-sm">Real Kirana Savings</p>
              <p className="text-xs text-emerald-200/80">Wholesale-friendly neighborhood prices</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-emerald-950 font-bold shrink-0 shadow-sm">
              <Truck className="h-6 w-6" />
            </span>
            <div>
              <p className="font-bold text-white text-sm">Quick Home Delivery</p>
              <p className="text-xs text-emerald-200/80">Instant counter pickup & local delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-emerald-950 font-bold shrink-0 shadow-sm">
              <BookOpen className="h-6 w-6" />
            </span>
            <div>
              <p className="font-bold text-white text-sm">Digital Udhar Khata</p>
              <p className="text-xs text-emerald-200/80">Trusted ledger billing with UPI & Cash</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <StoreLogo size="lg" />
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              Serving the community with fresh produce, dairy, bakery, pulses, and daily household staples. Personalized service, fair prices, and digital convenience.
            </p>
            <div className="pt-1 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Shop No. 12, Main Kirana Market, Central Road</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Open Everyday: 7:00 AM – 10:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Customer Helpdesk & WhatsApp: +91 98234 56789</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Shop Navigation</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-emerald-700 transition">Store Home</Link>
              </li>
              <li>
                <a href="#shop-catalog" className="hover:text-emerald-700 transition">All Groceries</a>
              </li>
              <li>
                <a href="#categories" className="hover:text-emerald-700 transition">Browse Categories</a>
              </li>
              <li>
                <Link to="/inventory" className="hover:text-emerald-700 transition">My Inventory</Link>
              </li>
              <li>
                <Link to="/shopping-list" className="hover:text-emerald-700 transition">Buy Queue & Orders</Link>
              </li>
              <li>
                <Link to="/udhar-khata" className="text-emerald-800 font-semibold hover:text-emerald-600 transition flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                  Digital Udhar Khata
                </Link>
              </li>
            </ul>
          </div>

          {/* Grocery Categories */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Top Categories</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/?category=PRODUCE" className="hover:text-emerald-700 transition">Fruits & Vegetables</Link>
              </li>
              <li>
                <Link to="/?category=DAIRY" className="hover:text-emerald-700 transition">Dairy Products</Link>
              </li>
              <li>
                <Link to="/?category=BAKERY" className="hover:text-emerald-700 transition">Bakery & Breads</Link>
              </li>
              <li>
                <Link to="/?category=BEVERAGES" className="hover:text-emerald-700 transition">Tea, Coffee & Beverages</Link>
              </li>
              <li>
                <Link to="/?category=SNACKS" className="hover:text-emerald-700 transition">Snacks & Biscuits</Link>
              </li>
              <li>
                <Link to="/?category=ESSENTIALS" className="hover:text-emerald-700 transition">Grains, Atta & Pulses</Link>
              </li>
              <li>
                <Link to="/?category=HOUSEHOLD" className="hover:text-emerald-700 transition">Household Essentials</Link>
              </li>
            </ul>
          </div>

          {/* Store Management & Payment */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Store Management</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/admin" className="hover:text-emerald-700 transition font-medium">Shop Admin Portal</Link>
              </li>
              <li>
                <Link to="/seller" className="hover:text-emerald-700 transition font-medium">Seller Counter</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-700 transition">Owner / Staff Login</Link>
              </li>
            </ul>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Accepted Payments</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">Cash</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700">UPI / GPay</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800">Udhar Khata</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} <strong>Shree Data Kirana</strong>. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for your daily grocery needs.
          </p>
        </div>
      </div>
    </footer>
  )
}
