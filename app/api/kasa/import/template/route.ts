import { NextRequest, NextResponse } from 'next/server'
import { format } from 'fast-csv'

export const dynamic = 'force-dynamic'

// GET - Download CSV template for a specific entity type
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 })
    }

    let headers: string[] = []
    let sampleData: any[] = []

    switch (type) {
      case 'families':
        headers = [
          'name',
          'hebrewName',
          'weddingDate',
          'husbandFirstName',
          'husbandHebrewName',
          'husbandFatherHebrewName',
          'wifeFirstName',
          'wifeHebrewName',
          'wifeFatherHebrewName',
          'email',
          'phone',
          'address',
          'street',
          'city',
          'state',
          'zip',
          'husbandCellPhone',
          'wifeCellPhone',
          'paymentPlanNumber'
        ]
        sampleData = [{
          name: 'Sample Family',
          hebrewName: 'משפחה לדוגמה',
          weddingDate: '2020-01-15',
          husbandFirstName: 'John',
          husbandHebrewName: 'יוחנן',
          husbandFatherHebrewName: 'אברהם',
          wifeFirstName: 'Jane',
          wifeHebrewName: 'חוה',
          wifeFatherHebrewName: 'יצחק',
          email: 'family@example.com',
          phone: '555-1234',
          address: '123 Main St',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          husbandCellPhone: '555-1234',
          wifeCellPhone: '555-5678',
          paymentPlanNumber: '1'
        }]
        break

      case 'members':
        headers = [
          'familyName',
          'familyEmail',
          'familyId',
          'firstName',
          'lastName',
          'hebrewFirstName',
          'hebrewLastName',
          'birthDate',
          'hebrewBirthDate',
          'gender',
          'barMitzvahDate',
          'batMitzvahDate',
          'weddingDate',
          'paymentPlan'
        ]
        sampleData = [{
          familyName: 'Sample Family',
          familyEmail: 'family@example.com',
          familyId: '',
          firstName: 'Child',
          lastName: 'Sample',
          hebrewFirstName: 'ילד',
          hebrewLastName: 'לדוגמה',
          birthDate: '2015-05-20',
          hebrewBirthDate: 'כ\' אייר תשע"ה',
          gender: 'male',
          barMitzvahDate: '2028-05-20',
          batMitzvahDate: '',
          weddingDate: '',
          paymentPlan: '2'
        }]
        break

      case 'payments':
        headers = [
          'familyName',
          'familyEmail',
          'familyId',
          'amount',
          'paymentDate',
          'year',
          'type',
          'paymentMethod',
          'notes'
        ]
        sampleData = [{
          familyName: 'Sample Family',
          familyEmail: 'family@example.com',
          familyId: '',
          amount: '1000',
          paymentDate: '2024-01-15',
          year: '2024',
          type: 'membership',
          paymentMethod: 'cash',
          notes: 'Annual membership payment'
        }]
        break

      case 'lifecycle-events':
        headers = [
          'familyName',
          'familyEmail',
          'familyId',
          'memberId',
          'eventType',
          'eventDate',
          'amount',
          'year',
          'notes'
        ]
        sampleData = [{
          familyName: 'Sample Family',
          familyEmail: 'family@example.com',
          familyId: '',
          memberId: '',
          eventType: 'chasena',
          eventDate: '2024-06-15',
          amount: '500',
          year: '2024',
          notes: 'Wedding celebration'
        }]
        break

      case 'payment-plans':
        headers = [
          'name',
          'planNumber',
          'yearlyPrice',
          'description'
        ]
        sampleData = [{
          name: 'Plan 1',
          planNumber: '1',
          yearlyPrice: '1000',
          description: 'Age group 0-4'
        }]
        break

      case 'lifecycle-event-types':
        headers = [
          'type',
          'name',
          'amount'
        ]
        sampleData = [{
          type: 'chasena',
          name: 'Wedding',
          amount: '500'
        }]
        break

      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
    }

    // Generate CSV using fast-csv
    const csvRows: string[] = []
    
    // Add headers
    csvRows.push(headers.join(','))
    
    // Add sample data row
    if (sampleData.length > 0) {
      const sample = sampleData[0]
      const row = headers.map(header => {
        const value = sample[header] || ''
        // Escape commas and quotes in values
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      csvRows.push(row.join(','))
    }

    const csv = csvRows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type}-template.csv"`
      }
    })
  } catch (error: any) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      { error: 'Failed to generate template', details: error.message },
      { status: 500 }
    )
  }
}

