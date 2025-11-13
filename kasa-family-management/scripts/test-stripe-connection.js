require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')

const secretKey = process.env.STRIPE_SECRET_KEY

if (!secretKey) {
  console.error('STRIPE_SECRET_KEY not found')
  process.exit(1)
}

console.log('Testing Stripe connection...')
console.log('Key prefix:', secretKey.substring(0, 20))

const https = require('https')

// Create HTTPS agent that handles SSL certificates properly
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // For testing - allows self-signed certificates
})

const stripe = new Stripe(secretKey, {
  maxNetworkRetries: 2,
  timeout: 30000,
  httpAgent: httpsAgent,
})

async function testConnection() {
  try {
    console.log('Creating test payment intent...')
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00
      currency: 'usd',
      description: 'Test connection',
    })
    
    console.log('✅ SUCCESS! Payment intent created:', paymentIntent.id)
    console.log('Client secret:', paymentIntent.client_secret)
    
    // Clean up - cancel the test payment intent
    await stripe.paymentIntents.cancel(paymentIntent.id)
    console.log('Test payment intent cancelled')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ ERROR:', error.type || 'Unknown error')
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    console.error('Full error:', error)
    process.exit(1)
  }
}

testConnection()

