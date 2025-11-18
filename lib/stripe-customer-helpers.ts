import Stripe from 'stripe'
import connectDB from './database'
import { Family, FamilyMember, StripeConfig } from './models'
import { getUserStripeAccountId } from './stripe-helpers'
import https from 'https'

// Create HTTPS agent
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production',
})

// Initialize Stripe with platform account
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  httpAgent: httpsAgent,
}) : null

/**
 * Create Stripe Customer for a family
 */
export async function createStripeCustomerForFamily(familyId: string): Promise<string | null> {
  if (!stripe) {
    console.error('Stripe not initialized')
    return null
  }

  await connectDB()
  
  const family = await Family.findById(familyId)
  if (!family) {
    console.error(`Family ${familyId} not found`)
    return null
  }

  // If customer already exists, return it
  if (family.stripeCustomerId) {
    return family.stripeCustomerId
  }

  // Get admin's Stripe account ID
  if (!family.userId) {
    console.error(`Family ${familyId} has no userId (admin)`)
    return null
  }

  const accountId = await getUserStripeAccountId(family.userId.toString(), familyId)
  if (!accountId) {
    console.error(`No Stripe account found for admin ${family.userId}`)
    return null
  }

  try {
    // Create Stripe Customer on the connected account
    const customer = await stripe.customers.create({
      email: family.email || undefined,
      name: family.name,
      phone: family.phone || family.husbandCellPhone || family.wifeCellPhone || undefined,
      metadata: {
        familyId: family._id.toString(),
        familyName: family.name,
        adminUserId: family.userId.toString(),
      },
      address: family.address || family.street ? {
        line1: family.address || family.street || '',
        city: family.city || '',
        state: family.state || '',
        postal_code: family.zip || '',
        country: 'US', // Default, can be made configurable
      } : undefined,
    }, {
      stripeAccount: accountId,
    })

    // Save customer ID to family
    family.stripeCustomerId = customer.id
    await family.save()

    console.log(`✅ Created Stripe Customer ${customer.id} for family ${family.name}`)
    return customer.id
  } catch (error: any) {
    console.error(`Error creating Stripe Customer for family ${familyId}:`, error)
    return null
  }
}

/**
 * Create Stripe Customer for a family member (when male turns 13)
 */
export async function createStripeCustomerForMember(memberId: string): Promise<string | null> {
  if (!stripe) {
    console.error('Stripe not initialized')
    return null
  }

  await connectDB()
  
  const member = await FamilyMember.findById(memberId).populate('familyId')
  if (!member) {
    console.error(`Member ${memberId} not found`)
    return null
  }

  // If customer already exists, return it
  if (member.stripeCustomerId) {
    return member.stripeCustomerId
  }

  const family = member.familyId as any
  if (!family || !family.userId) {
    console.error(`Member ${memberId} has no family or family has no userId`)
    return null
  }

  // Get admin's Stripe account ID
  const accountId = await getUserStripeAccountId(family.userId.toString(), family._id.toString())
  if (!accountId) {
    console.error(`No Stripe account found for admin ${family.userId}`)
    return null
  }

  try {
    // Create Stripe Customer for the member
    const customerName = `${member.firstName} ${member.lastName}`
    const customer = await stripe.customers.create({
      email: member.email || family.email || undefined,
      name: customerName,
      phone: member.phone || family.phone || family.husbandCellPhone || family.wifeCellPhone || undefined,
      metadata: {
        memberId: member._id.toString(),
        memberName: customerName,
        familyId: family._id.toString(),
        familyName: family.name,
        adminUserId: family.userId.toString(),
        createdReason: 'bar_mitzvah_age',
      },
      address: member.address || family.address || family.street ? {
        line1: member.address || family.address || family.street || '',
        city: member.city || family.city || '',
        state: member.state || family.state || '',
        postal_code: member.zip || family.zip || '',
        country: 'US',
      } : undefined,
    }, {
      stripeAccount: accountId,
    })

    // Save customer ID to member
    member.stripeCustomerId = customer.id
    await member.save()

    console.log(`✅ Created Stripe Customer ${customer.id} for member ${customerName} (turned 13)`)
    return customer.id
  } catch (error: any) {
    console.error(`Error creating Stripe Customer for member ${memberId}:`, error)
    return null
  }
}


