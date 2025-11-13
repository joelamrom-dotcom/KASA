import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, FamilyMember, LifecycleEventPayment } from '@/lib/models'
import { performAnalysis } from '@/lib/ml-analysis'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { question, analysisData } = body

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    // If analysis data not provided, fetch it
    let data = analysisData
    if (!data) {
      const families = await Family.find({}).lean()
      const members = await FamilyMember.find({}).lean()
      const lifecycleEvents = await LifecycleEventPayment.find({}).lean()

      data = {
        families: families.map((f: any) => ({
          _id: (f._id as any)?.toString() || String(f._id),
          weddingDate: f.weddingDate ? (f.weddingDate as Date).toISOString() : null,
          name: f.name,
          createdAt: f.createdAt ? (f.createdAt as Date).toISOString() : null
        })),
        members: members.map((m: any) => ({
          _id: (m._id as any)?.toString() || String(m._id),
          familyId: (m.familyId as any)?.toString() || String(m.familyId),
          birthDate: m.birthDate ? (m.birthDate as Date).toISOString() : null,
          weddingDate: m.weddingDate ? (m.weddingDate as Date).toISOString() : null,
          gender: m.gender
        })),
        lifecycleEvents: lifecycleEvents.map((e: any) => ({
          _id: (e._id as any)?.toString() || String(e._id),
          eventType: e.eventType,
          eventDate: e.eventDate ? (e.eventDate as Date).toISOString() : null,
          year: e.year
        }))
      }
    }

    // Perform analysis
    const analysis = performAnalysis(data, 20)

    // Build context for AI
    const context = `
Analysis Data Summary:
- Total Families: ${analysis.stability_analysis.current_stats.total_families}
- Total Members: ${analysis.stability_analysis.current_stats.total_members}
- Average Children per Family: ${analysis.stability_analysis.current_stats.avg_children_per_family.toFixed(1)}
- Children Trend: ${analysis.children_analysis.statistics.trend}
- Average Children (Historical): ${analysis.children_analysis.statistics.average.toFixed(1)}
- Average Weddings per Year: ${analysis.weddings_analysis.statistics.average.toFixed(1)}
- Total Historical Weddings: ${analysis.weddings_analysis.statistics.total_historical}

Recent Predictions (next 5 years):
${Object.keys(analysis.children_analysis.predictions).slice(0, 5).map(year => {
  const pred = analysis.children_analysis.predictions[parseInt(year)]
  return `Year ${year}: ${pred.predicted} children (range: ${pred.range_min}-${pred.range_max}, confidence: ${pred.confidence})`
}).join('\n')}

Wedding Predictions (next 5 years):
${Object.keys(analysis.weddings_analysis.predictions).slice(0, 5).map(year => {
  const pred = analysis.weddings_analysis.predictions[parseInt(year)]
  return `Year ${year}: ${pred.predicted} weddings (range: ${pred.range_min}-${pred.range_max}, confidence: ${pred.confidence})`
}).join('\n')}
`.trim()

    // Use the existing AI chat endpoint logic
    const conversationHistory = [{
      role: 'system',
      content: `You are an expert data analyst specializing in family and demographic trends. You have access to detailed analysis data about families, children, weddings, and future projections. Answer questions clearly and helpfully based on the provided analysis data.`
    }]

    const fullPrompt = `${context}\n\nUser Question: ${question}\n\nPlease provide a clear, helpful answer based on the analysis data above.`

    // Try to use AI chat endpoint
    try {
      const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: fullPrompt,
          conversationHistory
        })
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        return NextResponse.json({
          answer: aiData.response,
          provider: aiData.provider || 'ai',
          context: context
        })
      }
    } catch (error) {
      console.log('AI chat unavailable, using fallback')
    }

    // Fallback: Generate intelligent response based on question
    const answer = generateAnalysisAnswer(question, analysis, context)

    return NextResponse.json({
      answer,
      provider: 'fallback',
      context: context
    })
  } catch (error: any) {
    console.error('Error in analysis query:', error)
    return NextResponse.json(
      { error: 'Failed to process query', details: error.message },
      { status: 500 }
    )
  }
}

function generateAnalysisAnswer(question: string, analysis: any, context: string): string {
  const q = question.toLowerCase()

  // Answer common questions
  if (q.includes('children') || q.includes('child')) {
    return `Based on the analysis:
- Current average children per family: ${analysis.stability_analysis.current_stats.avg_children_per_family.toFixed(1)}
- Historical average: ${analysis.children_analysis.statistics.average.toFixed(1)}
- Trend: ${analysis.children_analysis.statistics.trend}
- Projected children for next year: ${Object.values(analysis.children_analysis.predictions)[0]?.predicted || 'N/A'}

The analysis shows ${analysis.children_analysis.statistics.trend} trend in children per family.`
  }

  if (q.includes('wedding') || q.includes('marriage')) {
    return `Wedding Analysis:
- Average weddings per year (historical): ${analysis.weddings_analysis.statistics.average.toFixed(1)}
- Total historical weddings: ${analysis.weddings_analysis.statistics.total_historical}
- Projected weddings for next year: ${Object.values(analysis.weddings_analysis.predictions)[0]?.predicted || 'N/A'}

The system predicts approximately ${analysis.weddings_analysis.statistics.average.toFixed(1)} weddings per year based on historical data.`
  }

  if (q.includes('family') || q.includes('families')) {
    return `Family Statistics:
- Total families: ${analysis.stability_analysis.current_stats.total_families}
- Total members: ${analysis.stability_analysis.current_stats.total_members}
- Average children per family: ${analysis.stability_analysis.current_stats.avg_children_per_family.toFixed(1)}

The community has ${analysis.stability_analysis.current_stats.total_families} families with an average of ${analysis.stability_analysis.current_stats.avg_children_per_family.toFixed(1)} children per family.`
  }

  if (q.includes('trend') || q.includes('future') || q.includes('projection')) {
    return `Future Projections:
- Children trend: ${analysis.children_analysis.statistics.trend}
- Average children per family: ${analysis.stability_analysis.current_stats.avg_children_per_family.toFixed(1)}
- Projected weddings per year: ${analysis.weddings_analysis.statistics.average.toFixed(1)}

Based on historical data, the community shows a ${analysis.children_analysis.statistics.trend} trend in children, with an average of ${analysis.weddings_analysis.statistics.average.toFixed(1)} weddings projected per year.`
  }

  return `Based on the analysis data:
- Total Families: ${analysis.stability_analysis.current_stats.total_families}
- Total Members: ${analysis.stability_analysis.current_stats.total_members}
- Average Children per Family: ${analysis.stability_analysis.current_stats.avg_children_per_family.toFixed(1)}
- Children Trend: ${analysis.children_analysis.statistics.trend}
- Average Weddings per Year: ${analysis.weddings_analysis.statistics.average.toFixed(1)}

You can ask specific questions about children, weddings, families, trends, or future projections.`
}

