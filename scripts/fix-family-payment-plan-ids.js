/**
 * Script to check and fix families that don't have paymentPlanId set
 */

const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

async function fixFamilyPaymentPlanIds() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is required')
  process.exit(1)
}
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB\n')

    // Define schemas inline
    const PaymentPlanSchema = new mongoose.Schema({
      name: { type: String, required: true },
      yearlyPrice: { type: Number, required: true },
      planNumber: { type: Number },
    }, { timestamps: true })

    const FamilySchema = new mongoose.Schema({
      name: { type: String, required: true },
      currentPlan: { type: Number },
      paymentPlanId: { type: mongoose.Schema.Types.ObjectId },
    }, { timestamps: true })

    const PaymentPlan = mongoose.models.PaymentPlan || mongoose.model('PaymentPlan', PaymentPlanSchema)
    const Family = mongoose.models.Family || mongoose.model('Family', FamilySchema)

    // Get all families
    const families = await Family.find({})
    console.log(`Found ${families.length} families\n`)

    let fixedCount = 0
    let alreadySetCount = 0
    let missingPlanCount = 0

    for (const family of families) {
      console.log(`\nFamily: ${family.name}`)
      console.log(`  currentPlan: ${family.currentPlan || 'NOT SET'}`)
      console.log(`  paymentPlanId: ${family.paymentPlanId || 'NOT SET ❌'}`)

      if (family.paymentPlanId) {
        // Check if the paymentPlanId is valid
        const plan = await PaymentPlan.findById(family.paymentPlanId)
        if (plan) {
          console.log(`  ✅ paymentPlanId is valid -> ${plan.name} (planNumber: ${plan.planNumber})`)
          alreadySetCount++
        } else {
          console.log(`  ⚠️ paymentPlanId exists but plan not found - fixing...`)
          // Find plan by currentPlan
          if (family.currentPlan) {
            const planByNumber = await PaymentPlan.findOne({ planNumber: family.currentPlan })
            if (planByNumber) {
              family.paymentPlanId = planByNumber._id
              await family.save()
              console.log(`  ✅ Fixed! Updated to ${planByNumber.name} (ID: ${planByNumber._id})`)
              fixedCount++
            } else {
              console.log(`  ❌ Could not find plan for currentPlan ${family.currentPlan}`)
              missingPlanCount++
            }
          }
        }
      } else {
        // paymentPlanId is missing - find and set it
        if (family.currentPlan) {
          let planByNumber = await PaymentPlan.findOne({ planNumber: family.currentPlan })
          
          // If not found by planNumber, list all plans and suggest fixing
          if (!planByNumber) {
            console.log(`  ⚠️ Plan ${family.currentPlan} not found. Available plans:`)
            const allPlans = await PaymentPlan.find({}).sort({ planNumber: 1 })
            for (const plan of allPlans) {
              console.log(`    - ${plan.name}: planNumber=${plan.planNumber}, price=$${plan.yearlyPrice}`)
            }
            
            // If Plan 1 doesn't exist but family needs it, we should create it or update the family
            // For now, let's see what plans exist and update accordingly
            if (allPlans.length > 0) {
              // Use the first plan as fallback, or better: create missing plans
              console.log(`  ⚠️ Note: Family needs plan ${family.currentPlan} but it doesn't exist`)
              console.log(`  ⚠️ Consider creating Plan ${family.currentPlan} or updating family's currentPlan`)
            }
            missingPlanCount++
          } else {
            family.paymentPlanId = planByNumber._id
            await family.save()
            console.log(`  ✅ Fixed! Set paymentPlanId to ${planByNumber.name} (ID: ${planByNumber._id})`)
            fixedCount++
          }
        } else {
          console.log(`  ❌ No currentPlan set - cannot determine payment plan`)
          missingPlanCount++
        }
      }
    }

    console.log(`\n\n📊 Summary:`)
    console.log(`  ✅ Already set correctly: ${alreadySetCount}`)
    console.log(`  🔧 Fixed: ${fixedCount}`)
    console.log(`  ❌ Missing/cannot fix: ${missingPlanCount}`)

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
  }
}

fixFamilyPaymentPlanIds()

