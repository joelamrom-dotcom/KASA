// Payment Plan Types
export interface PaymentPlan {
  id: string
  name: string
  ageStart: number
  ageEnd: number | null // null means 17+
  yearlyPrice: number
  createdAt: Date
  updatedAt: Date
}

// Lifecycle Event Types
export interface LifecycleEvent {
  id: string
  type: 'chasena' | 'bar_mitzvah' | 'birth_boy' | 'birth_girl'
  name: string
  amount: number
  createdAt: Date
  updatedAt: Date
}

// Family Types
export interface Family {
  id: string
  name: string
  weddingDate: Date
  address?: string
  phone?: string
  email?: string
  city?: string
  state?: string
  zip?: string
  currentPlan: number // Payment plan ID (1-4)
  currentPayment: number
  openBalance: number
  createdAt: Date
  updatedAt: Date
}

// Family Member Types
export interface FamilyMember {
  id: string
  familyId: string
  firstName: string
  lastName: string
  birthDate: Date
  gender?: 'male' | 'female'
  createdAt: Date
  updatedAt: Date
}

// Payment Tracking
export interface Payment {
  id: string
  familyId: string
  amount: number
  paymentDate: Date
  year: number
  type: 'membership' | 'donation' | 'other'
  notes?: string
  createdAt: Date
}

// Withdrawal Types
export interface Withdrawal {
  id: string
  familyId: string
  amount: number
  withdrawalDate: Date
  reason: string
  year: number
  createdAt: Date
}

// Lifecycle Event Payment
export interface LifecycleEventPayment {
  id: string
  familyId: string
  eventType: 'chasena' | 'bar_mitzvah' | 'birth_boy' | 'birth_girl'
  amount: number
  eventDate: Date
  year: number
  notes?: string
  createdAt: Date
}

// Yearly Calculation Types
export interface YearlyCalculation {
  id: string
  year: number
  // Age group counts
  ageGroup0to4: number
  ageGroup5to8: number
  ageGroup9to16: number
  ageGroup17plus: number
  // Income calculations
  incomeAgeGroup0to4: number
  incomeAgeGroup5to8: number
  incomeAgeGroup9to16: number
  incomeAgeGroup17plus: number
  totalIncome: number
  extraDonation: number
  calculatedIncome: number
  // Expense calculations
  chasenaCount: number
  chasenaAmount: number
  barMitzvahCount: number
  barMitzvahAmount: number
  birthBoyCount: number
  birthBoyAmount: number
  birthGirlCount: number
  birthGirlAmount: number
  totalExpenses: number
  extraExpense: number
  calculatedExpenses: number
  // Balance
  balance: number
  createdAt: Date
  updatedAt: Date
}

// Statement Types
export interface Statement {
  id: string
  familyId: string
  statementNumber: string
  date: Date
  fromDate: Date
  toDate: Date
  openingBalance: number
  income: number
  withdrawals: number
  expenses: number
  closingBalance: number
  createdAt: Date
}

