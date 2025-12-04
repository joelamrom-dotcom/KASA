import { ReportVersion, CustomReport } from '@/lib/models'
import connectDB from '@/lib/database'

export class ReportVersionService {
  /**
   * Create a new version of a report
   */
  static async createVersion(
    reportId: string,
    userId: string,
    description?: string
  ) {
    await connectDB()

    const report = await CustomReport.findById(reportId)
    if (!report) {
      throw new Error('Report not found')
    }

    // Get the current version number
    const latestVersionRaw = await ReportVersion.findOne({ reportId })
      .sort({ version: -1 })
      .lean()
    const latestVersion = latestVersionRaw as any

    const nextVersion = (latestVersion?.version || 0) + 1

    // Mark all previous versions as not current
    await ReportVersion.updateMany(
      { reportId, isCurrent: true },
      { isCurrent: false }
    )

    // Create new version
    const version = await ReportVersion.create({
      reportId,
      version: nextVersion,
      createdBy: userId,
      description: description || `Version ${nextVersion}`,
      reportDefinition: report.toObject(),
      isCurrent: true,
    })

    // Update report history
    report.reportHistory = report.reportHistory || []
    report.reportHistory.push({
      version: nextVersion,
      changedBy: userId as any,
      changedAt: new Date(),
      changes: description || `Version ${nextVersion}`,
      snapshot: report.toObject(),
    })
    await report.save()

    return version
  }

  /**
   * Get all versions of a report
   */
  static async getVersionsByReport(reportId: string) {
    await connectDB()

    const versionsRaw = await ReportVersion.find({ reportId })
      .sort({ version: -1 })
      .populate('createdBy', 'firstName lastName email')
      .lean()
    const versions = versionsRaw as any

    return versions
  }

  /**
   * Get a specific version by ID
   */
  static async getVersionById(versionId: string) {
    await connectDB()

    const versionRaw = await ReportVersion.findById(versionId)
      .populate('createdBy', 'firstName lastName email')
      .populate('reportId', 'name description')
      .lean()
    const version = versionRaw as any

    return version
  }

  /**
   * Get the current version of a report
   */
  static async getCurrentVersion(reportId: string) {
    await connectDB()

    const versionRaw = await ReportVersion.findOne({ reportId, isCurrent: true })
      .populate('createdBy', 'firstName lastName email')
      .lean()
    const version = versionRaw as any

    return version
  }

  /**
   * Restore a report to a previous version
   */
  static async restoreVersion(versionId: string, userId: string) {
    await connectDB()

    const version = await ReportVersion.findById(versionId)
    if (!version) {
      throw new Error('Version not found')
    }

    const report = await CustomReport.findById(version.reportId)
    if (!report) {
      throw new Error('Report not found')
    }

    // Create a new version from the current state before restoring
    await this.createVersion(version.reportId.toString(), userId, 'Backup before restore')

    // Restore the report definition
    const restoredDefinition = version.reportDefinition
    Object.assign(report, restoredDefinition)
    await report.save()

    // Mark this version as current
    await ReportVersion.updateMany(
      { reportId: version.reportId, isCurrent: true },
      { isCurrent: false }
    )
    version.isCurrent = true
    await version.save()

    return { success: true, report }
  }

  /**
   * Compare two versions
   */
  static async compareVersions(versionId1: string, versionId2: string) {
    await connectDB()

    const [version1Raw, version2Raw] = await Promise.all([
      ReportVersion.findById(versionId1).lean(),
      ReportVersion.findById(versionId2).lean(),
    ])
    const version1 = version1Raw as any
    const version2 = version2Raw as any

    if (!version1 || !version2) {
      throw new Error('One or both versions not found')
    }

    if (version1.reportId.toString() !== version2.reportId.toString()) {
      throw new Error('Versions are from different reports')
    }

    // Compare report definitions
    const comparison = {
      version1: {
        version: version1.version,
        createdBy: version1.createdBy,
        createdAt: version1.createdAt,
        description: version1.description,
      },
      version2: {
        version: version2.version,
        createdBy: version2.createdBy,
        createdAt: version2.createdAt,
        description: version2.description,
      },
      differences: this.compareDefinitions(version1.reportDefinition, version2.reportDefinition),
    }

    return comparison
  }

  /**
   * Compare two report definitions and return differences
   */
  private static compareDefinitions(def1: any, def2: any): any {
    const differences: any = {
      fields: [],
      filters: [],
      dateRange: null,
      groupBy: null,
      sortBy: null,
    }

    // Compare fields
    if (JSON.stringify(def1.fields) !== JSON.stringify(def2.fields)) {
      differences.fields.push({
        type: 'changed',
        old: def1.fields,
        new: def2.fields,
      })
    }

    // Compare filters
    if (JSON.stringify(def1.filters) !== JSON.stringify(def2.filters)) {
      differences.filters.push({
        type: 'changed',
        old: def1.filters,
        new: def2.filters,
      })
    }

    // Compare date range
    if (JSON.stringify(def1.dateRange) !== JSON.stringify(def2.dateRange)) {
      differences.dateRange = {
        old: def1.dateRange,
        new: def2.dateRange,
      }
    }

    // Compare groupBy
    if (JSON.stringify(def1.groupBy) !== JSON.stringify(def2.groupBy)) {
      differences.groupBy = {
        old: def1.groupBy,
        new: def2.groupBy,
      }
    }

    // Compare sortBy
    if (def1.sortBy !== def2.sortBy || def1.sortOrder !== def2.sortOrder) {
      differences.sortBy = {
        old: { sortBy: def1.sortBy, sortOrder: def1.sortOrder },
        new: { sortBy: def2.sortBy, sortOrder: def2.sortOrder },
      }
    }

    return differences
  }
}

