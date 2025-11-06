// Scheduler for automatic monthly statement generation
// This can be called by a cron job or scheduled task

import connectDB from './database'
import { Statement, Family, Payment, Withdrawal, LifecycleEventPayment } from './models'
import { calculateFamilyBalance } from './calculations'

export async function generateMonthlyStatements(year?: number, month?: number) {
  try {
    await connectDB()

    // Default to current month if not provided
    const targetYear = year || new Date().getFullYear()
    const targetMonth = month || new Date().getMonth() + 1

    // Calculate date range for the month
    const fromDate = new Date(targetYear, targetMonth - 1, 1)
    const toDate = new Date(targetYear, targetMonth, 0, 23, 59, 59) // Last day of month

    // Get all active families
    const families = await Family.find({})

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
          console.log(`Statement already exists for ${family.name} - ${targetMonth}/${targetYear}`)
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

        // Get lifecycle events in date range
        const lifecycleEvents = await LifecycleEventPayment.find({
          familyId: family._id,
          eventDate: { $gte: fromDate, $lte: toDate }
        })
        const totalExpenses = lifecycleEvents.reduce((sum, e) => sum + e.amount, 0)

        // Calculate closing balance
        const closingBalance = openingBalance + totalIncome - totalWithdrawals - totalExpenses

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

        console.log(`Generated statement for ${family.name}: ${statementNumber}`)
      } catch (error: any) {
        console.error(`Error generating statement for ${family.name}:`, error)
        errors.push({
          familyId: family._id.toString(),
          familyName: family.name,
          error: error.message
        })
      }
    }

    return {
      success: true,
      month: targetMonth,
      year: targetYear,
      generated: generatedStatements.length,
      failed: errors.length,
      statements: generatedStatements,
      errors: errors
    }
  } catch (error: any) {
    console.error('Error in generateMonthlyStatements:', error)
    throw error
  }
}

