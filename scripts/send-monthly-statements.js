// Script to send monthly statements via email
// This should be run on the 1st of each month via cron job
// Usage: node scripts/send-monthly-statements.js

const https = require('https')
const http = require('http')

const API_URL = process.env.API_URL || 'http://localhost:3000'
const API_PATH = '/api/kasa/statements/send-monthly-emails'

function sendMonthlyStatements() {
  return new Promise((resolve, reject) => {
    const url = new URL(API_PATH, API_URL)
    const protocol = url.protocol === 'https:' ? https : http
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const req = protocol.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Successfully sent monthly statements')
            console.log(`   Sent: ${result.sent}`)
            console.log(`   Failed: ${result.failed}`)
            if (result.month) {
              console.log(`   Month: ${result.month}`)
            }
            if (result.errors && result.errors.length > 0) {
              console.log('   Errors:')
              result.errors.forEach(err => console.log(`     - ${err}`))
            }
            resolve(result)
          } else {
            console.error('❌ Error sending monthly statements:', result.error || result)
            reject(new Error(result.error || 'Failed to send statements'))
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error)
          reject(error)
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ Request error:', error)
      reject(error)
    })

    req.end()
  })
}

// Run the script
console.log('📧 Starting monthly statement email sending...')
console.log(`   API URL: ${API_URL}`)
console.log(`   Time: ${new Date().toISOString()}`)

sendMonthlyStatements()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  })

