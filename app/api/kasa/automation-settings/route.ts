import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { AutomationSettings } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

// GET - Get automation settings for current user
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    let settings = await AutomationSettings.findOne({ userId: userObjectId })
    
    // Create default settings if none exist
    if (!settings) {
      settings = await AutomationSettings.create({
        userId: userObjectId,
        enableMonthlyPayments: true,
        enableStatementGeneration: true,
        enableStatementEmails: true,
        enableWeddingConversion: true,
        enableTaskEmails: true,
        enableFamilyWelcomeEmails: true,
        enablePaymentEmails: true,
      })
    }
    
    return NextResponse.json({
      enableMonthlyPayments: settings.enableMonthlyPayments,
      monthlyPaymentsSchedule: settings.monthlyPaymentsSchedule,
      enableStatementGeneration: settings.enableStatementGeneration,
      statementGenerationSchedule: settings.statementGenerationSchedule,
      enableStatementEmails: settings.enableStatementEmails,
      statementEmailsSchedule: settings.statementEmailsSchedule,
      enableWeddingConversion: settings.enableWeddingConversion,
      weddingConversionSchedule: settings.weddingConversionSchedule,
      enableTaskEmails: settings.enableTaskEmails,
      taskEmailsSchedule: settings.taskEmailsSchedule,
      enableFamilyWelcomeEmails: settings.enableFamilyWelcomeEmails ?? true,
      enablePaymentEmails: settings.enablePaymentEmails ?? true,
      isActive: settings.isActive,
    })
  } catch (error: any) {
    console.error('Error fetching automation settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automation settings', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Update automation settings
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const {
      enableMonthlyPayments,
      monthlyPaymentsSchedule,
      enableStatementGeneration,
      statementGenerationSchedule,
      enableStatementEmails,
      statementEmailsSchedule,
      enableWeddingConversion,
      weddingConversionSchedule,
      enableTaskEmails,
      taskEmailsSchedule,
      enableFamilyWelcomeEmails,
      enablePaymentEmails,
    } = body
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    const updateData: any = {
      lastUpdated: new Date(),
    }
    
    if (typeof enableMonthlyPayments === 'boolean') {
      updateData.enableMonthlyPayments = enableMonthlyPayments
    }
    if (monthlyPaymentsSchedule) {
      updateData.monthlyPaymentsSchedule = monthlyPaymentsSchedule
    }
    if (typeof enableStatementGeneration === 'boolean') {
      updateData.enableStatementGeneration = enableStatementGeneration
    }
    if (statementGenerationSchedule) {
      updateData.statementGenerationSchedule = statementGenerationSchedule
    }
    if (typeof enableStatementEmails === 'boolean') {
      updateData.enableStatementEmails = enableStatementEmails
    }
    if (statementEmailsSchedule) {
      updateData.statementEmailsSchedule = statementEmailsSchedule
    }
    if (typeof enableWeddingConversion === 'boolean') {
      updateData.enableWeddingConversion = enableWeddingConversion
    }
    if (weddingConversionSchedule) {
      updateData.weddingConversionSchedule = weddingConversionSchedule
    }
    if (typeof enableTaskEmails === 'boolean') {
      updateData.enableTaskEmails = enableTaskEmails
    }
    if (taskEmailsSchedule) {
      updateData.taskEmailsSchedule = taskEmailsSchedule
    }
    if (typeof enableFamilyWelcomeEmails === 'boolean') {
      updateData.enableFamilyWelcomeEmails = enableFamilyWelcomeEmails
    }
    if (typeof enablePaymentEmails === 'boolean') {
      updateData.enablePaymentEmails = enablePaymentEmails
    }
    
    const settings = await AutomationSettings.findOneAndUpdate(
      { userId: userObjectId },
      updateData,
      { new: true, upsert: true }
    )
    
    return NextResponse.json({
      enableMonthlyPayments: settings.enableMonthlyPayments,
      monthlyPaymentsSchedule: settings.monthlyPaymentsSchedule,
      enableStatementGeneration: settings.enableStatementGeneration,
      statementGenerationSchedule: settings.statementGenerationSchedule,
      enableStatementEmails: settings.enableStatementEmails,
      statementEmailsSchedule: settings.statementEmailsSchedule,
      enableWeddingConversion: settings.enableWeddingConversion,
      weddingConversionSchedule: settings.weddingConversionSchedule,
      enableTaskEmails: settings.enableTaskEmails,
      taskEmailsSchedule: settings.taskEmailsSchedule,
      enableFamilyWelcomeEmails: settings.enableFamilyWelcomeEmails ?? true,
      enablePaymentEmails: settings.enablePaymentEmails ?? true,
      isActive: settings.isActive,
    })
  } catch (error: any) {
    console.error('Error updating automation settings:', error)
    return NextResponse.json(
      { error: 'Failed to update automation settings', details: error.message },
      { status: 500 }
    )
  }
}

