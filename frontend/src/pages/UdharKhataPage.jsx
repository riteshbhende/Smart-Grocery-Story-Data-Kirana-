import React, { useEffect, useState } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  AlertTriangle,
  History,
  UserPlus,
  Phone,
  CreditCard,
  Wallet,
  ShieldAlert,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/toast'
import {
  getUdharKhata,
  getUdharSummary,
  addCustomerKhata,
  recordUdharTransaction,
  recordUdharPayment,
} from '../services/udharService'
import { formatPrice } from '../utils/format'

export default function UdharKhataPage() {
  const toast = useToast()
  const [accounts, setAccounts] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modals
  const [addCustomerOpen, setAddCustomerOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ customerName: '', phone: '', creditLimit: 5000, openingDue: 0 })

  const [transactionModal, setTransactionModal] = useState({ open: false, type: 'DEBIT', customer: null })
  const [txnForm, setTxnForm] = useState({ amount: '', description: '', paymentMethod: 'CASH' })

  const [historyModal, setHistoryModal] = useState({ open: false, customer: null })

  const loadData = async () => {
    setLoading(true)
    try {
      const [list, sum] = await Promise.all([getUdharKhata(), getUdharSummary()])
      setAccounts(list)
      setSummary(sum)
    } catch {
      toast.error('Could not load Udhar Khata data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddCustomer = async (e) => {
    e.preventDefault()
    if (!newCustomer.customerName.trim()) {
      toast.error('Customer name is required.')
      return
    }

    try {
      await addCustomerKhata(newCustomer)
      toast.success(`Account created for ${newCustomer.customerName}`)
      setAddCustomerOpen(false)
      setNewCustomer({ customerName: '', phone: '', creditLimit: 5000, openingDue: 0 })
      await loadData()
    } catch {
      toast.error('Failed to create customer account.')
    }
  }

  const handleTransactionSubmit = async (e) => {
    e.preventDefault()
    const amount = Number(txnForm.amount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount.')
      return
    }

    const { customer, type } = transactionModal
    try {
      if (type === 'DEBIT') {
        await recordUdharTransaction(customer.id, {
          amount,
          description: txnForm.description || 'Grocery items on credit',
        })
        toast.success(`Udhar of ${formatPrice(amount)} recorded for ${customer.customerName}`)
      } else {
        await recordUdharPayment(customer.id, {
          amount,
          paymentMethod: txnForm.paymentMethod,
          note: txnForm.description,
        })
        toast.success(`Payment of ${formatPrice(amount)} recorded for ${customer.customerName}`)
      }
      setTransactionModal({ open: false, type: 'DEBIT', customer: null })
      setTxnForm({ amount: '', description: '', paymentMethod: 'CASH' })
      await loadData()
    } catch {
      toast.error('Transaction failed to record.')
    }
  }

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.phone && acc.phone.includes(searchTerm))
    if (!matchesSearch) return false

    if (statusFilter === 'DUES_ONLY') return acc.currentDue > 0
    if (statusFilter === 'NEAR_LIMIT') return acc.status === 'NEAR_LIMIT' || acc.status === 'EXCEEDED'
    if (statusFilter === 'CLEAR') return acc.currentDue === 0
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-emerald-900/10 bg-gradient-to-r from-emerald-900 via-green-900 to-emerald-800 p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 border border-amber-400/30 px-3 py-1 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              Shree Data Kirana Digital Ledger
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
              Customer Udhar Khata
            </h1>
            <p className="mt-2 text-sm sm:text-base text-emerald-100/80 max-w-2xl">
              Track customer credit limits, outstanding grocery dues, record payments (Jama), and manage trusted neighborhood relationships.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setAddCustomerOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold shadow-md rounded-xl text-sm px-5 py-2.5 flex items-center gap-2 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              New Customer Khata
            </Button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pending Dues</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Wallet className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-rose-600">
            {summary ? formatPrice(summary.totalPendingDue) : '₹0'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {summary?.accountsWithDues ?? 0} customer(s) with active balances
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Accounts</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CreditCard className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {accounts.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Digital credit ledger accounts
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Near / Exceeded Limit</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <ShieldAlert className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-amber-600">
            {accounts.filter((a) => a.currentDue >= (a.creditLimit || 3000) * 0.8).length}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Follow up recommended for settlement
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Credit Limit</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <CheckCircle className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {summary ? formatPrice(summary.totalCreditLimit) : '₹0'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Store allocated credit power
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          {[
            { id: 'ALL', label: 'All Accounts' },
            { id: 'DUES_ONLY', label: 'With Pending Dues' },
            { id: 'NEAR_LIMIT', label: 'Near Limit' },
            { id: 'CLEAR', label: 'Settled (₹0)' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                statusFilter === id
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Ledger Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Credit Limit</th>
                <th className="px-6 py-4">Pending Due</th>
                <th className="px-6 py-4">Khata Status</th>
                <th className="px-6 py-4">Last Payment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    No customer accounts match your search or filter.
                  </td>
                </tr>
              )}

              {filteredAccounts.map((acc) => {
                const percentUsed = Math.min(100, Math.round(((acc.currentDue || 0) / (acc.creditLimit || 1)) * 100))
                const isOverLimit = acc.currentDue >= acc.creditLimit
                const isNearLimit = acc.currentDue >= acc.creditLimit * 0.8

                return (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                          {acc.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{acc.customerName}</p>
                          {acc.phone && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {acc.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {formatPrice(acc.creditLimit)}
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <span className={`text-base font-extrabold ${acc.currentDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {formatPrice(acc.currentDue)}
                        </span>
                        <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOverLimit ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{percentUsed}% of limit</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {acc.currentDue === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Settled
                        </span>
                      ) : isOverLimit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> Exceeded
                        </span>
                      ) : isNearLimit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Near Limit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                          Active Dues
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {acc.lastPaymentDate ? new Date(acc.lastPaymentDate).toLocaleDateString('en-IN') : 'None recorded'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTransactionModal({ open: true, type: 'DEBIT', customer: acc })}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition flex items-center gap-1 shadow-xs"
                          title="Record Udhar Given"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
                          + Udhar
                        </button>

                        <button
                          type="button"
                          onClick={() => setTransactionModal({ open: true, type: 'CREDIT', customer: acc })}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition flex items-center gap-1 shadow-xs"
                          title="Record Payment Received"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700" />
                          Jama
                        </button>

                        <button
                          type="button"
                          onClick={() => setHistoryModal({ open: true, customer: acc })}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                          title="View Transaction History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Customer */}
      {addCustomerOpen && (
        <Modal
          open={addCustomerOpen}
          title="New Customer Udhar Khata"
          description="Create a digital ledger account with personalized credit limit for Shree Data Kirana."
          onClose={() => setAddCustomerOpen(false)}
          footer={null}
        >
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <Input
              label="Customer Full Name"
              placeholder="e.g. Ramesh Chandra"
              value={newCustomer.customerName}
              onChange={(e) => setNewCustomer({ ...newCustomer, customerName: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              placeholder="e.g. +91 98765 43210"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            />
            <Input
              label="Credit Limit (₹)"
              type="number"
              placeholder="5000"
              value={newCustomer.creditLimit}
              onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: e.target.value })}
              required
            />
            <Input
              label="Opening Due Balance (if any) (₹)"
              type="number"
              placeholder="0"
              value={newCustomer.openingDue}
              onChange={(e) => setNewCustomer({ ...newCustomer, openingDue: e.target.value })}
            />

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setAddCustomerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold">
                Create Account
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Record Debit / Credit Transaction */}
      {transactionModal.open && transactionModal.customer && (
        <Modal
          open={transactionModal.open}
          title={transactionModal.type === 'DEBIT' ? `Give Udhar: ${transactionModal.customer.customerName}` : `Receive Jama: ${transactionModal.customer.customerName}`}
          description={transactionModal.type === 'DEBIT' ? 'Record grocery items taken on credit' : 'Record payment received to reduce pending due balance'}
          onClose={() => setTransactionModal({ open: false, type: 'DEBIT', customer: null })}
          footer={null}
        >
          <form onSubmit={handleTransactionSubmit} className="space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Current Balance:</span>
              <span className="font-extrabold text-rose-600 text-base">{formatPrice(transactionModal.customer.currentDue)}</span>
            </div>

            <Input
              label="Amount (₹)"
              type="number"
              placeholder="e.g. 500"
              value={txnForm.amount}
              onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
              required
              min="1"
            />

            {transactionModal.type === 'CREDIT' ? (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">Payment Method</label>
                <select
                  value={txnForm.paymentMethod}
                  onChange={(e) => setTxnForm({ ...txnForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-emerald-600"
                >
                  <option value="CASH">Cash</option>
                  <option value="GPAY">Google Pay / PhonePe UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
            ) : null}

            <Input
              label="Note / Item Details"
              placeholder={transactionModal.type === 'DEBIT' ? 'e.g. Dal, Oil, Spices' : 'e.g. Cash settlement'}
              value={txnForm.description}
              onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })}
            />

            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setTransactionModal({ open: false, type: 'DEBIT', customer: null })}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={transactionModal.type === 'DEBIT' ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold' : 'bg-emerald-700 hover:bg-emerald-800 text-white font-bold'}
              >
                {transactionModal.type === 'DEBIT' ? 'Save Udhar Entry' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Customer Transaction History */}
      {historyModal.open && historyModal.customer && (
        <Modal
          open={historyModal.open}
          title={`Ledger History: ${historyModal.customer.customerName}`}
          description={`Phone: ${historyModal.customer.phone || 'N/A'} | Credit Limit: ${formatPrice(historyModal.customer.creditLimit)}`}
          onClose={() => setHistoryModal({ open: false, customer: null })}
          footer={null}
        >
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {(!historyModal.customer.history || historyModal.customer.history.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-6">No previous entries for this account.</p>
            )}

            {historyModal.customer.history?.map((h) => (
              <div
                key={h.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between text-sm ${
                  h.type === 'PURCHASE' ? 'bg-amber-50/50 border-amber-200/70' : 'bg-emerald-50/50 border-emerald-200/70'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      h.type === 'PURCHASE' ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                    }`}>
                      {h.type === 'PURCHASE' ? 'Udhar (Debit)' : 'Jama (Payment)'}
                    </span>
                    <span className="text-xs text-slate-500">{h.date}</span>
                  </div>
                  <p className="mt-1 font-medium text-slate-800">{h.description}</p>
                </div>
                <span className={`text-base font-extrabold ${h.type === 'PURCHASE' ? 'text-amber-900' : 'text-emerald-700'}`}>
                  {h.type === 'PURCHASE' ? `+${formatPrice(h.amount)}` : `-${formatPrice(h.amount)}`}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <Button variant="secondary" onClick={() => setHistoryModal({ open: false, customer: null })}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
