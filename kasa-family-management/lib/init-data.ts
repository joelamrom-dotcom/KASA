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
    
    // Create default payment plans - ensure all 4 plans exist
    const defaultPlans = [
      { name: 'Plan 1', yearlyPrice: 1200, planNumber: 1 },
      { name: 'Plan 2', yearlyPrice: 1500, planNumber: 2 },
      { name: 'Plan 3', yearlyPrice: 1800, planNumber: 3 },
      { name: 'Plan 4', yearlyPrice: 2500, planNumber: 4 }
    ]

    if (existingPlans === 0) {
      // Create all plans if none exist
      await PaymentPlan.create(defaultPlans)
      console.log('✅ Default payment plans created')
    } else {
      // Ensure all plans exist - create missing ones
      for (const defaultPlan of defaultPlans) {
        const existingPlan = await PaymentPlan.findOne({ planNumber: defaultPlan.planNumber })
        if (!existingPlan) {
          await PaymentPlan.create(defaultPlan)
          console.log(`✅ Created missing ${defaultPlan.name}`)
        }
      }
      // Update existing plans to add planNumber if missing
      const plans = await PaymentPlan.find({}).sort({ createdAt: 1 })
      for (let i = 0; i < plans.length; i++) {
        const plan = plans[i]
        if (!plan.planNumber) {
          // Try to infer planNumber from name first
          const planNumberMap: { [key: string]: number } = {
            'Plan 1': 1,
            'Plan 2': 2,
            'Plan 3': 3,
            'Plan 4': 4
          }
          
          let assignedPlanNumber = planNumberMap[plan.name]
          
          // If not found by name, try to match by yearlyPrice (unique per plan)
          if (!assignedPlanNumber) {
            const priceToPlanMap: { [key: number]: number } = {
              1200: 1,
              1500: 2,
              1800: 3,
              2500: 4
            }
            assignedPlanNumber = priceToPlanMap[plan.yearlyPrice]
          }
          
          // If still not found, use creation order (index + 1)
          if (!assignedPlanNumber) {
            assignedPlanNumber = i + 1
          }
          
          plan.planNumber = assignedPlanNumber
          await plan.save()
          console.log(`Updated plan "${plan.name}" with planNumber: ${assignedPlanNumber}`)
        }
      }
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

