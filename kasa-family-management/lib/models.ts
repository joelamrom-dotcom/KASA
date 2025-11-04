import mongoose, { Schema } from 'mongoose'
import connectDB from './database'

// Initialize connection
connectDB().catch(console.error)

// Payment Plan Schema
const PaymentPlanSchema = new Schema({
  name: { type: String, required: true },
  ageStart: { type: Number, required: true },
  ageEnd: { type: Number, default: null },
  yearlyPrice: { type: Number, required: true },
}, { timestamps: true })

// Lifecycle Event Schema
const LifecycleEventSchema = new Schema({
  type: { 
    type: String, 
    enum: ['chasena', 'bar_mitzvah', 'birth_boy', 'birth_girl'],
    required: true 
  },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
}, { timestamps: true })

// Family Schema
const FamilySchema = new Schema({
  name: { type: String, required: true },
  weddingDate: { type: Date, required: true },
  address: String,
  phone: String,
  email: String,
  city: String,
  state: String,
  zip: String,
  currentPlan: { type: Number, default: 1 },
  currentPayment: { type: Number, default: 0 },
  openBalance: { type: Number, default: 0 },
}, { timestamps: true })

// Family Member Schema
const FamilyMemberSchema = new Schema({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  birthDate: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female'] },
}, { timestamps: true })

// Payment Schema
const PaymentSchema = new Schema({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  amount: { type: Number, required: true },
  paymentDate: { type: Date, required: true },
  year: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['membership', 'donation', 'other'],
    default: 'membership'
  },
  notes: String,
}, { timestamps: true })

// Withdrawal Schema
const WithdrawalSchema = new Schema({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  amount: { type: Number, required: true },
  withdrawalDate: { type: Date, required: true },
  reason: { type: String, required: true },
  year: { type: Number, required: true },
}, { timestamps: true })

// Lifecycle Event Payment Schema
const LifecycleEventPaymentSchema = new Schema({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  eventType: { 
    type: String, 
    enum: ['chasena', 'bar_mitzvah', 'birth_boy', 'birth_girl'],
    required: true 
  },
  amount: { type: Number, required: true },
  eventDate: { type: Date, required: true },
  year: { type: Number, required: true },
  notes: String,
}, { timestamps: true })

// Yearly Calculation Schema
const YearlyCalculationSchema = new Schema({
  year: { type: Number, required: true, unique: true },
  // Age group counts
  ageGroup0to4: { type: Number, default: 0 },
  ageGroup5to8: { type: Number, default: 0 },
  ageGroup9to16: { type: Number, default: 0 },
  ageGroup17plus: { type: Number, default: 0 },
  // Income calculations
  incomeAgeGroup0to4: { type: Number, default: 0 },
  incomeAgeGroup5to8: { type: Number, default: 0 },
  incomeAgeGroup9to16: { type: Number, default: 0 },
  incomeAgeGroup17plus: { type: Number, default: 0 },
  totalIncome: { type: Number, default: 0 },
  extraDonation: { type: Number, default: 0 },
  calculatedIncome: { type: Number, default: 0 },
  // Expense calculations
  chasenaCount: { type: Number, default: 0 },
  chasenaAmount: { type: Number, default: 0 },
  barMitzvahCount: { type: Number, default: 0 },
  barMitzvahAmount: { type: Number, default: 0 },
  birthBoyCount: { type: Number, default: 0 },
  birthBoyAmount: { type: Number, default: 0 },
  birthGirlCount: { type: Number, default: 0 },
  birthGirlAmount: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  extraExpense: { type: Number, default: 0 },
  calculatedExpenses: { type: Number, default: 0 },
  // Balance
  balance: { type: Number, default: 0 },
}, { timestamps: true })

// Statement Schema
const StatementSchema = new Schema({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  statementNumber: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  openingBalance: { type: Number, default: 0 },
  income: { type: Number, default: 0 },
  withdrawals: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  closingBalance: { type: Number, default: 0 },
}, { timestamps: true })

// Export models
export const PaymentPlan = mongoose.models.PaymentPlan || mongoose.model('PaymentPlan', PaymentPlanSchema)
export const LifecycleEvent = mongoose.models.LifecycleEvent || mongoose.model('LifecycleEvent', LifecycleEventSchema)
export const Family = mongoose.models.Family || mongoose.model('Family', FamilySchema)
export const FamilyMember = mongoose.models.FamilyMember || mongoose.model('FamilyMember', FamilyMemberSchema)
export const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)
export const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', WithdrawalSchema)
export const LifecycleEventPayment = mongoose.models.LifecycleEventPayment || mongoose.model('LifecycleEventPayment', LifecycleEventPaymentSchema)
export const YearlyCalculation = mongoose.models.YearlyCalculation || mongoose.model('YearlyCalculation', YearlyCalculationSchema)
export const Statement = mongoose.models.Statement || mongoose.model('Statement', StatementSchema)

