// Script to process monthly recurring payments
// Can be run manually or scheduled via cron job
// Usage: node scripts/process-monthly-payments.js

const https = require('https')
const http = require('http')

const API_URL = process.env.API_URL || 'http://localhost:3000'
const ENDPOINT = '/api/kasa/recurring-payments/process'

function processMonthlyPayments() {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT, API_URL)
    const client = url.protocol === 'https:' ? https : http

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const req = client.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (res.statusCode === 200) {
            resolve(result)
          } else {
            reject(new Error(result.error || 'Request failed'))
          }
        } catch (error) {
          reject(error)
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.end()
  })
}

// Run the script
processMonthlyPayments()
  .then((result) => {
    console.log('Monthly payments processed successfully:')
    console.log(JSON.stringify(result, null, 2))
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error processing monthly payments:', error)
    process.exit(1)
  })

