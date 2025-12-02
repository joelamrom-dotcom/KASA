import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, FamilyMember, Payment } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - AI-powered semantic search
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

    // Enhanced search with semantic matching
    const results: any[] = []

    // Search families (name, email, phone, address)
    const families = await Family.find({
      userId,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } }
      ]
    }).limit(limit).lean()

    families.forEach((f: any) => {
      results.push({
        type: 'family',
        _id: f._id.toString(),
        title: f.name,
        subtitle: f.email || f.phone || '',
        url: `/families/${f._id}`,
        relevance: calculateRelevance(query, f.name, f.email)
      })
    })

    // Search members
    const userFamilies = await Family.find({ userId }).select('_id').lean()
    const userFamilyIds = userFamilies.map(f => f._id)

    const members = await FamilyMember.find({
      familyId: { $in: userFamilyIds },
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } }
      ]
    }).limit(limit).lean()

    members.forEach((m: any) => {
      results.push({
        type: 'member',
        _id: m._id.toString(),
        title: `${m.firstName} ${m.lastName}`,
        subtitle: 'Family member',
        url: `/families/${m.familyId}?member=${m._id}`,
        relevance: calculateRelevance(query, `${m.firstName} ${m.lastName}`)
      })
    })

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance)

    return NextResponse.json({
      results: results.slice(0, limit),
      count: results.length
    })
  } catch (error: any) {
    console.error('Error performing AI search:', error)
    return NextResponse.json(
      { error: 'Failed to perform search', details: error.message },
      { status: 500 }
    )
  }
}

function calculateRelevance(query: string, ...texts: (string | undefined)[]): number {
  const queryLower = query.toLowerCase()
  let score = 0

  texts.forEach(text => {
    if (!text) return
    const textLower = text.toLowerCase()
    
    if (textLower === queryLower) {
      score += 100
    } else if (textLower.startsWith(queryLower)) {
      score += 80
    } else if (textLower.includes(queryLower)) {
      score += 50
    } else {
      // Fuzzy match
      const similarity = calculateSimilarity(queryLower, textLower)
      score += similarity * 30
    }
  })

  return score
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

