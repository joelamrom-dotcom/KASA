import { ReportDrillDown, CustomReport } from '@/lib/models'
import connectDB from '@/lib/database'
import mongoose from 'mongoose'

export class ReportDrillDownService {
  /**
   * Execute drill-down from a source field value
   */
  static async executeDrillDown(
    reportId: string,
    sourceField: string,
    sourceValue: any,
    userId: string
  ): Promise<any> {
    await connectDB()

    const drillDownConfig = await ReportDrillDown.findOne({ reportId })
    if (!drillDownConfig) {
      throw new Error('Drill-down not configured for this report')
    }

    const config = drillDownConfig.configurations?.find(
      (c: any) => c.sourceField === sourceField
    )

    if (!config) {
      // Use default behavior - show related records
      return this.getDefaultDrillDown(sourceField, sourceValue, userId)
    }

    // Execute custom drill-down
    if (config.targetReport) {
      return this.executeReportDrillDown(config, sourceValue, userId)
    }

    if (config.customQuery) {
      return this.executeCustomQuery(config.customQuery, sourceValue, userId)
    }

    return this.getDefaultDrillDown(sourceField, sourceValue, userId)
  }

  /**
   * Get default drill-down (show related records)
   */
  private static async getDefaultDrillDown(
    sourceField: string,
    sourceValue: any,
    userId: string
  ): Promise<any> {
    // Extract model name from field (e.g., 'payment.amount' -> 'Payment')
    const parts = sourceField.split('.')
    const modelName = parts[0]
    const fieldName = parts.length > 1 ? parts[1] : '_id'

    // Map model names to actual models
    const models = require('@/lib/models')
    const modelMap: Record<string, any> = {
      'payment': models.Payment,
      'family': models.Family,
      'member': models.FamilyMember,
      'event': models.LifecycleEvent,
      'statement': models.Statement,
    }

    const Model = modelMap[modelName.toLowerCase()]
    if (!Model) {
      throw new Error(`Unknown model: ${modelName}`)
    }

    // Build query
    const query: any = { userId: new mongoose.Types.ObjectId(userId) }
    query[fieldName] = sourceValue

    // Get related records
    const recordsRaw = await Model.find(query).limit(100).lean()
    const records = recordsRaw as any

    // Get related records from other models
    const relatedRecords: any[] = []
    if (modelName.toLowerCase() === 'payment') {
      // Get family for this payment
      const paymentsRaw = await Model.find(query).populate('familyId').limit(10).lean()
      const payments = paymentsRaw as any
      relatedRecords.push(...payments.map((p: any) => ({
        type: 'family',
        record: p.familyId,
      })))
    }

    return {
      sourceField,
      sourceValue,
      records,
      relatedRecords,
      totalCount: records.length,
    }
  }

  /**
   * Execute drill-down to another report
   */
  private static async executeReportDrillDown(
    config: any,
    sourceValue: any,
    userId: string
  ): Promise<any> {
    await connectDB()

    const targetReportRaw = await CustomReport.findById(config.targetReport).lean()
    const targetReport = targetReportRaw as any
    if (!targetReport) {
      throw new Error('Target report not found')
    }

    // Apply field mappings to create filters
    const filters: any[] = []
    if (config.fieldMappings) {
      for (const mapping of config.fieldMappings) {
        filters.push({
          fieldName: mapping.targetField,
          operator: mapping.mappingType === 'equals' ? 'equals' : 'contains',
          value: sourceValue,
        })
      }
    }

    // Generate report with filters
    // This would call the report generation service
    return {
      targetReport: {
        _id: targetReport._id,
        name: targetReport.name,
      },
      filters,
      displayOptions: config.displayOptions,
    }
  }

  /**
   * Execute custom query drill-down
   */
  private static async executeCustomQuery(
    customQuery: any,
    sourceValue: any,
    userId: string
  ): Promise<any> {
    // Replace placeholders in query with source value
    const query = JSON.parse(JSON.stringify(customQuery))
    const queryStr = JSON.stringify(query)
    const replacedQuery = queryStr.replace(/\{\{value\}\}/g, sourceValue)
    const finalQuery = JSON.parse(replacedQuery)

    // Execute query based on query type
    // This is a simplified version - would need full query execution logic
    return {
      query: finalQuery,
      results: [],
    }
  }

  /**
   * Configure drill-down for a report
   */
  static async configureDrillDown(
    reportId: string,
    configurations: any[]
  ): Promise<any> {
    await connectDB()

    let drillDown = await ReportDrillDown.findOne({ reportId })
    if (!drillDown) {
      drillDown = await ReportDrillDown.create({
        reportId,
        configurations,
        defaultBehavior: {
          enabled: true,
          showRelatedRecords: true,
          showDetails: true,
        },
      })
    } else {
      drillDown.configurations = configurations
      await drillDown.save()
    }

    return drillDown
  }

  /**
   * Get drill-down configuration for a report
   */
  static async getDrillDownConfig(reportId: string): Promise<any> {
    await connectDB()

    const drillDownRaw = await ReportDrillDown.findOne({ reportId })
      .populate('configurations.targetReport', 'name description')
      .lean()
    const drillDown = drillDownRaw as any

    return drillDown
  }
}

