/**
 * Template Engine for Email/SMS Templates
 * Handles variable replacement and template rendering
 */

export interface TemplateVariables {
  // Family variables
  familyName?: string
  familyEmail?: string
  familyPhone?: string
  familyAddress?: string
  
  // Payment variables
  amount?: number
  paymentDate?: string
  paymentMethod?: string
  balance?: number
  dueDate?: string
  
  // Member variables
  memberName?: string
  memberAge?: number
  memberBirthDate?: string
  
  // System variables
  currentDate?: string
  currentYear?: number
  loginUrl?: string
  
  // Custom variables
  [key: string]: any
}

/**
 * Replace variables in template string
 * Variables are in format: {{variableName}}
 */
export function replaceTemplateVariables(
  template: string,
  variables: TemplateVariables
): string {
  let result = template
  
  // Replace all {{variable}} patterns
  result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = variables[varName]
    if (value === undefined || value === null) {
      return match // Keep original if variable not found
    }
    return String(value)
  })
  
  // Format currency for amount variables
  if (variables.amount !== undefined) {
    result = result.replace(/\{\{amountFormatted\}\}/g, formatCurrency(variables.amount))
  }
  
  if (variables.balance !== undefined) {
    result = result.replace(/\{\{balanceFormatted\}\}/g, formatCurrency(variables.balance))
  }
  
  // Format dates
  if (variables.paymentDate) {
    result = result.replace(/\{\{paymentDateFormatted\}\}/g, formatDate(variables.paymentDate))
  }
  
  if (variables.dueDate) {
    result = result.replace(/\{\{dueDateFormatted\}\}/g, formatDate(variables.dueDate))
  }
  
  return result
}

/**
 * Get available template variables for a category
 */
export function getAvailableVariables(category: 'family' | 'payment' | 'member' | 'system' = 'family'): Array<{
  name: string
  displayName: string
  description: string
  example: string
}> {
  const allVariables: Record<string, { displayName: string; description: string; example: string; category: string }> = {
    // Family variables
    familyName: {
      displayName: 'Family Name',
      description: 'The family\'s full name',
      example: 'Goldberg Family',
      category: 'family'
    },
    familyEmail: {
      displayName: 'Family Email',
      description: 'The family\'s email address',
      example: 'family@example.com',
      category: 'family'
    },
    familyPhone: {
      displayName: 'Family Phone',
      description: 'The family\'s phone number',
      example: '(555) 123-4567',
      category: 'family'
    },
    familyAddress: {
      displayName: 'Family Address',
      description: 'The family\'s full address',
      example: '123 Main St, City, State 12345',
      category: 'family'
    },
    
    // Payment variables
    amount: {
      displayName: 'Payment Amount',
      description: 'The payment amount (number)',
      example: '1000',
      category: 'payment'
    },
    amountFormatted: {
      displayName: 'Payment Amount (Formatted)',
      description: 'The payment amount formatted as currency',
      example: '$1,000.00',
      category: 'payment'
    },
    paymentDate: {
      displayName: 'Payment Date',
      description: 'The payment date',
      example: '2024-01-15',
      category: 'payment'
    },
    paymentDateFormatted: {
      displayName: 'Payment Date (Formatted)',
      description: 'The payment date formatted',
      example: 'January 15, 2024',
      category: 'payment'
    },
    paymentMethod: {
      displayName: 'Payment Method',
      description: 'The payment method used',
      example: 'Credit Card',
      category: 'payment'
    },
    balance: {
      displayName: 'Current Balance',
      description: 'The current balance (number)',
      example: '500',
      category: 'payment'
    },
    balanceFormatted: {
      displayName: 'Current Balance (Formatted)',
      description: 'The current balance formatted as currency',
      example: '$500.00',
      category: 'payment'
    },
    dueDate: {
      displayName: 'Due Date',
      description: 'The payment due date',
      example: '2024-02-01',
      category: 'payment'
    },
    dueDateFormatted: {
      displayName: 'Due Date (Formatted)',
      description: 'The payment due date formatted',
      example: 'February 1, 2024',
      category: 'payment'
    },
    
    // Member variables
    memberName: {
      displayName: 'Member Name',
      description: 'The member\'s full name',
      example: 'John Doe',
      category: 'member'
    },
    memberAge: {
      displayName: 'Member Age',
      description: 'The member\'s age',
      example: '13',
      category: 'member'
    },
    memberBirthDate: {
      displayName: 'Member Birth Date',
      description: 'The member\'s birth date',
      example: '2010-05-15',
      category: 'member'
    },
    
    // System variables
    currentDate: {
      displayName: 'Current Date',
      description: 'Today\'s date',
      example: '2024-01-15',
      category: 'system'
    },
    currentYear: {
      displayName: 'Current Year',
      description: 'The current year',
      example: '2024',
      category: 'system'
    },
    loginUrl: {
      displayName: 'Login URL',
      description: 'URL to the family portal login',
      example: 'https://kasa.com/login',
      category: 'system'
    }
  }
  
  return Object.entries(allVariables)
    .filter(([_, info]) => info.category === category || category === 'family')
    .map(([name, info]) => ({
      name,
      displayName: info.displayName,
      description: info.description,
      example: info.example
    }))
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Preview template with sample data
 */
export function previewTemplate(template: string, category: 'family' | 'payment' | 'member' | 'system' = 'family'): string {
  const sampleVariables: TemplateVariables = {
    familyName: 'Sample Family',
    familyEmail: 'sample@example.com',
    familyPhone: '(555) 123-4567',
    familyAddress: '123 Main St, City, State 12345',
    amount: 1000,
    balance: 500,
    paymentDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: 'Credit Card',
    memberName: 'John Doe',
    memberAge: 13,
    memberBirthDate: '2010-05-15',
    currentDate: new Date().toISOString(),
    currentYear: new Date().getFullYear(),
    loginUrl: 'https://kasa.com/login'
  }
  
  return replaceTemplateVariables(template, sampleVariables)
}

