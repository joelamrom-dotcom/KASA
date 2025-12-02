import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { 
  Family, FamilyMember, Payment, LifecycleEventPayment, PaymentPlan, LifecycleEvent,
  Withdrawal, Refund, Task, FamilyTag, FamilyGroup, FamilyNote, FamilyRelationship
} from '@/lib/models'
import { parse } from 'fast-csv'

export const dynamic = 'force-dynamic'

// Helper function to parse CSV using fast-csv
async function parseCSV(csvText: string): Promise<{ headers: string[], rows: any[] }> {
  return new Promise((resolve, reject) => {
    const rows: any[] = []
    let headers: string[] = []

    const stream = parse({ headers: true, skipEmptyLines: true })
      .on('headers', (headerList) => {
        headers = headerList
      })
      .on('data', (row) => {
        rows.push(row)
      })
      .on('error', (error) => {
        reject(error)
      })
      .on('end', () => {
        resolve({ headers, rows })
      })

    stream.write(csvText)
    stream.end()
  })
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
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const { headers, rows } = await parseCSV(csvText)

    if (headers.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty or invalid' },
        { status: 400 }
      )
    }

    // Normalize headers for lookup
    const normalizedHeaders = headers.map(h => normalizeColumnName(h))
    const headerMap: { [key: string]: string } = {}
    headers.forEach((h) => {
      headerMap[normalizeColumnName(h)] = h
    })

    const imported: number[] = []
    const errors: string[] = []
    const warnings: string[] = []

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Import based on type
    switch (importType) {
      case 'families':
        await importFamilies(rows, headerMap, imported, errors, warnings, userId)
        break
      case 'members':
        await importMembers(rows, headerMap, imported, errors, warnings)
        break
      case 'payments':
        await importPayments(rows, headerMap, imported, errors, warnings)
        break
      case 'lifecycle-events':
        await importLifecycleEvents(rows, headerMap, imported, errors, warnings)
        break
      case 'payment-plans':
        await importPaymentPlans(rows, headerMap, imported, errors, warnings, userId)
        break
      case 'lifecycle-event-types':
        await importLifecycleEventTypes(rows, headerMap, imported, errors, warnings, userId)
        break
      case 'withdrawals':
        await importWithdrawals(rows, headerMap, imported, errors, warnings)
        break
      case 'refunds':
        await importRefunds(rows, headerMap, imported, errors, warnings)
        break
      case 'tasks':
        await importTasks(rows, headerMap, imported, errors, warnings, userId)
        break
      case 'family-tags':
        await importFamilyTags(rows, headerMap, imported, errors, warnings, userId)
        break
      case 'family-groups':
        await importFamilyGroups(rows, headerMap, imported, errors, warnings, userId)
        break
      case 'family-notes':
        await importFamilyNotes(rows, headerMap, imported, errors, warnings)
        break
      case 'family-relationships':
        await importFamilyRelationships(rows, headerMap, imported, errors, warnings, userId)
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
  rows: any[],
  headerMap: { [key: string]: string },
  imported: number[],
  errors: string[],
  warnings: string[],
  userId: any
) {
  const getValue = (row: any, field: string): string => {
    const normalizedField = normalizeColumnName(field)
    const actualHeader = headerMap[normalizedField]
    if (actualHeader && row[actualHeader] !== undefined) {
      return String(row[actualHeader] || '').trim()
    }
    if (row[field] !== undefined) {
      return String(row[field] || '').trim()
    }
    return ''
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
      const existing = await Family.findOne({ name: new RegExp(name, 'i'), userId })
      if (existing) {
        warnings.push(`Row ${i + 2}: Family "${name}" already exists, skipping`)
        continue
      }

      const family = await Family.create({
        userId,
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
  rows: any[],
  headerMap: { [key: string]: string },
  imported: number[],
  errors: string[],
  warnings: string[]
) {
  const getValue = (row: any, field: string): string => {
    const normalizedField = normalizeColumnName(field)
    const actualHeader = headerMap[normalizedField]
    if (actualHeader && row[actualHeader] !== undefined) {
      return String(row[actualHeader] || '').trim()
    }
    if (row[field] !== undefined) {
      return String(row[field] || '').trim()
    }
    return ''
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

      // Find family by name or email (familyId is not in template)
      const familyName = getValue(row, 'familyName')
      const familyEmail = getValue(row, 'familyEmail')
      let familyId = getValue(row, 'familyId')
      
      if (!familyId && (familyName || familyEmail)) {
        const family = await findFamilyByNameOrEmail(familyName, familyEmail)
        if (family) {
          familyId = family._id.toString()
        } else {
          errors.push(`Row ${i + 2}: Family not found (name: ${familyName}, email: ${familyEmail})`)
          continue
        }
      } else if (!familyId) {
        errors.push(`Row ${i + 2}: Family name or email is required`)
        continue
      }

      const member = await FamilyMember.create({
        familyId,
        firstName,
        lastName,
        hebrewFirstName: getValue(row, 'hebrewFirstName') || undefined,
        hebrewLastName: getValue(row, 'hebrewLastName') || undefined,
        birthDate: parseDate(getValue(row, 'birthDate')) || undefined,
        hebrewBirthDate: getValue(row, 'hebrewBirthDate') || undefined,
        gender: getValue(row, 'gender') || undefined,
        barMitzvahDate: parseDate(getValue(row, 'barMitzvahDate')) || undefined,
        batMitzvahDate: parseDate(getValue(row, 'batMitzvahDate')) || undefined,
        weddingDate: parseDate(getValue(row, 'weddingDate')) || undefined,
        paymentPlan: getValue(row, 'paymentPlan') ? parseInt(getValue(row, 'paymentPlan')) : undefined
      })

      imported.push(i)
    } catch (error: any) {
      errors.push(`Row ${i + 2}: ${error.message || 'Failed to import member'}`)
    }
  }
}

async function importPayments(
  rows: any[],
  headerMap: { [key: string]: string },
  imported: number[],
  errors: string[],
  warnings: string[]
) {
  const getValue = (row: any, field: string): string => {
    const normalizedField = normalizeColumnName(field)
    const actualHeader = headerMap[normalizedField]
    if (actualHeader && row[actualHeader] !== undefined) {
      return String(row[actualHeader] || '').trim()
    }
    if (row[field] !== undefined) {
      return String(row[field] || '').trim()
    }
    return ''
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

      // Find family by name or email (familyId is not in template)
      const familyName = getValue(row, 'familyName')
      const familyEmail = getValue(row, 'familyEmail')
      let familyId = getValue(row, 'familyId')
      
      if (!familyId && (familyName || familyEmail)) {
        const family = await findFamilyByNameOrEmail(familyName, familyEmail)
        if (family) {
          familyId = family._id.toString()
        } else {
          errors.push(`Row ${i + 2}: Family not found (name: ${familyName}, email: ${familyEmail})`)
          continue
        }
      } else if (!familyId) {
        errors.push(`Row ${i + 2}: Family name or email is required`)
        continue
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
  rows: any[],
  headerMap: { [key: string]: string },
  imported: number[],
  errors: string[],
  warnings: string[]
) {
  const getValue = (row: any, field: string): string => {
    const normalizedField = normalizeColumnName(field)
    const actualHeader = headerMap[normalizedField]
    if (actualHeader && row[actualHeader] !== undefined) {
      return String(row[actualHeader] || '').trim()
    }
    if (row[field] !== undefined) {
      return String(row[field] || '').trim()
    }
    return ''
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

      // Find family by name or email (familyId is not in template)
      const familyName = getValue(row, 'familyName')
      const familyEmail = getValue(row, 'familyEmail')
      let familyId = getValue(row, 'familyId')
      
      if (!familyId && (familyName || familyEmail)) {
        const family = await findFamilyByNameOrEmail(familyName, familyEmail)
        if (family) {
          familyId = family._id.toString()
        } else {
          errors.push(`Row ${i + 2}: Family not found (name: ${familyName}, email: ${familyEmail})`)
          continue
        }
      } else if (!familyId) {
        errors.push(`Row ${i + 2}: Family name or email is required`)
        continue
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

async function importPaymentPlans(
  rows: any[],
  headerMap: { [key: string]: string },
  imported: number[],
  errors: string[],
  warnings: string[],
  userId: any
) {
  const getValue = (row: any, field: string): string => {
    const normalizedField = normalizeColumnName(field)
    const actualHeader = headerMap[normalizedField]
    if (actualHeader && row[actualHeader] !== undefined) {
      return String(row[actualHeader] || '').trim()
    }
    if (row[field] !== undefined) {
      return String(row[field] || '').trim()
    }
    return ''
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const name = getValue(row, 'name')
      const planNumberStr = getValue(row, 'planNumber')
      const yearlyPriceStr = getValue(row, 'yearlyPrice')

      if (!name || !planNumberStr || !yearlyPriceStr) {
        errors.push(`Row ${i + 2}: Name, plan number, and yearly price are required`)
        continue
      }

      const planNumber = parseInt(planNumberStr)
      const yearlyPrice = parseFloat(yearlyPriceStr)

      if (isNaN(planNumber) || isNaN(yearlyPrice)) {
        errors.push(`Row ${i + 2}: Plan number and yearly price must be valid numbers`)
        continue
      }

      // Check if plan already exists
      const existing = await PaymentPlan.findOne({ planNumber, userId })
      if (existing) {
        warnings.push(`Row ${i + 2}: Payment plan ${planNumber} already exists, skipping`)
        continue
      }

      await PaymentPlan.create({
        userId,
        name,
        planNumber,
        yearlyPrice,
        description: getValue(row, 'description') || undefined
      })

      imported.push(i)
    } catch (error: any) {
      errors.push(`Row ${i + 2}: ${error.message || 'Failed to import payment plan'}`)
    }
  }
}

async function importLifecycleEventTypes(
  rows: any[],
  headerMap: { [key: string]: string },
  imported: number[],
  errors: string[],
  warnings: string[],
  userId: any
) {
  const getValue = (row: any, field: string): string => {
    const normalizedField = normalizeColumnName(field)
    const actualHeader = headerMap[normalizedField]
    if (actualHeader && row[actualHeader] !== undefined) {
      return String(row[actualHeader] || '').trim()
    }
    if (row[field] !== undefined) {
      return String(row[field] || '').trim()
    }
    return ''
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const type = getValue(row, 'type')
      const name = getValue(row, 'name')
      const amountStr = getValue(row, 'amount')

      if (!type || !name || !amountStr) {
        errors.push(`Row ${i + 2}: Type, name, and amount are required`)
        continue
      }

      const amount = parseFloat(amountStr)
      if (isNaN(amount)) {
        errors.push(`Row ${i + 2}: Amount must be a valid number`)
        continue
      }

      // Check if event type already exists
      const existing = await LifecycleEvent.findOne({ type: type.toLowerCase(), userId })
      if (existing) {
        warnings.push(`Row ${i + 2}: Lifecycle event type "${type}" already exists, skipping`)
        continue
      }

      await LifecycleEvent.create({
        userId,
        type: type.toLowerCase(),
        name,
        amount
      })

      imported.push(i)
    } catch (error: any) {
      errors.push(`Row ${i + 2}: ${error.message || 'Failed to import lifecycle event type'}`)
    }
  }
}

async function importWithdrawals(
  rows: any[],
  headerMap: { [key: string]: string },
  imported: number[],
  errors: string[],
  warnings: string[]
) {
  const getValue = (row: any, field: string): string => {
    const normalizedField = normalizeColumnName(field)
    const actualHeader = headerMap[normalizedField]
    if (actualHeader && row[actualHeader] !== undefined) {
      return String(row[actualHeader] || '').trim()
    }
    if (row[field] !== undefined) {
      return String(row[field] || '').trim()
    }
    return ''
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

      const withdrawalDate = parseDate(getValue(row, 'withdrawalDate'))
      if (!withdrawalDate) {
        errors.push(`Row ${i + 2}: Valid withdrawal date is required`)
        continue
      }

      const familyName = getValue(row, 'familyName')
      const familyEmail = getValue(row, 'familyEmail')
      let familyId = getValue(row, 'familyId')
      
      if (!familyId && (familyName || familyEmail)) {
        const family = await findFamilyByNameOrEmail(familyName, familyEmail)
        if (family) {
          familyId = family._id.toString()
        } else {
          errors.push(`Row ${i + 2}: Family not found (name: ${familyName}, email: ${familyEmail})`)
          continue
        }
      } else if (!familyId) {
        errors.push(`Row ${i + 2}: Family name or email is required`)
        continue
      }

      await Withdrawal.create({
        familyId,
        amount,
        withdrawalDate,
        reason: getValue(row, 'reason') || undefined,
        notes: getValue(row, 'notes') || undefined
      })

      imported.push(i)
    } catch (error: any) {
      errors.push(`Row ${i + 2}: ${error.message || 'Failed to import withdrawal'}`)
    }
  }
}

async function importRefunds(
  rows: any[],
  headerMap: { [key: string]: string },
  imported: number[],
  errors: string[],
  warnings: string[]
) {
  const getValue = (row: any, field: string): string => {
    const normalizedField = normalizeColumnName(field)
    const actualHeader = headerMap[normalizedField]
    if (actualHeader && row[actualHeader] !== undefined) {
      return String(row[actualHeader] || '').trim()
    }
    if (row[field] !== undefined) {
      return String(row[field] || '').trim()
    }
    return ''
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

      const refundDate = parseDate(getValue(row, 'refundDate'))
      if (!refundDate) {
        errors.push(`Row ${i + 2}: Valid refund date is required`)
        continue
      }

      let paymentId = getValue(row, 'paymentId')
      if (!paymentId) {
        errors.push(`Row ${i + 2}: Payment ID is required`)
        continue
      }

      const familyName = getValue(row, 'familyName')
      const familyEmail = getValue(row, 'familyEmail')
      let familyId = getValue(row, 'familyId')
      
      if (!familyId && (familyName || familyEmail)) {
        const family = await findFamilyByNameOrEmail(familyName, familyEmail)
        if (family) {
          familyId = family._id.toString()
        } else {
          errors.push(`Row ${i + 2}: Family not found (name: ${familyName}, email: ${familyEmail})`)
          continue
        }
      } else if (!familyId) {
        errors.push(`Row ${i + 2}: Family name or email is required`)
        continue
      }

      await Refund.create({
        paymentId,
        familyId,
        amount,
        refundDate,
        reason: getValue(row, 'reason') || 'requested_by_customer',
        notes: getValue(row, 'notes') || undefined,
        status: 'pending'
      })

      imported.push(i)
    } catch (error: any) {
      errors.push(`Row ${i + 2}: ${error.message || 'Failed to import refund'}`)
    }
  }
}

async function importTasks(
  rows: any[],
  headerMap: { [key: string]: string },
  imported: number[],
  errors: string[],
  warnings: string[],
  userId: any
) {
  const getValue = (row: any, field: string): string => {
    const normalizedField = normalizeColumnName(field)
    const actualHeader = headerMap[normalizedField]
    if (actualHeader && row[actualHeader] !== undefined) {
      return String(row[actualHeader] || '').trim()
    }
    if (row[field] !== undefined) {
      return String(row[field] || '').trim()
    }
    return ''
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const title = getValue(row, 'title')
      const dueDateStr = getValue(row, 'dueDate')
      const email = getValue(row, 'email')

      if (!title || !dueDateStr || !email) {
        errors.push(`Row ${i + 2}: Title, due date, and email are required`)
        continue
      }

      const dueDate = parseDate(dueDateStr)
      if (!dueDate) {
        errors.push(`Row ${i + 2}: Valid due date is required`)
        continue
      }

      await Task.create({
        userId,
        title,
        description: getValue(row, 'description') || undefined,
        dueDate,
        email,
        isCompleted: getValue(row, 'isCompleted')?.toLowerCase() === 'true',
        priority: getValue(row, 'priority') || 'medium'
      })

      imported.push(i)
    } catch (error: any) {
      errors.push(`Row ${i + 2}: ${error.message || 'Failed to import task'}`)
    }
  }
}

async function importFamilyTags(
  rows: any[],
  headerMap: { [key: string]: string },
  imported: number[],
  errors: string[],
  warnings: string[],
  userId: any
) {
  const getValue = (row: any, field: string): string => {
    const normalizedField = normalizeColumnName(field)
    const actualHeader = headerMap[normalizedField]
    if (actualHeader && row[actualHeader] !== undefined) {
      return String(row[actualHeader] || '').trim()
    }
    if (row[field] !== undefined) {
      return String(row[field] || '').trim()
    }
    return ''
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const name = getValue(row, 'name')
      if (!name) {
        errors.push(`Row ${i + 2}: Tag name is required`)
        continue
      }

      // Check if tag already exists
      const existing = await FamilyTag.findOne({ name, userId })
      if (existing) {
        warnings.push(`Row ${i + 2}: Tag "${name}" already exists, skipping`)
        continue
      }

      await FamilyTag.create({
        userId,
        name,
        color: getValue(row, 'color') || '#3b82f6',
        description: getValue(row, 'description') || undefined
      })

      imported.push(i)
    } catch (error: any) {
      errors.push(`Row ${i + 2}: ${error.message || 'Failed to import family tag'}`)
    }
  }
}

async function importFamilyGroups(
  rows: any[],
  headerMap: { [key: string]: string },
  imported: number[],
  errors: string[],
  warnings: string[],
  userId: any
) {
  const getValue = (row: any, field: string): string => {
    const normalizedField = normalizeColumnName(field)
    const actualHeader = headerMap[normalizedField]
    if (actualHeader && row[actualHeader] !== undefined) {
      return String(row[actualHeader] || '').trim()
    }
    if (row[field] !== undefined) {
      return String(row[field] || '').trim()
    }
    return ''
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const name = getValue(row, 'name')
      if (!name) {
        errors.push(`Row ${i + 2}: Group name is required`)
        continue
      }

      // Check if group already exists
      const existing = await FamilyGroup.findOne({ name, userId })
      if (existing) {
        warnings.push(`Row ${i + 2}: Group "${name}" already exists, skipping`)
        continue
      }

      const familyNamesStr = getValue(row, 'familyNames')
      const familyIds: any[] = []
      
      if (familyNamesStr) {
        const familyNames = familyNamesStr.split(',').map(n => n.trim())
        for (const familyName of familyNames) {
          const family = await Family.findOne({ name: new RegExp(familyName, 'i') })
          if (family) {
            familyIds.push(family._id)
          } else {
            warnings.push(`Row ${i + 2}: Family "${familyName}" not found, skipping`)
          }
        }
      }

      await FamilyGroup.create({
        userId,
        name,
        description: getValue(row, 'description') || undefined,
        color: getValue(row, 'color') || '#3b82f6',
        families: familyIds
      })

      imported.push(i)
    } catch (error: any) {
      errors.push(`Row ${i + 2}: ${error.message || 'Failed to import family group'}`)
    }
  }
}

async function importFamilyNotes(
  rows: any[],
  headerMap: { [key: string]: string },
  imported: number[],
  errors: string[],
  warnings: string[]
) {
  const getValue = (row: any, field: string): string => {
    const normalizedField = normalizeColumnName(field)
    const actualHeader = headerMap[normalizedField]
    if (actualHeader && row[actualHeader] !== undefined) {
      return String(row[actualHeader] || '').trim()
    }
    if (row[field] !== undefined) {
      return String(row[field] || '').trim()
    }
    return ''
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const note = getValue(row, 'note')
      if (!note) {
        errors.push(`Row ${i + 2}: Note is required`)
        continue
      }

      const familyName = getValue(row, 'familyName')
      const familyEmail = getValue(row, 'familyEmail')
      let familyId = getValue(row, 'familyId')
      
      if (!familyId && (familyName || familyEmail)) {
        const family = await findFamilyByNameOrEmail(familyName, familyEmail)
        if (family) {
          familyId = family._id.toString()
        } else {
          errors.push(`Row ${i + 2}: Family not found (name: ${familyName}, email: ${familyEmail})`)
          continue
        }
      } else if (!familyId) {
        errors.push(`Row ${i + 2}: Family name or email is required`)
        continue
      }

      await FamilyNote.create({
        familyId,
        note,
        checked: getValue(row, 'checked')?.toLowerCase() === 'true' || false
      })

      imported.push(i)
    } catch (error: any) {
      errors.push(`Row ${i + 2}: ${error.message || 'Failed to import family note'}`)
    }
  }
}

async function importFamilyRelationships(
  rows: any[],
  headerMap: { [key: string]: string },
  imported: number[],
  errors: string[],
  warnings: string[],
  userId: any
) {
  const getValue = (row: any, field: string): string => {
    const normalizedField = normalizeColumnName(field)
    const actualHeader = headerMap[normalizedField]
    if (actualHeader && row[actualHeader] !== undefined) {
      return String(row[actualHeader] || '').trim()
    }
    if (row[field] !== undefined) {
      return String(row[field] || '').trim()
    }
    return ''
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const relationshipType = getValue(row, 'relationshipType')
      if (!relationshipType) {
        errors.push(`Row ${i + 2}: Relationship type is required`)
        continue
      }

      // Find family 1
      const family1Name = getValue(row, 'family1Name')
      const family1Email = getValue(row, 'family1Email')
      let family1Id = getValue(row, 'family1Id')
      
      if (!family1Id && (family1Name || family1Email)) {
        const family = await findFamilyByNameOrEmail(family1Name, family1Email)
        if (family) {
          family1Id = family._id.toString()
        } else {
          errors.push(`Row ${i + 2}: Family 1 not found (name: ${family1Name}, email: ${family1Email})`)
          continue
        }
      } else if (!family1Id) {
        errors.push(`Row ${i + 2}: Family 1 name or email is required`)
        continue
      }

      // Find family 2
      const family2Name = getValue(row, 'family2Name')
      const family2Email = getValue(row, 'family2Email')
      let family2Id = getValue(row, 'family2Id')
      
      if (!family2Id && (family2Name || family2Email)) {
        const family = await findFamilyByNameOrEmail(family2Name, family2Email)
        if (family) {
          family2Id = family._id.toString()
        } else {
          errors.push(`Row ${i + 2}: Family 2 not found (name: ${family2Name}, email: ${family2Email})`)
          continue
        }
      } else if (!family2Id) {
        errors.push(`Row ${i + 2}: Family 2 name or email is required`)
        continue
      }

      if (family1Id === family2Id) {
        errors.push(`Row ${i + 2}: Family 1 and Family 2 cannot be the same`)
        continue
      }

      await FamilyRelationship.create({
        userId,
        familyId1: family1Id,
        familyId2: family2Id,
        relationshipType: relationshipType.toLowerCase()
      })

      imported.push(i)
    } catch (error: any) {
      errors.push(`Row ${i + 2}: ${error.message || 'Failed to import family relationship'}`)
    }
  }
}
