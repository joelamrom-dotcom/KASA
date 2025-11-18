/**
 * Script to delete all users except joelamrom@gmail.com
 * Run: node scripts/delete-all-users-except-joelamrom.js
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

// Define User schema (simplified for script)
const UserSchema = new mongoose.Schema({}, { strict: false })
const User = mongoose.model('User', UserSchema)

async function deleteUsersExceptJoelamrom() {
  try {
    console.log('Connecting to database...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to database')
    
    const keepEmail = 'joelamrom@gmail.com'
    
    // Find the user to keep
    const userToKeep = await User.findOne({ email: keepEmail.toLowerCase() })
    
    if (!userToKeep) {
      console.error(`User with email ${keepEmail} not found`)
      console.log('Available users:')
      const allUsers = await User.find({}).select('email firstName lastName role')
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.firstName} ${u.lastName}) - Role: ${u.role}`)
      })
      process.exit(1)
    }
    
    console.log(`\nKeeping user: ${userToKeep.email} (${userToKeep.firstName} ${userToKeep.lastName})`)
    console.log(`Current role: ${userToKeep.role}`)
    
    // Get count of users to delete
    const usersToDelete = await User.find({ email: { $ne: keepEmail.toLowerCase() } })
    console.log(`\nFound ${usersToDelete.length} users to delete:`)
    usersToDelete.forEach(u => {
      console.log(`  - ${u.email} (${u.firstName} ${u.lastName}) - Role: ${u.role}`)
    })
    
    if (usersToDelete.length === 0) {
      console.log('\n✅ No users to delete. Only joelamrom@gmail.com exists.')
      await mongoose.disconnect()
      console.log('\nDatabase connection closed')
      return
    }
    
    // Delete all users except joelamrom@gmail.com
    const result = await User.deleteMany({ email: { $ne: keepEmail.toLowerCase() } })
    
    console.log(`\n✅ Successfully deleted ${result.deletedCount} user(s)!`)
    
    // Verify
    const remainingUsers = await User.find({})
    console.log(`\nRemaining users: ${remainingUsers.length}`)
    remainingUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.firstName} ${u.lastName}) - Role: ${u.role}`)
    })
    
    // Ensure joelamrom is super_admin
    if (userToKeep.role !== 'super_admin') {
      userToKeep.role = 'super_admin'
      await userToKeep.save()
      console.log('\n✅ Set joelamrom@gmail.com role to super_admin')
    }
    
    await mongoose.disconnect()
    console.log('\nDatabase connection closed')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

deleteUsersExceptJoelamrom()

