// Script to test updating a family with Hebrew names
const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

const FamilySchema = new mongoose.Schema({
  name: { type: String, required: true },
  hebrewName: String,
  weddingDate: { type: Date, required: true },
  husbandFirstName: String,
  husbandHebrewName: String,
  husbandFatherHebrewName: String,
  wifeFirstName: String,
  wifeHebrewName: String,
  wifeFatherHebrewName: String,
  husbandCellPhone: String,
  wifeCellPhone: String,
  address: String,
  street: String,
  phone: String,
  email: String,
  city: String,
  state: String,
  zip: String,
  currentPlan: { type: Number, default: 1 },
  paymentPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentPlan' },
  currentPayment: { type: Number, default: 0 },
  openBalance: { type: Number, default: 0 },
}, { timestamps: true })

const Family = mongoose.models.Family || mongoose.model('Family', FamilySchema)

async function testUpdate() {
  // Use the same database as the API (cloud MongoDB Atlas)
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable is required')
    process.exit(1)
  }
  
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')
    
    // Find the first family
    const family = await Family.findOne({ name: 'goldberger' })
    
    if (!family) {
      console.log('Family not found')
      return
    }
    
    console.log('Current family data:')
    console.log(JSON.stringify(family.toObject(), null, 2))
    console.log('\n' + '='.repeat(80))
    
    // Test update with Hebrew names
    const updateData = {
      hebrewName: 'גולדברגר',
      husbandHebrewName: 'יואל',
      husbandFatherHebrewName: 'אברהם',
      wifeHebrewName: 'שרה',
      wifeFatherHebrewName: 'יצחק'
    }
    
    console.log('\nUpdating with Hebrew names:')
    console.log(JSON.stringify(updateData, null, 2))
    
    const updated = await Family.findByIdAndUpdate(
      family._id,
      updateData,
      { new: true, runValidators: true }
    )
    
    console.log('\n' + '='.repeat(80))
    console.log('Updated family data:')
    console.log(JSON.stringify(updated.toObject(), null, 2))
    
    // Verify the update
    const verified = await Family.findById(family._id)
    console.log('\n' + '='.repeat(80))
    console.log('Verified from database:')
    console.log(`  hebrewName: ${verified.hebrewName || '(empty)'}`)
    console.log(`  husbandHebrewName: ${verified.husbandHebrewName || '(empty)'}`)
    console.log(`  husbandFatherHebrewName: ${verified.husbandFatherHebrewName || '(empty)'}`)
    console.log(`  wifeHebrewName: ${verified.wifeHebrewName || '(empty)'}`)
    console.log(`  wifeFatherHebrewName: ${verified.wifeFatherHebrewName || '(empty)'}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n✅ Disconnected from MongoDB')
  }
}

testUpdate()

