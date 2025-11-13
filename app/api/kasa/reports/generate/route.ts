import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { 
  Family, 
  FamilyMember, 
  Payment, 
  LifecycleEventPayment, 
  PaymentPlan,
  Statement,
  Task
} from '@/lib/models'

export const dynamic = 'force-dynamic'

// Helper function to convert to CSV
function toCSV(rows: string[][]): string {
  return rows.map(row => {
    return row.map(cell => {
      const cellStr = String(cell || '')
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }).join(',')
  }).join('\n')
}

// Helper function to parse date expressions
function parseDateExpression(dateStr: string): { start: Date; end: Date } | null {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const dateStrLower = dateStr.toLowerCase().trim()
  
  // Today
  if (dateStrLower === 'today') {
    return {
      start: today,
      end: new Date(tomorrow.getTime() - 1) // End of today
    }
  }
  
  // Yesterday
  if (dateStrLower === 'yesterday') {
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    return {
      start: yesterday,
      end: new Date(today.getTime() - 1) // End of yesterday
    }
  }
  
  // This week (last 7 days)
  if (dateStrLower.includes('this week') || dateStrLower.includes('last 7 days')) {
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    return {
      start: weekAgo,
      end: new Date(tomorrow.getTime() - 1)
    }
  }
  
  // This month
  if (dateStrLower.includes('this month')) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return {
      start: startOfMonth,
      end: endOfMonth
    }
  }
  
  // Try parsing as date string (YYYY-MM-DD, MM/DD/YYYY, etc.)
  const parsedDate = new Date(dateStr)
  if (!isNaN(parsedDate.getTime())) {
    const start = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate())
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    end.setMilliseconds(end.getMilliseconds() - 1)
    return { start, end }
  }
  
  return null
}

// Helper function to parse field filters from query
function parseFieldFilters(query: string, queryLower: string): {
  familyFilters: any
  memberFilters: any
  paymentFilters: any
  eventFilters: any
  filterDescriptions: string[]
} {
  const familyFilters: any = {}
  const memberFilters: any = {}
  const paymentFilters: any = {}
  const eventFilters: any = {}
  const filterDescriptions: string[] = []

  // Parse date range filters (from X to Y, from today, etc.)
  const dateRangePatterns = [
    { pattern: /from\s+([^to]+?)\s+to\s+([^greaterless]+?)(?:\s|$)/i, field: 'paymentDate', collections: ['payment'] },
    { pattern: /from\s+([^to]+?)\s+to\s+([^greaterless]+?)(?:\s|$)/i, field: 'eventDate', collections: ['event'] },
    { pattern: /from\s+(today|yesterday|this week|this month|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})(?:\s|$)/i, field: 'paymentDate', collections: ['payment'] },
    { pattern: /from\s+(today|yesterday|this week|this month|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})(?:\s|$)/i, field: 'eventDate', collections: ['event'] },
    { pattern: /(?:on|in)\s+(today|yesterday|this week|this month)(?:\s|$)/i, field: 'paymentDate', collections: ['payment'] },
    { pattern: /(?:on|in)\s+(today|yesterday|this week|this month)(?:\s|$)/i, field: 'eventDate', collections: ['event'] }
  ]

  for (const { pattern, field, collections } of dateRangePatterns) {
    const match = query.match(pattern)
    if (match) {
      if (match[2]) {
        // From X to Y format
        const startDate = parseDateExpression(match[1].trim())
        const endDate = parseDateExpression(match[2].trim())
        if (startDate && endDate) {
          const dateRange = { $gte: startDate.start, $lte: endDate.end }
          if (collections.includes('payment')) {
            paymentFilters[field] = dateRange
            filterDescriptions.push(`payment date from ${match[1].trim()} to ${match[2].trim()}`)
          }
          if (collections.includes('event')) {
            eventFilters[field] = dateRange
            filterDescriptions.push(`event date from ${match[1].trim()} to ${match[2].trim()}`)
          }
        }
      } else if (match[1]) {
        // Single date (from today, on today, etc.)
        const dateExpr = parseDateExpression(match[1].trim())
        if (dateExpr) {
          const dateRange = { $gte: dateExpr.start, $lte: dateExpr.end }
          if (collections.includes('payment')) {
            paymentFilters[field] = dateRange
            filterDescriptions.push(`payment date: ${match[1].trim()}`)
          }
          if (collections.includes('event')) {
            eventFilters[field] = dateRange
            filterDescriptions.push(`event date: ${match[1].trim()}`)
          }
        }
      }
    }
  }

  // Parse date filters (last updated, created, etc.)
  const dateFieldPatterns = [
    { pattern: /last\s*updated\s*(?:in|on|from)?\s*(\d{4})/i, field: 'updatedAt', collections: ['family', 'member', 'payment', 'event'] },
    { pattern: /created\s*(?:in|on|from)?\s*(\d{4})/i, field: 'createdAt', collections: ['family', 'member', 'payment', 'event'] },
    { pattern: /updated\s*(?:in|on|from)?\s*(\d{4})/i, field: 'updatedAt', collections: ['family', 'member', 'payment', 'event'] }
  ]

  for (const { pattern, field, collections } of dateFieldPatterns) {
    const match = query.match(pattern)
    if (match) {
      const year = parseInt(match[1])
      const startOfYear = new Date(year, 0, 1)
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)
      const dateRange = { $gte: startOfYear, $lte: endOfYear }
      
      if (collections.includes('family')) familyFilters[field] = dateRange
      if (collections.includes('member')) memberFilters[field] = dateRange
      if (collections.includes('payment')) paymentFilters[field] = dateRange
      if (collections.includes('event')) eventFilters[field] = dateRange
      
      filterDescriptions.push(`${field} in ${year}`)
    }
  }

  // Parse amount filters for payments and events (support "greater than", "more than", etc.)
  const amountPatterns = [
    { pattern: /(?:amount|greater|more)\s*(?:than|>)\s*(\d+(?:\.\d+)?)/i, operator: '$gt' },
    { pattern: /amount\s*>\s*(\d+(?:\.\d+)?)/i, operator: '$gt' },
    { pattern: /amount\s*>=\s*(\d+(?:\.\d+)?)/i, operator: '$gte' },
    { pattern: /(?:amount|less|lower)\s*(?:than|<)\s*(\d+(?:\.\d+)?)/i, operator: '$lt' },
    { pattern: /amount\s*<\s*(\d+(?:\.\d+)?)/i, operator: '$lt' },
    { pattern: /amount\s*<=\s*(\d+(?:\.\d+)?)/i, operator: '$lte' },
    { pattern: /amount\s*=\s*(\d+(?:\.\d+)?)/i, operator: '$eq' },
    { pattern: /amount\s*(\d+(?:\.\d+)?)/i, operator: '$eq' } // Default to equals if just number
  ]

  for (const { pattern, operator } of amountPatterns) {
    const match = query.match(pattern)
    if (match && (queryLower.includes('payment') || queryLower.includes('event') || queryLower.includes('greater') || queryLower.includes('more'))) {
      const amount = parseFloat(match[1])
      // Only apply to payments if query mentions payments, or if it's a general amount filter
      if (queryLower.includes('payment') || (!queryLower.includes('event') && (queryLower.includes('payment') || queryLower.includes('greater') || queryLower.includes('more')))) {
        // Merge with existing amount filter if present
        if (paymentFilters.amount) {
          // Combine operators (e.g., if we have > 50 and > 55, keep the more restrictive one)
          if (operator === '$gt' && paymentFilters.amount.$gt !== undefined) {
            paymentFilters.amount.$gt = Math.max(paymentFilters.amount.$gt, amount)
          } else {
            paymentFilters.amount = { [operator]: amount }
          }
        } else {
          paymentFilters.amount = { [operator]: amount }
        }
        filterDescriptions.push(`payment amount ${operator === '$gt' ? '>' : operator === '$gte' ? '>=' : operator === '$lt' ? '<' : operator === '$lte' ? '<=' : '='} ${amount}`)
      }
      if (queryLower.includes('event')) {
        if (eventFilters.amount) {
          if (operator === '$gt' && eventFilters.amount.$gt !== undefined) {
            eventFilters.amount.$gt = Math.max(eventFilters.amount.$gt, amount)
          } else {
            eventFilters.amount = { [operator]: amount }
          }
        } else {
          eventFilters.amount = { [operator]: amount }
        }
        filterDescriptions.push(`event amount ${operator === '$gt' ? '>' : operator === '$gte' ? '>=' : operator === '$lt' ? '<' : operator === '$lte' ? '<=' : '='} ${amount}`)
      }
      break // Only match first amount pattern
    }
  }

  // Parse balance filters for families
  const balancePatterns = [
    { pattern: /balance\s*>\s*(\d+(?:\.\d+)?)/i, operator: '$gt' },
    { pattern: /balance\s*>=\s*(\d+(?:\.\d+)?)/i, operator: '$gte' },
    { pattern: /balance\s*<\s*(\d+(?:\.\d+)?)/i, operator: '$lt' },
    { pattern: /balance\s*<=\s*(\d+(?:\.\d+)?)/i, operator: '$lte' },
    { pattern: /balance\s*=\s*(\d+(?:\.\d+)?)/i, operator: '$eq' },
    { pattern: /open\s*balance\s*>\s*(\d+(?:\.\d+)?)/i, operator: '$gt' },
    { pattern: /open\s*balance\s*<\s*(\d+(?:\.\d+)?)/i, operator: '$lt' }
  ]

  for (const { pattern, operator } of balancePatterns) {
    const match = query.match(pattern)
    if (match && queryLower.includes('famil')) {
      const balance = parseFloat(match[1])
      familyFilters.openBalance = { [operator]: balance }
      filterDescriptions.push(`balance ${operator} ${balance}`)
      break
    }
  }

  // Parse payment type filters
  const paymentTypePatterns = [
    { pattern: /type\s*(?:is|of|:)?\s*(membership|donation|other)/i, field: 'type' },
    { pattern: /payment\s*type\s*(?:is|of|:)?\s*(membership|donation|other)/i, field: 'type' }
  ]

  for (const { pattern, field } of paymentTypePatterns) {
    const match = query.match(pattern)
    if (match && queryLower.includes('payment')) {
      const type = match[1].toLowerCase()
      paymentFilters[field] = type
      filterDescriptions.push(`payment type: ${type}`)
      break
    }
  }

  // Parse payment method filters
  const paymentMethodPatterns = [
    { pattern: /method\s*(?:is|of|:)?\s*(cash|credit_card|check|quick_pay)/i, field: 'paymentMethod' },
    { pattern: /payment\s*method\s*(?:is|of|:)?\s*(cash|credit_card|check|quick_pay)/i, field: 'paymentMethod' }
  ]

  for (const { pattern, field } of paymentMethodPatterns) {
    const match = query.match(pattern)
    if (match && queryLower.includes('payment')) {
      const method = match[1].toLowerCase()
      paymentFilters[field] = method
      filterDescriptions.push(`payment method: ${method}`)
      break
    }
  }

  // Parse event type filters
  const eventTypePatterns = [
    { pattern: /event\s*type\s*(?:is|of|:)?\s*(chasena|bar_mitzvah|birth_boy|birth_girl)/i, field: 'eventType' },
    { pattern: /type\s*(?:is|of|:)?\s*(chasena|bar_mitzvah|birth_boy|birth_girl)/i, field: 'eventType' }
  ]

  for (const { pattern, field } of eventTypePatterns) {
    const match = query.match(pattern)
    if (match && queryLower.includes('event')) {
      const eventType = match[1].toLowerCase()
      eventFilters[field] = eventType
      filterDescriptions.push(`event type: ${eventType}`)
      break
    }
  }

  // Parse email filters
  const emailPatterns = [
    { pattern: /email\s*contains?\s*["']?([^"'\s]+)["']?/i, operator: '$regex' },
    { pattern: /email\s*(?:is|:)?\s*["']?([^"'\s@]+@[^"'\s]+)["']?/i, operator: '$eq' }
  ]

  for (const { pattern, operator } of emailPatterns) {
    const match = query.match(pattern)
    if (match && queryLower.includes('famil')) {
      const emailValue = match[1]
      if (operator === '$regex') {
        familyFilters.email = { $regex: emailValue, $options: 'i' }
        filterDescriptions.push(`email contains: ${emailValue}`)
      } else {
        familyFilters.email = emailValue
        filterDescriptions.push(`email: ${emailValue}`)
      }
      break
    }
  }

  // Parse gender filters for members
  const genderPatterns = [
    { pattern: /gender\s*(?:is|:)?\s*(male|female)/i, field: 'gender' }
  ]

  for (const { pattern, field } of genderPatterns) {
    const match = query.match(pattern)
    if (match && queryLower.includes('member')) {
      const gender = match[1].toLowerCase()
      memberFilters[field] = gender
      filterDescriptions.push(`gender: ${gender}`)
      break
    }
  }

  // Parse city/state filters for families
  const locationPatterns = [
    { pattern: /city\s*(?:is|:)?\s*["']?([^"'\s]+)["']?/i, field: 'city' },
    { pattern: /state\s*(?:is|:)?\s*["']?([^"'\s]+)["']?/i, field: 'state' }
  ]

  for (const { pattern, field } of locationPatterns) {
    const match = query.match(pattern)
    if (match && queryLower.includes('famil')) {
      const value = match[1]
      familyFilters[field] = { $regex: value, $options: 'i' }
      filterDescriptions.push(`${field}: ${value}`)
      break
    }
  }

  return {
    familyFilters,
    memberFilters,
    paymentFilters,
    eventFilters,
    filterDescriptions
  }
}

// POST - Generate a report based on query
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { query } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const queryLower = query.toLowerCase()
    const csvRows: string[][] = []
    let filename = ''
    let recordCount: any = {}

    // Extract year from query (e.g., "2026", "year 2026", "in 2026")
    const yearMatch = query.match(/\b(20\d{2})\b/)
    const requestedYear = yearMatch ? parseInt(yearMatch[1]) : null

    // Parse field-specific filters
    const fieldFilters = parseFieldFilters(query, queryLower)

    // Use AI to understand what data to include in report
    // First try to use AI chat endpoint to understand the request
    let reportType = 'all' // default
    let aiSuggestion = null
    
    try {
      const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Based on this report request: "${query}", determine what data should be included. Respond with ONLY a JSON object with these boolean fields: includeFamilies, includeMembers, includePayments, includeEvents. Example: {"includeFamilies": true, "includeMembers": true, "includePayments": false, "includeEvents": false}`,
          conversationHistory: []
        })
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        // Try to parse JSON from AI response
        try {
          const jsonMatch = aiData.response?.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            aiSuggestion = JSON.parse(jsonMatch[0])
          }
        } catch (e) {
          // If AI response can't be parsed, fall back to keyword matching
        }
      }
    } catch (error) {
      // If AI is unavailable, fall back to keyword matching
      console.log('AI unavailable, using keyword matching')
    }

    // Detect what data to include in report (use AI suggestion if available, otherwise precise keyword matching)
    // Only include what is explicitly requested - don't default to "all"
    const includeFamilies = aiSuggestion?.includeFamilies ?? (queryLower.includes('famil') && !queryLower.includes('member'))
    const includeMembers = aiSuggestion?.includeMembers ?? (queryLower.includes('member'))
    const includePayments = aiSuggestion?.includePayments ?? (queryLower.includes('payment'))
    const includeEvents = aiSuggestion?.includeEvents ?? (queryLower.includes('event') || queryLower.includes('lifecycle'))
    
    // Only include "all" if explicitly requested
    const includeAll = queryLower.includes('all data') || queryLower.includes('everything') || queryLower.includes('complete')
    
    // If nothing specific is requested and not "all", default to families only (most common request)
    const hasSpecificRequest = includeFamilies || includeMembers || includePayments || includeEvents || includeAll
    const defaultToFamilies = !hasSpecificRequest && (queryLower.includes('report') || queryLower.includes('export') || queryLower.includes('download'))

    // Header
    csvRows.push(['DATA REPORT'])
    csvRows.push(['Generated:', new Date().toLocaleString()])
    csvRows.push(['Query:', query])
    csvRows.push([])

    // FAMILIES SECTION
    if (includeFamilies || includeAll || defaultToFamilies) {
      // Build query with year filter and field filters
      const familyQuery: any = { ...fieldFilters.familyFilters }
      if (requestedYear && !familyQuery.updatedAt && !familyQuery.createdAt) {
        // Only apply wedding date year filter if not already filtering by updatedAt/createdAt
        const startOfYear = new Date(requestedYear, 0, 1)
        const endOfYear = new Date(requestedYear, 11, 31, 23, 59, 59, 999)
        familyQuery.weddingDate = {
          $gte: startOfYear,
          $lte: endOfYear
        }
      }
      
      const families = await Family.find(familyQuery).sort({ name: 1 }).lean()
      recordCount.families = families.length

      csvRows.push(['FAMILIES'])
      const familyFilterDesc: string[] = []
      if (requestedYear && !familyQuery.updatedAt && !familyQuery.createdAt) {
        familyFilterDesc.push(`Wedding Year: ${requestedYear}`)
      }
      fieldFilters.filterDescriptions.forEach(desc => {
        if (desc.includes('balance') || desc.includes('email') || desc.includes('city') || desc.includes('state') || desc.includes('updatedAt') || desc.includes('createdAt')) {
          familyFilterDesc.push(desc)
        }
      })
      if (familyFilterDesc.length > 0) {
        csvRows.push([`Filtered by: ${familyFilterDesc.join(', ')}`])
      }
      csvRows.push(['Name', 'Hebrew Name', 'Email', 'Phone', 'Wedding Date', 'Address', 'City', 'State', 'Zip', 'Payment Plan'])
      
      for (const family of families) {
        const familyObj = family as any
        let planName = ''
        if (familyObj.paymentPlanId) {
          const plan = await PaymentPlan.findById(familyObj.paymentPlanId).lean()
          planName = (plan as any)?.name || `Plan ${familyObj.currentPlan || ''}`
        } else if (familyObj.currentPlan) {
          planName = `Plan ${familyObj.currentPlan}`
        }

        csvRows.push([
          familyObj.name || '',
          familyObj.hebrewName || '',
          familyObj.email || '',
          familyObj.phone || '',
          familyObj.weddingDate ? new Date(familyObj.weddingDate).toLocaleDateString() : '',
          familyObj.address || '',
          familyObj.city || '',
          familyObj.state || '',
          familyObj.zip || '',
          planName
        ])
      }
      csvRows.push([])
    }

    // MEMBERS SECTION
    if (includeMembers || includeAll) {
      const families = await Family.find({}).sort({ name: 1 }).lean()
      
      // Build query with year filter and field filters
      const memberQuery: any = { ...fieldFilters.memberFilters }
      
      if (requestedYear && !memberQuery.updatedAt && !memberQuery.createdAt) {
        // Only apply date year filter if not already filtering by updatedAt/createdAt
        const startOfYear = new Date(requestedYear, 0, 1)
        const endOfYear = new Date(requestedYear, 11, 31, 23, 59, 59, 999)
        
        // Find members where any date field matches the requested year
        if (Object.keys(memberQuery).length > 0) {
          // Merge with existing filters
          memberQuery.$or = [
            { birthDate: { $gte: startOfYear, $lte: endOfYear } },
            { barMitzvahDate: { $gte: startOfYear, $lte: endOfYear } },
            { batMitzvahDate: { $gte: startOfYear, $lte: endOfYear } },
            { weddingDate: { $gte: startOfYear, $lte: endOfYear } }
          ]
        } else {
          memberQuery.$or = [
            { birthDate: { $gte: startOfYear, $lte: endOfYear } },
            { barMitzvahDate: { $gte: startOfYear, $lte: endOfYear } },
            { batMitzvahDate: { $gte: startOfYear, $lte: endOfYear } },
            { weddingDate: { $gte: startOfYear, $lte: endOfYear } }
          ]
        }
      }
      
      const allMembers = await FamilyMember.find(memberQuery).sort({ familyId: 1, lastName: 1, firstName: 1 }).lean()
      recordCount.totalMembers = allMembers.length

      csvRows.push(['MEMBERS'])
      const memberFilterDesc: string[] = []
      if (requestedYear && !memberQuery.updatedAt && !memberQuery.createdAt) {
        memberFilterDesc.push(`Year: ${requestedYear} (Birth, Bar/Bat Mitzvah, or Wedding Date)`)
      }
      fieldFilters.filterDescriptions.forEach(desc => {
        if (desc.includes('gender') || desc.includes('updatedAt') || desc.includes('createdAt')) {
          memberFilterDesc.push(desc)
        }
      })
      if (memberFilterDesc.length > 0) {
        csvRows.push([`Filtered by: ${memberFilterDesc.join(', ')}`])
      }
      csvRows.push(['Family Name', 'First Name', 'Last Name', 'Hebrew First Name', 'Hebrew Last Name', 'Birth Date', 'Gender', 'Bar Mitzvah Date', 'Bat Mitzvah Date', 'Wedding Date'])
      
      for (const member of allMembers) {
        const memberObj = member as any
        const family = families.find((f: any) => f._id.toString() === memberObj.familyId.toString())
        const familyName = (family as any)?.name || 'Unknown'

        csvRows.push([
          familyName,
          memberObj.firstName || '',
          memberObj.lastName || '',
          memberObj.hebrewFirstName || '',
          memberObj.hebrewLastName || '',
          memberObj.birthDate ? new Date(memberObj.birthDate).toLocaleDateString() : '',
          memberObj.gender || '',
          memberObj.barMitzvahDate ? new Date(memberObj.barMitzvahDate).toLocaleDateString() : '',
          memberObj.batMitzvahDate ? new Date(memberObj.batMitzvahDate).toLocaleDateString() : '',
          memberObj.weddingDate ? new Date(memberObj.weddingDate).toLocaleDateString() : ''
        ])
      }
      csvRows.push([])
    }

    // PAYMENTS SECTION
    if (includePayments || includeAll) {
      // Build query with year filter and field filters
      const paymentQuery: any = { ...fieldFilters.paymentFilters }
      // If paymentDate filter exists, don't apply year filter (date filter takes precedence)
      if (requestedYear && !paymentQuery.updatedAt && !paymentQuery.createdAt && !paymentQuery.paymentDate) {
        paymentQuery.year = requestedYear
      }
      
      const payments = await Payment.find(paymentQuery)
        .populate('familyId', 'name')
        .sort({ paymentDate: -1 })
        .lean()
      
      recordCount.payments = payments.length

      csvRows.push(['PAYMENTS'])
      const paymentFilterDesc: string[] = []
      if (requestedYear && !paymentQuery.updatedAt && !paymentQuery.createdAt) {
        paymentFilterDesc.push(`Year: ${requestedYear}`)
      }
      fieldFilters.filterDescriptions.forEach(desc => {
        if (desc.includes('payment') || desc.includes('amount') || desc.includes('updatedAt') || desc.includes('createdAt')) {
          paymentFilterDesc.push(desc)
        }
      })
      if (paymentFilterDesc.length > 0) {
        csvRows.push([`Filtered by: ${paymentFilterDesc.join(', ')}`])
      }
      csvRows.push(['Date', 'Year', 'Family', 'Amount', 'Type', 'Payment Method', 'Notes'])

      for (const payment of payments) {
        const paymentObj = payment as any
        const family = paymentObj.familyId as any

        csvRows.push([
          paymentObj.paymentDate ? new Date(paymentObj.paymentDate).toLocaleDateString() : '',
          paymentObj.year || '',
          family?.name || 'Unknown',
          paymentObj.amount?.toFixed(2) || '0.00',
          paymentObj.type || '',
          paymentObj.paymentMethod || '',
          paymentObj.notes || ''
        ])
      }
      csvRows.push([])
    }

    // LIFECYCLE EVENTS SECTION
    if (includeEvents || includeAll) {
      // Build query with year filter and field filters
      const eventQuery: any = { ...fieldFilters.eventFilters }
      if (requestedYear && !eventQuery.updatedAt && !eventQuery.createdAt) {
        eventQuery.year = requestedYear
      }
      
      const events = await LifecycleEventPayment.find(eventQuery)
        .populate('familyId', 'name')
        .sort({ eventDate: -1 })
        .lean()
      
      recordCount.events = events.length

      csvRows.push(['LIFECYCLE EVENTS'])
      const eventFilterDesc: string[] = []
      if (requestedYear && !eventQuery.updatedAt && !eventQuery.createdAt) {
        eventFilterDesc.push(`Year: ${requestedYear}`)
      }
      fieldFilters.filterDescriptions.forEach(desc => {
        if (desc.includes('event') || desc.includes('amount') || desc.includes('updatedAt') || desc.includes('createdAt')) {
          eventFilterDesc.push(desc)
        }
      })
      if (eventFilterDesc.length > 0) {
        csvRows.push([`Filtered by: ${eventFilterDesc.join(', ')}`])
      }
      csvRows.push(['Date', 'Year', 'Family', 'Event Type', 'Amount', 'Notes'])

      for (const event of events) {
        const eventObj = event as any
        const family = eventObj.familyId as any

        csvRows.push([
          eventObj.eventDate ? new Date(eventObj.eventDate).toLocaleDateString() : '',
          eventObj.year || '',
          family?.name || 'Unknown',
          eventObj.eventType || '',
          eventObj.amount?.toFixed(2) || '0.00',
          eventObj.notes || ''
        ])
      }
      csvRows.push([])
    }

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0]
    const yearSuffix = requestedYear ? `_${requestedYear}` : ''
    
    if (includeAll) {
      filename = `Complete_Data_Report${yearSuffix}_${dateStr}.csv`
    } else {
      const parts: string[] = []
      if (includeFamilies || defaultToFamilies) parts.push('Families')
      if (includeMembers) parts.push('Members')
      if (includePayments) parts.push('Payments')
      if (includeEvents) parts.push('Events')
      filename = parts.length > 0 
        ? `${parts.join('_')}_Report${yearSuffix}_${dateStr}.csv`
        : `Data_Report${yearSuffix}_${dateStr}.csv`
    }

    const csvContent = toCSV(csvRows)

    return NextResponse.json({
      success: true,
      csvContent,
      filename,
      recordCount
    })
  } catch (error: any) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    )
  }
}

