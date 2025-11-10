import { NextRequest, NextResponse } from 'next/server'
import { convertMembersOnWeddingDate } from '@/lib/wedding-converter'

// POST - Manually trigger wedding date conversions (for testing or manual runs)
export async function POST(request: NextRequest) {
  try {
    const result = await convertMembersOnWeddingDate()
    return NextResponse.json({
      message: 'Wedding date conversion completed',
      converted: result.converted,
      members: result.members.map((m: any) => ({
        id: m._id,
        name: `${m.firstName} ${m.lastName}`,
        weddingDate: m.weddingDate
      }))
    })
  } catch (error: any) {
    console.error('Error converting members on wedding date:', error)
    return NextResponse.json(
      { error: 'Failed to convert members on wedding date', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Check for members scheduled for conversion today
export async function GET(request: NextRequest) {
  try {
    const { convertMembersOnWeddingDate } = await import('@/lib/wedding-converter')
    const result = await convertMembersOnWeddingDate()
    return NextResponse.json({
      message: 'Wedding date conversion check completed',
      converted: result.converted,
      members: result.members.map((m: any) => ({
        id: m._id,
        name: `${m.firstName} ${m.lastName}`,
        weddingDate: m.weddingDate
      }))
    })
  } catch (error: any) {
    console.error('Error checking wedding date conversions:', error)
    return NextResponse.json(
      { error: 'Failed to check wedding date conversions', details: error.message },
      { status: 500 }
    )
  }
}

