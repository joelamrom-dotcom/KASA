import { ReportSnapshot, CustomReport } from '@/lib/models'
import connectDB from '@/lib/database'

export class ReportSnapshotService {
  /**
   * Create a snapshot of a report at the current point in time
   */
  static async createSnapshot(
    reportId: string,
    userId: string,
    name: string,
    description?: string,
    data?: any,
    summary?: any
  ) {
    await connectDB()

    const report = await CustomReport.findById(reportId)
    if (!report) {
      throw new Error('Report not found')
    }

    // If data is not provided, execute the report to get current data
    if (!data) {
      // This would call the report execution service
      // For now, we'll store empty data and it can be populated later
      data = {}
    }

    // Calculate metadata
    const metadata = {
      recordCount: Array.isArray(data) ? data.length : 0,
      totalAmount: summary?.totalAmount || 0,
      averageAmount: summary?.averageAmount || 0,
      dateRange: {
        startDate: report.dateRange?.startDate || new Date(),
        endDate: report.dateRange?.endDate || new Date(),
      },
    }

    const snapshot = await ReportSnapshot.create({
      reportId,
      userId,
      name,
      description,
      snapshotDate: new Date(),
      data,
      summary: summary || {},
      metadata,
    })

    return snapshot
  }

  /**
   * Get all snapshots for a report
   */
  static async getSnapshotsByReport(reportId: string, userId?: string) {
    await connectDB()

    const query: any = { reportId }
    if (userId) {
      query.userId = userId
    }

    const snapshots = await ReportSnapshot.find(query)
      .sort({ snapshotDate: -1 })
      .populate('userId', 'firstName lastName email')
      .lean()

    return snapshots
  }

  /**
   * Get a specific snapshot by ID
   */
  static async getSnapshotById(snapshotId: string, userId?: string) {
    await connectDB()

    const query: any = { _id: snapshotId }
    if (userId) {
      query.userId = userId
    }

    const snapshot = await ReportSnapshot.findOne(query)
      .populate('userId', 'firstName lastName email')
      .populate('reportId', 'name description')
      .lean()

    return snapshot
  }

  /**
   * Compare two snapshots
   */
  static async compareSnapshots(snapshotId1: string, snapshotId2: string) {
    await connectDB()

    const [snapshot1, snapshot2] = await Promise.all([
      ReportSnapshot.findById(snapshotId1).lean(),
      ReportSnapshot.findById(snapshotId2).lean(),
    ])

    if (!snapshot1 || !snapshot2) {
      throw new Error('One or both snapshots not found')
    }

    // Compare metadata
    const comparison = {
      recordCount: {
        snapshot1: snapshot1.metadata?.recordCount || 0,
        snapshot2: snapshot2.metadata?.recordCount || 0,
        difference: (snapshot2.metadata?.recordCount || 0) - (snapshot1.metadata?.recordCount || 0),
        percentChange: snapshot1.metadata?.recordCount
          ? (((snapshot2.metadata?.recordCount || 0) - (snapshot1.metadata?.recordCount || 0)) / snapshot1.metadata.recordCount) * 100
          : 0,
      },
      totalAmount: {
        snapshot1: snapshot1.metadata?.totalAmount || 0,
        snapshot2: snapshot2.metadata?.totalAmount || 0,
        difference: (snapshot2.metadata?.totalAmount || 0) - (snapshot1.metadata?.totalAmount || 0),
        percentChange: snapshot1.metadata?.totalAmount
          ? (((snapshot2.metadata?.totalAmount || 0) - (snapshot1.metadata?.totalAmount || 0)) / snapshot1.metadata.totalAmount) * 100
          : 0,
      },
      averageAmount: {
        snapshot1: snapshot1.metadata?.averageAmount || 0,
        snapshot2: snapshot2.metadata?.averageAmount || 0,
        difference: (snapshot2.metadata?.averageAmount || 0) - (snapshot1.metadata?.averageAmount || 0),
        percentChange: snapshot1.metadata?.averageAmount
          ? (((snapshot2.metadata?.averageAmount || 0) - (snapshot1.metadata?.averageAmount || 0)) / snapshot1.metadata.averageAmount) * 100
          : 0,
      },
      dateRange: {
        snapshot1: snapshot1.metadata?.dateRange,
        snapshot2: snapshot2.metadata?.dateRange,
      },
      snapshot1,
      snapshot2,
    }

    return comparison
  }

  /**
   * Delete a snapshot
   */
  static async deleteSnapshot(snapshotId: string, userId: string) {
    await connectDB()

    const snapshot = await ReportSnapshot.findOne({ _id: snapshotId, userId })
    if (!snapshot) {
      throw new Error('Snapshot not found or access denied')
    }

    await ReportSnapshot.deleteOne({ _id: snapshotId })
    return { success: true }
  }

  /**
   * Get historical trend data for a report
   */
  static async getHistoricalTrends(reportId: string, startDate?: Date, endDate?: Date) {
    await connectDB()

    const query: any = { reportId }
    if (startDate || endDate) {
      query.snapshotDate = {}
      if (startDate) query.snapshotDate.$gte = startDate
      if (endDate) query.snapshotDate.$lte = endDate
    }

    const snapshots = await ReportSnapshot.find(query)
      .sort({ snapshotDate: 1 })
      .select('snapshotDate metadata summary')
      .lean()

    // Format for trend analysis
    const trends = snapshots.map((snapshot) => ({
      date: snapshot.snapshotDate,
      recordCount: snapshot.metadata?.recordCount || 0,
      totalAmount: snapshot.metadata?.totalAmount || 0,
      averageAmount: snapshot.metadata?.averageAmount || 0,
    }))

    return trends
  }
}

