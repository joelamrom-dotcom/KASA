/**
 * Script to convert members to families on their wedding date
 * Run this daily via cron job: 0 0 * * * node scripts/convert-wedding-dates.js
 * 
 * Note: This script uses TypeScript, so you may need to compile first or use ts-node
 * Alternative: Use the API endpoint /api/kasa/wedding-converter via cron job
 */

const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Import models
const { FamilyMember, Family } = require('../lib/models')

async function convertMembersOnWeddingDate() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is required')
  process.exit(1)
}
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    // Find all members with wedding dates that are today or in the past who haven't been converted yet
    const membersToConvert = await FamilyMember.find({
      weddingDate: {
        $lte: startOfToday // Wedding date is today or in the past
      },
      convertedToFamily: { $ne: true }
    })

    console.log(`Found ${membersToConvert.length} member(s) to convert on ${today.toLocaleDateString()}`)

    for (const member of membersToConvert) {
      try {
        // Get the original family
        const originalFamily = await Family.findById(member.familyId)
        if (!originalFamily) {
          console.error(`Original family not found for member ${member._id}`)
          continue
        }

        const weddingDate = member.weddingDate
        if (!weddingDate) {
          continue
        }

        // Calculate payment plan based on years married (on wedding date, it's 0 years)
        // But we'll calculate based on years from wedding date to today
        const todayForCalc = new Date()
        const yearsMarried = todayForCalc.getFullYear() - weddingDate.getFullYear()
        const monthDiff = todayForCalc.getMonth() - weddingDate.getMonth()
        const actualYearsMarried = monthDiff < 0 || (monthDiff === 0 && todayForCalc.getDate() < weddingDate.getDate()) 
          ? yearsMarried - 1 
          : yearsMarried
        
        // Determine payment plan based on years married
        let paymentPlan = 1
        if (actualYearsMarried >= 0 && actualYearsMarried <= 4) {
          paymentPlan = 1
        } else if (actualYearsMarried >= 5 && actualYearsMarried <= 8) {
          paymentPlan = 2
        } else if (actualYearsMarried >= 9 && actualYearsMarried <= 16) {
          paymentPlan = 3
        } else {
          paymentPlan = 4 // 17+ years
        }

        // Create new family name
        const newFamilyName = member.spouseName 
          ? `${member.firstName} ${member.lastName} & ${member.spouseName}`
          : `${member.firstName} ${member.lastName} Family`

        // Determine spouse information - use new fields if available, otherwise fall back to spouseName
        const spouseFirstName = member.spouseFirstName || (member.spouseName ? member.spouseName.trim().split(' ')[0] : '')
        const spouseLastName = member.spouseName && !member.spouseFirstName 
          ? (member.spouseName.trim().split(' ').length > 1 ? member.spouseName.trim().split(' ').slice(1).join(' ') : member.lastName)
          : member.lastName

        // Determine father's Hebrew name based on member gender
        // If male: use current family's husbandHebrewName
        // If female: use current family's wifeHebrewName
        const fatherHebrewName = member.gender === 'male' 
          ? originalFamily.husbandHebrewName || null
          : originalFamily.wifeHebrewName || null

        // Create new family - use address if provided, otherwise use original family address
        const newFamily = await Family.create({
          name: newFamilyName,
          weddingDate: weddingDate,
          // Use address if provided, otherwise use original family address
          address: member.address || originalFamily.address,
          street: member.address || originalFamily.street || originalFamily.address,
          phone: member.phone || originalFamily.phone,
          email: member.email || originalFamily.email,
          city: member.city || originalFamily.city,
          state: member.state || originalFamily.state,
          zip: member.zip || originalFamily.zip,
          // Set husband/wife information based on member gender
          ...(member.gender === 'male' ? {
            husbandFirstName: member.firstName,
            husbandHebrewName: member.hebrewFirstName || null,
            husbandFatherHebrewName: fatherHebrewName,
            husbandCellPhone: null,
            wifeFirstName: spouseFirstName || null,
            wifeHebrewName: member.spouseHebrewName || null,
            wifeFatherHebrewName: member.spouseFatherHebrewName || null,
            wifeCellPhone: member.spouseCellPhone || null
          } : {
            husbandFirstName: spouseFirstName || null,
            husbandHebrewName: member.spouseHebrewName || null,
            husbandFatherHebrewName: member.spouseFatherHebrewName || null,
            husbandCellPhone: member.spouseCellPhone || null,
            wifeFirstName: member.firstName,
            wifeHebrewName: member.hebrewFirstName || null,
            wifeFatherHebrewName: fatherHebrewName,
            wifeCellPhone: null
          }),
          currentPlan: paymentPlan,
          currentPayment: 0,
          openBalance: 0
        })

        // Create spouse as a member if name provided (but NOT the converted member - they ARE the family)
        if (spouseFirstName || member.spouseName) {
          await FamilyMember.create({
            familyId: newFamily._id,
            firstName: spouseFirstName,
            lastName: spouseLastName,
            hebrewFirstName: member.spouseHebrewName || null,
            birthDate: weddingDate, // Approximate, can be updated later
            gender: member.gender === 'male' ? 'female' : 'male'
          })
        }

        // Mark original member as converted and remove from old family
        // The converted member becomes the family head, not a child/member
        member.convertedToFamily = true
        await FamilyMember.deleteOne({ _id: member._id })

        console.log(`✅ Successfully converted ${member.firstName} ${member.lastName} to new family: ${newFamily.name}`)
      } catch (error) {
        console.error(`❌ Error converting member ${member._id} to family:`, error.message)
        // Continue with next member even if one fails
      }
    }

    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
    
    return { converted: membersToConvert.length, members: membersToConvert }
  } catch (error) {
    console.error('Error in convertMembersOnWeddingDate:', error)
    await mongoose.disconnect()
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  convertMembersOnWeddingDate()
    .then(result => {
      console.log(`\n✅ Conversion completed: ${result.converted} member(s) converted`)
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Conversion failed:', error)
      process.exit(1)
    })
}

module.exports = { convertMembersOnWeddingDate }
