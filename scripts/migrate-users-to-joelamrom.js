/**
 * Script to migrate data from multiple users to joelamrom@gmail.com
 * This will assign all families, payments, tasks, etc. from specified users to joelamrom@gmail.com
 * 
 * Usage: node scripts/migrate-users-to-joelamrom.js
 */

const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

// Try to load .env.local file manually
try {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8')
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
} catch (error) {
  console.log('Could not load .env.local, using environment variables')
}

// MongoDB URI from environment variable (REQUIRED)
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is required')
  process.exit(1)
}

// Define schemas (simplified for script)
const UserSchema = new mongoose.Schema({}, { strict: false })
const FamilySchema = new mongoose.Schema({}, { strict: false })
const PaymentSchema = new mongoose.Schema({}, { strict: false })
const TaskSchema = new mongoose.Schema({}, { strict: false })
const ReportSchema = new mongoose.Schema({}, { strict: false })

const User = mongoose.model('User', UserSchema)
const Family = mongoose.model('Family', FamilySchema)
const Payment = mongoose.model('Payment', PaymentSchema)
const Task = mongoose.model('Task', TaskSchema)
const Report = mongoose.model('Report', ReportSchema)

async function migrateUsersToJoelamrom() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    // Find joelamrom@gmail.com user
    const targetEmail = 'joelamrom@gmail.com'
    const targetUser = await User.findOne({ email: targetEmail.toLowerCase() })
    
    if (!targetUser) {
      console.error(`❌ User ${targetEmail} not found in database`)
      process.exit(1)
    }

    console.log(`✅ Found target user: ${targetUser.email} (ID: ${targetUser._id})\n`)

    // List all users
    const allUsers = await User.find({}).select('email _id role').lean()
    console.log('All users in database:')
    allUsers.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.email} (ID: ${u._id}, Role: ${u.role})`)
    })
    console.log('')

    // Get users to migrate FROM (all users except joelamrom)
    const usersToMigrate = allUsers.filter(u => u.email.toLowerCase() !== targetEmail.toLowerCase())
    
    if (usersToMigrate.length === 0) {
      console.log('✅ No other users found. Nothing to migrate.')
      await mongoose.disconnect()
      return
    }

    console.log(`\n📋 Found ${usersToMigrate.length} user(s) to migrate data from:`)
    usersToMigrate.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.email} (ID: ${u._id})`)
    })
    console.log('')

    // Confirm migration
    console.log(`🔄 Migrating data from ${usersToMigrate.length} user(s) to ${targetEmail}...\n`)

    let totalFamilies = 0
    let totalPayments = 0
    let totalTasks = 0
    let totalReports = 0

    for (const sourceUser of usersToMigrate) {
      console.log(`\n📦 Migrating data from ${sourceUser.email}...`)

      // Migrate Families
      const familiesResult = await Family.updateMany(
        { userId: sourceUser._id },
        { $set: { userId: targetUser._id } }
      )
      totalFamilies += familiesResult.modifiedCount
      console.log(`  ✅ Migrated ${familiesResult.modifiedCount} families`)

      // Migrate Payments (payments are linked via familyId, but we'll update any direct userId references)
      // Note: Payments typically don't have userId, but we'll check
      const paymentsResult = await Payment.updateMany(
        { userId: sourceUser._id },
        { $set: { userId: targetUser._id } }
      )
      totalPayments += paymentsResult.modifiedCount
      if (paymentsResult.modifiedCount > 0) {
        console.log(`  ✅ Migrated ${paymentsResult.modifiedCount} payments`)
      }

      // Migrate Tasks
      const tasksResult = await Task.updateMany(
        { userId: sourceUser._id },
        { $set: { userId: targetUser._id } }
      )
      totalTasks += tasksResult.modifiedCount
      if (tasksResult.modifiedCount > 0) {
        console.log(`  ✅ Migrated ${tasksResult.modifiedCount} tasks`)
      }

      // Migrate Reports
      const reportsResult = await Report.updateMany(
        { userId: sourceUser._id },
        { $set: { userId: targetUser._id } }
      )
      totalReports += reportsResult.modifiedCount
      if (reportsResult.modifiedCount > 0) {
        console.log(`  ✅ Migrated ${reportsResult.modifiedCount} reports`)
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('✅ Migration Summary:')
    console.log(`  Total Families: ${totalFamilies}`)
    console.log(`  Total Payments: ${totalPayments}`)
    console.log(`  Total Tasks: ${totalTasks}`)
    console.log(`  Total Reports: ${totalReports}`)
    console.log('='.repeat(50))

    // Verify migration
    console.log('\n🔍 Verifying migration...')
    const joelamromFamilies = await Family.countDocuments({ userId: targetUser._id })
    console.log(`✅ ${joelamromFamilies} families now belong to ${targetEmail}`)

    // Check if any data still belongs to migrated users
    for (const sourceUser of usersToMigrate) {
      const remainingFamilies = await Family.countDocuments({ userId: sourceUser._id })
      const remainingTasks = await Task.countDocuments({ userId: sourceUser._id })
      const remainingReports = await Report.countDocuments({ userId: sourceUser._id })
      
      if (remainingFamilies > 0 || remainingTasks > 0 || remainingReports > 0) {
        console.log(`⚠️  ${sourceUser.email} still has:`)
        if (remainingFamilies > 0) console.log(`   - ${remainingFamilies} families`)
        if (remainingTasks > 0) console.log(`   - ${remainingTasks} tasks`)
        if (remainingReports > 0) console.log(`   - ${remainingReports} reports`)
      }
    }

    await mongoose.disconnect()
    console.log('\n✅ Disconnected from MongoDB')
    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

migrateUsersToJoelamrom()

