import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportShareService } from '@/lib/services/ReportShareService'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET - Get all shares for a report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasPermission(user, PERMISSIONS.REPORTS_VIEW))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const shares = await ReportShareService.getReportShares(params.id)

    return NextResponse.json({ shares })
  } catch (error: any) {
    console.error('Error fetching shares:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shares', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Share report
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasPermission(user, PERMISSIONS.REPORTS_UPDATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { shareType, sharedWith, roleId, permissions, linkOptions } = body

    let share: any

    switch (shareType) {
      case 'user':
        if (!sharedWith) {
          return NextResponse.json({ error: 'sharedWith is required for user share' }, { status: 400 })
        }
        share = await ReportShareService.shareWithUser(
          params.id,
          user.userId,
          sharedWith,
          permissions || {}
        )
        break

      case 'role':
        if (!roleId) {
          return NextResponse.json({ error: 'roleId is required for role share' }, { status: 400 })
        }
        share = await ReportShareService.shareWithRole(
          params.id,
          user.userId,
          roleId,
          permissions || {}
        )
        break

      case 'link':
        const linkResult = await ReportShareService.createShareLink(
          params.id,
          user.userId,
          linkOptions || {}
        )
        return NextResponse.json({ share: linkResult.share, shareUrl: linkResult.shareUrl }, { status: 201 })

      default:
        return NextResponse.json({ error: 'Invalid shareType' }, { status: 400 })
    }

    return NextResponse.json({ share }, { status: 201 })
  } catch (error: any) {
    console.error('Error sharing report:', error)
    return NextResponse.json(
      { error: 'Failed to share report', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Revoke a share
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const shareId = searchParams.get('shareId')

    if (!shareId) {
      return NextResponse.json({ error: 'shareId is required' }, { status: 400 })
    }

    await ReportShareService.revokeShare(shareId, user.userId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error revoking share:', error)
    return NextResponse.json(
      { error: 'Failed to revoke share', details: error.message },
      { status: 500 }
    )
  }
}

