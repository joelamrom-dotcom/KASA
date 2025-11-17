/**
 * Migration script to assign all existing data to joelamrom@gmail.com
 * Run this script once: node scripts/migrate-data.js
 * 
 * Make sure to set MONGODB_URI environment variable:
 * Windows: $env:MONGODB_URI="your-connection-string"
 * Linux/Mac: export MONGODB_URI="your-connection-string"
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

// Default MongoDB URI (same as in lib/database.ts)
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || 
  'mongodb+srv://joelamrom:ssSTmBrRHh8FeZFh@cluster0joel.bwr2yp0.mongodb.net/kasa-family-db?retryWrites=true&w=majority&appName=Cluster0Joel'

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables')
  process.exit(1)
}

// Define schemas (simplified for migration)
const UserSchema = new mongoose.Schema({}, { strict: false })
const FamilySchema = new mongoose.Schema({}, { strict: false })
const TaskSchema = new mongoose.Schema({}, { strict: false })
const ReportSchema = new mongoose.Schema({}, { strict: false })

const User = mongoose.model('User', UserSchema)
const Family = mongoose.model('Family', FamilySchema)
const Task = mongoose.model('Task', TaskSchema)
const Report = mongoose.model('Report', ReportSchema)

async function migrateData() {
  try {
    console.log('Connecting to database...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to database')
    
    // Find user by email
    const email = 'joelamrom@gmail.com'
    const user = await User.findOne({ email: email.toLowerCase() })
    
    if (!user) {
      console.error(`User with email ${email} not found`)
      console.log('Available users:')
      const allUsers = await User.find({}).select('email firstName lastName')
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.firstName} ${u.lastName})`)
      })
      process.exit(1)
    }
    
    const userId = user._id
    console.log(`Found user: ${user.email} (${user.firstName} ${user.lastName})`)
    console.log(`User ID: ${userId}`)
    
    let migrated = {
      families: 0,
      tasks: 0,
      reports: 0
    }
    
    // Migrate families without userId
    console.log('\nMigrating families...')
    const familiesResult = await Family.updateMany(
      { $or: [{ userId: { $exists: false } }, { userId: null }] },
      { $set: { userId: userId } }
    )
    migrated.families = familiesResult.modifiedCount
    console.log(`  Migrated ${migrated.families} families`)
    
    // Migrate tasks without userId
    console.log('\nMigrating tasks...')
    const tasksResult = await Task.updateMany(
      { $or: [{ userId: { $exists: false } }, { userId: null }] },
      { $set: { userId: userId } }
    )
    migrated.tasks = tasksResult.modifiedCount
    console.log(`  Migrated ${migrated.tasks} tasks`)
    
    // Migrate reports without userId
    console.log('\nMigrating reports...')
    const reportsResult = await Report.updateMany(
      { $or: [{ userId: { $exists: false } }, { userId: null }] },
      { $set: { userId: userId } }
    )
    migrated.reports = reportsResult.modifiedCount
    console.log(`  Migrated ${migrated.reports} reports`)
    
    console.log('\n✅ Migration completed successfully!')
    console.log(`\nSummary:`)
    console.log(`  Families: ${migrated.families}`)
    console.log(`  Tasks: ${migrated.tasks}`)
    console.log(`  Reports: ${migrated.reports}`)
    console.log(`\nAll data has been assigned to: ${user.email}`)
    
    await mongoose.disconnect()
    console.log('\nDatabase connection closed')
  } catch (error) {
    console.error('Migration error:', error)
    process.exit(1)
  }
}

migrateData()

