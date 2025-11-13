import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, FamilyMember } from '@/lib/models'

export const dynamic = 'force-dynamic'

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

    // Check if it's a families/members report request
    if (queryLower.includes('famil') && (queryLower.includes('member') || queryLower.includes('report'))) {
      // Generate families and members report
      const families = await Family.find({}).sort({ name: 1 }).lean()
      
      // Get all members for each family
      const familiesWithMembers = await Promise.all(
        families.map(async (family: any) => {
          const members = await FamilyMember.find({ familyId: family._id }).lean()
          return {
            family: {
              _id: family._id.toString(),
              name: family.name,
              hebrewName: family.hebrewName || '',
              email: family.email || '',
              phone: family.phone || '',
              weddingDate: family.weddingDate ? new Date(family.weddingDate).toLocaleDateString() : '',
              address: [family.address, family.city, family.state, family.zip].filter(Boolean).join(', ') || ''
            },
            members: members.map((member: any) => ({
              firstName: member.firstName || '',
              lastName: member.lastName || '',
              hebrewFirstName: member.hebrewFirstName || '',
              hebrewLastName: member.hebrewLastName || '',
              birthDate: member.birthDate ? new Date(member.birthDate).toLocaleDateString() : '',
              gender: member.gender || '',
              barMitzvahDate: member.barMitzvahDate ? new Date(member.barMitzvahDate).toLocaleDateString() : '',
              batMitzvahDate: member.batMitzvahDate ? new Date(member.batMitzvahDate).toLocaleDateString() : '',
              weddingDate: member.weddingDate ? new Date(member.weddingDate).toLocaleDateString() : ''
            }))
          }
        })
      )

      // Generate CSV
      const csvRows: string[][] = []
      
      // Header
      csvRows.push(['FAMILIES AND MEMBERS REPORT'])
      csvRows.push(['Generated:', new Date().toLocaleString()])
      csvRows.push([])

      // Process each family
      familiesWithMembers.forEach((familyData, index) => {
        if (index > 0) {
          csvRows.push([]) // Empty row between families
        }

        // Family header
        csvRows.push(['FAMILY'])
        csvRows.push(['Name', familyData.family.name])
        if (familyData.family.hebrewName) {
          csvRows.push(['Hebrew Name', familyData.family.hebrewName])
        }
        if (familyData.family.email) {
          csvRows.push(['Email', familyData.family.email])
        }
        if (familyData.family.phone) {
          csvRows.push(['Phone', familyData.family.phone])
        }
        if (familyData.family.weddingDate) {
          csvRows.push(['Wedding Date', familyData.family.weddingDate])
        }
        if (familyData.family.address) {
          csvRows.push(['Address', familyData.family.address])
        }

        // Members section
        if (familyData.members.length > 0) {
          csvRows.push([])
          csvRows.push(['MEMBERS'])
          csvRows.push(['First Name', 'Last Name', 'Hebrew First Name', 'Hebrew Last Name', 'Birth Date', 'Gender', 'Bar Mitzvah Date', 'Bat Mitzvah Date', 'Wedding Date'])
          
          familyData.members.forEach(member => {
            csvRows.push([
              member.firstName,
              member.lastName,
              member.hebrewFirstName,
              member.hebrewLastName,
              member.birthDate,
              member.gender,
              member.barMitzvahDate,
              member.batMitzvahDate,
              member.weddingDate
            ])
          })
        } else {
          csvRows.push([])
          csvRows.push(['MEMBERS', 'No members'])
        }
      })

      // Convert to CSV string
      const csvContent = csvRows.map(row => {
        return row.map(cell => {
          const cellStr = String(cell || '')
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        }).join(',')
      }).join('\n')

      return NextResponse.json({
        success: true,
        csvContent,
        filename: `Families_Members_Report_${new Date().toISOString().split('T')[0]}.csv`,
        recordCount: {
          families: families.length,
          totalMembers: familiesWithMembers.reduce((sum, f) => sum + f.members.length, 0)
        }
      })
    }

    // Default: return error for unsupported report types
    return NextResponse.json(
      { error: 'Report type not supported. Please ask for "families and members report" or similar.' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    )
  }
}

