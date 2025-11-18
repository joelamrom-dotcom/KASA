// Test script to check what the API returns
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

async function testAPIResponse() {
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
    
    // Simulate what the API does
    const families = await Family.find({}).sort({ name: 1 })
    
    console.log(`Found ${families.length} families\n`)
    
    const familiesWithMembers = families.map((family) => {
      const familyObj = family.toObject()
      
      // Simulate what the API returns
      return {
        ...familyObj,
        _id: familyObj._id?.toString() || familyObj._id,
        paymentPlanId: familyObj.paymentPlanId?.toString() || familyObj.paymentPlanId,
        memberCount: 0
      }
    })
    
    console.log('API Response (first family):')
    console.log(JSON.stringify(familiesWithMembers[0], null, 2))
    
    console.log('\nHebrew name fields in response:')
    familiesWithMembers.forEach((family, index) => {
      console.log(`\nFamily ${index + 1} (${family.name}):`)
      console.log(`  hebrewName: ${family.hebrewName || '(missing/empty)'}`)
      console.log(`  husbandHebrewName: ${family.husbandHebrewName || '(missing/empty)'}`)
      console.log(`  husbandFatherHebrewName: ${family.husbandFatherHebrewName || '(missing/empty)'}`)
      console.log(`  wifeHebrewName: ${family.wifeHebrewName || '(missing/empty)'}`)
      console.log(`  wifeFatherHebrewName: ${family.wifeFatherHebrewName || '(missing/empty)'}`)
      
      // Check if it would pass the filter
      const hasHusbandName = family.husbandHebrewName && family.husbandHebrewName.trim() !== ''
      const hasWifeName = family.wifeHebrewName && family.wifeHebrewName.trim() !== ''
      const hasAnyHebrewName = hasHusbandName || hasWifeName
      
      console.log(`  Would pass filter: ${hasAnyHebrewName ? 'YES ✅' : 'NO ❌'}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n✅ Disconnected from MongoDB')
  }
}

testAPIResponse()

