import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, FamilyMember, Payment } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - AI-enhanced semantic search with natural language processing
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { query, limit = 20 } = body

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Natural language query interpretation
    const interpretedQuery = interpretNaturalLanguage(query)
    
    // Enhanced semantic search
    const results: any[] = []

    // Search families with semantic matching
    const familyQuery: any = { userId }
    
    if (interpretedQuery.type === 'family' || interpretedQuery.type === 'all') {
      const familySearchFields = ['name', 'email', 'phone', 'address', 'city']
      const familyRegex = new RegExp(interpretedQuery.searchTerm, 'i')
      
      familyQuery.$or = familySearchFields.map(field => ({
        [field]: familyRegex
      }))

      const families = await Family.find(familyQuery).limit(limit).lean()

      families.forEach((f: any) => {
        const relevance = calculateSemanticRelevance(interpretedQuery.searchTerm, [
          f.name, f.email, f.phone, f.address
        ])
        
        results.push({
          type: 'family',
          _id: f._id.toString(),
          title: f.name,
          subtitle: f.email || f.phone || '',
          url: `/families/${f._id}`,
          relevance,
          highlight: highlightMatch(f.name, interpretedQuery.searchTerm)
        })
      })
    }

    // Search members
    if (interpretedQuery.type === 'member' || interpretedQuery.type === 'all') {
      const userFamilies = await Family.find({ userId }).select('_id').lean()
      const userFamilyIds = userFamilies.map(f => f._id)

      const memberQuery: any = {
        familyId: { $in: userFamilyIds },
        $or: [
          { firstName: { $regex: interpretedQuery.searchTerm, $options: 'i' } },
          { lastName: { $regex: interpretedQuery.searchTerm, $options: 'i' } }
        ]
      }

      const members = await FamilyMember.find(memberQuery).limit(limit).lean()

      members.forEach((m: any) => {
        const fullName = `${m.firstName} ${m.lastName}`
        const relevance = calculateSemanticRelevance(interpretedQuery.searchTerm, [fullName])
        
        results.push({
          type: 'member',
          _id: m._id.toString(),
          title: fullName,
          subtitle: `Age: ${m.age || 'N/A'}`,
          url: `/families/${m.familyId}/members/${m._id}`,
          relevance,
          highlight: highlightMatch(fullName, interpretedQuery.searchTerm)
        })
      })
    }

    // Search payments
    if (interpretedQuery.type === 'payment' || interpretedQuery.type === 'all') {
      const paymentQuery: any = { userId }
      
      // Check if query contains amount
      const amountMatch = interpretedQuery.searchTerm.match(/\$?(\d+(?:\.\d{2})?)/)
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1])
        paymentQuery.amount = { $gte: amount * 0.9, $lte: amount * 1.1 }
      } else {
        paymentQuery.$or = [
          { description: { $regex: interpretedQuery.searchTerm, $options: 'i' } },
          { paymentMethod: { $regex: interpretedQuery.searchTerm, $options: 'i' } }
        ]
      }

      const payments = await Payment.find(paymentQuery).limit(limit).lean()

      payments.forEach((p: any) => {
        const relevance = calculateSemanticRelevance(interpretedQuery.searchTerm, [
          p.description, p.paymentMethod, p.amount?.toString()
        ])
        
        results.push({
          type: 'payment',
          _id: p._id.toString(),
          title: `$${p.amount?.toFixed(2)} - ${p.description || 'Payment'}`,
          subtitle: new Date(p.date).toLocaleDateString(),
          url: `/payments/${p._id}`,
          relevance,
          highlight: highlightMatch(p.description || '', interpretedQuery.searchTerm)
        })
      })
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance)

    // Generate suggestions based on query
    const suggestions = generateSuggestions(interpretedQuery.searchTerm, results)

    return NextResponse.json({
      results: results.slice(0, limit),
      suggestions,
      interpretedQuery,
      total: results.length
    })
  } catch (error: any) {
    console.error('Error in AI-enhanced search:', error)
    return NextResponse.json(
      { error: 'Failed to perform search', details: error.message },
      { status: 500 }
    )
  }
}

// Interpret natural language queries
function interpretNaturalLanguage(query: string): {
  type: 'family' | 'member' | 'payment' | 'all'
  searchTerm: string
  filters: any
} {
  const lowerQuery = query.toLowerCase()
  
  // Detect entity type
  let type: 'family' | 'member' | 'payment' | 'all' = 'all'
  if (lowerQuery.includes('family') || lowerQuery.includes('families')) {
    type = 'family'
  } else if (lowerQuery.includes('member') || lowerQuery.includes('person')) {
    type = 'member'
  } else if (lowerQuery.includes('payment') || lowerQuery.includes('paid') || lowerQuery.includes('$')) {
    type = 'payment'
  }

  // Extract search term (remove type keywords)
  let searchTerm = query
    .replace(/\b(family|families|member|members|person|people|payment|payments|paid)\b/gi, '')
    .trim()

  if (!searchTerm) {
    searchTerm = query
  }

  // Extract filters
  const filters: any = {}
  
  // Date filters
  if (lowerQuery.includes('today')) {
    filters.date = new Date()
  } else if (lowerQuery.includes('this week')) {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    filters.dateFrom = weekAgo
  } else if (lowerQuery.includes('this month')) {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    filters.dateFrom = monthAgo
  }

  return { type, searchTerm, filters }
}

// Calculate semantic relevance score
function calculateSemanticRelevance(query: string, fields: string[]): number {
  const lowerQuery = query.toLowerCase()
  let maxScore = 0

  fields.forEach(field => {
    if (!field) return
    
    const lowerField = field.toLowerCase()
    
    // Exact match
    if (lowerField === lowerQuery) {
      maxScore = Math.max(maxScore, 100)
      return
    }
    
    // Starts with
    if (lowerField.startsWith(lowerQuery)) {
      maxScore = Math.max(maxScore, 80)
      return
    }
    
    // Contains
    if (lowerField.includes(lowerQuery)) {
      maxScore = Math.max(maxScore, 60)
      return
    }
    
    // Word match
    const queryWords = lowerQuery.split(/\s+/)
    const fieldWords = lowerField.split(/\s+/)
    const matchingWords = queryWords.filter(qw => 
      fieldWords.some(fw => fw.includes(qw) || qw.includes(fw))
    )
    
    if (matchingWords.length > 0) {
      maxScore = Math.max(maxScore, (matchingWords.length / queryWords.length) * 50)
    }
  })

  return maxScore
}

// Highlight matching text
function highlightMatch(text: string, query: string): string {
  if (!text || !query) return text
  
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// Generate search suggestions
function generateSuggestions(query: string, results: any[]): string[] {
  const suggestions: string[] = []
  
  if (results.length === 0) {
    suggestions.push(`Search for families named "${query}"`)
    suggestions.push(`Find payments for "${query}"`)
    suggestions.push(`Look for members with "${query}"`)
  } else {
    const types = [...new Set(results.map(r => r.type))]
    types.forEach(type => {
      suggestions.push(`Show all ${type}s`)
    })
  }
  
  return suggestions
}

