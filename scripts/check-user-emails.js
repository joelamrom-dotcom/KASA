// Check what emails are actually stored in the database for joelamrom and yoelamrom
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

async function checkEmails() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    const User = mongoose.model('User', UserSchema)

    // Check for joelamrom@gmail.com
    console.log('Checking for joelamrom@gmail.com...')
    const joelamrom = await User.findOne({ email: /joelamrom/i })
    if (joelamrom) {
      console.log('✅ Found user:')
      console.log('   _id:', joelamrom._id)
      console.log('   email:', joelamrom.email)
      console.log('   firstName:', joelamrom.firstName)
      console.log('   lastName:', joelamrom.lastName)
      console.log('   role:', joelamrom.role)
    } else {
      console.log('❌ No user found with joelamrom in email')
    }

    console.log('\nChecking for yoelamrom@gmail.com...')
    const yoelamrom = await User.findOne({ email: /yoelamrom/i })
    if (yoelamrom) {
      console.log('✅ Found user:')
      console.log('   _id:', yoelamrom._id)
      console.log('   email:', yoelamrom.email)
      console.log('   firstName:', yoelamrom.firstName)
      console.log('   lastName:', yoelamrom.lastName)
      console.log('   role:', yoelamrom.role)
    } else {
      console.log('❌ No user found with yoelamrom in email')
    }

    console.log('\n--- All users with "joel" or "yoel" in email ---')
    const allJoelUsers = await User.find({ 
      email: { $regex: /joel|yoel/i } 
    })
    allJoelUsers.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`)
      console.log('   _id:', user._id)
      console.log('   email:', user.email)
      console.log('   role:', user.role)
    })

    await mongoose.disconnect()
    console.log('\n✅ Disconnected from MongoDB')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkEmails()

