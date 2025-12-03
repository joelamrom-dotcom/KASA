import { ReportDependency, CustomReport } from '@/lib/models'
import connectDB from '@/lib/database'
import mongoose from 'mongoose'

export class ReportDependencyService {
  /**
   * Analyze and create/update dependencies for a report
   */
  static async analyzeDependencies(reportId: string, reportDefinition: any): Promise<any> {
    await connectDB()

    const dataSources: any[] = []
    const dependsOnReports: string[] = []

    // Extract data sources from fields
    if (reportDefinition.fields) {
      for (const field of reportDefinition.fields) {
        const fieldName = field.fieldName || ''
        const parts = fieldName.split('.')
        if (parts.length > 0) {
          const sourceModel = parts[0]
          dataSources.push({
            sourceType: 'model',
            sourceName: sourceModel,
            sourcePath: fieldName,
            isRequired: true,
            lastVerified: new Date(),
          })
        }
      }
    }

    // Extract data sources from filters
    if (reportDefinition.filters) {
      for (const filter of reportDefinition.filters) {
        const fieldName = filter.fieldName || ''
        const parts = fieldName.split('.')
        if (parts.length > 0) {
          const sourceModel = parts[0]
          if (!dataSources.find(ds => ds.sourceName === sourceModel)) {
            dataSources.push({
              sourceType: 'model',
              sourceName: sourceModel,
              sourcePath: fieldName,
              isRequired: false,
              lastVerified: new Date(),
            })
          }
        }
      }
    }

    // Check for cross-report dependencies (if report references other reports)
    // This would need to be determined from report definition or metadata

    // Create or update dependency record
    let dependency = await ReportDependency.findOne({ reportId })
    if (!dependency) {
      dependency = await ReportDependency.create({
        reportId,
        dataSources,
        dependsOnReports,
        dependentReports: [],
        impactAnalysis: {
          lastAnalyzed: new Date(),
          affectedUsers: [],
          estimatedImpact: 'medium',
          changeHistory: [],
        },
      })
    } else {
      dependency.dataSources = dataSources
      dependency.dependsOnReports = dependsOnReports
      dependency.impactAnalysis.lastAnalyzed = new Date()
      await dependency.save()
    }

    return dependency
  }

  /**
   * Find all reports that depend on a specific data source
   */
  static async findReportsByDataSource(sourceName: string): Promise<any[]> {
    await connectDB()

    const dependencies = await ReportDependency.find({
      'dataSources.sourceName': sourceName,
    })
      .populate('reportId', 'name description')
      .lean()

    return dependencies.map(dep => ({
      reportId: dep.reportId,
      reportName: (dep.reportId as any)?.name,
      dependency: dep,
    }))
  }

  /**
   * Get impact analysis for a data source change
   */
  static async analyzeImpact(sourceName: string, changeType: string): Promise<any> {
    await connectDB()

    const affectedReports = await this.findReportsByDataSource(sourceName)
    const affectedUsers = new Set<string>()

    // Get all users who have access to affected reports
    for (const report of affectedReports) {
      const reportDoc = await CustomReport.findById(report.reportId).select('userId').lean()
      if (reportDoc) {
        affectedUsers.add((reportDoc.userId as any).toString())
      }
    }

    // Calculate impact level
    let impactLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (affectedReports.length > 20) {
      impactLevel = 'critical'
    } else if (affectedReports.length > 10) {
      impactLevel = 'high'
    } else if (affectedReports.length > 5) {
      impactLevel = 'medium'
    }

    return {
      sourceName,
      changeType,
      affectedReports: affectedReports.length,
      affectedUsers: affectedUsers.size,
      impactLevel,
      reports: affectedReports,
      recommendations: this.getRecommendations(impactLevel, affectedReports.length),
    }
  }

  /**
   * Get recommendations based on impact
   */
  private static getRecommendations(
    impactLevel: string,
    reportCount: number
  ): string[] {
    const recommendations: string[] = []

    if (impactLevel === 'critical' || impactLevel === 'high') {
      recommendations.push('Notify all affected users before making changes')
      recommendations.push('Consider creating a migration plan')
      recommendations.push('Test changes in a staging environment first')
    }

    if (reportCount > 0) {
      recommendations.push(`Review ${reportCount} affected report(s)`)
      recommendations.push('Update report definitions if necessary')
    }

    return recommendations
  }

  /**
   * Get dependency graph for a report
   */
  static async getDependencyGraph(reportId: string): Promise<any> {
    await connectDB()

    const dependency = await ReportDependency.findOne({ reportId })
      .populate('dependsOnReports', 'name')
      .populate('dependentReports', 'name')
      .lean()

    if (!dependency) {
      return { nodes: [], edges: [] }
    }

    const nodes: any[] = [
      {
        id: reportId,
        label: (dependency.reportId as any)?.name || 'Report',
        type: 'report',
      },
    ]

    const edges: any[] = []

    // Add data source nodes
    const dataSources = new Set<string>()
    dependency.dataSources?.forEach((ds: any) => {
      if (!dataSources.has(ds.sourceName)) {
        dataSources.add(ds.sourceName)
        nodes.push({
          id: `source_${ds.sourceName}`,
          label: ds.sourceName,
          type: 'dataSource',
        })
        edges.push({
          from: `source_${ds.sourceName}`,
          to: reportId,
          type: 'depends_on',
        })
      }
    })

    // Add dependent report nodes
    dependency.dependsOnReports?.forEach((depReport: any) => {
      nodes.push({
        id: depReport._id.toString(),
        label: depReport.name,
        type: 'report',
      })
      edges.push({
        from: depReport._id.toString(),
        to: reportId,
        type: 'depends_on',
      })
    })

    // Add reports that depend on this report
    dependency.dependentReports?.forEach((depReport: any) => {
      nodes.push({
        id: depReport._id.toString(),
        label: depReport.name,
        type: 'report',
      })
      edges.push({
        from: reportId,
        to: depReport._id.toString(),
        type: 'used_by',
      })
    })

    return { nodes, edges }
  }

  /**
   * Update dependent reports when a data source changes
   */
  static async updateDependentReports(
    sourceName: string,
    changeDescription: string,
    changedBy: string
  ): Promise<void> {
    await connectDB()

    const dependencies = await ReportDependency.find({
      'dataSources.sourceName': sourceName,
    })

    for (const dep of dependencies) {
      dep.impactAnalysis.changeHistory.push({
        changedAt: new Date(),
        changedBy: changedBy as any,
        changeType: 'data_source_changed',
        description: changeDescription,
      })
      await dep.save()
    }
  }
}

