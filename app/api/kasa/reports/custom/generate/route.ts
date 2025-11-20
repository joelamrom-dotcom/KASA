import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { CustomReport, Payment, Family, LifecycleEvent, Withdrawal, Statement } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// POST - Generate report data based on custom report configuration
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportId, dateRangeOverride, filtersOverride } = body

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    // Get report configuration
    const report = await CustomReport.findOne({
      _id: reportId,
      userId: userObjectId,
      isActive: true
    }).lean()

    if (!report || Array.isArray(report)) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Type assertion: findOne().lean() returns a single document or null, not an array
    const reportDoc = report as { dateRange?: any; filters?: any }
    
    // Use override date range if provided, otherwise use report's date range
    const dateRange = dateRangeOverride || reportDoc.dateRange
    const filters = filtersOverride || reportDoc.filters

    // Calculate actual dates based on date range type
    let startDate: Date
    let endDate: Date = new Date()

    if (dateRange.type === 'custom' && dateRange.startDate && dateRange.endDate) {
      startDate = new Date(dateRange.startDate)
      endDate = new Date(dateRange.endDate)
    } else {
      // Calculate dates based on type
      const now = new Date()
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
        default:
          startDate = new Date(now.getFullYear(), 0, 1)
      }
    }

    // Build query based on filters
    const query: any = {
      userId: userObjectId
    }

    // Apply date filters
    if (report.fields.some((f: any) => f.fieldName.startsWith('payment.'))) {
      query['paymentDate'] = { $gte: startDate, $lte: endDate }
    }

    // Fetch data based on fields
    const data: any[] = []
    const fieldGroups = new Set(report.fields.map((f: any) => f.fieldName.split('.')[0]))

    // Fetch payments if needed
    if (fieldGroups.has('payment')) {
      const paymentQuery: any = { userId: userObjectId }
      if (dateRange.type !== 'custom' || dateRange.startDate) {
        paymentQuery.paymentDate = { $gte: startDate, $lte: endDate }
      }

      const payments = await Payment.find(paymentQuery)
        .populate('familyId', 'name')
        .lean()

      for (const payment of payments) {
        const row: any = {}
        const paymentDoc = payment as { _id: { toString(): string } | string; familyId?: any; [key: string]: any }
        report.fields.forEach((field: any) => {
          if (field.fieldName.startsWith('payment.')) {
            const prop = field.fieldName.split('.').slice(1).join('.')
            if (prop === 'family') {
              row[field.label] = (paymentDoc.familyId as any)?.name || ''
            } else {
              row[field.label] = paymentDoc[prop] || ''
            }
          }
        })
        row._id = typeof paymentDoc._id === 'string' ? paymentDoc._id : paymentDoc._id.toString()
        row._type = 'payment'
        data.push(row)
      }
    }

    // Calculate aggregates
    const summary: any = {}
    report.fields.forEach((field: any) => {
      if (field.aggregate !== 'none') {
        const values = data.map(row => {
          const val = row[field.label]
          return typeof val === 'number' ? val : parseFloat(val) || 0
        })

        switch (field.aggregate) {
          case 'sum':
            summary[field.label] = values.reduce((a, b) => a + b, 0)
            break
          case 'avg':
            summary[field.label] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
            break
          case 'count':
            summary[field.label] = values.length
            break
          case 'min':
            summary[field.label] = Math.min(...values)
            break
          case 'max':
            summary[field.label] = Math.max(...values)
            break
        }
      }
    })

    // Handle comparison if enabled
    let comparisonData: any = null
    if (report.comparison?.enabled) {
      // Fetch comparison period data
      let compareStartDate: Date
      let compareEndDate: Date

      if (report.comparison.type === 'year_over_year') {
        const yearDiff = endDate.getFullYear() - startDate.getFullYear()
        compareStartDate = new Date(startDate)
        compareStartDate.setFullYear(compareStartDate.getFullYear() - 1)
        compareEndDate = new Date(endDate)
        compareEndDate.setFullYear(compareEndDate.getFullYear() - 1)
      } else if (report.comparison.type === 'custom') {
        compareStartDate = new Date(report.comparison.compareToStartDate)
        compareEndDate = new Date(report.comparison.compareToEndDate)
      } else {
        // Period over period - same length as current period
        const periodLength = endDate.getTime() - startDate.getTime()
        compareEndDate = new Date(startDate.getTime() - 1)
        compareStartDate = new Date(compareEndDate.getTime() - periodLength)
      }

      // Fetch comparison data (simplified - same structure as main data)
      const comparePaymentQuery: any = { userId: userObjectId }
      comparePaymentQuery.paymentDate = { $gte: compareStartDate, $lte: compareEndDate }

      const comparePayments = await Payment.find(comparePaymentQuery)
        .populate('familyId', 'name')
        .lean()

      comparisonData = {
        period: {
          start: compareStartDate,
          end: compareEndDate
        },
        data: comparePayments.map((p: any) => {
          const row: any = {}
          report.fields.forEach((field: any) => {
            if (field.fieldName.startsWith('payment.')) {
              const prop = field.fieldName.split('.').slice(1).join('.')
              if (prop === 'family') {
                row[field.label] = (p.familyId as any)?.name || ''
              } else {
                row[field.label] = (p as any)[prop] || ''
              }
            }
          })
          return row
        })
      }

      // Calculate comparison summary
      const compareSummary: any = {}
      report.fields.forEach((field: any) => {
        if (field.aggregate !== 'none') {
          const values = comparisonData.data.map((row: any) => {
            const val = row[field.label]
            return typeof val === 'number' ? val : parseFloat(val) || 0
          })

          switch (field.aggregate) {
            case 'sum':
              compareSummary[field.label] = values.reduce((a, b) => a + b, 0)
              break
            case 'avg':
              compareSummary[field.label] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
              break
            case 'count':
              compareSummary[field.label] = values.length
              break
            case 'min':
              compareSummary[field.label] = Math.min(...values)
              break
            case 'max':
              compareSummary[field.label] = Math.max(...values)
              break
          }
        }
      })
      comparisonData.summary = compareSummary
    }

    return NextResponse.json({
      report: {
        name: report.name,
        description: report.description,
        dateRange: {
          start: startDate,
          end: endDate
        }
      },
      data,
      summary,
      comparison: comparisonData,
      fields: report.fields,
      generatedAt: new Date()
    })
  } catch (error: any) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    )
  }
}

