/**
 * Database Index Optimization Script
 * Run this to ensure all frequently queried fields have proper indexes
 * 
 * Usage: node scripts/optimize-indexes.js
 */

const mongoose = require('mongoose')

// Define schemas inline (simplified versions just for indexing)
const FamilySchema = new mongoose.Schema({}, { collection: 'families' })
const PaymentSchema = new mongoose.Schema({}, { collection: 'payments' })
const PaymentPlanSchema = new mongoose.Schema({}, { collection: 'paymentplans' })
const FamilyMemberSchema = new mongoose.Schema({}, { collection: 'familymembers' })

const Family = mongoose.models.Family || mongoose.model('Family', FamilySchema)
const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)
const PaymentPlan = mongoose.models.PaymentPlan || mongoose.model('PaymentPlan', PaymentPlanSchema)
const FamilyMember = mongoose.models.FamilyMember || mongoose.model('FamilyMember', FamilyMemberSchema)

async function optimizeIndexes() {
  try {
    console.log('🔍 Optimizing database indexes...')
    
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL
    if (!mongoUri) {
      console.log('⚠️  Skipping index optimization - No MongoDB connection string found')
      console.log('   Set MONGODB_URI or DATABASE_URL environment variable to run optimization')
      console.log('   Run manually: npm run optimize:db')
      process.exit(0)
    }
    
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')
    
    // Family indexes
    console.log('\n📊 Creating Family indexes...')
    await Family.collection.createIndex({ name: 1 })
    await Family.collection.createIndex({ hebrewName: 1 })
    await Family.collection.createIndex({ email: 1 })
    await Family.collection.createIndex({ phone: 1 })
    await Family.collection.createIndex({ paymentPlanId: 1 })
    await Family.collection.createIndex({ openBalance: -1 })
    await Family.collection.createIndex({ weddingDate: -1 })
    await Family.collection.createIndex({ city: 1, state: 1 })
    await Family.collection.createIndex({ deleted: 1, deletedAt: 1 })
    console.log('✅ Family indexes created')
    
    // Payment indexes
    console.log('\n💳 Creating Payment indexes...')
    await Payment.collection.createIndex({ familyId: 1 })
    await Payment.collection.createIndex({ paymentDate: -1 })
    await Payment.collection.createIndex({ year: 1 })
    await Payment.collection.createIndex({ amount: -1 })
    await Payment.collection.createIndex({ paymentMethod: 1 })
    await Payment.collection.createIndex({ type: 1 })
    await Payment.collection.createIndex({ familyId: 1, paymentDate: -1 })
    await Payment.collection.createIndex({ year: 1, type: 1 })
    console.log('✅ Payment indexes created')
    
    // PaymentPlan indexes
    console.log('\n📋 Creating PaymentPlan indexes...')
    await PaymentPlan.collection.createIndex({ name: 1 })
    await PaymentPlan.collection.createIndex({ yearlyPrice: 1 })
    await PaymentPlan.collection.createIndex({ planNumber: 1 })
    console.log('✅ PaymentPlan indexes created')
    
    // FamilyMember indexes
    console.log('\n👥 Creating FamilyMember indexes...')
    await FamilyMember.collection.createIndex({ familyId: 1 })
    await FamilyMember.collection.createIndex({ firstName: 1 })
    await FamilyMember.collection.createIndex({ lastName: 1 })
    await FamilyMember.collection.createIndex({ email: 1 })
    await FamilyMember.collection.createIndex({ dateOfBirth: -1 })
    await FamilyMember.collection.createIndex({ familyId: 1, dateOfBirth: -1 })
    console.log('✅ FamilyMember indexes created')
    
    // Show index statistics
    console.log('\n📈 Index Statistics:')
    const familyIndexes = await Family.collection.indexes()
    const paymentIndexes = await Payment.collection.indexes()
    const planIndexes = await PaymentPlan.collection.indexes()
    const memberIndexes = await FamilyMember.collection.indexes()
    
    console.log(`Family indexes: ${familyIndexes.length}`)
    console.log(`Payment indexes: ${paymentIndexes.length}`)
    console.log(`PaymentPlan indexes: ${planIndexes.length}`)
    console.log(`FamilyMember indexes: ${memberIndexes.length}`)
    
    console.log('\n✨ Database optimization complete!')
    console.log('Expected improvements:')
    console.log('  - 50-80% faster queries on indexed fields')
    console.log('  - Better performance for searches, filters, and sorts')
    console.log('  - Reduced database CPU usage')
    
  } catch (error) {
    console.error('❌ Error optimizing indexes:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n👋 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Run if called directly
if (require.main === module) {
  optimizeIndexes()
}

module.exports = optimizeIndexes
