import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { RecycleBin } from '@/lib/models'
import { 
  Family, 
  FamilyMember, 
  Payment, 
  Withdrawal, 
  LifecycleEventPayment, 
  FamilyNote,
  Task,
  Statement,
  PaymentPlan,
  SavedPaymentMethod,
  RecurringPayment
} from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Restore a record from recycle bin
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const recycleItem = await RecycleBin.findById(params.id)
    
    if (!recycleItem) {
      return NextResponse.json(
        { error: 'Recycle bin item not found' },
        { status: 404 }
      )
    }

    if (recycleItem.restoredAt) {
      return NextResponse.json(
        { error: 'This item has already been restored' },
        { status: 400 }
      )
    }

    // Restore the record based on type
    const recordData = recycleItem.recordData
    let restoredRecord: any = null

    switch (recycleItem.recordType) {
      case 'family':
        restoredRecord = await Family.create(recordData)
        break
      case 'member':
        restoredRecord = await FamilyMember.create(recordData)
        break
      case 'payment':
        restoredRecord = await Payment.create(recordData)
        break
      case 'withdrawal':
        restoredRecord = await Withdrawal.create(recordData)
        break
      case 'lifecycleEvent':
        restoredRecord = await LifecycleEventPayment.create(recordData)
        break
      case 'note':
        restoredRecord = await FamilyNote.create(recordData)
        break
      case 'task':
        restoredRecord = await Task.create(recordData)
        break
      case 'statement':
        restoredRecord = await Statement.create(recordData)
        break
      case 'paymentPlan':
        restoredRecord = await PaymentPlan.create(recordData)
        break
      case 'savedPaymentMethod':
        restoredRecord = await SavedPaymentMethod.create(recordData)
        break
      case 'recurringPayment':
        restoredRecord = await RecurringPayment.create(recordData)
        break
      default:
        return NextResponse.json(
          { error: `Unknown record type: ${recycleItem.recordType}` },
          { status: 400 }
        )
    }

    // Mark as restored
    recycleItem.restoredAt = new Date()
    recycleItem.restoredBy = 'System' // You can get from auth context
    await recycleItem.save()

    return NextResponse.json({ 
      message: 'Record restored successfully',
      restoredRecord 
    })
  } catch (error: any) {
    console.error('Error restoring record:', error)
    return NextResponse.json(
      { error: 'Failed to restore record', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Permanently delete from recycle bin
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const recycleItem = await RecycleBin.findByIdAndDelete(params.id)
    
    if (!recycleItem) {
      return NextResponse.json(
        { error: 'Recycle bin item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Record permanently deleted' })
  } catch (error: any) {
    console.error('Error permanently deleting record:', error)
    return NextResponse.json(
      { error: 'Failed to permanently delete record', details: error.message },
      { status: 500 }
    )
  }
}

