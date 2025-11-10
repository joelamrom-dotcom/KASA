/**
 * Script to check the Zeidy payment plan in the database
 */

const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Import models
const { PaymentPlan } = require('../lib/models')

async function checkZeidyPlan() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://joelamrom:ssSTmBrRHh8FeZFh@cluster0joel.bwr2yp0.mongodb.net/kasa-family-db?retryWrites=true&w=majority&appName=Cluster0Joel'
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB\n')

    // Find the Zeidy plan
    const zeidyPlan = await PaymentPlan.findOne({ name: /zeidy/i })
    
    if (!zeidyPlan) {
      console.log('❌ Zeidy plan not found in database')
      
      // List all plans
      const allPlans = await PaymentPlan.find({}).sort({ planNumber: 1 })
      console.log('\nAll payment plans in database:')
      allPlans.forEach((plan, index) => {
        console.log(`\n${index + 1}. ${plan.name}`)
        console.log(`   _id: ${plan._id}`)
        console.log(`   planNumber: ${plan.planNumber || 'NOT SET'}`)
        console.log(`   yearlyPrice: $${plan.yearlyPrice}`)
        console.log(`   createdAt: ${plan.createdAt}`)
        console.log(`   updatedAt: ${plan.updatedAt}`)
      })
    } else {
      console.log('✅ Found Zeidy plan:')
      console.log(`   _id: ${zeidyPlan._id}`)
      console.log(`   name: ${zeidyPlan.name}`)
      console.log(`   planNumber: ${zeidyPlan.planNumber || 'NOT SET'}`)
      console.log(`   yearlyPrice: $${zeidyPlan.yearlyPrice}`)
      console.log(`   createdAt: ${zeidyPlan.createdAt}`)
      console.log(`   updatedAt: ${zeidyPlan.updatedAt}`)
      
      // Also check all plans for reference
      console.log('\n\nAll payment plans:')
      const allPlans = await PaymentPlan.find({}).sort({ planNumber: 1 })
      allPlans.forEach((plan, index) => {
        console.log(`\n${index + 1}. ${plan.name}`)
        console.log(`   _id: ${plan._id}`)
        console.log(`   planNumber: ${plan.planNumber || 'NOT SET'}`)
        console.log(`   yearlyPrice: $${plan.yearlyPrice}`)
      })
    }

    process.exit(0)
  } catch (error) {
    console.error('Error checking Zeidy plan:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
  }
}

checkZeidyPlan()

