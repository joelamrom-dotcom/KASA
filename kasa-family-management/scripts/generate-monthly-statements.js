// Script to generate monthly statements
// Can be run manually or scheduled via cron job
// Usage: node scripts/generate-monthly-statements.js [year] [month]

const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Import models (you'll need to adjust paths based on your structure)
const { Statement, Family, Payment, Withdrawal, LifecycleEventPayment } = require('../lib/models')
const { calculateFamilyBalance } = require('../lib/calculations')

async function generateMonthlyStatements(year, month) {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://joelamrom:ssSTmBrRHh8FeZFh@cluster0joel.bwr2yp0.mongodb.net/kasa-family-db?retryWrites=true&w=majority&appName=Cluster0Joel'
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Default to current month if not provided
    const targetYear = year || new Date().getFullYear()
    const targetMonth = month || new Date().getMonth() + 1

    // Calculate date range for the month
    const fromDate = new Date(targetYear, targetMonth - 1, 1)
    const toDate = new Date(targetYear, targetMonth, 0, 23, 59, 59) // Last day of month

    console.log(`Generating statements for ${targetMonth}/${targetYear}`)
    console.log(`Date range: ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`)

    // Get all active families
    const families = await Family.find({})
    console.log(`Found ${families.length} families`)

    const generatedStatements = []
    const errors = []

    for (const family of families) {
      try {
        // Check if statement already exists for this month
        const existingStatement = await Statement.findOne({
          familyId: family._id,
          fromDate: { 
            $gte: new Date(targetYear, targetMonth - 1, 1),
            $lt: new Date(targetYear, targetMonth, 1)
          }
        })

        if (existingStatement) {
          console.log(`  ⏭️  Statement already exists for ${family.name}`)
          continue
        }

        // Get opening balance (balance before fromDate)
        const openingBalanceData = await calculateFamilyBalance(
          family._id.toString(),
          new Date(fromDate.getTime() - 1)
        )
        const openingBalance = openingBalanceData.balance

        // Get payments in date range
        const payments = await Payment.find({
          familyId: family._id,
          paymentDate: { $gte: fromDate, $lte: toDate }
        })
        const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0)

        // Get withdrawals in date range
        const withdrawals = await Withdrawal.find({
          familyId: family._id,
          withdrawalDate: { $gte: fromDate, $lte: toDate }
        })
        const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0)

        // Get lifecycle events in date range (for display only, not included in balance)
        const lifecycleEvents = await LifecycleEventPayment.find({
          familyId: family._id,
          eventDate: { $gte: fromDate, $lte: toDate }
        })
        const totalExpenses = lifecycleEvents.reduce((sum, e) => sum + e.amount, 0)

        // Calculate closing balance (lifecycle events are NOT subtracted from balance)
        const closingBalance = openingBalance + totalIncome - totalWithdrawals

        // Generate statement number
        const statementCount = await Statement.countDocuments({ familyId: family._id })
        const statementNumber = `STMT-${family._id.toString().slice(-6)}-${statementCount + 1}`

        const statement = await Statement.create({
          familyId: family._id,
          statementNumber,
          date: new Date(),
          fromDate: fromDate,
          toDate: toDate,
          openingBalance,
          income: totalIncome,
          withdrawals: totalWithdrawals,
          expenses: totalExpenses,
          closingBalance
        })

        generatedStatements.push({
          familyId: family._id.toString(),
          familyName: family.name,
          statementNumber: statement.statementNumber
        })

        console.log(`  ✅ Generated statement for ${family.name}: ${statementNumber}`)
      } catch (error) {
        console.error(`  ❌ Error generating statement for ${family.name}:`, error.message)
        errors.push({
          familyId: family._id.toString(),
          familyName: family.name,
          error: error.message
        })
      }
    }

    console.log('\n📊 Summary:')
    console.log(`  Generated: ${generatedStatements.length}`)
    console.log(`  Failed: ${errors.length}`)
    if (errors.length > 0) {
      console.log('\n❌ Errors:')
      errors.forEach(e => console.log(`  - ${e.familyName}: ${e.error}`))
    }

    await mongoose.disconnect()
    return {
      success: true,
      month: targetMonth,
      year: targetYear,
      generated: generatedStatements.length,
      failed: errors.length,
      statements: generatedStatements,
      errors: errors
    }
  } catch (error) {
    console.error('Error in generateMonthlyStatements:', error)
    await mongoose.disconnect()
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  const year = process.argv[2] ? parseInt(process.argv[2]) : undefined
  const month = process.argv[3] ? parseInt(process.argv[3]) : undefined

  generateMonthlyStatements(year, month)
    .then(result => {
      console.log('\n✅ Process completed successfully')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Process failed:', error)
      process.exit(1)
    })
}

module.exports = { generateMonthlyStatements }

