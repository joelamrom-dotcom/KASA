/**
 * Data validation utilities
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate email format
 */
export function validateEmail(email: string | undefined | null): boolean {
  if (!email) return true // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validate phone number format (US format)
 */
export function validatePhone(phone: string | undefined | null): boolean {
  if (!phone) return true // Optional field
  const phoneRegex = /^[\d\s\-\(\)\+\.]+$/
  const digitsOnly = phone.replace(/\D/g, '')
  return phoneRegex.test(phone) && digitsOnly.length >= 10
}

/**
 * Validate required fields
 */
export function validateRequiredFields(data: any, requiredFields: string[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors.push(`${field} is required`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate family data
 */
export function validateFamilyData(family: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields
  if (!family.name || !family.name.trim()) {
    errors.push('Family name is required')
  }

  if (!family.weddingDate) {
    errors.push('Wedding date is required')
  }

  // Email validation
  if (family.email && !validateEmail(family.email)) {
    errors.push('Invalid email format')
  }

  // Phone validation
  if (family.phone && !validatePhone(family.phone)) {
    warnings.push('Phone number format may be invalid')
  }

  if (family.husbandCellPhone && !validatePhone(family.husbandCellPhone)) {
    warnings.push('Husband cell phone format may be invalid')
  }

  if (family.wifeCellPhone && !validatePhone(family.wifeCellPhone)) {
    warnings.push('Wife cell phone format may be invalid')
  }

  // Date validation
  if (family.weddingDate) {
    const weddingDate = new Date(family.weddingDate)
    if (isNaN(weddingDate.getTime())) {
      errors.push('Invalid wedding date')
    } else if (weddingDate > new Date()) {
      warnings.push('Wedding date is in the future')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate member data
 */
export function validateMemberData(member: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!member.firstName || !member.firstName.trim()) {
    errors.push('First name is required')
  }

  if (!member.lastName || !member.lastName.trim()) {
    errors.push('Last name is required')
  }

  if (member.birthDate) {
    const birthDate = new Date(member.birthDate)
    if (isNaN(birthDate.getTime())) {
      errors.push('Invalid birth date')
    } else if (birthDate > new Date()) {
      errors.push('Birth date cannot be in the future')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate payment data
 */
export function validatePaymentData(payment: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!payment.amount || payment.amount <= 0) {
    errors.push('Valid payment amount is required')
  }

  if (!payment.paymentDate) {
    errors.push('Payment date is required')
  } else {
    const paymentDate = new Date(payment.paymentDate)
    if (isNaN(paymentDate.getTime())) {
      errors.push('Invalid payment date')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Normalize phone number
 */
export function normalizePhone(phone: string | undefined | null): string | null {
  if (!phone) return null
  return phone.replace(/\D/g, '') // Remove non-digits
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string | undefined | null): string {
  if (!phone) return ''
  const digits = normalizePhone(phone)
  if (!digits || digits.length !== 10) return phone
  
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

