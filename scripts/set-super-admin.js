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

// Default MongoDB URI (same as in lib/database.ts)
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || 
  'mongodb+srv://joelamrom:ssSTmBrRHh8FeZFh@cluster0joel.bwr2yp0.mongodb.net/kasa-family-db?retryWrites=true&w=majority&appName=Cluster0Joel'

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables')
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
    
    // Update to super_admin
    user.role = 'super_admin'
    await user.save()
    
    console.log('\n✅ Successfully set user as super_admin!')
    console.log(`\nUser: ${user.firstName} ${user.lastName}`)
    console.log(`Email: ${user.email}`)
    console.log(`Role: ${user.role}`)
    
    await mongoose.disconnect()
    console.log('\nDatabase connection closed')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

setSuperAdmin()

