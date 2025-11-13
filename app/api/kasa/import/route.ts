import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, FamilyMember, Payment, LifecycleEventPayment, PaymentPlan } from '@/lib/models'

export const dynamic = 'force-dynamic'

// Helper function to parse CSV
function parseCSV(csvText: string): { headers: string[], rows: string[][] } {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  // Parse rows
  const rows: string[][] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Handle CSV with quoted values that may contain commas
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim()) // Add last value

    rows.push(values.map(v => v.replace(/^"|"$/g, '')))
  }

  return { headers, rows }
}

// Helper to normalize column names
function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '').replace(/[_-]/g, '')
}

// Helper to parse date
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null
  const date = new Date(dateStr.trim())
  return isNaN(date.getTime()) ? null : date
}

// Helper to find family by name or email
async function findFamilyByNameOrEmail(name?: string, email?: string) {
  if (!name && !email) return null
  
  const query: any = {}
  if (name) query.name = new RegExp(name.trim(), 'i')
  if (email) query.email = email.trim().toLowerCase()
  
  return await Family.findOne(query)
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const importType = formData.get('type') as string

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    if (!importType) {
      return NextResponse.json(
        { error: 'Import type is required' },
        { status: 400 }
      )
    }

    // Read CSV file
    const csvText = await file.text()
    const { headers, rows } = parseCSV(csvText)

    if (headers.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty or invalid' },
        { status: 400 }
      )
    }

    // Normalize headers
    const normalizedHeaders = headers.map(h => normalizeColumnName(h))
    const headerMap: { [key: string]: number } = {}
    normalizedHeaders.forEach((h, i) => {
      headerMap[h] = i
    })

    const imported: number[] = []
    const errors: string[] = []
    const warnings: string[] = []

    // Import based on type
    switch (importType) {
      case 'families':
        await importFamilies(rows, headerMap, headers, imported, errors, warnings)
        break
      case 'members':
        await importMembers(rows, headerMap, headers, imported, errors, warnings)
        break
      case 'payments':
        await importPayments(rows, headerMap, headers, imported, errors, warnings)
        break
      case 'lifecycle-events':
        await importLifecycleEvents(rows, headerMap, headers, imported, errors, warnings)
        break
      default:
        return NextResponse.json(
          { error: `Unknown import type: ${importType}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      failed: errors.length,
      errors,
      warnings
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import data', details: error.message },
      { status: 500 }
    )
  }
}

async function importFamilies(
  rows: string[][],
  headerMap: { [key: string]: number },
  originalHeaders: string[],
  imported: number[],
  errors: string[],
  warnings: string[]
) {
  const getValue = (row: string[], field: string): string => {
    const index = headerMap[normalizeColumnName(field)]
    return index !== undefined ? (row[index] || '').trim() : ''
  }

  // Get payment plans for lookup
  const paymentPlans = await PaymentPlan.find({}).lean()
  const planMap: { [key: number]: string } = {}
  paymentPlans.forEach((plan: any) => {
    if (plan.planNumber) {
      planMap[plan.planNumber] = plan._id.toString()
    }
  })

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const name = getValue(row, 'name')
      if (!name) {
        errors.push(`Row ${i + 2}: Family name is required`)
        continue
      }

      const weddingDate = parseDate(getValue(row, 'weddingDate'))
      if (!weddingDate) {
        errors.push(`Row ${i + 2}: Valid wedding date is required`)
        continue
      }

      // Find payment plan
      let paymentPlanId = null
      const planIdStr = getValue(row, 'paymentPlanId')
      const planNumber = getValue(row, 'paymentPlanNumber') || getValue(row, 'planNumber')
      
      if (planIdStr) {
        paymentPlanId = planIdStr
      } else if (planNumber) {
        const planNum = parseInt(planNumber)
        if (planMap[planNum]) {
          paymentPlanId = planMap[planNum]
        } else {
          warnings.push(`Row ${i + 2}: Payment plan ${planNum} not found, using default`)
        }
      }

      // Check if family already exists
      const existing = await Family.findOne({ name: new RegExp(name, 'i') })
      if (existing) {
        warnings.push(`Row ${i + 2}: Family "${name}" already exists, skipping`)
        continue
      }

      const family = await Family.create({
        name,
        hebrewName: getValue(row, 'hebrewName') || undefined,
        weddingDate,
        husbandFirstName: getValue(row, 'husbandFirstName') || undefined,
        husbandHebrewName: getValue(row, 'husbandHebrewName') || undefined,
        husbandFatherHebrewName: getValue(row, 'husbandFatherHebrewName') || undefined,
        wifeFirstName: getValue(row, 'wifeFirstName') || undefined,
        wifeHebrewName: getValue(row, 'wifeHebrewName') || undefined,
        wifeFatherHebrewName: getValue(row, 'wifeFatherHebrewName') || undefined,
        email: getValue(row, 'email') || undefined,
        phone: getValue(row, 'phone') || undefined,
        address: getValue(row, 'address') || getValue(row, 'street') || undefined,
        street: getValue(row, 'street') || getValue(row, 'address') || undefined,
        city: getValue(row, 'city') || undefined,
        state: getValue(row, 'state') || undefined,
        zip: getValue(row, 'zip') || undefined,
        husbandCellPhone: getValue(row, 'husbandCellPhone') || undefined,
        wifeCellPhone: getValue(row, 'wifeCellPhone') || undefined,
        paymentPlanId: paymentPlanId || undefined,
        currentPlan: planNumber ? parseInt(planNumber) : 1,
        openBalance: 0
      })

      imported.push(i)
    } catch (error: any) {
      errors.push(`Row ${i + 2}: ${error.message || 'Failed to import family'}`)
    }
  }
}

async function importMembers(
  rows: string[][],
  headerMap: { [key: string]: number },
  originalHeaders: string[],
  imported: number[],
  errors: string[],
  warnings: string[]
) {
  const getValue = (row: string[], field: string): string => {
    const index = headerMap[normalizeColumnName(field)]
    return index !== undefined ? (row[index] || '').trim() : ''
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const firstName = getValue(row, 'firstName')
      const lastName = getValue(row, 'lastName')
      if (!firstName || !lastName) {
        errors.push(`Row ${i + 2}: First name and last name are required`)
        continue
      }

      // Find family
      let familyId = getValue(row, 'familyId')
      if (!familyId) {
        const familyName = getValue(row, 'familyName')
        const familyEmail = getValue(row, 'familyEmail')
        if (familyName || familyEmail) {
          const family = await findFamilyByNameOrEmail(familyName, familyEmail)
          if (family) {
            familyId = family._id.toString()
          } else {
            errors.push(`Row ${i + 2}: Family not found (name: ${familyName}, email: ${familyEmail})`)
            continue
          }
        } else {
          errors.push(`Row ${i + 2}: Family ID, name, or email is required`)
          continue
        }
      }

      const member = await FamilyMember.create({
        familyId,
        firstName,
        lastName,
        hebrewFirstName: getValue(row, 'hebrewFirstName') || undefined,
        hebrewLastName: getValue(row, 'hebrewLastName') || undefined,
        birthDate: parseDate(getValue(row, 'birthDate')) || undefined,
        gender: getValue(row, 'gender') || undefined,
        barMitzvahDate: parseDate(getValue(row, 'barMitzvahDate')) || undefined,
        batMitzvahDate: parseDate(getValue(row, 'batMitzvahDate')) || undefined,
        weddingDate: parseDate(getValue(row, 'weddingDate')) || undefined
      })

      imported.push(i)
    } catch (error: any) {
      errors.push(`Row ${i + 2}: ${error.message || 'Failed to import member'}`)
    }
  }
}

async function importPayments(
  rows: string[][],
  headerMap: { [key: string]: number },
  originalHeaders: string[],
  imported: number[],
  errors: string[],
  warnings: string[]
) {
  const getValue = (row: string[], field: string): string => {
    const index = headerMap[normalizeColumnName(field)]
    return index !== undefined ? (row[index] || '').trim() : ''
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const amountStr = getValue(row, 'amount')
      const amount = parseFloat(amountStr)
      if (isNaN(amount) || amount <= 0) {
        errors.push(`Row ${i + 2}: Valid amount is required`)
        continue
      }

      const paymentDate = parseDate(getValue(row, 'paymentDate'))
      if (!paymentDate) {
        errors.push(`Row ${i + 2}: Valid payment date is required`)
        continue
      }

      // Find family
      let familyId = getValue(row, 'familyId')
      if (!familyId) {
        const familyName = getValue(row, 'familyName')
        const familyEmail = getValue(row, 'familyEmail')
        if (familyName || familyEmail) {
          const family = await findFamilyByNameOrEmail(familyName, familyEmail)
          if (family) {
            familyId = family._id.toString()
          } else {
            errors.push(`Row ${i + 2}: Family not found`)
            continue
          }
        } else {
          errors.push(`Row ${i + 2}: Family ID, name, or email is required`)
          continue
        }
      }

      const year = getValue(row, 'year') ? parseInt(getValue(row, 'year')) : paymentDate.getFullYear()

      const payment = await Payment.create({
        familyId,
        amount,
        paymentDate,
        year,
        type: getValue(row, 'type') || 'membership',
        paymentMethod: getValue(row, 'paymentMethod') || 'cash',
        notes: getValue(row, 'notes') || undefined
      })

      imported.push(i)
    } catch (error: any) {
      errors.push(`Row ${i + 2}: ${error.message || 'Failed to import payment'}`)
    }
  }
}

async function importLifecycleEvents(
  rows: string[][],
  headerMap: { [key: string]: number },
  originalHeaders: string[],
  imported: number[],
  errors: string[],
  warnings: string[]
) {
  const getValue = (row: string[], field: string): string => {
    const index = headerMap[normalizeColumnName(field)]
    return index !== undefined ? (row[index] || '').trim() : ''
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const eventType = getValue(row, 'eventType')
      if (!eventType) {
        errors.push(`Row ${i + 2}: Event type is required`)
        continue
      }

      const eventDate = parseDate(getValue(row, 'eventDate'))
      if (!eventDate) {
        errors.push(`Row ${i + 2}: Valid event date is required`)
        continue
      }

      const amountStr = getValue(row, 'amount')
      const amount = parseFloat(amountStr) || 0

      // Find family
      let familyId = getValue(row, 'familyId')
      if (!familyId) {
        const familyName = getValue(row, 'familyName')
        const familyEmail = getValue(row, 'familyEmail')
        if (familyName || familyEmail) {
          const family = await findFamilyByNameOrEmail(familyName, familyEmail)
          if (family) {
            familyId = family._id.toString()
          } else {
            errors.push(`Row ${i + 2}: Family not found`)
            continue
          }
        } else {
          errors.push(`Row ${i + 2}: Family ID, name, or email is required`)
          continue
        }
      }

      const year = getValue(row, 'year') ? parseInt(getValue(row, 'year')) : eventDate.getFullYear()

      const event = await LifecycleEventPayment.create({
        familyId,
        memberId: getValue(row, 'memberId') || undefined,
        eventType: eventType.toLowerCase(),
        eventDate,
        year,
        amount,
        notes: getValue(row, 'notes') || undefined
      })

      imported.push(i)
    } catch (error: any) {
      errors.push(`Row ${i + 2}: ${error.message || 'Failed to import lifecycle event'}`)
    }
  }
}

