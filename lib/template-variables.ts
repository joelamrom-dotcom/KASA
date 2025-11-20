/**
 * Template Variable Replacement Utility
 * Handles dynamic variable replacement in message templates
 */

export interface VariableValue {
  [key: string]: any
}

export interface AvailableVariable {
  name: string
  displayName: string
  category: 'family' | 'payment' | 'member' | 'system'
  description?: string
}

// Available template variables
export const AVAILABLE_VARIABLES: AvailableVariable[] = [
  // Family variables
  { name: 'familyName', displayName: 'Family Name', category: 'family', description: 'Full family name' },
  { name: 'familyHebrewName', displayName: 'Family Hebrew Name', category: 'family', description: 'Family name in Hebrew' },
  { name: 'husbandFirstName', displayName: 'Husband First Name', category: 'family', description: 'Husband\'s first name' },
  { name: 'husbandHebrewName', displayName: 'Husband Hebrew Name', category: 'family', description: 'Husband\'s Hebrew name' },
  { name: 'wifeFirstName', displayName: 'Wife First Name', category: 'family', description: 'Wife\'s first name' },
  { name: 'wifeHebrewName', displayName: 'Wife Hebrew Name', category: 'family', description: 'Wife\'s Hebrew name' },
  { name: 'email', displayName: 'Email Address', category: 'family', description: 'Family email address' },
  { name: 'phone', displayName: 'Phone Number', category: 'family', description: 'Family phone number' },
  { name: 'husbandCellPhone', displayName: 'Husband Cell Phone', category: 'family', description: 'Husband\'s cell phone' },
  { name: 'wifeCellPhone', displayName: 'Wife Cell Phone', category: 'family', description: 'Wife\'s cell phone' },
  { name: 'address', displayName: 'Address', category: 'family', description: 'Full address' },
  { name: 'street', displayName: 'Street', category: 'family', description: 'Street address' },
  { name: 'city', displayName: 'City', category: 'family', description: 'City' },
  { name: 'state', displayName: 'State', category: 'family', description: 'State' },
  { name: 'zip', displayName: 'ZIP Code', category: 'family', description: 'ZIP code' },
  { name: 'weddingDate', displayName: 'Wedding Date', category: 'family', description: 'Wedding date' },
  { name: 'openBalance', displayName: 'Open Balance', category: 'family', description: 'Current balance owed' },
  { name: 'currentPayment', displayName: 'Current Payment', category: 'family', description: 'Current payment amount' },
  { name: 'paymentPlan', displayName: 'Payment Plan', category: 'family', description: 'Payment plan name' },
  { name: 'memberCount', displayName: 'Member Count', category: 'family', description: 'Number of family members' },
  
  // Payment variables
  { name: 'paymentAmount', displayName: 'Payment Amount', category: 'payment', description: 'Payment amount' },
  { name: 'paymentDate', displayName: 'Payment Date', category: 'payment', description: 'Payment date' },
  { name: 'paymentType', displayName: 'Payment Type', category: 'payment', description: 'Type of payment (membership/donation)' },
  { name: 'paymentMethod', displayName: 'Payment Method', category: 'payment', description: 'Payment method used' },
  { name: 'paymentYear', displayName: 'Payment Year', category: 'payment', description: 'Year of payment' },
  
  // System variables
  { name: 'currentDate', displayName: 'Current Date', category: 'system', description: 'Today\'s date' },
  { name: 'currentYear', displayName: 'Current Year', category: 'system', description: 'Current year' },
  { name: 'organizationName', displayName: 'Organization Name', category: 'system', description: 'Organization name' },
]

/**
 * Replace variables in a template string
 * Variables are in the format {{variableName}}
 */
export function replaceVariables(
  template: string,
  variables: VariableValue,
  options?: { 
    fallback?: string // What to show if variable is missing
    strict?: boolean // Throw error if variable is missing
  }
): string {
  const { fallback = '', strict = false } = options || {}
  
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = getVariableValue(varName, variables)
    
    if (value === undefined || value === null) {
      if (strict) {
        throw new Error(`Variable ${varName} not found`)
      }
      return fallback
    }
    
    return String(value)
  })
}

/**
 * Get variable value from variables object
 * Supports nested properties like 'family.name'
 */
function getVariableValue(varName: string, variables: VariableValue): any {
  // Handle nested properties
  if (varName.includes('.')) {
    const parts = varName.split('.')
    let value = variables
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part]
      } else {
        return undefined
      }
    }
    return value
  }
  
  return variables[varName]
}

/**
 * Extract all variables from a template string
 */
export function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  
  return matches.map(match => match.replace(/\{\{|\}\}/g, ''))
}

/**
 * Build variable values object from family data
 */
export function buildFamilyVariables(family: any, payment?: any): VariableValue {
  const variables: VariableValue = {
    // Family variables
    familyName: family.name || '',
    familyHebrewName: family.hebrewName || '',
    husbandFirstName: family.husbandFirstName || '',
    husbandHebrewName: family.husbandHebrewName || '',
    wifeFirstName: family.wifeFirstName || '',
    wifeHebrewName: family.wifeHebrewName || '',
    email: family.email || '',
    phone: family.phone || '',
    husbandCellPhone: family.husbandCellPhone || '',
    wifeCellPhone: family.wifeCellPhone || '',
    address: family.address || '',
    street: family.street || '',
    city: family.city || '',
    state: family.state || '',
    zip: family.zip || '',
    weddingDate: family.weddingDate ? new Date(family.weddingDate).toLocaleDateString() : '',
    openBalance: family.openBalance || 0,
    currentPayment: family.currentPayment || 0,
    paymentPlan: family.paymentPlan?.name || family.paymentPlanId?.name || '',
    memberCount: family.memberCount || 0,
    
    // System variables
    currentDate: new Date().toLocaleDateString(),
    currentYear: new Date().getFullYear(),
    organizationName: 'Kasa Family Management',
  }
  
  // Add payment variables if payment is provided
  if (payment) {
    variables.paymentAmount = payment.amount || 0
    variables.paymentDate = payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : ''
    variables.paymentType = payment.type || ''
    variables.paymentMethod = payment.paymentMethod || ''
    variables.paymentYear = payment.year || new Date().getFullYear()
  }
  
  return variables
}

/**
 * Validate template variables
 */
export function validateTemplate(template: string): {
  valid: boolean
  missingVariables: string[]
  availableVariables: string[]
} {
  const usedVariables = extractVariables(template)
  const availableVarNames = AVAILABLE_VARIABLES.map(v => v.name)
  const missingVariables = usedVariables.filter(v => !availableVarNames.includes(v))
  
  return {
    valid: missingVariables.length === 0,
    missingVariables,
    availableVariables: availableVarNames
  }
}

