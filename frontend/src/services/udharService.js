import api from '../api/client'

const UDHAR_STORAGE_KEY = 'sdk_udhar_khata_records_v1'

// Default seed data for local storage if none exists yet
const defaultUdharAccounts = [
  {
    id: 'c1',
    customerName: 'Rajesh Sharma',
    phone: '+91 98201 45821',
    creditLimit: 5000,
    currentDue: 1850,
    lastPaymentDate: '2026-10-18',
    status: 'ACTIVE',
    history: [
      { id: 'h1', date: '2026-10-12', type: 'PURCHASE', description: 'Atta 10kg, Mustard Oil 2L', amount: 1200 },
      { id: 'h2', date: '2026-10-18', type: 'PAYMENT', description: 'GPay payment received', amount: 1000 },
      { id: 'h3', date: '2026-10-21', type: 'PURCHASE', description: 'Basmati Rice, Sugar 5kg', amount: 1650 },
    ],
  },
  {
    id: 'c2',
    customerName: 'Sunita Patel',
    phone: '+91 98450 11234',
    creditLimit: 4000,
    currentDue: 920,
    lastPaymentDate: '2026-10-15',
    status: 'ACTIVE',
    history: [
      { id: 'h4', date: '2026-10-10', type: 'PURCHASE', description: 'Milk, Bread, Butter daily', amount: 520 },
      { id: 'h5', date: '2026-10-19', type: 'PURCHASE', description: 'Snacks, Spices pack', amount: 400 },
    ],
  },
  {
    id: 'c3',
    customerName: 'Mahesh Verma',
    phone: '+91 97112 88491',
    creditLimit: 3000,
    currentDue: 2400,
    lastPaymentDate: '2026-10-05',
    status: 'NEAR_LIMIT',
    history: [
      { id: 'h6', date: '2026-10-02', type: 'PURCHASE', description: 'Toor Dal, Ghee 1L', amount: 1400 },
      { id: 'h7', date: '2026-10-14', type: 'PURCHASE', description: 'Household Cleaners', amount: 1000 },
    ],
  },
  {
    id: 'c4',
    customerName: 'Pooja Tiwari',
    phone: '+91 91234 56789',
    creditLimit: 6000,
    currentDue: 0,
    lastPaymentDate: '2026-10-22',
    status: 'CLEAR',
    history: [
      { id: 'h8', date: '2026-10-16', type: 'PURCHASE', description: 'Monthly Essentials', amount: 3200 },
      { id: 'h9', date: '2026-10-22', type: 'PAYMENT', description: 'Cash settlement in full', amount: 3200 },
    ],
  },
]

function getLocalAccounts() {
  try {
    const raw = localStorage.getItem(UDHAR_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(UDHAR_STORAGE_KEY, JSON.stringify(defaultUdharAccounts))
      return defaultUdharAccounts
    }
    return JSON.parse(raw)
  } catch {
    return defaultUdharAccounts
  }
}

function saveLocalAccounts(accounts) {
  try {
    localStorage.setItem(UDHAR_STORAGE_KEY, JSON.stringify(accounts))
  } catch (err) {
    console.error('Failed to save udhar accounts to local storage', err)
  }
}

/**
 * Fetch all customer Udhar Khata accounts
 */
export async function getUdharKhata() {
  try {
    const { data } = await api.get('/api/udhar')
    return data
  } catch {
    // Graceful fallback to client-managed ledger
    return getLocalAccounts()
  }
}

/**
 * Fetch Udhar summary stats (Total Pending Dues, Accounts count, Near Limit count)
 */
export async function getUdharSummary() {
  try {
    const { data } = await api.get('/api/udhar/summary')
    return data
  } catch {
    const accounts = getLocalAccounts()
    const totalPendingDue = accounts.reduce((sum, acc) => sum + (Number(acc.currentDue) || 0), 0)
    const accountsWithDues = accounts.filter((acc) => (Number(acc.currentDue) || 0) > 0).length
    const totalCreditLimit = accounts.reduce((sum, acc) => sum + (Number(acc.creditLimit) || 0), 0)
    return {
      totalPendingDue,
      accountsWithDues,
      totalAccounts: accounts.length,
      totalCreditLimit,
    }
  }
}

/**
 * Add a new customer Udhar account
 */
export async function addCustomerKhata(customerData) {
  try {
    const { data } = await api.post('/api/udhar/customers', customerData)
    return data
  } catch {
    const accounts = getLocalAccounts()
    const newAccount = {
      id: `c_${Date.now()}`,
      customerName: customerData.customerName,
      phone: customerData.phone || '',
      creditLimit: Number(customerData.creditLimit) || 3000,
      currentDue: Number(customerData.openingDue) || 0,
      lastPaymentDate: null,
      status: Number(customerData.openingDue) > 0 ? 'ACTIVE' : 'CLEAR',
      history: customerData.openingDue > 0
        ? [
            {
              id: `h_${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: 'PURCHASE',
              description: 'Opening balance / Previous due',
              amount: Number(customerData.openingDue),
            },
          ]
        : [],
    }
    const updated = [newAccount, ...accounts]
    saveLocalAccounts(updated)
    return newAccount
  }
}

/**
 * Record a new Udhar Purchase (Goods taken on credit)
 */
export async function recordUdharTransaction(customerId, { amount, description }) {
  try {
    const { data } = await api.post(`/api/udhar/customers/${customerId}/transactions`, { amount, description })
    return data
  } catch {
    const accounts = getLocalAccounts()
    const updated = accounts.map((acc) => {
      if (acc.id === customerId) {
        const nextDue = Number(acc.currentDue) + Number(amount)
        const nextStatus = nextDue >= acc.creditLimit ? 'EXCEEDED' : nextDue >= acc.creditLimit * 0.8 ? 'NEAR_LIMIT' : 'ACTIVE'
        return {
          ...acc,
          currentDue: nextDue,
          status: nextStatus,
          history: [
            {
              id: `h_${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: 'PURCHASE',
              description: description || 'Grocery Purchase on Credit',
              amount: Number(amount),
            },
            ...acc.history,
          ],
        }
      }
      return acc
    })
    saveLocalAccounts(updated)
    return updated.find((acc) => acc.id === customerId)
  }
}

/**
 * Record a Payment received (Jama / Credit settlement)
 */
export async function recordUdharPayment(customerId, { amount, paymentMethod, note }) {
  try {
    const { data } = await api.post(`/api/udhar/customers/${customerId}/payments`, { amount, paymentMethod, note })
    return data
  } catch {
    const accounts = getLocalAccounts()
    const updated = accounts.map((acc) => {
      if (acc.id === customerId) {
        const nextDue = Math.max(0, Number(acc.currentDue) - Number(amount))
        const nextStatus = nextDue === 0 ? 'CLEAR' : nextDue >= acc.creditLimit ? 'EXCEEDED' : 'ACTIVE'
        return {
          ...acc,
          currentDue: nextDue,
          lastPaymentDate: new Date().toISOString().split('T')[0],
          status: nextStatus,
          history: [
            {
              id: `h_${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: 'PAYMENT',
              description: `${paymentMethod || 'Cash'} payment: ${note || 'Payment Received'}`,
              amount: Number(amount),
            },
            ...acc.history,
          ],
        }
      }
      return acc
    })
    saveLocalAccounts(updated)
    return updated.find((acc) => acc.id === customerId)
  }
}
