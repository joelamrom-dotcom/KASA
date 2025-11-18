// Check if members have Hebrew names
const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

const FamilyMemberSchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  firstName: { type: String, required: true },
  hebrewFirstName: String,
  lastName: { type: String, required: true },
  hebrewLastName: String,
  birthDate: Date,
  hebrewBirthDate: String,
  gender: String,
}, { timestamps: true })

const FamilyMember = mongoose.models.FamilyMember || mongoose.model('FamilyMember', FamilyMemberSchema)

async function checkMemberHebrew() {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable is required')
    process.exit(1)
  }
  
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')
    
    const members = await FamilyMember.find({}).sort({ birthDate: 1 })
    
    console.log(`Found ${members.length} members in database\n`)
    
    members.forEach((member, index) => {
      const memberObj = member.toObject()
      console.log(`Member ${index + 1}: ${memberObj.firstName} ${memberObj.lastName}`)
      console.log(`  Hebrew First Name: ${memberObj.hebrewFirstName || '(empty)'}`)
      console.log(`  Hebrew Last Name: ${memberObj.hebrewLastName || '(empty)'}`)
      console.log(`  Family ID: ${memberObj.familyId}`)
      console.log('')
    })
    
    const membersWithHebrewNames = members.filter(m => {
      const obj = m.toObject()
      return obj.hebrewFirstName && obj.hebrewFirstName.trim() !== ''
    })
    
    console.log(`\nSummary:`)
    console.log(`  Total members: ${members.length}`)
    console.log(`  Members with Hebrew first names: ${membersWithHebrewNames.length}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n✅ Disconnected from MongoDB')
  }
}

checkMemberHebrew()

