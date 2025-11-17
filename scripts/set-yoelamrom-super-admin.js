/**
 * Script to create/set yoelamrom@gmail.com as super_admin
 * Run: node scripts/set-yoelamrom-super-admin.js
 */

const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

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

// Default MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL ||
  'mongodb+srv://joelamrom:ssSTmBrRHh8FeZFh@cluster0joel.bwr2yp0.mongodb.net/kasa-family-db?retryWrites=true&w=majority&appName=Cluster0Joel'

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables')
  process.exit(1)
}

// Define User schema (simplified for script)
const UserSchema = new mongoose.Schema({}, { strict: false })
const User = mongoose.model('User', UserSchema)

async function setYoelamromSuperAdmin() {
  try {
    console.log('Connecting to database...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to database')

    const email = 'yoelamrom@gmail.com'

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      console.log(`User with email ${email} not found. Creating new user...`)
      
      // Create new user with super_admin role
      const hashedPassword = await bcrypt.hash('temp-password-change-me', 10)
      user = await User.create({
        email: email.toLowerCase(),
        firstName: 'Yoel',
        lastName: 'Amrom',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
        emailVerified: true
      })
      console.log(`✅ Created new user: ${email}`)
    } else {
      console.log(`Found existing user: ${user.email} (${user.firstName} ${user.lastName})`)
      console.log(`Current role: ${user.role}`)

      // Update to super_admin
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
    }

    // Verify the update
    const verifyUser = await User.findOne({ email: email.toLowerCase() })
    console.log(`\nVerification:`)
    console.log(`  Email: ${verifyUser.email}`)
    console.log(`  Name: ${verifyUser.firstName} ${verifyUser.lastName}`)
    console.log(`  Role: ${verifyUser.role}`)
    console.log(`  Active: ${verifyUser.isActive}`)

    await mongoose.disconnect()
    console.log('\nDatabase connection closed')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

setYoelamromSuperAdmin()

