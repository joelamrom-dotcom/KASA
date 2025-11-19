import mongoose, { Schema } from 'mongoose'

// Payment Plan Schema
const PaymentPlanSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Owner of this payment plan (optional for backward compatibility)
  name: { type: String, required: true },
  planNumber: { type: Number, required: true }, // Removed unique constraint - will be unique per user
  yearlyPrice: { type: Number, required: true },
  description: String,
}, { timestamps: true })

PaymentPlanSchema.index({ userId: 1, planNumber: 1 }, { unique: true, sparse: true }) // Unique planNumber per user

// Family Schema
const FamilySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Owner of this family data (optional for migration)
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
  parentFamilyId: { type: Schema.Types.ObjectId, ref: 'Family' }, // Reference to parent family (for families created from members)
  stripeCustomerId: String, // Stripe Customer ID for this family
}, { timestamps: true })

// Add index for userId for better query performance
FamilySchema.index({ userId: 1 })

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
  stripeCustomerId: String, // Stripe Customer ID (created when male turns 13)
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
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Owner of this event type (optional for backward compatibility)
  type: { type: String, required: true, lowercase: true }, // Removed unique constraint - will be unique per user
  name: { type: String, required: true },
  amount: { type: Number, required: true },
}, { timestamps: true })

LifecycleEventSchema.index({ userId: 1, type: 1 }, { unique: true, sparse: true }) // Unique type per user

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
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Owner of this email config (optional for backward compatibility)
  email: { type: String, required: true },
  password: { type: String, required: true }, // Encrypted or stored securely
  fromName: { type: String, default: 'Kasa Family Management' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

EmailConfigSchema.index({ userId: 1, isActive: 1 }) // Index for faster queries

// SMS Configuration Schema (Email-to-SMS)
const SmsConfigSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Owner of this SMS config
  defaultGateway: { type: String, default: 'txt.att.net' }, // Default carrier gateway if carrier unknown
  emailSubject: { type: String, default: 'SMS' }, // Subject line for email-to-SMS
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

SmsConfigSchema.index({ userId: 1, isActive: 1 }) // Index for faster queries

// Cycle Configuration Schema (Membership Year Configuration)
const CycleConfigSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Owner of this cycle config (optional for backward compatibility)
  cycleStartMonth: { type: Number, required: true, min: 1, max: 12 }, // 1-12 (January-December)
  cycleStartDay: { type: Number, required: true, min: 1, max: 31 }, // Day of month
  description: { type: String, default: 'Membership cycle start date' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

CycleConfigSchema.index({ userId: 1, isActive: 1 }) // Index for faster queries

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

// Task Schema
const TaskSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Owner of this task (optional for migration)
  title: { type: String, required: true },
  description: String,
  dueDate: { type: Date, required: true },
  email: { type: String, required: true }, // Email to notify on due date
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  relatedFamilyId: { type: Schema.Types.ObjectId, ref: 'Family' },
  relatedMemberId: { type: Schema.Types.ObjectId, ref: 'FamilyMember' },
  relatedPaymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
  emailSent: { type: Boolean, default: false }, // Track if email was sent
  completedAt: Date,
  notes: String,
}, { timestamps: true })

TaskSchema.index({ userId: 1 })

// Report Schema (for AI-generated reports from chat conversations)
const ReportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Owner of this report (optional for migration)
  title: { type: String, required: true },
  question: { type: String, required: true }, // The question asked
  answer: { type: String, required: true }, // The AI answer
  reportType: { 
    type: String, 
    enum: ['chat', 'analysis', 'financial', 'custom'], 
    default: 'chat' 
  },
  metadata: {
    provider: String, // AI provider used (if applicable)
    context: String, // Additional context used
  },
  tags: [String], // Tags for categorization
  notes: String, // Additional notes
}, { timestamps: true })

ReportSchema.index({ userId: 1 })

// User Schema (for authentication)
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: false }, // Hashed password (optional for OAuth users)
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'user', 'viewer', 'family'], 
    default: 'admin' 
  },
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: false }, // Link to family for family users
  phoneNumber: { type: String, required: false }, // Phone number for phone-based authentication
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  // Google OAuth fields
  googleId: { type: String, unique: true, sparse: true }, // Google user ID (sparse index allows multiple nulls)
  profilePicture: String, // Profile picture URL from Google
}, { timestamps: true })

// Add index for familyId for better query performance
UserSchema.index({ familyId: 1 })

// Family Note Schema
const FamilyNoteSchema = new Schema({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  note: { type: String, required: true },
  checked: { type: Boolean, default: false }, // Mark as reviewed/checked
  checkedAt: Date, // When it was checked
  checkedBy: String, // Who checked it (user email or name)
}, { timestamps: true })

// Recycle Bin Schema
const RecycleBinSchema = new Schema({
  recordType: { 
    type: String, 
    required: true,
    enum: ['family', 'member', 'payment', 'withdrawal', 'lifecycleEvent', 'note', 'task', 'statement', 'paymentPlan', 'savedPaymentMethod', 'recurringPayment']
  },
  originalId: { type: String, required: true }, // Original record ID
  recordData: { type: Schema.Types.Mixed, required: true }, // Full record data as JSON
  deletedBy: String, // User who deleted it (optional)
  deletedAt: { type: Date, default: Date.now },
  restoredAt: Date, // When it was restored (if restored)
  restoredBy: String, // Who restored it
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
// Stripe Configuration Schema (User's Stripe Connect Account)
const StripeConfigSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, // One Stripe account per user
  stripeAccountId: { type: String, required: true }, // Stripe Connect account ID
  accessToken: { type: String }, // OAuth access token (optional - not needed for Standard Connect accounts)
  refreshToken: { type: String }, // OAuth refresh token (optional - not needed for Standard Connect accounts)
  stripePublishableKey: { type: String }, // Account's publishable key
  accountEmail: { type: String }, // Account email from Stripe
  accountName: { type: String }, // Account name/display name
  isActive: { type: Boolean, default: true },
  connectedAt: { type: Date, default: Date.now },
  lastSyncedAt: { type: Date },
}, { timestamps: true })

StripeConfigSchema.index({ userId: 1 }, { unique: true })

// Automation Settings Schema (User-specific automation controls)
const AutomationSettingsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  // Monthly Recurring Payments
  enableMonthlyPayments: { type: Boolean, default: true },
  monthlyPaymentsSchedule: { type: String, default: '0 2 * * *' }, // Daily at 2 AM
  
  // Monthly Statement Generation
  enableStatementGeneration: { type: Boolean, default: true },
  statementGenerationSchedule: { type: String, default: '0 2 1 * *' }, // 1st of month at 2 AM
  
  // Monthly Statement Email Sending
  enableStatementEmails: { type: Boolean, default: true },
  statementEmailsSchedule: { type: String, default: '0 3 1 * *' }, // 1st of month at 3 AM
  
  // Wedding Date Conversion
  enableWeddingConversion: { type: Boolean, default: true },
  weddingConversionSchedule: { type: String, default: '0 1 * * *' }, // Daily at 1 AM
  
  // Task Due Date Emails
  enableTaskEmails: { type: Boolean, default: true },
  taskEmailsSchedule: { type: String, default: '0 9 * * *' }, // Daily at 9 AM
  
  // Email Notifications
  enableFamilyWelcomeEmails: { type: Boolean, default: true },
  enablePaymentEmails: { type: Boolean, default: true },
  
  // SMS Notifications
  enableFamilyWelcomeSMS: { type: Boolean, default: false },
  enablePaymentSMS: { type: Boolean, default: false },
  
  // Payment Reminders
  enablePaymentReminders: { type: Boolean, default: false },
  reminderDaysBefore: { type: [Number], default: [3, 1] }, // Send reminders 3 days and 1 day before payment
  
  isActive: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true })

AutomationSettingsSchema.index({ userId: 1 }, { unique: true })

export const EmailConfig = mongoose.models.EmailConfig || mongoose.model('EmailConfig', EmailConfigSchema)
export const SmsConfig = mongoose.models.SmsConfig || mongoose.model('SmsConfig', SmsConfigSchema)
export const CycleConfig = mongoose.models.CycleConfig || mongoose.model('CycleConfig', CycleConfigSchema)
export const StripeConfig = mongoose.models.StripeConfig || mongoose.model('StripeConfig', StripeConfigSchema)
export const AutomationSettings = mongoose.models.AutomationSettings || mongoose.model('AutomationSettings', AutomationSettingsSchema)
export const SavedPaymentMethod = mongoose.models.SavedPaymentMethod || mongoose.model('SavedPaymentMethod', SavedPaymentMethodSchema)
export const RecurringPayment = mongoose.models.RecurringPayment || mongoose.model('RecurringPayment', RecurringPaymentSchema)
export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema)
export const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema)
export const User = mongoose.models.User || mongoose.model('User', UserSchema)
export const FamilyNote = mongoose.models.FamilyNote || mongoose.model('FamilyNote', FamilyNoteSchema)
export const RecycleBin = mongoose.models.RecycleBin || mongoose.model('RecycleBin', RecycleBinSchema)
