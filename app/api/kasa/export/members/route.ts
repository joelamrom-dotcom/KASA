import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { FamilyMember, Family } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Export members to CSV/Excel
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Get user's families
    const userFamilies = await Family.find({ userId }).select('_id name').lean()
    const userFamilyIds = userFamilies.map(f => f._id)
    const familyMap = new Map(userFamilies.map((f: any) => [f._id.toString(), f.name]))

    const members = await FamilyMember.find({ familyId: { $in: userFamilyIds } })
      .populate('familyId', 'name')
      .lean()

    const exportData = members.map((m: any) => ({
      'First Name': m.firstName || '',
      'Last Name': m.lastName || '',
      'Hebrew First Name': m.hebrewFirstName || '',
      'Hebrew Last Name': m.hebrewLastName || '',
      'Birth Date': m.birthDate ? new Date(m.birthDate).toLocaleDateString() : '',
      'Hebrew Birth Date': m.hebrewBirthDate || '',
      Gender: m.gender || '',
      Family: familyMap.get(m.familyId?.toString() || '') || (m.familyId as any)?.name || '',
      'Payment Plan': m.paymentPlan || '',
      'Bar Mitzvah Date': m.barMitzvahDate ? new Date(m.barMitzvahDate).toLocaleDateString() : '',
      'Bat Mitzvah Date': m.batMitzvahDate ? new Date(m.batMitzvahDate).toLocaleDateString() : ''
    }))

    if (format === 'csv') {
      const headers = Object.keys(exportData[0] || {})
      const csvRows = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            return typeof value === 'string' && value.includes(',') 
              ? `"${value.replace(/"/g, '""')}"` 
              : value
          }).join(',')
        )
      ]
      
      const csv = csvRows.join('\n')
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="members-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      return NextResponse.json({ data: exportData, count: exportData.length })
    }
  } catch (error: any) {
    console.error('Error exporting members:', error)
    return NextResponse.json(
      { error: 'Failed to export members', details: error.message },
      { status: 500 }
    )
  }
}

