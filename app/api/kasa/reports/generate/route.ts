import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { 
  Family, 
  FamilyMember, 
  Payment, 
  LifecycleEventPayment, 
  PaymentPlan,
  Statement,
  Task
} from '@/lib/models'

export const dynamic = 'force-dynamic'

// Helper function to convert to CSV
function toCSV(rows: string[][]): string {
  return rows.map(row => {
    return row.map(cell => {
      const cellStr = String(cell || '')
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }).join(',')
  }).join('\n')
}

// POST - Generate a report based on query
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { query } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const queryLower = query.toLowerCase()
    const csvRows: string[][] = []
    let filename = ''
    let recordCount: any = {}

    // Use AI to understand what data to include in report
    // First try to use AI chat endpoint to understand the request
    let reportType = 'all' // default
    let aiSuggestion = null
    
    try {
      const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Based on this report request: "${query}", determine what data should be included. Respond with ONLY a JSON object with these boolean fields: includeFamilies, includeMembers, includePayments, includeEvents. Example: {"includeFamilies": true, "includeMembers": true, "includePayments": false, "includeEvents": false}`,
          conversationHistory: []
        })
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        // Try to parse JSON from AI response
        try {
          const jsonMatch = aiData.response?.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            aiSuggestion = JSON.parse(jsonMatch[0])
          }
        } catch (e) {
          // If AI response can't be parsed, fall back to keyword matching
        }
      }
    } catch (error) {
      // If AI is unavailable, fall back to keyword matching
      console.log('AI unavailable, using keyword matching')
    }

    // Detect what data to include in report (use AI suggestion if available, otherwise keyword matching)
    const includeFamilies = aiSuggestion?.includeFamilies ?? (queryLower.includes('famil') || queryLower.includes('all'))
    const includeMembers = aiSuggestion?.includeMembers ?? (queryLower.includes('member') || queryLower.includes('all'))
    const includePayments = aiSuggestion?.includePayments ?? (queryLower.includes('payment') || queryLower.includes('all'))
    const includeEvents = aiSuggestion?.includeEvents ?? (queryLower.includes('event') || queryLower.includes('lifecycle') || queryLower.includes('all'))
    const includeAll = queryLower.includes('all') || (!includeFamilies && !includeMembers && !includePayments && !includeEvents)

    // Header
    csvRows.push(['DATA REPORT'])
    csvRows.push(['Generated:', new Date().toLocaleString()])
    csvRows.push(['Query:', query])
    csvRows.push([])

    // FAMILIES SECTION
    if (includeFamilies || includeAll) {
      const families = await Family.find({}).sort({ name: 1 }).lean()
      recordCount.families = families.length

      csvRows.push(['FAMILIES'])
      csvRows.push(['Name', 'Hebrew Name', 'Email', 'Phone', 'Wedding Date', 'Address', 'City', 'State', 'Zip', 'Payment Plan'])
      
      for (const family of families) {
        const familyObj = family as any
        let planName = ''
        if (familyObj.paymentPlanId) {
          const plan = await PaymentPlan.findById(familyObj.paymentPlanId).lean()
          planName = (plan as any)?.name || `Plan ${familyObj.currentPlan || ''}`
        } else if (familyObj.currentPlan) {
          planName = `Plan ${familyObj.currentPlan}`
        }

        csvRows.push([
          familyObj.name || '',
          familyObj.hebrewName || '',
          familyObj.email || '',
          familyObj.phone || '',
          familyObj.weddingDate ? new Date(familyObj.weddingDate).toLocaleDateString() : '',
          familyObj.address || '',
          familyObj.city || '',
          familyObj.state || '',
          familyObj.zip || '',
          planName
        ])
      }
      csvRows.push([])
    }

    // MEMBERS SECTION
    if (includeMembers || includeAll) {
      const families = await Family.find({}).sort({ name: 1 }).lean()
      const allMembers = await FamilyMember.find({}).sort({ familyId: 1, lastName: 1, firstName: 1 }).lean()
      
      recordCount.totalMembers = allMembers.length

      csvRows.push(['MEMBERS'])
      csvRows.push(['Family Name', 'First Name', 'Last Name', 'Hebrew First Name', 'Hebrew Last Name', 'Birth Date', 'Gender', 'Bar Mitzvah Date', 'Bat Mitzvah Date', 'Wedding Date'])
      
      for (const member of allMembers) {
        const memberObj = member as any
        const family = families.find((f: any) => f._id.toString() === memberObj.familyId.toString())
        const familyName = (family as any)?.name || 'Unknown'

        csvRows.push([
          familyName,
          memberObj.firstName || '',
          memberObj.lastName || '',
          memberObj.hebrewFirstName || '',
          memberObj.hebrewLastName || '',
          memberObj.birthDate ? new Date(memberObj.birthDate).toLocaleDateString() : '',
          memberObj.gender || '',
          memberObj.barMitzvahDate ? new Date(memberObj.barMitzvahDate).toLocaleDateString() : '',
          memberObj.batMitzvahDate ? new Date(memberObj.batMitzvahDate).toLocaleDateString() : '',
          memberObj.weddingDate ? new Date(memberObj.weddingDate).toLocaleDateString() : ''
        ])
      }
      csvRows.push([])
    }

    // PAYMENTS SECTION
    if (includePayments || includeAll) {
      const payments = await Payment.find({})
        .populate('familyId', 'name')
        .sort({ paymentDate: -1 })
        .lean()
      
      recordCount.payments = payments.length

      csvRows.push(['PAYMENTS'])
      csvRows.push(['Date', 'Year', 'Family', 'Amount', 'Type', 'Payment Method', 'Notes'])
      
      for (const payment of payments) {
        const paymentObj = payment as any
        const family = paymentObj.familyId as any

        csvRows.push([
          paymentObj.paymentDate ? new Date(paymentObj.paymentDate).toLocaleDateString() : '',
          paymentObj.year || '',
          family?.name || 'Unknown',
          paymentObj.amount?.toFixed(2) || '0.00',
          paymentObj.type || '',
          paymentObj.paymentMethod || '',
          paymentObj.notes || ''
        ])
      }
      csvRows.push([])
    }

    // LIFECYCLE EVENTS SECTION
    if (includeEvents || includeAll) {
      const events = await LifecycleEventPayment.find({})
        .populate('familyId', 'name')
        .sort({ eventDate: -1 })
        .lean()
      
      recordCount.events = events.length

      csvRows.push(['LIFECYCLE EVENTS'])
      csvRows.push(['Date', 'Year', 'Family', 'Event Type', 'Amount', 'Notes'])
      
      for (const event of events) {
        const eventObj = event as any
        const family = eventObj.familyId as any

        csvRows.push([
          eventObj.eventDate ? new Date(eventObj.eventDate).toLocaleDateString() : '',
          eventObj.year || '',
          family?.name || 'Unknown',
          eventObj.eventType || '',
          eventObj.amount?.toFixed(2) || '0.00',
          eventObj.notes || ''
        ])
      }
      csvRows.push([])
    }

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0]
    if (includeAll) {
      filename = `Complete_Data_Report_${dateStr}.csv`
    } else {
      const parts: string[] = []
      if (includeFamilies) parts.push('Families')
      if (includeMembers) parts.push('Members')
      if (includePayments) parts.push('Payments')
      if (includeEvents) parts.push('Events')
      filename = `${parts.join('_')}_Report_${dateStr}.csv`
    }

    const csvContent = toCSV(csvRows)

    return NextResponse.json({
      success: true,
      csvContent,
      filename,
      recordCount
    })
  } catch (error: any) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    )
  }
}

