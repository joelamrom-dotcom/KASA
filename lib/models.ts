import mongoose, { Schema } from 'mongoose'

// Payment Plan Schema
const PaymentPlanSchema = new Schema({
  name: { type: String, required: true },
  planNumber: { type: Number, required: true, unique: true },
  yearlyPrice: { type: Number, required: true },
  description: String,
}, { timestamps: true })

// Family Schema
const FamilySchema = new Schema({
  name: { type: String, required: true },
  hebrewName: String, // Required in frontend, optional in schema for backward compatibility
  weddingDate: { type: Date, required: true },
  husbandFirstName: String,
  husbandHebrewName: String, // Required in frontend, optional in schema for backward compatibility
  husbandFatherHebrewName: String, // Husband's father's Hebrew first name
  wifeFirstName: String,
  wifeHebrewName: String, // Required in frontend, optional in schema for backward compatibility
  wifeFatherHebrewName: String, // Wife's father's Hebrew first name
  husbandCellPhone: String,
  wifeCellPhone: String,
  address: String,
  street: String,
  phone: String,
  email: String,
  city: String,
  state: String,
  zip: String,
  currentPlan: { type: Number, default: 1 }, // Keep for backward compatibility
  paymentPlanId: { type: Schema.Types.ObjectId, ref: 'PaymentPlan' }, // Reference to PaymentPlan by ID
  currentPayment: { type: Number, default: 0 }, // Keep for backward compatibility
  openBalance: { type: Number, default: 0 }, // Deprecated - no longer used in UI, kept for backward compatibility
}, { timestamps: true })

// Family Member Schema
const FamilyMemberSchema = new Schema({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  firstName: { type: String, required: true },
  hebrewFirstName: String, // Required in frontend, optional in schema for backward compatibility
  lastName: { type: String, required: true },
  hebrewLastName: String, // Required in frontend, optional in schema for backward compatibility
  birthDate: Date,
  hebrewBirthDate: String,
  gender: String,
  barMitzvahDate: Date,
  batMitzvahDate: Date,
  weddingDate: Date,
  spouseName: String, // Keep for backward compatibility
  // Spouse information fields (for auto-conversion)
  spouseFirstName: String,
  spouseHebrewName: String,
  spouseFatherHebrewName: String,
  spouseCellPhone: String,
  phone: String, // Phone for the new family
  email: String, // Email for the new family
  address: String, // Address for the new family
  city: String, // City for the new family
  state: String, // State for the new family
  zip: String, // ZIP for the new family
  paymentPlan: Number, // Keep for backward compatibility
  paymentPlanId: { type: Schema.Types.ObjectId, ref: 'PaymentPlan' }, // Reference to PaymentPlan by ID
  paymentPlanAssigned: { type: Boolean, default: false },
  notes: String,
}, { timestamps: true })

// Payment Schema
const PaymentSchema = new Schema({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  memberId: { type: Schema.Types.ObjectId, ref: 'FamilyMember' }, // Optional: for member-specific payments
  amount: { type: Number, required: true },
  paymentDate: { type: Date, required: true },
  year: Number, // Year for calculation purposes
  type: String, // 'membership' | 'donation' | 'other'
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'credit_card', 'check', 'quick_pay'],
    default: 'cash'
  },
  // Credit Card Information
  ccInfo: {
    last4: String, // Last 4 digits of card
    cardType: String, // Visa, Mastercard, etc.
    expiryMonth: String,
    expiryYear: String,
    nameOnCard: String
  },
  // Check Information
  checkInfo: {
    checkNumber: String,
    bankName: String,
    routingNumber: String
  },
  // Stripe Integration
  stripePaymentIntentId: String, // Stripe payment intent ID for credit card payments
  savedPaymentMethodId: { type: Schema.Types.ObjectId, ref: 'SavedPaymentMethod' }, // Reference to saved payment method if used
  recurringPaymentId: { type: Schema.Types.ObjectId, ref: 'RecurringPayment' }, // Reference to recurring payment if part of subscription
  paymentFrequency: { type: String, enum: ['one-time', 'monthly'], default: 'one-time' }, // Payment frequency
  notes: String,
}, { timestamps: true })

// Withdrawal Schema
const WithdrawalSchema = new Schema({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  amount: { type: Number, required: true },
  withdrawalDate: { type: Date, required: true },
  reason: String,
  notes: String,
}, { timestamps: true })

// Lifecycle Event Schema (Event Types)
const LifecycleEventSchema = new Schema({
  type: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
}, { timestamps: true })

// Lifecycle Event Payment Schema
const LifecycleEventPaymentSchema = new Schema({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  memberId: { type: Schema.Types.ObjectId, ref: 'FamilyMember' },
  eventType: { type: String, required: true, lowercase: true },
  eventDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  notes: String,
  year: Number, // Year for calculation purposes
}, { timestamps: true })

// Yearly Calculation Schema
const YearlyCalculationSchema = new Schema({
  year: { type: Number, required: true, unique: true },
  // Plan-based counts
  plan1: { type: Number, default: 0 },
  plan2: { type: Number, default: 0 },
  plan3: { type: Number, default: 0 },
  plan4: { type: Number, default: 0 },
  plan1Name: { type: String },
  plan2Name: { type: String },
  plan3Name: { type: String },
  plan4Name: { type: String },
  incomePlan1: { type: Number, default: 0 },
  incomePlan2: { type: Number, default: 0 },
  incomePlan3: { type: Number, default: 0 },
  incomePlan4: { type: Number, default: 0 },
  totalPayments: { type: Number, default: 0 }, // All payments from the year
  planIncome: { type: Number, default: 0 }, // Income from payment plans only
  // Age group counts (backward compatibility)
  ageGroup0to4: { type: Number, default: 0 },
  ageGroup5to8: { type: Number, default: 0 },
  ageGroup9to16: { type: Number, default: 0 },
  ageGroup17plus: { type: Number, default: 0 },
  // Income calculations (backward compatibility)
  incomeAgeGroup0to4: { type: Number, default: 0 },
  incomeAgeGroup5to8: { type: Number, default: 0 },
  incomeAgeGroup9to16: { type: Number, default: 0 },
  incomeAgeGroup17plus: { type: Number, default: 0 },
  totalIncome: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  totalWithdrawals: { type: Number, default: 0 },
  netIncome: { type: Number, default: 0 },
}, { timestamps: true })

// Statement Schema
const StatementSchema = new Schema({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  memberId: { type: Schema.Types.ObjectId, ref: 'FamilyMember' }, // Optional: for member-specific statements
  statementNumber: { type: String, required: true },
  date: { type: Date, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  openingBalance: { type: Number, required: true },
  income: { type: Number, required: true },
  withdrawals: { type: Number, required: true },
  expenses: { type: Number, required: true },
  closingBalance: { type: Number, required: true },
}, { timestamps: true })

// Email Configuration Schema
const EmailConfigSchema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true }, // Encrypted or stored securely
  fromName: { type: String, default: 'Kasa Family Management' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

// Cycle Configuration Schema (Membership Year Configuration)
const CycleConfigSchema = new Schema({
  cycleStartMonth: { type: Number, required: true, min: 1, max: 12 }, // 1-12 (January-December)
  cycleStartDay: { type: Number, required: true, min: 1, max: 31 }, // Day of month
  description: { type: String, default: 'Membership cycle start date' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

// Saved Payment Method Schema (Cards on File)
const SavedPaymentMethodSchema = new Schema({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  stripePaymentMethodId: { type: String, required: true }, // Stripe payment method ID
  last4: { type: String, required: true }, // Last 4 digits
  cardType: { type: String, required: true }, // Visa, Mastercard, etc.
  expiryMonth: { type: Number, required: true },
  expiryYear: { type: Number, required: true },
  nameOnCard: String,
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

// Recurring Payment Schema
const RecurringPaymentSchema = new Schema({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  savedPaymentMethodId: { type: Schema.Types.ObjectId, ref: 'SavedPaymentMethod', required: true },
  amount: { type: Number, required: true },
  frequency: { type: String, enum: ['monthly'], default: 'monthly' },
  startDate: { type: Date, required: true },
  nextPaymentDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  notes: String,
}, { timestamps: true })

// Export models
export const PaymentPlan = mongoose.models.PaymentPlan || mongoose.model('PaymentPlan', PaymentPlanSchema)
export const Family = mongoose.models.Family || mongoose.model('Family', FamilySchema)
export const FamilyMember = mongoose.models.FamilyMember || mongoose.model('FamilyMember', FamilyMemberSchema)
export const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)
export const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', WithdrawalSchema)
export const LifecycleEvent = mongoose.models.LifecycleEvent || mongoose.model('LifecycleEvent', LifecycleEventSchema)
export const LifecycleEventPayment = mongoose.models.LifecycleEventPayment || mongoose.model('LifecycleEventPayment', LifecycleEventPaymentSchema)
export const YearlyCalculation = mongoose.models.YearlyCalculation || mongoose.model('YearlyCalculation', YearlyCalculationSchema)
export const Statement = mongoose.models.Statement || mongoose.model('Statement', StatementSchema)
export const EmailConfig = mongoose.models.EmailConfig || mongoose.model('EmailConfig', EmailConfigSchema)
export const CycleConfig = mongoose.models.CycleConfig || mongoose.model('CycleConfig', CycleConfigSchema)
export const SavedPaymentMethod = mongoose.models.SavedPaymentMethod || mongoose.model('SavedPaymentMethod', SavedPaymentMethodSchema)
export const RecurringPayment = mongoose.models.RecurringPayment || mongoose.model('RecurringPayment', RecurringPaymentSchema)
