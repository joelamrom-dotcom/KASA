import { Family, FamilyMember, PaymentPlan } from './models'
import connectDB from './database'
import { calculateAge, getAgeGroup } from './calculations'

/**
 * Check if a member's payment plan needs to be updated based on age
 * Returns the recommended plan number or null if no change needed
 */
export async function checkPaymentPlanUpdate(memberId: string): Promise<number | null> {
  await connectDB()
  
  const member = await FamilyMember.findById(memberId)
  if (!member || !member.birthDate) {
    return null
  }

  const age = calculateAge(member.birthDate)
  const recommendedPlan = getAgeGroup(age)
  
  // If member already has a plan assigned and it matches, no update needed
  if (member.paymentPlan === recommendedPlan) {
    return null
  }

  return recommendedPlan
}

/**
 * Auto-update payment plan for a member when they age up
 * Returns true if plan was updated, false otherwise
 */
export async function autoUpdatePaymentPlan(memberId: string, notifyFamily: boolean = true): Promise<{
  updated: boolean
  oldPlan?: number
  newPlan?: number
  memberName?: string
  familyId?: string
}> {
  await connectDB()
  
  const member = await FamilyMember.findById(memberId).populate('familyId', 'name email paymentPlanId')
  if (!member || !member.birthDate) {
    return { updated: false }
  }

  const age = calculateAge(member.birthDate)
  const recommendedPlan = getAgeGroup(age)
  
  // If member already has the correct plan, no update needed
  if (member.paymentPlan === recommendedPlan) {
    return { updated: false }
  }

  const oldPlan = member.paymentPlan
  member.paymentPlan = recommendedPlan
  member.paymentPlanAssigned = true
  await member.save()

  const family = member.familyId as any

  // Get payment plan name
  let planName = `Plan ${recommendedPlan}`
  try {
    const paymentPlans = await PaymentPlan.find().lean()
    const plan = paymentPlans.find((p: any) => p.planNumber === recommendedPlan)
    if (plan) {
      planName = plan.name
    }
  } catch (error) {
    console.error('Error fetching payment plan name:', error)
  }

  // Notify family if requested
  if (notifyFamily && family?.email) {
    try {
      const { sendEmail } = await import('@/lib/email-helpers')
      const memberName = `${member.firstName} ${member.lastName}`
      const subject = `Payment Plan Updated for ${memberName}`
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Payment Plan Updated</h1>
            </div>
            <div class="content">
              <p>Dear ${family.name},</p>
              
              <p>We wanted to inform you that the payment plan for <strong>${memberName}</strong> has been automatically updated.</p>
              
              <div class="info-box">
                <p><strong>Previous Plan:</strong> ${oldPlan ? `Plan ${oldPlan}` : 'Not assigned'}</p>
                <p><strong>New Plan:</strong> ${planName}</p>
                <p><strong>Reason:</strong> ${memberName} has reached the age group for this plan (currently ${age} years old).</p>
              </div>
              
              <p>This update will be reflected in your next payment calculation. If you have any questions, please don't hesitate to contact us.</p>
              
              <p>Best regards,<br>Kasa Family Management Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
      await sendEmail(family.email, subject, html)
    } catch (emailError) {
      console.error('Error sending payment plan update email:', emailError)
      // Don't fail the update if email fails
    }
  }

  return {
    updated: true,
    oldPlan: oldPlan || undefined,
    newPlan: recommendedPlan,
    memberName: `${member.firstName} ${member.lastName}`,
    familyId: family?._id?.toString()
  }
}

/**
 * Check all members and update payment plans for those who have aged up
 * Returns summary of updates
 */
export async function checkAndUpdateAllPaymentPlans(userId?: string): Promise<{
  checked: number
  updated: number
  results: Array<{
    memberId: string
    memberName: string
    familyId: string
    oldPlan?: number
    newPlan: number
  }>
}> {
  await connectDB()
  
  const query: any = {}
  if (userId) {
    // Get families for this user
    const families = await Family.find({ userId }).select('_id').lean()
    const familyIds = families.map(f => f._id)
    query.familyId = { $in: familyIds }
  }

  const members = await FamilyMember.find(query).populate('familyId', 'name userId').lean()
  
  let checked = 0
  let updated = 0
  const results: Array<{
    memberId: string
    memberName: string
    familyId: string
    oldPlan?: number
    newPlan: number
  }> = []

  for (const member of members) {
    if (!member.birthDate) continue
    
    checked++
    const age = calculateAge(new Date(member.birthDate))
    const recommendedPlan = getAgeGroup(age)
    
    // Only update if plan is different
    if (member.paymentPlan !== recommendedPlan) {
      const updateResult = await autoUpdatePaymentPlan(member._id.toString(), true)
      if (updateResult.updated) {
        updated++
        results.push({
          memberId: member._id.toString(),
          memberName: `${member.firstName} ${member.lastName}`,
          familyId: (member.familyId as any)?._id?.toString() || '',
          oldPlan: updateResult.oldPlan,
          newPlan: updateResult.newPlan!
        })
      }
    }
  }

  return { checked, updated, results }
}

