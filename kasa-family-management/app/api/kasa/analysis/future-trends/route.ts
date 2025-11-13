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
