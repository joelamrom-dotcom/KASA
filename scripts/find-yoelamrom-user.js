// Find any user with yoelamrom email (case-insensitive search)
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value.replace(/^["']|["']$/g, '')
      }
    }
  })
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://joelamrom:ssSTmBrRHh8FeZFh@cluster0joel.bwr2yp0.mongodb.net/kasa-family-db?retryWrites=true&w=majority&appName=Cluster0Joel'

const UserSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  role: String,
  _id: mongoose.Schema.Types.ObjectId
}, { collection: 'users', strict: false })

async function findYoelamromUser() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    const User = mongoose.model('User', UserSchema)

    // Try exact match first
    console.log('Searching for exact match: yoelamrom@gmail.com')
    let user = await User.findOne({ email: 'yoelamrom@gmail.com' })
    if (user) {
      console.log('✅ Found exact match:')
      console.log('   _id:', user._id)
      console.log('   email:', user.email)
      console.log('   role:', user.role)
    } else {
      console.log('❌ No exact match found')
    }

    // Try case-insensitive regex search
    console.log('\nSearching with case-insensitive regex: /yoelamrom/i')
    const users = await User.find({ email: { $regex: /yoelamrom/i } })
    if (users.length > 0) {
      console.log(`✅ Found ${users.length} user(s) with case-insensitive match:`)
      users.forEach((u, i) => {
        console.log(`\nUser ${i + 1}:`)
        console.log('   _id:', u._id)
        console.log('   email:', u.email)
        console.log('   firstName:', u.firstName)
        console.log('   lastName:', u.lastName)
        console.log('   role:', u.role)
      })
    } else {
      console.log('❌ No case-insensitive match found')
    }

    // List ALL users to see what's actually in the database
    console.log('\n--- ALL USERS IN DATABASE ---')
    const allUsers = await User.find({})
    console.log(`Total users: ${allUsers.length}\n`)
    allUsers.forEach((u, i) => {
      console.log(`User ${i + 1}:`)
      console.log('   _id:', u._id)
      console.log('   email:', u.email)
      console.log('   role:', u.role)
      console.log('')
    })

    await mongoose.disconnect()
    console.log('✅ Disconnected from MongoDB')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

findYoelamromUser()

