import { CustomReport } from '@/lib/models'
import { connectDB } from '@/lib/database'
import mongoose from 'mongoose'

export class ReportBuilderService {
  /**
   * Apply row-level security filters to a query
   */
  static applyRowLevelSecurity(
    query: any,
    report: any,
    user: any
  ): any {
    if (!report.rowLevelSecurity?.enabled || !report.rowLevelSecurity?.rules) {
      return query
    }

    const securityQuery: any = {}

    for (const rule of report.rowLevelSecurity.rules) {
      let value: any

      // Handle special user fields
      if (rule.value === 'userId') {
        value = user.userId
      } else if (rule.value === 'role') {
        value = user.role
      } else if (rule.value === 'customRoleId') {
        value = user.customRoleId
      } else {
        value = rule.value
      }

      if (rule.operator === 'equals') {
        securityQuery[rule.fieldName] = value
      } else if (rule.operator === 'in') {
        securityQuery[rule.fieldName] = { $in: Array.isArray(value) ? value : [value] }
      } else if (rule.operator === 'not_in') {
        securityQuery[rule.fieldName] = { $nin: Array.isArray(value) ? value : [value] }
      }
    }

    // Merge with existing query
    return { ...query, ...securityQuery }
  }

  /**
   * Apply report parameters to filters
   */
  static applyParameters(
    report: any,
    parameters: Record<string, any>
  ): any {
    if (!report.parameters || report.parameters.length === 0) {
      return report
    }

    // Replace parameter placeholders in filters with actual values
    const updatedFilters = report.filters.map((filter: any) => {
      if (typeof filter.value === 'string' && filter.value.startsWith('{{') && filter.value.endsWith('}}')) {
        const paramName = filter.value.slice(2, -2).trim()
        if (parameters[paramName] !== undefined) {
          return { ...filter, value: parameters[paramName] }
        }
      }
      return filter
    })

    return { ...report, filters: updatedFilters }
  }

  /**
   * Apply cross-filters (filters on related objects)
   */
  static async applyCrossFilters(
    report: any,
    baseQuery: any,
    model: any
  ): Promise<any> {
    if (!report.crossFilters || report.crossFilters.length === 0) {
      return baseQuery
    }

    // For each cross-filter, we need to find related records and filter base query
    for (const crossFilter of report.crossFilters) {
      const relatedModel = this.getModelByName(crossFilter.relatedObject)
      if (!relatedModel) continue

      // Build query for related object
      const relatedQuery: any = {}
      for (const filter of crossFilter.filters) {
        this.applyFilterToQuery(relatedQuery, filter)
      }

      // Find matching related records
      const relatedRecords = await relatedModel.find(relatedQuery).select('_id').lean()
      const relatedIds = relatedRecords.map((r: any) => r._id)

      // Apply to base query (assuming there's a relationship field)
      // This is simplified - in reality, you'd need to know the relationship field name
      if (relatedIds.length > 0) {
        // Example: if cross-filtering on Family, and base is Payment with familyId
        const relationshipField = this.getRelationshipField(crossFilter.relatedObject, model.modelName)
        if (relationshipField) {
          baseQuery[relationshipField] = { $in: relatedIds }
        }
      } else {
        // No matching related records, return empty result
        baseQuery._id = { $in: [] }
      }
    }

    return baseQuery
  }

  /**
   * Apply field-to-field filters
   */
  static applyFieldToFieldFilters(
    query: any,
    report: any
  ): any {
    if (!report.fieldToFieldFilters || report.fieldToFieldFilters.length === 0) {
      return query
    }

    // Field-to-field filters are applied using MongoDB $expr
    const exprConditions: any[] = []

    for (const filter of report.fieldToFieldFilters) {
      const field1 = `$${filter.fieldName1}`
      const field2 = `$${filter.fieldName2}`

      let condition: any
      switch (filter.operator) {
        case 'equals':
          condition = { $eq: [field1, field2] }
          break
        case 'not_equals':
          condition = { $ne: [field1, field2] }
          break
        case 'greater_than':
          condition = { $gt: [field1, field2] }
          break
        case 'less_than':
          condition = { $lt: [field1, field2] }
          break
        case 'greater_than_or_equal':
          condition = { $gte: [field1, field2] }
          break
        case 'less_than_or_equal':
          condition = { $lte: [field1, field2] }
          break
        default:
          continue
      }

      exprConditions.push(condition)
    }

    if (exprConditions.length > 0) {
      query.$expr = { $and: exprConditions }
    }

    return query
  }

  /**
   * Apply a single filter to a query
   */
  private static applyFilterToQuery(query: any, filter: any): void {
    const { fieldName, operator, value, value2 } = filter

    switch (operator) {
      case 'equals':
        query[fieldName] = value
        break
      case 'not_equals':
        query[fieldName] = { $ne: value }
        break
      case 'contains':
        query[fieldName] = { $regex: value, $options: 'i' }
        break
      case 'greater_than':
        query[fieldName] = { $gt: value }
        break
      case 'less_than':
        query[fieldName] = { $lt: value }
        break
      case 'greater_than_or_equal':
        query[fieldName] = { $gte: value }
        break
      case 'less_than_or_equal':
        query[fieldName] = { $lte: value }
        break
      case 'between':
        query[fieldName] = { $gte: value, $lte: value2 }
        break
      case 'in':
        query[fieldName] = { $in: Array.isArray(value) ? value : [value] }
        break
      case 'not_in':
        query[fieldName] = { $nin: Array.isArray(value) ? value : [value] }
        break
      case 'starts_with':
        query[fieldName] = { $regex: `^${value}`, $options: 'i' }
        break
      case 'ends_with':
        query[fieldName] = { $regex: `${value}$`, $options: 'i' }
        break
      case 'is_empty':
        query[fieldName] = { $in: [null, ''] }
        break
      case 'is_not_empty':
        query[fieldName] = { $nin: [null, ''] }
        break
    }
  }

  /**
   * Get model by name (helper function)
   */
  private static getModelByName(modelName: string): any {
    const models = require('@/lib/models')
    const modelMap: Record<string, any> = {
      'Family': models.Family,
      'Payment': models.Payment,
      'LifecycleEvent': models.LifecycleEvent,
      'FamilyMember': models.FamilyMember,
      'Statement': models.Statement,
      'Withdrawal': models.Withdrawal,
    }
    return modelMap[modelName]
  }

  /**
   * Get relationship field name between two models
   */
  private static getRelationshipField(fromModel: string, toModel: string): string | null {
    // This is a simplified mapping - in reality, you'd need a proper relationship map
    const relationships: Record<string, Record<string, string>> = {
      'Family': {
        'Payment': 'familyId',
        'LifecycleEvent': 'familyId',
        'FamilyMember': 'familyId',
      },
      'Payment': {
        'Family': 'familyId',
      },
    }
    return relationships[fromModel]?.[toModel] || null
  }

  /**
   * Execute a report with all advanced features
   */
  static async executeReport(
    reportId: string,
    userId: string,
    parameters?: Record<string, any>,
    options?: {
      limit?: number
      offset?: number
      useCache?: boolean
    }
  ): Promise<any> {
    await connectDB()

    const report = await CustomReport.findOne({
      _id: reportId,
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true,
    }).lean()

    if (!report) {
      throw new Error('Report not found')
    }

    // Check cache if enabled
    if (options?.useCache && report.cache?.enabled) {
      const cacheAge = report.cache.lastCached
        ? (Date.now() - new Date(report.cache.lastCached).getTime()) / 1000
        : Infinity

      if (cacheAge < (report.cache.ttl || 3600) && report.cache.cachedData) {
        return report.cache.cachedData
      }
    }

    // Apply parameters
    let processedReport = report
    if (parameters) {
      processedReport = this.applyParameters(report, parameters)
    }

    // Get user for row-level security
    const User = require('@/lib/models').User
    const user = await User.findById(userId).lean()

    // Build base query
    let query: any = {
      userId: new mongoose.Types.ObjectId(userId),
    }

    // Apply filters
    if (processedReport.filters) {
      for (const filter of processedReport.filters) {
        this.applyFilterToQuery(query, filter)
      }
    }

    // Apply row-level security
    if (user) {
      query = this.applyRowLevelSecurity(query, processedReport, user)
    }

    // Apply field-to-field filters
    query = this.applyFieldToFieldFilters(query, processedReport)

    // Apply cross-filters (this would need to know which model to query)
    // For now, we'll skip this as it requires model context

    // Apply date range
    if (processedReport.dateRange) {
      const { startDate, endDate } = this.calculateDateRange(processedReport.dateRange)
      if (startDate && endDate) {
        // Apply to date field (this would need to be determined from report fields)
        query.date = { $gte: startDate, $lte: endDate }
      }
    }

    // Apply pagination
    const limit = options?.limit || 1000
    const offset = options?.offset || 0

    // Execute query (this is simplified - in reality, you'd need to determine the model)
    // The actual implementation would be in the API route that knows which model to use

    // Update cache if enabled
    if (report.cache?.enabled) {
      // This would be done after getting the data
    }

    // Update analytics
    await CustomReport.updateOne(
      { _id: reportId },
      {
        $inc: { 'analytics.viewCount': 1 },
        $set: {
          'analytics.lastViewed': new Date(),
          'analytics.lastViewedBy': new mongoose.Types.ObjectId(userId),
        },
      }
    )

    return {
      query,
      report: processedReport,
      limit,
      offset,
    }
  }

  /**
   * Calculate actual dates from date range configuration
   */
  static calculateDateRange(dateRange: any): { startDate: Date | null; endDate: Date | null } {
    if (dateRange.type === 'custom' && dateRange.startDate && dateRange.endDate) {
      return {
        startDate: new Date(dateRange.startDate),
        endDate: new Date(dateRange.endDate),
      }
    }

    const now = new Date()
    let startDate: Date | null = null
    let endDate: Date = now

    switch (dateRange.type) {
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, 0, 1)
        endDate = new Date(now.getFullYear() - 1, 11, 31)
        break
      case 'last_30_days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'last_90_days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'last_365_days':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'this_quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1)
        break
      case 'last_quarter':
        const lastQuarter = Math.floor(now.getMonth() / 3) - 1
        if (lastQuarter < 0) {
          startDate = new Date(now.getFullYear() - 1, 9, 1)
          endDate = new Date(now.getFullYear() - 1, 11, 31)
        } else {
          startDate = new Date(now.getFullYear(), lastQuarter * 3, 1)
          endDate = new Date(now.getFullYear(), (lastQuarter + 1) * 3, 0)
        }
        break
      case 'this_fiscal_year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'last_fiscal_year':
        startDate = new Date(now.getFullYear() - 1, 0, 1)
        endDate = new Date(now.getFullYear() - 1, 11, 31)
        break
      case 'mtd':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'qtd':
        const qtr = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), qtr * 3, 1)
        break
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = dateRange.startDate ? new Date(dateRange.startDate) : null
        endDate = dateRange.endDate ? new Date(dateRange.endDate) : now
    }

    return { startDate, endDate }
  }

  /**
   * Clear report cache
   */
  static async clearCache(reportId: string): Promise<void> {
    await connectDB()
    await CustomReport.updateOne(
      { _id: reportId },
      {
        $unset: { 'cache.cachedData': '', 'cache.lastCached': '' },
      }
    )
  }

  /**
   * Get report usage analytics
   */
  static async getReportAnalytics(reportId: string): Promise<any> {
    await connectDB()
    const report = await CustomReport.findById(reportId)
      .select('analytics name')
      .lean()

    return report?.analytics || null
  }
}

