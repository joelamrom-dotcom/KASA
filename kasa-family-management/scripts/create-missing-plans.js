/**
 * Script to create missing payment plans (Plan 1 and Plan 2)
 */

const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

async function createMissingPlans() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI
    if (!MONGODB_URI) {
      console.error('Error: MONGODB_URI environment variable is required')
      process.exit(1)
    }
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB\n')

    const PaymentPlanSchema = new mongoose.Schema({
      name: { type: String, required: true },
      yearlyPrice: { type: Number, required: true },
      planNumber: { type: Number },
    }, { timestamps: true })

    const PaymentPlan = mongoose.models.PaymentPlan || mongoose.model('PaymentPlan', PaymentPlanSchema)

    const plansToCreate = [
      { name: 'Plan 1', yearlyPrice: 1200, planNumber: 1 },
      { name: 'Plan 2', yearlyPrice: 1500, planNumber: 2 }
    ]

    for (const planData of plansToCreate) {
      const existing = await PaymentPlan.findOne({ planNumber: planData.planNumber })
      if (existing) {
        console.log(`✅ ${planData.name} already exists (ID: ${existing._id})`)
      } else {
        const created = await PaymentPlan.create(planData)
        console.log(`✅ Created ${planData.name} (ID: ${created._id})`)
      }
    }

    console.log('\n📊 All payment plans:')
    const allPlans = await PaymentPlan.find({}).sort({ planNumber: 1 })
    for (const plan of allPlans) {
      console.log(`  ${plan.planNumber}. ${plan.name} - $${plan.yearlyPrice} (ID: ${plan._id})`)
    }

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
  }
}

createMissingPlans()

