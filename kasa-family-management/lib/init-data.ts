import connectDB from './database'
import { PaymentPlan, LifecycleEvent } from './models'

/**
 * Initialize default payment plans and lifecycle events
 * This matches the Excel file structure
 */
export async function initializeDefaultData() {
  try {
    await connectDB()
    
    // Check if data already exists
    const existingPlans = await PaymentPlan.countDocuments()
    const existingEvents = await LifecycleEvent.countDocuments()
    
    if (existingPlans > 0 && existingEvents > 0) {
      console.log('Default data already initialized')
      return
    }
    
    // Create default payment plans (matching Excel)
    if (existingPlans === 0) {
      await PaymentPlan.create([
        {
          name: 'Plan 1',
          ageStart: 0,
          ageEnd: 4,
          yearlyPrice: 1200
        },
        {
          name: 'Plan 2',
          ageStart: 5,
          ageEnd: 8,
          yearlyPrice: 1500
        },
        {
          name: 'Plan 3',
          ageStart: 9,
          ageEnd: 16,
          yearlyPrice: 1800
        },
        {
          name: 'Plan 4',
          ageStart: 17,
          ageEnd: null, // 17+
          yearlyPrice: 2500
        }
      ])
      console.log('✅ Default payment plans created')
    }
    
    // Create default lifecycle events (matching Excel)
    if (existingEvents === 0) {
      await LifecycleEvent.create([
        {
          type: 'chasena',
          name: 'Chasena',
          amount: 12180
        },
        {
          type: 'bar_mitzvah',
          name: 'Bar Mitzvah',
          amount: 1800
        },
        {
          type: 'birth_boy',
          name: 'Birth Boy',
          amount: 500
        },
        {
          type: 'birth_girl',
          name: 'Birth Girl',
          amount: 500
        }
      ])
      console.log('✅ Default lifecycle events created')
    }
    
    console.log('✅ Default data initialization complete')
  } catch (error) {
    console.error('Error initializing default data:', error)
    throw error
  }
}

