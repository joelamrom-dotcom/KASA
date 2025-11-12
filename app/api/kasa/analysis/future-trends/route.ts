import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, FamilyMember, LifecycleEventPayment } from '@/lib/models'
import { performAnalysis } from '@/lib/ml-analysis'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const yearsAhead = parseInt(searchParams.get('years') || '10')
    
    // Fetch all data needed for analysis
    const families = await Family.find({}).lean()
    const members = await FamilyMember.find({}).lean()
    const lifecycleEvents = await LifecycleEventPayment.find({}).lean()
    
    // Prepare data for analysis
    const analysisData = {
      families: families.map((f: any) => ({
        _id: (f._id as any)?.toString() || String(f._id),
        weddingDate: f.weddingDate ? (f.weddingDate as Date).toISOString() : null,
        name: f.name,
        createdAt: f.createdAt ? (f.createdAt as Date).toISOString() : null
      })),
      members: members.map((m: any) => ({
        _id: (m._id as any)?.toString() || String(m._id),
        familyId: (m.familyId as any)?.toString() || String(m.familyId),
        birthDate: m.birthDate ? (m.birthDate as Date).toISOString() : null,
        weddingDate: m.weddingDate ? (m.weddingDate as Date).toISOString() : null,
        gender: m.gender
      })),
      lifecycleEvents: lifecycleEvents.map((e: any) => ({
        _id: (e._id as any)?.toString() || String(e._id),
        eventType: e.eventType,
        eventDate: e.eventDate ? (e.eventDate as Date).toISOString() : null,
        year: e.year
      }))
    }
    
    // Use TypeScript ML analysis
    const result = performAnalysis(analysisData, yearsAhead)
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in analysis API:', error)
    return NextResponse.json(
      { error: 'Failed to perform analysis', details: error.message },
      { status: 500 }
    )
  }
}

// TypeScript fallback analysis (DEPRECATED - Python only now)
// Kept for reference but not used
async function performTypeScriptAnalysis(data: any, yearsAhead: number) {
  const currentYear = new Date().getFullYear()
  
  // Analyze children by year
  const historicalChildren: { [year: number]: number } = {}
  const historicalBirths: { [year: number]: number } = {}
  
  for (const member of data.members) {
    if (member.birthDate) {
      const birthDate = new Date(member.birthDate)
      const birthYear = birthDate.getFullYear()
      historicalBirths[birthYear] = (historicalBirths[birthYear] || 0) + 1
    }
  }
  
  // Count children alive per year
  for (let year = currentYear - 10; year <= currentYear; year++) {
    let count = 0
    for (const member of data.members) {
      if (member.birthDate) {
        const birthDate = new Date(member.birthDate)
        const referenceDate = new Date(year, 11, 31)
        if (birthDate <= referenceDate) {
          const weddingDate = member.weddingDate ? new Date(member.weddingDate) : null
          if (!weddingDate || weddingDate.getFullYear() > year) {
            count++
          }
        }
      }
    }
    historicalChildren[year] = count
  }
  
  const historicalValues = Object.values(historicalChildren)
  const avgChildren = historicalValues.length > 0 
    ? historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length 
    : 0
  
  // Predictions
  const childrenPredictions: { [year: number]: any } = {}
  for (let year = currentYear + 1; year <= currentYear + yearsAhead; year++) {
    const predicted = Math.max(0, Math.round(avgChildren))
    childrenPredictions[year] = {
      predicted,
      range_min: Math.max(0, Math.round(predicted * 0.8)),
      range_max: Math.round(predicted * 1.2),
      confidence: 'medium'
    }
  }
  
  // Analyze weddings
  const historicalWeddings: { [year: number]: number } = {}
  for (const family of data.families) {
    if (family.weddingDate) {
      const year = new Date(family.weddingDate).getFullYear()
      historicalWeddings[year] = (historicalWeddings[year] || 0) + 1
    }
  }
  for (const member of data.members) {
    if (member.weddingDate) {
      const year = new Date(member.weddingDate).getFullYear()
      historicalWeddings[year] = (historicalWeddings[year] || 0) + 1
    }
  }
  
  const weddingValues = Object.values(historicalWeddings)
  const avgWeddings = weddingValues.length > 0
    ? weddingValues.reduce((a, b) => a + b, 0) / weddingValues.length
    : 0
  
  const weddingPredictions: { [year: number]: any } = {}
  for (let year = currentYear + 1; year <= currentYear + yearsAhead; year++) {
    const predicted = Math.max(0, Math.round(avgWeddings))
    weddingPredictions[year] = {
      predicted,
      range_min: Math.max(0, Math.round(predicted * 0.5)),
      range_max: Math.round(predicted * 1.5),
      confidence: 'medium'
    }
  }
  
  // Family stability
  const childrenPerFamily = data.families.map((f: any) => 
    data.members.filter((m: any) => m.familyId === f._id).length
  )
  const avgChildrenPerFamily = childrenPerFamily.length > 0
    ? childrenPerFamily.reduce((a: number, b: number) => a + b, 0) / childrenPerFamily.length
    : 0
  
  const stabilityPredictions: { [year: number]: any } = {}
  const familyCounts = Object.values(historicalWeddings)
  const avgNewFamilies = familyCounts.length > 0
    ? familyCounts.reduce((a: number, b: number) => a + b, 0) / familyCounts.length
    : 0
  
  for (let year = currentYear + 1; year <= currentYear + yearsAhead; year++) {
    const yearsFromNow = year - currentYear
    const predictedNew = Math.round(avgNewFamilies * yearsFromNow)
    stabilityPredictions[year] = {
      total_families: data.families.length + predictedNew,
      new_families: predictedNew,
      avg_children_per_family: Math.round(avgChildrenPerFamily * 10) / 10,
      stability_score: avgChildrenPerFamily >= 2 ? 'high' : avgChildrenPerFamily >= 1 ? 'medium' : 'low'
    }
  }
  
  return {
    analysis_date: new Date().toISOString(),
    years_ahead: yearsAhead,
    ml_used: false,
    analysis_system: 'TypeScript (Statistical)',
    children_analysis: {
      historical: historicalChildren,
      historical_births: historicalBirths,
      statistics: {
        average: avgChildren,
        median: historicalValues.length > 0 ? [...historicalValues].sort()[Math.floor(historicalValues.length / 2)] : 0,
        min: historicalValues.length > 0 ? Math.min(...historicalValues) : 0,
        max: historicalValues.length > 0 ? Math.max(...historicalValues) : 0,
        trend: historicalValues.length >= 3 
          ? (historicalValues[historicalValues.length - 1] > historicalValues[0] ? 'growing' : 'stable')
          : 'stable'
      },
      predictions: childrenPredictions
    },
    weddings_analysis: {
      historical: historicalWeddings,
      statistics: {
        average: avgWeddings,
        median: weddingValues.length > 0 ? [...weddingValues].sort()[Math.floor(weddingValues.length / 2)] : 0,
        total_historical: weddingValues.reduce((a, b) => a + b, 0)
      },
      predictions: weddingPredictions
    },
    stability_analysis: {
      current_stats: {
        total_families: data.families.length,
        total_members: data.members.length,
        avg_children_per_family: Math.round(avgChildrenPerFamily * 100) / 100,
        families_with_children: data.families.filter((f: any) => 
          data.members.some((m: any) => m.familyId === f._id)
        ).length
      },
      historical_families: historicalWeddings,
      predictions: stabilityPredictions
    }
  }
}

