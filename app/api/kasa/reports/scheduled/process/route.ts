import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { ScheduledReport, CustomReport } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Process scheduled reports (called by cron job)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const now = new Date()
    
    // Find all active scheduled reports that are due
    const dueReports = await ScheduledReport.find({
      isActive: true,
      nextRun: { $lte: now }
    }).populate('reportId').lean()

    const results = []

    for (const scheduledReport of dueReports) {
      try {
        const report = scheduledReport.reportId as any
        if (!report) {
          console.error(`Report not found for scheduled report ${scheduledReport._id}`)
          continue
        }

        // Generate report data
        const generateRes = await fetch(`${request.nextUrl.origin}/api/kasa/reports/custom/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Note: This would need proper authentication in production
            'Authorization': request.headers.get('Authorization') || ''
          },
          body: JSON.stringify({ reportId: report._id.toString() })
        })

        if (!generateRes.ok) {
          throw new Error('Failed to generate report')
        }

        const reportData = await generateRes.json()

        // Export report
        const exportRes = await fetch(`${request.nextUrl.origin}/api/kasa/reports/custom/export`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            reportId: report._id.toString(),
            format: scheduledReport.exportFormat,
            reportData
          })
        })

        if (!exportRes.ok) {
          throw new Error('Failed to export report')
        }

        const blob = await exportRes.blob()

        // Send emails to recipients
        const { sendEmail } = await import('@/lib/email-helpers')
        
        for (const recipient of scheduledReport.recipients || []) {
          try {
            // Convert blob to base64 for email attachment
            const buffer = await blob.arrayBuffer()
            const base64 = Buffer.from(buffer).toString('base64')
            
            await sendEmail(
              recipient.email,
              `Scheduled Report: ${scheduledReport.name}`,
              `Please find attached the scheduled report "${scheduledReport.name}".`,
              {
                filename: `${scheduledReport.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.${scheduledReport.exportFormat === 'excel' ? 'xlsx' : scheduledReport.exportFormat}`,
                content: base64,
                encoding: 'base64',
                contentType: scheduledReport.exportFormat === 'pdf' ? 'application/pdf' : 
                             scheduledReport.exportFormat === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                             'text/csv'
              }
            )
          } catch (emailError: any) {
            console.error(`Error sending email to ${recipient.email}:`, emailError)
          }
        }

        // Update scheduled report
        const mongoose = require('mongoose')
        const scheduledReportId = new mongoose.Types.ObjectId(scheduledReport._id)
        
        // Calculate next run
        const nextRun = calculateNextRun(scheduledReport.schedule)
        
        await ScheduledReport.findByIdAndUpdate(scheduledReportId, {
          lastRun: now,
          nextRun,
          runCount: (scheduledReport.runCount || 0) + 1,
          errorCount: scheduledReport.errorCount || 0
        })

        results.push({
          scheduledReportId: scheduledReport._id.toString(),
          name: scheduledReport.name,
          status: 'success',
          recipientsSent: scheduledReport.recipients?.length || 0
        })
      } catch (error: any) {
        console.error(`Error processing scheduled report ${scheduledReport._id}:`, error)
        
        // Update error count
        const mongoose = require('mongoose')
        const scheduledReportId = new mongoose.Types.ObjectId(scheduledReport._id)
        
        await ScheduledReport.findByIdAndUpdate(scheduledReportId, {
          errorCount: (scheduledReport.errorCount || 0) + 1,
          lastError: error.message
        })

        results.push({
          scheduledReportId: scheduledReport._id.toString(),
          name: scheduledReport.name,
          status: 'error',
          error: error.message
        })
      }
    }

    return NextResponse.json({
      processed: results.length,
      results
    })
  } catch (error: any) {
    console.error('Error processing scheduled reports:', error)
    return NextResponse.json(
      { error: 'Failed to process scheduled reports', details: error.message },
      { status: 500 }
    )
  }
}

function calculateNextRun(schedule: any): Date {
  const now = new Date()
  const [hours, minutes] = schedule.time.split(':').map(Number)
  
  let nextRun = new Date()
  nextRun.setHours(hours, minutes, 0, 0)

  switch (schedule.frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      break
    case 'weekly':
      const dayOfWeek = schedule.dayOfWeek || 0
      const currentDay = nextRun.getDay()
      let daysUntilNext = (dayOfWeek - currentDay + 7) % 7
      if (daysUntilNext === 0 && nextRun <= now) {
        daysUntilNext = 7
      }
      nextRun.setDate(nextRun.getDate() + daysUntilNext)
      break
    case 'monthly':
      const dayOfMonth = schedule.dayOfMonth || 1
      nextRun.setDate(dayOfMonth)
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1)
      }
      break
    case 'quarterly':
      nextRun.setMonth(Math.floor(nextRun.getMonth() / 3) * 3, schedule.dayOfMonth || 1)
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 3)
      }
      break
    case 'yearly':
      nextRun.setMonth(0, schedule.dayOfMonth || 1)
      if (nextRun <= now) {
        nextRun.setFullYear(nextRun.getFullYear() + 1)
      }
      break
  }

  return nextRun
}

