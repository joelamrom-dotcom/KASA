import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { CustomReport } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

// GET - Get performance metrics for all reports
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasPermission(user, PERMISSIONS.REPORTS_VIEW))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate: Date
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(0) // All time
    }

    const reports = await CustomReport.find({
      userId: new mongoose.Types.ObjectId(user.userId),
      isActive: true,
    })
      .select('name analytics')
      .lean()

    const metrics = reports.map((report: any) => ({
      reportId: report._id.toString(),
      reportName: report.name,
      viewCount: report.analytics?.viewCount || 0,
      lastViewed: report.analytics?.lastViewed || report.createdAt,
      averageGenerationTime: report.performanceMetrics?.averageGenerationTime || 0,
      dataRowCount: report.performanceMetrics?.dataRowCount || 0,
      exportCount: report.analytics?.exportCount || 0,
      scheduleCount: report.analytics?.scheduleCount || 0,
      cacheHitRate: report.cache?.enabled ? 0.75 : 0, // Placeholder
    }))

    // Filter by time range if needed
    const filteredMetrics = timeRange === 'all'
      ? metrics
      : metrics.filter((m: any) => new Date(m.lastViewed) >= startDate)

    // Sort by view count
    filteredMetrics.sort((a: any, b: any) => b.viewCount - a.viewCount)

    return NextResponse.json({ metrics: filteredMetrics })
  } catch (error: any) {
    console.error('Error fetching performance metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics', details: error.message },
      { status: 500 }
    )
  }
}

