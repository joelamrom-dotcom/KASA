// Script to check the actual structure of a family document
const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

const FamilySchema = new mongoose.Schema({}, { strict: false, timestamps: true })
const Family = mongoose.models.Family || mongoose.model('Family', FamilySchema)

async function checkFamilyStructure() {
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
    
    const families = await Family.find({}).limit(1)
    
    if (families.length === 0) {
      console.log('No families found.')
      return
    }
    
    const family = families[0]
    const familyObj = family.toObject()
    
    console.log('Family Document Structure:')
    console.log('='.repeat(80))
    console.log(JSON.stringify(familyObj, null, 2))
    console.log('='.repeat(80))
    
    console.log('\nAll fields in document:')
    Object.keys(familyObj).forEach(key => {
      console.log(`  - ${key}: ${typeof familyObj[key]} = ${JSON.stringify(familyObj[key])}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n✅ Disconnected from MongoDB')
  }
}

checkFamilyStructure()

