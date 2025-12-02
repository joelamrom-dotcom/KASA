import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportShareService } from '@/lib/services/ReportShareService'

export const dynamic = 'force-dynamic'

// GET - Access report via share link
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const password = searchParams.get('password')
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    const share = await ReportShareService.validateShareLink(
      params.token,
      password || undefined,
      ipAddress
    )

    return NextResponse.json({ share })
  } catch (error: any) {
    console.error('Error validating share link:', error)
    return NextResponse.json(
      { error: error.message || 'Invalid or expired share link' },
      { status: 403 }
    )
  }
}

