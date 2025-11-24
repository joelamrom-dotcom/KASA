import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { AutomationRule, FamilyMember, Task, Family } from '@/lib/models'
import { executeAutomationRules } from '@/lib/automation-engine'
import { calculateAge } from '@/lib/calculations'

// POST - Execute scheduled automation rules (called by cron job)
// This handles: member_birthday, task_due, scheduled triggers
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Optional: Check for cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const results = {
      memberBirthdays: { checked: 0, triggered: 0 },
      taskDue: { checked: 0, triggered: 0 },
      scheduled: { executed: 0, failed: 0 },
    }
    
    // 1. Check for member birthdays
    try {
      const members = await FamilyMember.find({ isActive: true }).lean()
      
      for (const member of members) {
        if (!member.birthDate) continue
        
        const birthDate = new Date(member.birthDate)
        const todayMonth = today.getMonth()
        const todayDate = today.getDate()
        const birthMonth = birthDate.getMonth()
        const birthDateNum = birthDate.getDate()
        
        // Check if today is the member's birthday
        if (birthMonth === todayMonth && birthDateNum === todayDate) {
          results.memberBirthdays.checked++
          
          // Calculate age
          const referenceDate = new Date(today.getFullYear(), 11, 31) // December 31
          const age = calculateAge(member.birthDate, referenceDate)
          
          // Trigger member_birthday automation rules
          const family = await Family.findById(member.familyId)
          if (family) {
            const triggerResult = await executeAutomationRules(
              {
                type: 'member_birthday',
                familyId: member.familyId?.toString(),
                memberId: member._id.toString(),
                data: {
                  firstName: member.firstName,
                  lastName: member.lastName,
                  birthDate: member.birthDate,
                  age,
                },
              },
              family.userId?.toString()
            )
            
            if (triggerResult.executed > 0) {
              results.memberBirthdays.triggered++
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error checking member birthdays:', error)
    }
    
    // 2. Check for tasks due today
    try {
      const dueTasks = await Task.find({
        status: { $in: ['pending', 'in_progress'] },
        dueDate: {
          $gte: new Date(today.getTime()),
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Next 24 hours
        },
      }).lean()
      
      for (const task of dueTasks) {
        results.taskDue.checked++
        
        // Check if task is due today (within 24 hours)
        const taskDueDate = new Date(task.dueDate)
        const hoursUntilDue = (taskDueDate.getTime() - today.getTime()) / (1000 * 60 * 60)
        
        if (hoursUntilDue <= 24 && hoursUntilDue >= 0) {
          // Trigger task_due automation rules
          const triggerResult = await executeAutomationRules(
            {
              type: 'task_due',
              taskId: task._id.toString(),
              familyId: task.relatedFamilyId?.toString(),
              memberId: task.relatedMemberId?.toString(),
              data: {
                title: task.title,
                dueDate: task.dueDate,
                priority: task.priority,
                status: task.status,
              },
            },
            task.userId?.toString()
          )
          
          if (triggerResult.executed > 0) {
            results.taskDue.triggered++
          }
        }
      }
    } catch (error: any) {
      console.error('Error checking due tasks:', error)
    }
    
    // 3. Execute scheduled automation rules (cron-based)
    try {
      const scheduledRules = await AutomationRule.find({
        isActive: true,
        'trigger.type': 'scheduled',
      }).lean()
      
      for (const rule of scheduledRules) {
        try {
          // Parse cron expression (simplified - would need full cron parser in production)
          const schedule = rule.trigger.config?.schedule
          if (!schedule) continue
          
          // For now, execute daily scheduled rules
          // In production, use a proper cron parser like node-cron
          if (schedule.includes('* * *') || schedule.includes('0 0 *')) {
            const triggerResult = await executeAutomationRules(
              {
                type: 'scheduled',
                data: {
                  schedule,
                  ruleName: rule.name,
                },
              },
              rule.userId?.toString()
            )
            
            if (triggerResult.executed > 0) {
              results.scheduled.executed++
            } else if (triggerResult.failed > 0) {
              results.scheduled.failed++
            }
          }
        } catch (error: any) {
          console.error(`Error executing scheduled rule ${rule.name}:`, error)
          results.scheduled.failed++
        }
      }
    } catch (error: any) {
      console.error('Error executing scheduled rules:', error)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled automations executed',
      results,
    })
  } catch (error: any) {
    console.error('Error in scheduled automations:', error)
    return NextResponse.json(
      { error: 'Failed to execute scheduled automations', details: error.message },
      { status: 500 }
    )
  }
}

