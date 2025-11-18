/**
 * Script to set a user as super_admin
 * Run: node scripts/set-super-admin.js
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

async function setSuperAdmin() {
  try {
    console.log('Connecting to database...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to database')
    
    const email = 'joelamrom@gmail.com'
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    
    if (!user) {
      console.error(`User with email ${email} not found`)
      console.log('Available users:')
      const allUsers = await User.find({}).select('email firstName lastName role')
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.firstName} ${u.lastName}) - Role: ${u.role}`)
      })
      process.exit(1)
    }
    
    console.log(`Found user: ${user.email} (${user.firstName} ${user.lastName})`)
    console.log(`Current role: ${user.role}`)
    
    // Update to super_admin using findOneAndUpdate to ensure it persists
    const updatedUser = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: 'super_admin' },
      { new: true, runValidators: true }
    )
    
    if (!updatedUser) {
      console.error('Failed to update user')
      process.exit(1)
    }
    
    console.log('\n✅ Successfully set user as super_admin!')
    console.log(`\nUser: ${updatedUser.firstName} ${updatedUser.lastName}`)
    console.log(`Email: ${updatedUser.email}`)
    console.log(`Role: ${updatedUser.role}`)
    
    // Verify the update
    const verifyUser = await User.findOne({ email: email.toLowerCase() })
    console.log(`\nVerification - Role in DB: ${verifyUser.role}`)
    
    await mongoose.disconnect()
    console.log('\nDatabase connection closed')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

setSuperAdmin()

