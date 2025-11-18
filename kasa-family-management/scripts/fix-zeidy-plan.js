/**
 * Script to check and fix the Zeidy payment plan in the database
 */

const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

async function fixZeidyPlan() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable is required')
    process.exit(1)
  }
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB\n')

    // Define PaymentPlan schema inline since we can't import TypeScript
    const PaymentPlanSchema = new mongoose.Schema({
      name: { type: String, required: true },
      yearlyPrice: { type: Number, required: true },
      planNumber: { type: Number },
    }, { timestamps: true })

    const PaymentPlan = mongoose.models.PaymentPlan || mongoose.model('PaymentPlan', PaymentPlanSchema)

    // Find the Zeidy plan
    const zeidyPlan = await PaymentPlan.findOne({ name: /zeidy/i })
    
    if (!zeidyPlan) {
      console.log('❌ Zeidy plan not found in database')
      
      // List all plans
      const allPlans = await PaymentPlan.find({})
      console.log('\nAll payment plans in database:')
      allPlans.forEach((plan) => {
        console.log(`\n- ${plan.name}`)
        console.log(`  _id: ${plan._id}`)
        console.log(`  planNumber: ${plan.planNumber || 'NOT SET'}`)
        console.log(`  yearlyPrice: $${plan.yearlyPrice}`)
      })
    } else {
      console.log('✅ Found Zeidy plan:')
      console.log(`   _id: ${zeidyPlan._id}`)
      console.log(`   name: ${zeidyPlan.name}`)
      console.log(`   planNumber: ${zeidyPlan.planNumber || 'NOT SET ❌'}`)
      console.log(`   yearlyPrice: $${zeidyPlan.yearlyPrice}`)
      
      // Fix planNumber if missing
      if (!zeidyPlan.planNumber) {
        // Zeidy should be Plan 4 (yearlyPrice: 2500)
        zeidyPlan.planNumber = 4
        await zeidyPlan.save()
        console.log('\n✅ Fixed! Set planNumber to 4')
      } else {
        console.log('\n✅ planNumber is already set')
      }
      
      // Also check all plans
      console.log('\n\nAll payment plans:')
      const allPlans = await PaymentPlan.find({}).sort({ planNumber: 1 })
      for (const plan of allPlans) {
        console.log(`\n- ${plan.name}`)
        console.log(`  _id: ${plan._id}`)
        console.log(`  planNumber: ${plan.planNumber || 'NOT SET ❌'}`)
        console.log(`  yearlyPrice: $${plan.yearlyPrice}`)
        
        // Fix missing planNumbers
        if (!plan.planNumber) {
          // Bucher should be Plan 3 ($1800), but if price is wrong, fix both
          if (plan.name.toLowerCase().includes('bucher')) {
            plan.planNumber = 3
            plan.yearlyPrice = 1800 // Fix the price too
            await plan.save()
            console.log(`  ✅ Fixed! Set planNumber to 3 and yearlyPrice to $1800`)
          } else {
            const priceToPlanMap = {
              1200: 1,
              1500: 2,
              1800: 3,
              2500: 4
            }
            const inferredPlanNumber = priceToPlanMap[plan.yearlyPrice]
            if (inferredPlanNumber) {
              plan.planNumber = inferredPlanNumber
              await plan.save()
              console.log(`  ✅ Fixed! Set planNumber to ${inferredPlanNumber}`)
            }
          }
        } else if (plan.name.toLowerCase().includes('bucher') && plan.yearlyPrice !== 1800) {
          // Fix Bucher price if planNumber is set but price is wrong
          plan.yearlyPrice = 1800
          await plan.save()
          console.log(`  ✅ Fixed! Updated yearlyPrice to $1800`)
        }
      }
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

fixZeidyPlan()

