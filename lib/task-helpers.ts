import { Task, Family } from './models'
import connectDB from './database'

/**
 * Create a task when a payment is declined
 */
export async function createPaymentDeclinedTask(
  familyId: string,
  paymentId: string | null,
  amount: number,
  errorMessage: string,
  memberId?: string
) {
  try {
    await connectDB()
    
    // Get family to get email
    const family = await Family.findById(familyId).lean()
    if (!family) {
      console.error(`Family ${familyId} not found for task creation`)
      return null
    }

    // Use family email or a default email
    const email = (family as any).email || 'admin@kasa.com' // You may want to set a default admin email
    
    // Create task for payment declined
    const task = await Task.create({
      title: `Payment Declined: $${amount.toLocaleString()}`,
      description: `Payment attempt failed for ${(family as any).name || 'Family'}. Error: ${errorMessage}`,
      dueDate: new Date(), // Due today - immediate action needed
      email: email,
      status: 'pending',
      priority: 'high',
      relatedFamilyId: familyId,
      relatedMemberId: memberId || undefined,
      relatedPaymentId: paymentId || undefined,
      notes: `Payment amount: $${amount.toLocaleString()}. This task was automatically created due to payment failure.`
    })

    return task
  } catch (error: any) {
    console.error('Error creating payment declined task:', error)
    return null
  }
}

