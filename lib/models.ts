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

// Family Tag Schema
const FamilyTagSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  color: { type: String, default: '#3b82f6' }, // Tag color for UI
  description: String,
}, { timestamps: true })

FamilyTagSchema.index({ userId: 1, name: 1 }, { unique: true })

// Family Group Schema
const FamilyGroupSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  color: { type: String, default: '#3b82f6' }, // Group color for UI
  families: [{ type: Schema.Types.ObjectId, ref: 'Family' }],
}, { timestamps: true })

FamilyGroupSchema.index({ userId: 1, name: 1 })

// Family Relationship Schema
const FamilyRelationshipSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  familyId1: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  familyId2: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  relationshipType: {
    type: String,
    enum: ['related', 'merged', 'split', 'parent_child', 'sibling', 'custom'],
    required: true
  },
  customType: String, // For 'custom' relationship type
  notes: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

FamilyRelationshipSchema.index({ userId: 1, familyId1: 1, familyId2: 1 })
FamilyRelationshipSchema.index({ userId: 1, relationshipType: 1 })

// Payment Link Schema
const PaymentLinkSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  linkId: { type: String, required: true, unique: true }, // Unique identifier for the link
  amount: Number, // Optional: fixed amount, if null, user can enter amount
  description: String,
  paymentPlan: {
    enabled: { type: Boolean, default: false },
    installments: Number, // Number of installments
    frequency: { type: String, enum: ['weekly', 'biweekly', 'monthly', 'quarterly'], default: 'monthly' },
    startDate: Date,
  },
  expiresAt: Date, // Optional expiration date
  maxUses: Number, // Optional: maximum number of times link can be used
  currentUses: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  metadata: Schema.Types.Mixed, // Additional data
}, { timestamps: true })

PaymentLinkSchema.index({ linkId: 1 }, { unique: true })
PaymentLinkSchema.index({ userId: 1, familyId: 1 })
PaymentLinkSchema.index({ userId: 1, isActive: 1 })

// Payment Analytics Schema
const PaymentAnalyticsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  totalPayments: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  successfulPayments: { type: Number, default: 0 },
  failedPayments: { type: Number, default: 0 },
  paymentMethods: {
    cash: { count: Number, amount: Number },
    credit_card: { count: Number, amount: Number },
    check: { count: Number, amount: Number },
    quick_pay: { count: Number, amount: Number },
    ach: { count: Number, amount: Number },
  },
  averageAmount: Number,
  conversionRate: Number, // For payment links
}, { timestamps: true })

PaymentAnalyticsSchema.index({ userId: 1, date: 1 })

// Backup Schema
const BackupSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  backupType: {
    type: String,
    enum: ['full', 'families', 'payments', 'members', 'events', 'custom'],
    required: true
  },
  filename: { type: String, required: true },
  fileSize: Number, // Size in bytes
  recordCount: Number, // Number of records backed up
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  error: String,
  metadata: Schema.Types.Mixed,
}, { timestamps: true })

BackupSchema.index({ userId: 1, createdAt: -1 })
BackupSchema.index({ userId: 1, status: 1 })

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
  // Communication Preferences
  receiveEmails: { type: Boolean, default: true }, // Opt-in for email notifications
  receiveSMS: { type: Boolean, default: true }, // Opt-in for SMS notifications
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
  // Communication Preferences
  receiveEmails: { type: Boolean, default: true }, // Opt-in for email notifications
  receiveSMS: { type: Boolean, default: true }, // Opt-in for SMS notifications
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
  // Payment Link
  paymentLinkId: { type: Schema.Types.ObjectId, ref: 'PaymentLink' }, // Reference to payment link if paid via link
  // ACH/Wire Transfer Info
  achInfo: {
    accountType: String, // 'checking' | 'savings'
    last4: String, // Last 4 digits of account
    bankName: String,
    routingNumber: String,
  },
  wireTransferInfo: {
    bankName: String,
    accountNumber: String,
    routingNumber: String,
    swiftCode: String,
  },
  notes: String,
  // Refund tracking
  refundedAmount: { type: Number, default: 0 }, // Total amount refunded
  isFullyRefunded: { type: Boolean, default: false }, // Whether payment is fully refunded
  isPartiallyRefunded: { type: Boolean, default: false }, // Whether payment is partially refunded
}, { timestamps: true })

// Refund Schema (Track refund history)
const RefundSchema = new Schema({
  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  amount: { type: Number, required: true }, // Refund amount
  refundDate: { type: Date, required: true },
  reason: { 
    type: String, 
    enum: ['duplicate', 'fraudulent', 'requested_by_customer', 'cancelled', 'error', 'other'],
    default: 'requested_by_customer'
  },
  notes: String, // Additional notes about the refund
  refundedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Admin who processed the refund
  refundedByEmail: String, // Email of admin who processed refund
  // Stripe Integration
  stripeRefundId: String, // Stripe refund ID
  stripeChargeId: String, // Stripe charge ID (from payment intent)
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'canceled'],
    default: 'pending'
  },
  failureReason: String, // If refund failed, reason for failure
}, { timestamps: true })

RefundSchema.index({ paymentId: 1 })
RefundSchema.index({ familyId: 1 })
RefundSchema.index({ refundDate: -1 })

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

// Invoice/Receipt Template Configuration Schema
const InvoiceTemplateSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Owner of this template (optional for backward compatibility)
  templateType: { 
    type: String, 
    enum: ['invoice', 'receipt'], 
    required: true 
  },
  templateName: { type: String, default: 'Default' },
  // Header customization
  headerLogo: String, // URL or base64 image
  headerText: { type: String, default: 'KASA' },
  headerSubtext: { type: String, default: 'Family Management' },
  headerColor: { type: String, default: '#333333' },
  // Body customization
  primaryColor: { type: String, default: '#333333' },
  secondaryColor: { type: String, default: '#666666' },
  fontFamily: { type: String, default: 'Arial, sans-serif' },
  // Footer customization
  footerText: { type: String, default: 'Thank you for your business!' },
  footerSubtext: { type: String, default: 'Kasa Family Management' },
  // Custom CSS
  customCSS: String,
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true })

InvoiceTemplateSchema.index({ userId: 1, templateType: 1, isActive: 1 })
InvoiceTemplateSchema.index({ userId: 1, templateType: 1, isDefault: 1 })

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
  // Overdue tracking
  isOverdue: { type: Boolean, default: false },
  daysOverdue: { type: Number, default: 0 },
  lastReminderSent: { type: Date }, // Last time an overdue reminder was sent
  reminderLevel: { type: Number, default: 0 }, // 0 = none, 1 = 7 days, 2 = 14 days, 3 = 30 days
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

// Custom Report Template Schema
const CustomReportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  // Report configuration
  fields: [{
    fieldName: { type: String, required: true }, // e.g., 'family.name', 'payment.amount'
    label: { type: String, required: true }, // Display label
    dataType: { type: String, enum: ['string', 'number', 'date', 'currency', 'boolean', 'calculated'], default: 'string' },
    aggregate: { type: String, enum: ['sum', 'avg', 'count', 'min', 'max', 'none'], default: 'none' },
    groupBy: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    format: String, // Custom format (e.g., date format, number format)
    formula: String, // For calculated fields
    conditionalFormatting: [{
      condition: { type: String, enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'between'], required: true },
      value: Schema.Types.Mixed,
      value2: Schema.Types.Mixed, // For 'between'
      backgroundColor: String,
      textColor: String,
      fontWeight: String,
    }],
  }],
  // Filters
  filters: [{
    fieldName: { type: String, required: true },
    operator: { type: String, enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'between', 'in', 'not_in'], required: true },
    value: Schema.Types.Mixed,
    value2: Schema.Types.Mixed, // For 'between' operator
  }],
  // Cross-filters (filters that apply to related data)
  crossFilters: [{
    relatedObject: { type: String, required: true }, // e.g., 'Family', 'Payment'
    filters: [{
      fieldName: { type: String, required: true },
      operator: { type: String, enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'between', 'in', 'not_in'], required: true },
      value: Schema.Types.Mixed,
      value2: Schema.Types.Mixed,
    }],
  }],
  // Field-to-field filters (compare one field to another)
  fieldToFieldFilters: [{
    fieldName1: { type: String, required: true },
    operator: { type: String, enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal'], required: true },
    fieldName2: { type: String, required: true },
  }],
  // Report parameters/prompts
  parameters: [{
    name: { type: String, required: true },
    label: { type: String, required: true },
    dataType: { type: String, enum: ['string', 'number', 'date', 'boolean', 'picklist'], required: true },
    defaultValue: Schema.Types.Mixed,
    required: { type: Boolean, default: false },
    picklistValues: [String], // For picklist type
    promptText: String, // Text shown when prompting user
  }],
  // Row-level security
  rowLevelSecurity: {
    enabled: { type: Boolean, default: false },
    rules: [{
      fieldName: { type: String, required: true },
      operator: { type: String, enum: ['equals', 'in', 'not_in'], required: true },
      value: Schema.Types.Mixed, // Can be user field like 'userId', 'role', etc.
    }],
  },
  // Date range configuration
  dateRange: {
    type: { type: String, enum: ['custom', 'this_month', 'last_month', 'this_year', 'last_year', 'last_30_days', 'last_90_days', 'last_365_days', 'this_quarter', 'last_quarter', 'this_fiscal_year', 'last_fiscal_year', 'ytd', 'mtd', 'qtd'], default: 'custom' },
    startDate: Date,
    endDate: Date,
  },
  // Grouping and sorting
  groupBy: [String], // Fields to group by
  sortBy: { type: String, default: 'date' },
  sortOrder: { type: String, enum: ['asc', 'desc'], default: 'desc' },
  // Comparison settings
  comparison: {
    enabled: { type: Boolean, default: false },
    type: { type: String, enum: ['year_over_year', 'period_over_period', 'custom'], default: 'year_over_year' },
    compareToStartDate: Date,
    compareToEndDate: Date,
  },
  // Export settings
  exportSettings: {
    includeSummary: { type: Boolean, default: true },
    includeCharts: { type: Boolean, default: true },
    pageOrientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
    pageSize: { type: String, enum: ['letter', 'a4', 'legal'], default: 'letter' },
  },
  // Report caching
  cache: {
    enabled: { type: Boolean, default: false },
    ttl: { type: Number, default: 3600 }, // Time to live in seconds
    lastCached: Date,
    cachedData: Schema.Types.Mixed,
  },
  // Report analytics
  analytics: {
    viewCount: { type: Number, default: 0 },
    lastViewed: Date,
    lastViewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    exportCount: { type: Number, default: 0 },
    scheduleCount: { type: Number, default: 0 },
  },
  // Report history (for versioning)
  reportHistory: [{
    version: { type: Number, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    changes: String, // Description of changes
    snapshot: Schema.Types.Mixed, // Full report configuration at this version
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

CustomReportSchema.index({ userId: 1, isActive: 1 })

// Scheduled Report Schema
const ScheduledReportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportId: { type: Schema.Types.ObjectId, ref: 'CustomReport', required: true },
  name: { type: String, required: true },
  // Schedule configuration
  schedule: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], required: true },
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday, for weekly
    dayOfMonth: { type: Number, min: 1, max: 31 }, // For monthly
    time: { type: String, default: '09:00' }, // HH:mm format
    timezone: { type: String, default: 'America/New_York' },
  },
  // Recipients
  recipients: [{
    email: { type: String, required: true },
    name: String,
  }],
  // Export format
  exportFormat: { type: String, enum: ['pdf', 'excel', 'csv'], default: 'pdf' },
  // Status
  isActive: { type: Boolean, default: true },
  lastRun: Date,
  nextRun: Date,
  runCount: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 },
  lastError: String,
}, { timestamps: true })

ScheduledReportSchema.index({ userId: 1, isActive: 1 })
ScheduledReportSchema.index({ nextRun: 1, isActive: 1 })

// Report Snapshot Schema (for capturing report data at specific points in time)
const ReportSnapshotSchema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'CustomReport', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  snapshotDate: { type: Date, default: Date.now },
  data: Schema.Types.Mixed, // The actual report data at this point in time
  summary: Schema.Types.Mixed, // Summary statistics
  metadata: {
    recordCount: Number,
    totalAmount: Number,
    averageAmount: Number,
    dateRange: {
      startDate: Date,
      endDate: Date,
    },
  },
  tags: [String],
}, { timestamps: true })

ReportSnapshotSchema.index({ reportId: 1, snapshotDate: -1 })
ReportSnapshotSchema.index({ userId: 1 })

// Dashboard Schema (combining multiple reports into a single view)
const DashboardSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  layout: {
    type: { type: String, enum: ['grid', 'custom'], default: 'grid' },
    columns: { type: Number, default: 2 },
    rows: { type: Number, default: 2 },
  },
  components: [{
    reportId: { type: Schema.Types.ObjectId, ref: 'CustomReport' },
    snapshotId: { type: Schema.Types.ObjectId, ref: 'ReportSnapshot' }, // Optional: use snapshot instead of live report
    title: String,
    chartType: { type: String, enum: ['table', 'bar', 'line', 'pie', 'donut', 'area', 'funnel', 'gauge', 'scatter', 'heatmap'], default: 'table' },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      width: { type: Number, default: 1 },
      height: { type: Number, default: 1 },
    },
    filters: Schema.Types.Mixed, // Override filters for this component
    refreshInterval: Number, // Auto-refresh interval in seconds (0 = no auto-refresh)
  }],
  isPublic: { type: Boolean, default: false },
  sharedWith: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  tags: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

DashboardSchema.index({ userId: 1, isActive: 1 })
DashboardSchema.index({ isPublic: 1 })

// Report Version Schema (for tracking report definition changes)
const ReportVersionSchema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'CustomReport', required: true },
  version: { type: Number, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  description: String, // What changed in this version
  reportDefinition: Schema.Types.Mixed, // Full report configuration at this version
  isCurrent: { type: Boolean, default: false }, // Is this the current version
}, { timestamps: true })

ReportVersionSchema.index({ reportId: 1, version: -1 })
ReportVersionSchema.index({ reportId: 1, isCurrent: 1 })

// Report Dependency Schema (tracks data source dependencies)
const ReportDependencySchema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'CustomReport', required: true },
  // Data source dependencies
  dataSources: [{
    sourceType: { type: String, enum: ['model', 'field', 'calculated', 'external'], required: true },
    sourceName: { type: String, required: true }, // e.g., 'Payment', 'Family', 'payment.amount'
    sourcePath: String, // Full path to the data source
    isRequired: { type: Boolean, default: true },
    lastVerified: Date,
  }],
  // Report dependencies (this report depends on other reports)
  dependsOnReports: [{ type: Schema.Types.ObjectId, ref: 'CustomReport' }],
  // Reports that depend on this report
  dependentReports: [{ type: Schema.Types.ObjectId, ref: 'CustomReport' }],
  // Impact analysis metadata
  impactAnalysis: {
    lastAnalyzed: Date,
    affectedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    estimatedImpact: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    changeHistory: [{
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      changeType: { type: String, enum: ['field_added', 'field_removed', 'filter_changed', 'data_source_changed'] },
      description: String,
    }],
  },
}, { timestamps: true })

ReportDependencySchema.index({ reportId: 1 })
ReportDependencySchema.index({ 'dataSources.sourceName': 1 })

// Report Share Schema (granular sharing and permissions)
const ReportShareSchema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'CustomReport', required: true },
  sharedWith: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sharedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // Granular permissions
  permissions: {
    view: { type: Boolean, default: true },
    edit: { type: Boolean, default: false },
    share: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    export: { type: Boolean, default: true },
    schedule: { type: Boolean, default: false },
    comment: { type: Boolean, default: true },
  },
  // Share type
  shareType: {
    type: String,
    enum: ['user', 'role', 'public', 'link'],
    default: 'user',
  },
  // For role-based sharing
  roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
  // For link-based sharing
  shareLink: {
    token: String,
    expiresAt: Date,
    password: String, // Hashed password
    accessCount: { type: Number, default: 0 },
    maxAccessCount: Number, // Limit number of accesses
  },
  // Restrictions
  restrictions: {
    ipWhitelist: [String],
    allowedDomains: [String],
    requireAuth: { type: Boolean, default: true },
  },
  // Status
  isActive: { type: Boolean, default: true },
  revokedAt: Date,
  revokedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

ReportShareSchema.index({ reportId: 1, sharedWith: 1 })
ReportShareSchema.index({ reportId: 1, shareType: 1 })
ReportShareSchema.index({ 'shareLink.token': 1 }, { unique: true, sparse: true })

// Report Drill-Down Configuration Schema
const ReportDrillDownSchema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'CustomReport', required: true },
  // Drill-down configurations
  configurations: [{
    sourceField: { type: String, required: true }, // Field to click on
    targetReport: { type: Schema.Types.ObjectId, ref: 'CustomReport' }, // Report to navigate to
    targetView: { type: String, enum: ['detail', 'list', 'custom'], default: 'detail' },
    // Field mappings (source field -> target filter)
    fieldMappings: [{
      sourceField: { type: String, required: true },
      targetField: { type: String, required: true },
      mappingType: { type: String, enum: ['equals', 'contains', 'filter'], default: 'equals' },
    }],
    // Custom drill-down query
    customQuery: Schema.Types.Mixed,
    // Display options
    displayOptions: {
      title: String,
      showBreadcrumb: { type: Boolean, default: true },
      showBackButton: { type: Boolean, default: true },
      maxRecords: { type: Number, default: 100 },
    },
  }],
  // Default drill-down behavior
  defaultBehavior: {
    enabled: { type: Boolean, default: true },
    showRelatedRecords: { type: Boolean, default: true },
    showDetails: { type: Boolean, default: true },
  },
}, { timestamps: true })

ReportDrillDownSchema.index({ reportId: 1 })

// Report Template Schema (Pre-built report templates)
const ReportTemplateSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['financial', 'sales', 'operations', 'custom'], default: 'custom' },
  icon: String, // Icon name or URL
  reportDefinition: Schema.Types.Mixed, // Full report configuration
  isPublic: { type: Boolean, default: false }, // Can be used by all users
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  usageCount: { type: Number, default: 0 },
  tags: [String],
}, { timestamps: true })

ReportTemplateSchema.index({ category: 1, isPublic: 1 })

// Report Comment/Annotation Schema
const ReportCommentSchema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'CustomReport', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: String, required: true },
  // For cell-level comments
  cellReference: {
    rowIndex: Number,
    fieldName: String,
  },
  // For general report comments
  isGeneral: { type: Boolean, default: false },
  // Threading support
  parentCommentId: { type: Schema.Types.ObjectId, ref: 'ReportComment' },
  mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  resolved: { type: Boolean, default: false },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
}, { timestamps: true })

ReportCommentSchema.index({ reportId: 1, createdAt: -1 })
ReportCommentSchema.index({ userId: 1 })

// Report Bookmark Schema
const ReportBookmarkSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportId: { type: Schema.Types.ObjectId, ref: 'CustomReport', required: true },
  name: String, // Custom bookmark name
  filters: Schema.Types.Mixed, // Saved filter state
  dateRange: Schema.Types.Mixed, // Saved date range
  viewSettings: Schema.Types.Mixed, // Column visibility, sorting, etc.
  notes: String,
  tags: [String],
}, { timestamps: true })

ReportBookmarkSchema.index({ userId: 1, reportId: 1 }, { unique: true })

// Report Alert Schema
const ReportAlertSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportId: { type: Schema.Types.ObjectId, ref: 'CustomReport', required: true },
  name: { type: String, required: true },
  description: String,
  // Alert conditions
  conditions: [{
    fieldName: { type: String, required: true },
    operator: { type: String, enum: ['greater_than', 'less_than', 'equals', 'not_equals', 'contains', 'between'], required: true },
    value: Schema.Types.Mixed,
    value2: Schema.Types.Mixed, // For 'between'
    aggregate: { type: String, enum: ['sum', 'avg', 'count', 'min', 'max'], default: 'sum' },
  }],
  // Alert frequency
  frequency: {
    type: { type: String, enum: ['realtime', 'daily', 'weekly', 'monthly'], default: 'daily' },
    time: String, // HH:mm format
    dayOfWeek: Number, // 0-6 for weekly
    dayOfMonth: Number, // 1-31 for monthly
  },
  // Notification settings
  notificationType: {
    type: String,
    enum: ['email', 'in_app', 'both'],
    default: 'email',
  },
  recipients: [{
    email: { type: String, required: true },
    name: String,
  }],
  // Status
  isActive: { type: Boolean, default: true },
  lastTriggered: Date,
  triggerCount: { type: Number, default: 0 },
  lastError: String,
}, { timestamps: true })

ReportAlertSchema.index({ userId: 1, isActive: 1 })
ReportAlertSchema.index({ reportId: 1, isActive: 1 })

// Permission Schema (Granular permissions)
const PermissionSchema = new Schema({
  name: { type: String, required: true, unique: true }, // e.g., 'families.view', 'payments.create'
  displayName: { type: String, required: true }, // e.g., 'View Families', 'Create Payments'
  module: { 
    type: String, 
    required: true,
    enum: ['families', 'members', 'payments', 'lifecycle_events', 'statements', 'reports', 'users', 'roles', 'settings', 'documents', 'tasks', 'calendar', 'communication', 'analytics']
  },
  action: { 
    type: String, 
    required: true,
    enum: ['view', 'create', 'update', 'delete', 'export', 'import', 'manage']
  },
  description: String,
}, { timestamps: true })

PermissionSchema.index({ module: 1, action: 1 })

// Role Schema (Custom roles with permissions)
const RoleSchema = new Schema({
  name: { type: String, required: true, unique: true }, // e.g., 'accountant', 'manager'
  displayName: { type: String, required: true }, // e.g., 'Accountant', 'Manager'
  description: String,
  isSystem: { type: Boolean, default: false }, // System roles cannot be deleted
  isDefault: { type: Boolean, default: false }, // Default role for new users
  permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }], // Array of permission IDs
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

RoleSchema.index({ name: 1 })
RoleSchema.index({ isSystem: 1 })

// Session Schema (Session management)
const SessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true }, // JWT token or session token
  ipAddress: { type: String },
  userAgent: { type: String },
  deviceInfo: { type: Schema.Types.Mixed }, // Device type, OS, browser
  location: { type: Schema.Types.Mixed }, // Geographic location if available
  isActive: { type: Boolean, default: true },
  lastActivity: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  revokedAt: Date, // When session was manually revoked
  revokedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Who revoked the session
}, { timestamps: true })

SessionSchema.index({ userId: 1, isActive: 1 })
SessionSchema.index({ token: 1 })
SessionSchema.index({ expiresAt: 1 })

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
  customRoleId: { type: Schema.Types.ObjectId, ref: 'Role' }, // Custom role (overrides default role permissions)
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: false }, // Link to family for family users
  phoneNumber: { type: String, required: false }, // Phone number for phone-based authentication
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  // Two-Factor Authentication (2FA)
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String, // TOTP secret key
  twoFactorBackupCodes: [String], // Backup codes for 2FA
  twoFactorVerified: { type: Boolean, default: false }, // Whether 2FA setup is verified
  // Google OAuth fields
  googleId: { type: String, unique: true, sparse: true }, // Google user ID (sparse index allows multiple nulls)
  profilePicture: String, // Profile picture URL from Google
  // Push Notifications
  pushSubscription: Schema.Types.Mixed, // Push subscription object
  pushEnabled: { type: Boolean, default: false }, // Whether push notifications are enabled
  // Team management
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Who invited this user
  invitationToken: String, // Token for accepting invitation
  invitationExpires: Date,
  // IP Whitelist
  allowedIPs: [String], // Array of allowed IP addresses (empty = all IPs allowed)
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

// Notification Schema (In-app notifications)
const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error'], 
    default: 'info' 
  },
  read: { type: Boolean, default: false },
  readAt: Date,
  url: String, // Optional URL to navigate to when clicked
}, { timestamps: true })

NotificationSchema.index({ userId: 1, read: 1 })
NotificationSchema.index({ userId: 1, createdAt: -1 })

// Export models
export const PaymentPlan = mongoose.models.PaymentPlan || mongoose.model('PaymentPlan', PaymentPlanSchema)
export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema)
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

// Automation Rule Schema (Visual workflow builder rules)
const AutomationRuleSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  isActive: { type: Boolean, default: true },
  
  // Trigger: When should this rule run?
  trigger: {
    type: {
      type: String,
      required: true,
      enum: [
        'payment_received',
        'payment_failed',
        'payment_overdue',
        'payment_plan_changed',
        'member_added',
        'member_updated',
        'member_deleted',
        'member_age_changed',
        'member_birthday',
        'family_created',
        'family_updated',
        'family_deleted',
        'family_balance_changed',
        'lifecycle_event_created',
        'lifecycle_event_updated',
        'withdrawal_created',
        'recurring_payment_created',
        'recurring_payment_processed',
        'recurring_payment_failed',
        'task_created',
        'task_updated',
        'task_completed',
        'task_due',
        'statement_generated',
        'statement_sent',
        'invoice_generated',
        'document_uploaded',
        'note_added',
        'reminder_sent',
        'balance_threshold',
        'scheduled', // Run on a schedule
      ],
    },
    // Trigger-specific configuration
    config: {
      // For scheduled triggers
      schedule: String, // Cron expression
      // For balance_threshold
      threshold: Number,
      operator: { type: String, enum: ['greater_than', 'less_than', 'equals'] },
      // For member_age_changed
      targetAge: Number,
      // For payment_overdue
      daysOverdue: Number,
    },
  },
  
  // Conditions: When should actions execute? (optional - if empty, always execute)
  conditions: [{
    field: { type: String, required: true }, // e.g., 'family.balance', 'member.age', 'payment.amount'
    operator: {
      type: String,
      required: true,
      enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
    },
    value: Schema.Types.Mixed, // Can be string, number, boolean, etc.
    logicalOperator: { type: String, enum: ['AND', 'OR'], default: 'AND' }, // How to combine with next condition
  }],
  
  // Actions: What should happen when trigger fires and conditions match?
  actions: [{
    type: {
      type: String,
      required: true,
      enum: [
        'send_email',
        'send_sms',
        'send_push_notification',
        'create_task',
        'update_task',
        'create_notification',
        'update_payment_plan',
        'update_recurring_payment',
        'create_lifecycle_event',
        'update_lifecycle_event',
        'create_withdrawal',
        'update_family',
        'update_member',
        'add_family_note',
        'add_family_tag',
        'remove_family_tag',
        'generate_statement',
        'send_statement',
        'generate_invoice',
        'send_invoice',
        'create_payment_link',
        'create_document',
        'update_family_balance',
        'archive_family',
        'restore_family',
        'create_audit_log',
        'export_data',
        'webhook', // Call external webhook
      ],
    },
    config: {
      // For send_email
      emailTemplate: String,
      to: String, // 'family', 'admin', or specific email
      subject: String,
      body: String,
      
      // For send_sms
      smsTemplate: String,
      phoneNumber: String, // 'family', 'admin', or specific number
      message: String,
      
      // For create_task
      taskTitle: String,
      taskDescription: String,
      taskDueDate: String, // Relative date like '+7 days' or absolute
      taskPriority: { type: String, enum: ['low', 'medium', 'high', 'urgent'] },
      taskAssignee: String, // 'admin', 'family', or user ID
      
      // For create_notification
      notificationMessage: String,
      notificationType: { type: String, enum: ['info', 'success', 'warning', 'error'] },
      
      // For update_payment_plan
      paymentPlanId: Schema.Types.ObjectId,
      paymentPlanNumber: Number,
      
      // For create_lifecycle_event
      eventType: String,
      eventAmount: Number,
      eventDate: String, // Relative or absolute
      
      // For update_family / update_member
      updates: Schema.Types.Mixed, // Object with fields to update
      
      // For webhook
      webhookUrl: String,
      webhookMethod: { type: String, enum: ['GET', 'POST', 'PUT'], default: 'POST' },
      webhookHeaders: Schema.Types.Mixed,
      webhookBody: Schema.Types.Mixed,
    },
    order: { type: Number, default: 0 }, // Execution order
  }],
  
  // Execution tracking
  executionCount: { type: Number, default: 0 },
  lastExecutedAt: Date,
  lastExecutionResult: {
    success: Boolean,
    message: String,
    executedActions: Number,
    failedActions: Number,
  },
  
  // Error handling
  onError: {
    type: String,
    enum: ['stop', 'continue', 'notify'],
    default: 'notify',
  },
  
  // Rate limiting
  maxExecutionsPerDay: { type: Number, default: 100 },
  executionsToday: { type: Number, default: 0 },
  lastResetDate: { type: Date, default: Date.now },
}, { timestamps: true })

AutomationRuleSchema.index({ userId: 1, isActive: 1 })
AutomationRuleSchema.index({ 'trigger.type': 1, isActive: 1 })

// Automation Rule Execution Log Schema (Track rule executions)
const AutomationRuleExecutionSchema = new Schema({
  ruleId: { type: Schema.Types.ObjectId, ref: 'AutomationRule', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  triggerType: { type: String, required: true },
  triggerData: Schema.Types.Mixed, // Data that triggered the rule
  conditionsMatched: { type: Boolean, default: true },
  actionsExecuted: [{
    actionType: String,
    actionConfig: Schema.Types.Mixed,
    success: Boolean,
    result: Schema.Types.Mixed,
    error: String,
    executedAt: { type: Date, default: Date.now },
  }],
  executionTime: { type: Number, default: 0 }, // Milliseconds
  success: { type: Boolean, default: true },
  error: String,
}, { timestamps: true })

AutomationRuleExecutionSchema.index({ ruleId: 1, createdAt: -1 })
AutomationRuleExecutionSchema.index({ userId: 1, createdAt: -1 })

// Audit Log Schema (Track all changes in the system)
const AuditLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Who made the change
  userEmail: { type: String }, // User email for quick reference
  userRole: { type: String }, // User role for quick reference
  action: { 
    type: String, 
    required: true,
    enum: [
      'create', 'update', 'delete', 'restore',
      'payment_create', 'payment_update', 'payment_delete',
      'member_create', 'member_update', 'member_delete', 'member_convert',
      'family_create', 'family_update', 'family_delete', 'family_restore',
      'lifecycle_event_create', 'lifecycle_event_update', 'lifecycle_event_delete',
      'payment_plan_create', 'payment_plan_update', 'payment_plan_delete',
      'settings_update', 'stripe_connect', 'stripe_disconnect',
      'email_sent', 'sms_sent', 'statement_generated', 'report_generated',
      'task_create', 'task_update', 'task_delete', 'task_complete',
      'note_create', 'note_update', 'note_delete',
      'login', 'logout', 'impersonate_start', 'impersonate_end'
    ]
  },
  entityType: { 
    type: String, 
    required: true,
    enum: ['family', 'member', 'payment', 'lifecycle_event', 'payment_plan', 'task', 'note', 'settings', 'user', 'statement', 'report', 'stripe_config', 'email_config', 'sms_config', 'automation_settings']
  },
  entityId: { type: Schema.Types.ObjectId }, // ID of the affected entity
  entityName: { type: String }, // Name/title of the affected entity (for quick reference)
  changes: { type: Schema.Types.Mixed }, // Object containing old and new values
  description: { type: String }, // Human-readable description
  ipAddress: { type: String }, // IP address of the user
  userAgent: { type: String }, // User agent/browser info
  metadata: { type: Schema.Types.Mixed }, // Additional metadata (e.g., payment amount, family name)
}, { timestamps: true })

// Indexes for efficient querying
AuditLogSchema.index({ userId: 1, createdAt: -1 })
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 })
AuditLogSchema.index({ action: 1, createdAt: -1 })
AuditLogSchema.index({ createdAt: -1 })

export const EmailConfig = mongoose.models.EmailConfig || mongoose.model('EmailConfig', EmailConfigSchema)
export const SmsConfig = mongoose.models.SmsConfig || mongoose.model('SmsConfig', SmsConfigSchema)
export const InvoiceTemplate = mongoose.models.InvoiceTemplate || mongoose.model('InvoiceTemplate', InvoiceTemplateSchema)
export const CycleConfig = mongoose.models.CycleConfig || mongoose.model('CycleConfig', CycleConfigSchema)
export const StripeConfig = mongoose.models.StripeConfig || mongoose.model('StripeConfig', StripeConfigSchema)
export const AutomationSettings = mongoose.models.AutomationSettings || mongoose.model('AutomationSettings', AutomationSettingsSchema)
export const AutomationRule = mongoose.models.AutomationRule || mongoose.model('AutomationRule', AutomationRuleSchema)
export const AutomationRuleExecution = mongoose.models.AutomationRuleExecution || mongoose.model('AutomationRuleExecution', AutomationRuleExecutionSchema)
export const SavedPaymentMethod = mongoose.models.SavedPaymentMethod || mongoose.model('SavedPaymentMethod', SavedPaymentMethodSchema)
export const RecurringPayment = mongoose.models.RecurringPayment || mongoose.model('RecurringPayment', RecurringPaymentSchema)
export const Refund = mongoose.models.Refund || mongoose.model('Refund', RefundSchema)
export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema)
export const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema)
export const CustomReport = mongoose.models.CustomReport || mongoose.model('CustomReport', CustomReportSchema)
export const ScheduledReport = mongoose.models.ScheduledReport || mongoose.model('ScheduledReport', ScheduledReportSchema)
export const ReportSnapshot = mongoose.models.ReportSnapshot || mongoose.model('ReportSnapshot', ReportSnapshotSchema)
export const Dashboard = mongoose.models.Dashboard || mongoose.model('Dashboard', DashboardSchema)
export const ReportVersion = mongoose.models.ReportVersion || mongoose.model('ReportVersion', ReportVersionSchema)
export const ReportTemplate = mongoose.models.ReportTemplate || mongoose.model('ReportTemplate', ReportTemplateSchema)
export const ReportComment = mongoose.models.ReportComment || mongoose.model('ReportComment', ReportCommentSchema)
export const ReportBookmark = mongoose.models.ReportBookmark || mongoose.model('ReportBookmark', ReportBookmarkSchema)
export const ReportAlert = mongoose.models.ReportAlert || mongoose.model('ReportAlert', ReportAlertSchema)
export const ReportDependency = mongoose.models.ReportDependency || mongoose.model('ReportDependency', ReportDependencySchema)
export const ReportShare = mongoose.models.ReportShare || mongoose.model('ReportShare', ReportShareSchema)
export const ReportDrillDown = mongoose.models.ReportDrillDown || mongoose.model('ReportDrillDown', ReportDrillDownSchema)
export const FamilyTag = mongoose.models.FamilyTag || mongoose.model('FamilyTag', FamilyTagSchema)
export const FamilyGroup = mongoose.models.FamilyGroup || mongoose.model('FamilyGroup', FamilyGroupSchema)
export const FamilyRelationship = mongoose.models.FamilyRelationship || mongoose.model('FamilyRelationship', FamilyRelationshipSchema)
export const PaymentLink = mongoose.models.PaymentLink || mongoose.model('PaymentLink', PaymentLinkSchema)
export const PaymentAnalytics = mongoose.models.PaymentAnalytics || mongoose.model('PaymentAnalytics', PaymentAnalyticsSchema)
export const Backup = mongoose.models.Backup || mongoose.model('Backup', BackupSchema)
export const Permission = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema)
export const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema)
export const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema)
export const User = mongoose.models.User || mongoose.model('User', UserSchema)
export const FamilyNote = mongoose.models.FamilyNote || mongoose.model('FamilyNote', FamilyNoteSchema)
export const RecycleBin = mongoose.models.RecycleBin || mongoose.model('RecycleBin', RecycleBinSchema)
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema)

// Document/File Schema
const DocumentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  fileName: { type: String, required: true },
  fileSize: Number, // Size in bytes
  fileType: String, // MIME type
  filePath: String, // Path to stored file
  category: { 
    type: String, 
    enum: ['contract', 'agreement', 'form', 'invoice', 'receipt', 'statement', 'other'],
    default: 'other'
  },
  // Related entities
  relatedFamilyId: { type: Schema.Types.ObjectId, ref: 'Family' },
  relatedMemberId: { type: Schema.Types.ObjectId, ref: 'FamilyMember' },
  relatedPaymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
  relatedEventId: { type: Schema.Types.ObjectId, ref: 'LifecycleEvent' },
  // Tags for organization
  tags: [String],
  // Access control
  isPrivate: { type: Boolean, default: false },
  sharedWith: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  // Version control
  version: { type: Number, default: 1 },
  parentDocumentId: { type: Schema.Types.ObjectId, ref: 'Document' }, // For versioning
}, { timestamps: true })

DocumentSchema.index({ userId: 1, category: 1 })
DocumentSchema.index({ relatedFamilyId: 1 })
DocumentSchema.index({ tags: 1 })

export const Document = mongoose.models.Document || mongoose.model('Document', DocumentSchema)

// Message Template Schema
const MessageTemplateSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  subject: String, // For email templates (can contain variables)
  body: { type: String, required: true }, // Can contain HTML for email templates
  bodyHtml: { type: String }, // Rich HTML content for email templates
  type: { type: String, enum: ['email', 'sms'], required: true },
  variables: [{ // Available variables for this template
    name: { type: String, required: true }, // Variable name like 'familyName'
    displayName: { type: String, required: true }, // Display name like 'Family Name'
    category: { type: String, enum: ['family', 'payment', 'member', 'system'], default: 'family' }
  }],
  isHtml: { type: Boolean, default: false }, // Whether body contains HTML
}, { timestamps: true })

MessageTemplateSchema.index({ userId: 1, type: 1 })

// Message History Schema
const MessageHistorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['email', 'sms'], required: true },
  subject: String, // For email messages
  body: { type: String, required: true },
  recipients: [String], // Email addresses or phone numbers
  sentAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'partial', 'failed'], default: 'sent' },
  successCount: { type: Number, default: 0 },
  failureCount: { type: Number, default: 0 },
}, { timestamps: true })

MessageHistorySchema.index({ userId: 1, sentAt: -1 })

// Saved View Schema (for filter presets)
const SavedViewSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  entityType: { type: String, required: true }, // 'family', 'payment', 'member', etc.
  filters: Schema.Types.Mixed, // FilterGroup[] structure
  isDefault: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false }, // Can be shared with other users
  sharedWith: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Users this view is shared with
}, { timestamps: true })

SavedViewSchema.index({ userId: 1, entityType: 1 })
SavedViewSchema.index({ userId: 1, isDefault: 1 })
SavedViewSchema.index({ isPublic: 1, entityType: 1 })

// Support Ticket Schema
const SupportTicketSchema = new Schema({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' }, // User who created the ticket (family user)
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['billing', 'payment', 'account', 'technical', 'general', 'other'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' }, // Admin user assigned to handle ticket
  messages: [{
    from: { type: String, enum: ['family', 'admin'], required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    attachments: [{
      filename: String,
      url: String,
      size: Number
    }],
    createdAt: { type: Date, default: Date.now }
  }],
  resolvedAt: Date,
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolutionNotes: String,
}, { timestamps: true })

SupportTicketSchema.index({ familyId: 1, createdAt: -1 })
SupportTicketSchema.index({ userId: 1, createdAt: -1 })
SupportTicketSchema.index({ status: 1, priority: -1 })
SupportTicketSchema.index({ assignedTo: 1, status: 1 })

export const MessageTemplate = mongoose.models.MessageTemplate || mongoose.model('MessageTemplate', MessageTemplateSchema)
export const MessageHistory = mongoose.models.MessageHistory || mongoose.model('MessageHistory', MessageHistorySchema)
export const SavedView = mongoose.models.SavedView || mongoose.model('SavedView', SavedViewSchema)
export const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', SupportTicketSchema)
