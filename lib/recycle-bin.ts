import { RecycleBin } from './models'
import mongoose from 'mongoose'

export type RecordType = 
  | 'family' 
  | 'member' 
  | 'payment' 
  | 'withdrawal' 
  | 'lifecycleEvent' 
  | 'note' 
  | 'task' 
  | 'statement' 
  | 'paymentPlan' 
  | 'savedPaymentMethod' 
  | 'recurringPayment'

/**
 * Move a record to recycle bin instead of deleting it
 */
export async function moveToRecycleBin(
  recordType: RecordType,
  recordId: string,
  recordData: any,
  deletedBy?: string
): Promise<void> {
  await RecycleBin.create({
    recordType,
    originalId: recordId,
    recordData: JSON.parse(JSON.stringify(recordData)), // Deep clone
    deletedBy: deletedBy || 'System',
    deletedAt: new Date()
  })
}

/**
 * Restore a record from recycle bin
 */
export async function restoreFromRecycleBin(recycleBinId: string, restoredBy?: string): Promise<any> {
  const recycleItem = await RecycleBin.findById(recycleBinId)
  
  if (!recycleItem) {
    throw new Error('Recycle bin item not found')
  }

  if (recycleItem.restoredAt) {
    throw new Error('This item has already been restored')
  }

  // Mark as restored
  recycleItem.restoredAt = new Date()
  recycleItem.restoredBy = restoredBy || 'System'
  await recycleItem.save()

  return recycleItem
}

/**
 * Permanently delete a record from recycle bin
 */
export async function permanentDeleteFromRecycleBin(recycleBinId: string): Promise<void> {
  await RecycleBin.findByIdAndDelete(recycleBinId)
}

