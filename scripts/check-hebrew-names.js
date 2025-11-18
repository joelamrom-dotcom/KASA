// Script to check if Hebrew names are saved in the database
const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Family Schema (matching the one in models.ts)
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

async function checkHebrewNames() {
  // Use the same database as the API (from .env.local)
  const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is required')
  process.exit(1)
}
  
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')
    
    // Get all families
    const families = await Family.find({}).sort({ name: 1 })
    
    console.log(`Found ${families.length} families in database\n`)
    console.log('='.repeat(80))
    
    if (families.length === 0) {
      console.log('No families found in database.')
      return
    }
    
    // Check each family for Hebrew names
    families.forEach((family, index) => {
      const familyObj = family.toObject()
      console.log(`\n${index + 1}. Family: ${familyObj.name}`)
      console.log(`   ID: ${familyObj._id}`)
      console.log(`   Hebrew Name: ${familyObj.hebrewName || '(empty)'}`)
      console.log(`   Husband Hebrew Name: ${familyObj.husbandHebrewName || '(empty)'}`)
      console.log(`   Husband Father Hebrew Name: ${familyObj.husbandFatherHebrewName || '(empty)'}`)
      console.log(`   Wife Hebrew Name: ${familyObj.wifeHebrewName || '(empty)'}`)
      console.log(`   Wife Father Hebrew Name: ${familyObj.wifeFatherHebrewName || '(empty)'}`)
      
      // Check if any Hebrew names exist
      const hasHebrewNames = 
        familyObj.hebrewName || 
        familyObj.husbandHebrewName || 
        familyObj.husbandFatherHebrewName ||
        familyObj.wifeHebrewName || 
        familyObj.wifeFatherHebrewName
      
      if (hasHebrewNames) {
        console.log(`   ✅ Has Hebrew names`)
      } else {
        console.log(`   ❌ No Hebrew names found`)
      }
    })
    
    console.log('\n' + '='.repeat(80))
    console.log('\nSummary:')
    const familiesWithHebrewNames = families.filter(f => {
      const obj = f.toObject()
      return obj.hebrewName || obj.husbandHebrewName || obj.husbandFatherHebrewName || 
             obj.wifeHebrewName || obj.wifeFatherHebrewName
    })
    console.log(`   Total families: ${families.length}`)
    console.log(`   Families with Hebrew names: ${familiesWithHebrewNames.length}`)
    console.log(`   Families without Hebrew names: ${families.length - familiesWithHebrewNames.length}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n✅ Disconnected from MongoDB')
  }
}

checkHebrewNames()

