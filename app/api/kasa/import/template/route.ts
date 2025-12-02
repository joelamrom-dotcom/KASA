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

      case 'withdrawals':
        headers = [
          'familyName',
          'familyEmail',
          'familyId',
          'amount',
          'withdrawalDate',
          'reason',
          'notes'
        ]
        sampleData = [{
          familyName: 'Sample Family',
          familyEmail: 'family@example.com',
          familyId: '',
          amount: '200',
          withdrawalDate: '2024-01-15',
          reason: 'Refund',
          notes: 'Withdrawal notes'
        }]
        break

      case 'refunds':
        headers = [
          'paymentId',
          'familyName',
          'familyEmail',
          'familyId',
          'amount',
          'refundDate',
          'reason',
          'notes'
        ]
        sampleData = [{
          paymentId: '',
          familyName: 'Sample Family',
          familyEmail: 'family@example.com',
          familyId: '',
          amount: '100',
          refundDate: '2024-01-20',
          reason: 'requested_by_customer',
          notes: 'Refund notes'
        }]
        break

      case 'tasks':
        headers = [
          'title',
          'description',
          'dueDate',
          'email',
          'isCompleted',
          'priority'
        ]
        sampleData = [{
          title: 'Follow up with family',
          description: 'Call to discuss payment',
          dueDate: '2024-02-15',
          email: 'admin@example.com',
          isCompleted: 'false',
          priority: 'high'
        }]
        break

      case 'family-tags':
        headers = [
          'name',
          'color',
          'description'
        ]
        sampleData = [{
          name: 'VIP',
          color: '#3b82f6',
          description: 'VIP families'
        }]
        break

      case 'family-groups':
        headers = [
          'name',
          'description',
          'color',
          'familyNames'
        ]
        sampleData = [{
          name: 'Group A',
          description: 'First group',
          color: '#10b981',
          familyNames: 'Family 1,Family 2,Family 3'
        }]
        break

      case 'family-notes':
        headers = [
          'familyName',
          'familyEmail',
          'familyId',
          'note',
          'checked'
        ]
        sampleData = [{
          familyName: 'Sample Family',
          familyEmail: 'family@example.com',
          familyId: '',
          note: 'Important note about this family',
          checked: 'false'
        }]
        break

      case 'family-relationships':
        headers = [
          'family1Name',
          'family1Email',
          'family1Id',
          'family2Name',
          'family2Email',
          'family2Id',
          'relationshipType'
        ]
        sampleData = [{
          family1Name: 'Family A',
          family1Email: 'familya@example.com',
          family1Id: '',
          family2Name: 'Family B',
          family2Email: 'familyb@example.com',
          family2Id: '',
          relationshipType: 'related'
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

