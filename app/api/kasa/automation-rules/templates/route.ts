import { NextRequest, NextResponse } from 'next/server'

// GET - Get list of rule templates
export async function GET(request: NextRequest) {
  const templates = [
    {
      id: 'thank-you-payment',
      name: 'Thank You Email After Payment',
      description: 'Automatically send a thank you email when a payment is received',
      category: 'Communication',
      trigger: {
        type: 'payment_received',
        config: {},
      },
      conditions: [],
      actions: [
        {
          type: 'send_email',
          config: {
            to: 'family',
            subject: 'Thank You for Your Payment!',
            body: 'Dear {{family.name}},\n\nThank you for your payment of ${{payment.amount}}. We appreciate your continued support.\n\nBest regards,\nKasa Family Management',
          },
          order: 0,
        },
      ],
    },
    {
      id: 'auto-bar-mitzvah-event',
      name: 'Auto-Create Bar Mitzvah Event',
      description: 'Automatically create a Bar Mitzvah lifecycle event when a member turns 13',
      category: 'Lifecycle Events',
      trigger: {
        type: 'member_age_changed',
        config: {
          targetAge: 13,
        },
      },
      conditions: [
        {
          field: 'member.age',
          operator: 'equals',
          value: 13,
          logicalOperator: 'AND',
        },
      ],
      actions: [
        {
          type: 'create_lifecycle_event',
          config: {
            eventType: 'bar_mitzvah',
            eventAmount: 1800,
            eventDate: '+1 year',
            useMemberFromTrigger: true,
          },
          order: 0,
        },
      ],
    },
    {
      id: 'high-balance-alert',
      name: 'High Balance Alert',
      description: 'Alert admin when family balance exceeds $5000',
      category: 'Alerts',
      trigger: {
        type: 'family_balance_changed',
        config: {},
      },
      conditions: [
        {
          field: 'family.balance',
          operator: 'greater_than',
          value: 5000,
          logicalOperator: 'AND',
        },
      ],
      actions: [
        {
          type: 'create_notification',
          config: {
            notificationMessage: 'Family {{family.name}} has a balance of ${{family.balance}}',
            notificationType: 'warning',
          },
          order: 0,
        },
        {
          type: 'send_email',
          config: {
            to: 'admin',
            subject: 'High Balance Alert',
            body: 'Family {{family.name}} has a balance exceeding $5000. Current balance: ${{family.balance}}',
          },
          order: 1,
        },
      ],
    },
    {
      id: 'welcome-new-family',
      name: 'Welcome New Family',
      description: 'Send welcome email and create initial task when a new family is created',
      category: 'Onboarding',
      trigger: {
        type: 'family_created',
        config: {},
      },
      conditions: [],
      actions: [
        {
          type: 'send_email',
          config: {
            to: 'family',
            subject: 'Welcome to Kasa Family Management!',
            body: 'Dear {{family.name}},\n\nWelcome to our community! We are excited to have you join us.\n\nIf you have any questions, please don\'t hesitate to reach out.\n\nBest regards,\nKasa Family Management',
          },
          order: 0,
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Follow up with {{family.name}}',
            taskDescription: 'New family joined. Schedule welcome call.',
            taskDueDate: '+3 days',
            taskPriority: 'medium',
            taskAssignee: 'admin',
          },
          order: 1,
        },
      ],
    },
    {
      id: 'payment-plan-upgrade',
      name: 'Auto-Upgrade Payment Plan',
      description: 'Automatically upgrade payment plan when member ages up',
      category: 'Payment Plans',
      trigger: {
        type: 'member_age_changed',
        config: {},
      },
      conditions: [
        {
          field: 'member.age',
          operator: 'equals',
          value: 5,
          logicalOperator: 'AND',
        },
      ],
      actions: [
        {
          type: 'update_payment_plan',
          config: {
            paymentPlanNumber: 2,
            applyTo: 'member',
          },
          order: 0,
        },
        {
          type: 'send_email',
          config: {
            to: 'family',
            subject: 'Payment Plan Updated',
            body: 'Dear {{family.name}},\n\nThe payment plan for {{member.firstName}} {{member.lastName}} has been updated to Plan 2 as they have turned 5 years old.\n\nBest regards,\nKasa Family Management',
          },
          order: 1,
        },
      ],
    },
    {
      id: 'overdue-payment-reminder',
      name: 'Overdue Payment Reminder',
      description: 'Send reminder when payment becomes overdue',
      category: 'Payment Reminders',
      trigger: {
        type: 'payment_overdue',
        config: {
          daysOverdue: 7,
        },
      },
      conditions: [],
      actions: [
        {
          type: 'send_email',
          config: {
            to: 'family',
            subject: 'Payment Reminder',
            body: 'Dear {{family.name}},\n\nThis is a reminder that you have an overdue payment. Please make a payment at your earliest convenience.\n\nThank you,\nKasa Family Management',
          },
          order: 0,
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Follow up on overdue payment - {{family.name}}',
            taskDescription: 'Payment is overdue. Contact family.',
            taskDueDate: '+1 day',
            taskPriority: 'high',
            taskAssignee: 'admin',
          },
          order: 1,
        },
      ],
    },
    {
      id: 'tag-high-value-families',
      name: 'Tag High-Value Families',
      description: 'Automatically tag families with large payments',
      category: 'Tagging',
      trigger: {
        type: 'payment_received',
        config: {},
      },
      conditions: [
        {
          field: 'payment.amount',
          operator: 'greater_than',
          value: 1000,
          logicalOperator: 'AND',
        },
      ],
      actions: [
        {
          type: 'add_family_tag',
          config: {
            tagName: 'High Value',
            color: '#10b981',
          },
          order: 0,
        },
      ],
    },
    {
      id: 'task-completion-notification',
      name: 'Task Completion Notification',
      description: 'Send notification when a task is completed',
      category: 'Task Management',
      trigger: {
        type: 'task_completed',
        config: {},
      },
      conditions: [],
      actions: [
        {
          type: 'create_notification',
          config: {
            notificationMessage: 'Task "{{trigger.data.title}}" has been completed',
            notificationType: 'success',
          },
          order: 0,
        },
      ],
    },
    {
      id: 'statement-auto-send',
      name: 'Auto-Send Statement',
      description: 'Automatically email statement after generation',
      category: 'Statements',
      trigger: {
        type: 'statement_generated',
        config: {},
      },
      conditions: [],
      actions: [
        {
          type: 'send_statement',
          config: {
            subject: 'Your Statement',
            body: 'Please find your statement attached.',
          },
          order: 0,
        },
      ],
    },
    {
      id: 'recurring-payment-failed-alert',
      name: 'Recurring Payment Failed Alert',
      description: 'Alert admin when recurring payment fails',
      category: 'Payment Alerts',
      trigger: {
        type: 'recurring_payment_failed',
        config: {},
      },
      conditions: [],
      actions: [
        {
          type: 'create_notification',
          config: {
            notificationMessage: 'Recurring payment failed for {{family.name}}',
            notificationType: 'error',
          },
          order: 0,
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Fix failed payment - {{family.name}}',
            taskDescription: 'Recurring payment failed. Amount: ${{trigger.data.amount}}',
            taskDueDate: '+1 day',
            taskPriority: 'urgent',
            taskAssignee: 'admin',
          },
          order: 1,
        },
      ],
    },
  ]

  return NextResponse.json(templates)
}

