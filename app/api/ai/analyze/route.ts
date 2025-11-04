import { NextRequest, NextResponse } from 'next/server'
import Sentiment from 'sentiment'
import natural from 'natural'

// Try to import wink-nlp (may not work in all environments)
let nlp: any = null
try {
  const winkNLP = require('wink-nlp')
  const model = require('wink-eng-lite-web-model')
  nlp = winkNLP(model)
} catch (error) {
  console.log('wink-nlp not available, using alternative NLP methods')
}

// AI Analysis API - Using FREE open-source libraries (no API needed!)
// Libraries: sentiment, natural, wink-nlp - all work locally!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, data, type = 'general' } = body

    if (!text && !data) {
      return NextResponse.json(
        { error: 'Either text or data is required' },
        { status: 400 }
      )
    }

    // Perform analysis using JavaScript (no Python needed)
    const analysis = await performAnalysis(text, data, type)

    return NextResponse.json({
      success: true,
      analysis,
      provider: 'javascript-native',
    })
  } catch (error: any) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to perform analysis' },
      { status: 500 }
    )
  }
}

// Enhanced JavaScript analysis
async function performAnalysis(text?: string, data?: any, type: string = 'general') {
  const result: any = {}

  if (text) {
    // Text insights
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
    
    result.text_insights = {
      word_count: words.length,
      character_count: text.length,
      character_count_no_spaces: text.replace(/\s/g, '').length,
      sentence_count: sentences.length,
      paragraph_count: paragraphs.length,
      average_words_per_sentence: sentences.length > 0 ? (words.length / sentences.length).toFixed(2) : 0,
      average_sentence_length: sentences.length > 0 ? (sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length).toFixed(2) : 0,
      reading_time_minutes: Math.ceil(words.length / 200), // Average reading speed
      speaking_time_minutes: Math.ceil(words.length / 150), // Average speaking speed
    }

    // Advanced sentiment analysis using 'sentiment' library (free, open-source)
    const sentiment = new Sentiment()
    const sentimentResult = sentiment.analyze(text)
    
    result.sentiment = {
      score: sentimentResult.score,
      positive_count: sentimentResult.positive?.length || 0,
      negative_count: sentimentResult.negative?.length || 0,
      positive_words: sentimentResult.positive || [],
      negative_words: sentimentResult.negative || [],
      comparative: sentimentResult.comparative || 0,
      sentiment: sentimentResult.score > 2 ? 'positive' : sentimentResult.score < -2 ? 'negative' : 'neutral',
      confidence: Math.min(Math.abs(sentimentResult.comparative || 0), 1).toFixed(2),
    }

    // Advanced NLP analysis using 'natural' library (free, open-source)
    try {
      // Extract key phrases using natural library's TfIdf
      const TfIdf = natural.TfIdf
      const tfidf = new TfIdf()
      tfidf.addDocument(text)
      
      const keywords: { word: string; importance: number }[] = []
      tfidf.listTerms(0).forEach((item: any) => {
        if (item.term && item.term.length > 3) {
          keywords.push({ word: item.term, importance: item.tfidf || 0 })
        }
      })
      
      // Extract nouns and adjectives using natural's WordNet
      let nouns: string[] = []
      let adjectives: string[] = []
      let entities: any[] = []
      
      // Try to use wink-nlp if available for better entity extraction
      if (nlp) {
        try {
          const doc = nlp.readDoc(text)
          entities = doc.entities()
          nouns = doc.tokens().filter((token: any) => token.pos() === 'NOUN').out()
          adjectives = doc.tokens().filter((token: any) => token.pos() === 'ADJ').out()
        } catch (winkError) {
          console.log('wink-nlp extraction failed, using natural library')
        }
      }
      
      // Fallback: extract potential nouns/adjectives using natural library
      if (nouns.length === 0) {
        const tokenizer = new natural.WordTokenizer()
        const tokens = tokenizer.tokenize(text) || []
        // Simple heuristic: capitalize words are likely nouns
        nouns = tokens.filter((w: string) => w && w.length > 3 && /^[A-Z]/.test(w)).slice(0, 10)
      }
      
      // Key phrases and word frequency
      const wordsMap: { [key: string]: number } = {}
      words.forEach(word => {
        const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (cleanWord.length > 3 && !['that', 'this', 'with', 'from', 'have', 'been', 'were', 'they', 'them', 'their'].includes(cleanWord)) {
          wordsMap[cleanWord] = (wordsMap[cleanWord] || 0) + 1
        }
      })
      
      const topWords = Object.entries(wordsMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([word, count]) => ({ word, count }))
      
      result.text_insights.top_words = topWords
      result.text_insights.word_frequency = wordsMap
      result.text_insights.keywords = keywords.slice(0, 10).map(k => ({ word: k.word, importance: k.importance.toFixed(3) }))
      if (entities.length > 0) {
        result.text_insights.entities = entities.map((e: any) => e.out())
      }
      if (nouns.length > 0) {
        result.text_insights.nouns = nouns.slice(0, 10)
      }
      if (adjectives.length > 0) {
        result.text_insights.adjectives = adjectives.slice(0, 10)
      }
      
      // Generate AI-powered insights using local NLP (no API needed!)
      if (type === 'ai' || type === 'general' || type === 'all') {
        result.ai_analysis = generateLocalAIInsights(text, sentimentResult, entities, nouns, adjectives, keywords)
      }
    } catch (error) {
      console.log('Advanced NLP analysis error:', error)
      // Fallback to basic analysis
      const wordsMap: { [key: string]: number } = {}
      words.forEach(word => {
        const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (cleanWord.length > 3) {
          wordsMap[cleanWord] = (wordsMap[cleanWord] || 0) + 1
        }
      })
      
      const topWords = Object.entries(wordsMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([word, count]) => ({ word, count }))
      
      result.text_insights.top_words = topWords
      
      // Generate basic AI insights even if advanced NLP fails
      if (type === 'ai' || type === 'general' || type === 'all') {
        result.ai_analysis = generateLocalAIInsights(text, sentimentResult, [], [], [], [])
      }
    }
  }

  // Data analysis
  if (data) {
    if (Array.isArray(data)) {
      result.data_analysis = analyzeArrayData(data)
    } else if (typeof data === 'object') {
      result.data_analysis = analyzeObjectData(data)
    }
  }

  return result
}

// Enhanced array data analysis with statistical methods
function analyzeArrayData(data: any[]) {
  const result: any = {
    count: data.length,
    sample: data.slice(0, 5),
  }

  if (data.length === 0) {
    return result
  }

  // Analyze first object to determine structure
  const firstItem = data[0]
  if (typeof firstItem === 'object' && firstItem !== null) {
    const keys = Object.keys(firstItem)
    result.keys = keys
    
    // Numeric analysis with advanced statistics
    const numericKeys = keys.filter(key => {
      return data.some(item => typeof item[key] === 'number')
    })
    
    if (numericKeys.length > 0) {
      result.numeric_fields = {}
      numericKeys.forEach(key => {
        const values = data.map(item => item[key]).filter(v => typeof v === 'number' && !isNaN(v))
        if (values.length > 0) {
          const sorted = [...values].sort((a, b) => a - b)
          const sum = values.reduce((a, b) => a + b, 0)
          const mean = sum / values.length
          const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)]
          
          // Calculate standard deviation
          const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
          const stdDev = Math.sqrt(variance)
          
          // Calculate quartiles
          const q1Index = Math.floor(sorted.length * 0.25)
          const q3Index = Math.floor(sorted.length * 0.75)
          const q1 = sorted[q1Index]
          const q3 = sorted[q3Index]
          const iqr = q3 - q1
          
          result.numeric_fields[key] = {
            min: Math.min(...values),
            max: Math.max(...values),
            mean: mean.toFixed(2),
            median: median.toFixed(2),
            sum: sum.toFixed(2),
            count: values.length,
            std_dev: stdDev.toFixed(2),
            variance: variance.toFixed(2),
            q1: q1.toFixed(2),
            q3: q3.toFixed(2),
            iqr: iqr.toFixed(2),
            range: (Math.max(...values) - Math.min(...values)).toFixed(2),
          }
        }
      })
    }

    // Text analysis with frequency analysis
    const textKeys = keys.filter(key => {
      return data.some(item => typeof item[key] === 'string')
    })
    
    if (textKeys.length > 0) {
      result.text_fields = {}
      textKeys.forEach(key => {
        const values = data.map(item => item[key]).filter(v => typeof v === 'string')
        const uniqueValues = Array.from(new Set(values))
        
        // Calculate frequency distribution
        const frequency: { [key: string]: number } = {}
        values.forEach(val => {
          frequency[val] = (frequency[val] || 0) + 1
        })
        
        // Get top values by frequency
        const topValues = Object.entries(frequency)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([value, count]) => ({ value, count, percentage: ((count / values.length) * 100).toFixed(1) + '%' }))
        
        result.text_fields[key] = {
          total: values.length,
          unique: uniqueValues.length,
          unique_values: uniqueValues.slice(0, 10),
          top_values: topValues,
          most_common: topValues[0]?.value || null,
          diversity_ratio: (uniqueValues.length / values.length).toFixed(3), // 1.0 = all unique, 0.0 = all same
        }
      })
    }
    
    // Boolean analysis
    const booleanKeys = keys.filter(key => {
      return data.some(item => typeof item[key] === 'boolean')
    })
    
    if (booleanKeys.length > 0) {
      result.boolean_fields = {}
      booleanKeys.forEach(key => {
        const values = data.map(item => item[key]).filter(v => typeof v === 'boolean')
        const trueCount = values.filter(v => v === true).length
        const falseCount = values.filter(v => v === false).length
        
        result.boolean_fields[key] = {
          total: values.length,
          true_count: trueCount,
          false_count: falseCount,
          true_percentage: ((trueCount / values.length) * 100).toFixed(1) + '%',
          false_percentage: ((falseCount / values.length) * 100).toFixed(1) + '%',
        }
      })
    }
    
    // Date analysis
    const dateKeys = keys.filter(key => {
      return data.some(item => {
        const val = item[key]
        return val && (val instanceof Date || (typeof val === 'string' && !isNaN(Date.parse(val))))
      })
    })
    
    if (dateKeys.length > 0) {
      result.date_fields = {}
      dateKeys.forEach(key => {
        const dates = data.map(item => {
          const val = item[key]
          return val instanceof Date ? val : new Date(val)
        }).filter(d => !isNaN(d.getTime()))
        
        if (dates.length > 0) {
          const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
          const now = new Date()
          const ages = dates.map(d => now.getTime() - d.getTime())
          const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length
          
          result.date_fields[key] = {
            count: dates.length,
            earliest: sorted[0].toISOString(),
            latest: sorted[sorted.length - 1].toISOString(),
            average_age_days: (avgAge / (1000 * 60 * 60 * 24)).toFixed(1),
            span_days: ((sorted[sorted.length - 1].getTime() - sorted[0].getTime()) / (1000 * 60 * 60 * 24)).toFixed(1),
          }
        }
      })
    }
  }

  return result
}

// Analyze object data
function analyzeObjectData(data: any) {
  const result: any = {
    keys: Object.keys(data),
    structure: 'object',
  }

  Object.keys(data).forEach(key => {
    const value = data[key]
    if (typeof value === 'number') {
      result[key] = {
        type: 'number',
        value,
      }
    } else if (typeof value === 'string') {
      result[key] = {
        type: 'string',
        value,
        length: value.length,
      }
    } else if (Array.isArray(value)) {
      result[key] = {
        type: 'array',
        length: value.length,
        sample: value.slice(0, 3),
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = {
        type: 'object',
        keys: Object.keys(value),
      }
    }
  })

  return result
}

// Generate AI-powered insights using local NLP libraries (no API needed!)
function generateLocalAIInsights(
  text: string,
  sentiment: any,
  entities: any[],
  nouns: string[],
  adjectives: string[],
  keywords: { word: string; importance: number }[]
): any {
  const insights: string[] = []
  
  // Main themes (based on top keywords)
  if (keywords.length > 0) {
    const mainThemes = keywords.slice(0, 5).map(k => k.word).join(', ')
    insights.push(`📌 Main Themes: ${mainThemes}`)
  }
  
  // Key points (based on entities and important nouns)
  if (entities.length > 0) {
    const keyEntities = entities.slice(0, 5).map((e: any) => e.out()).join(', ')
    insights.push(`🔑 Key Entities: ${keyEntities}`)
  } else if (nouns.length > 0) {
    const keyNouns = nouns.slice(0, 5).join(', ')
    insights.push(`🔑 Key Topics: ${keyNouns}`)
  }
  
  // Sentiment insights
  if (sentiment.score > 0) {
    insights.push(`✨ Overall sentiment is positive (score: ${sentiment.score})`)
  } else if (sentiment.score < 0) {
    insights.push(`⚠️ Overall sentiment is negative (score: ${sentiment.score})`)
  } else {
    insights.push(`➖ Overall sentiment is neutral`)
  }
  
  // Text characteristics
  const wordCount = text.split(/\s+/).length
  if (wordCount > 200) {
    insights.push(`📊 Large dataset detected (${wordCount} words)`)
  }
  
  if (adjectives.length > 0) {
    const topAdjectives = adjectives.slice(0, 3).join(', ')
    insights.push(`🎨 Descriptive elements: ${topAdjectives}`)
  }
  
  // Summary
  insights.push(`\n📝 Summary: This ${wordCount > 100 ? 'comprehensive' : 'brief'} dataset contains ${sentiment.positive?.length || 0} positive indicators and ${sentiment.negative?.length || 0} negative indicators. The main focus appears to be on ${keywords.slice(0, 3).map(k => k.word).join(', ') || 'various topics'}.`)
  
  return {
    ai_analysis: insights.join('\n\n'),
    provider: 'local-nlp-libraries',
  }
}

// Old API-based analysis (kept as fallback but not used)
async function getAIAnalysis(text: string): Promise<any> {
  // Limit text length for AI analysis (avoid token limits)
  const maxLength = 2000
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text

  // Try multiple Hugging Face models (free, no API key needed)
  const models = [
    'meta-llama/Meta-Llama-3.1-8B-Instruct',
    'google/gemma-2b-it',
    'mistralai/Mistral-7B-Instruct-v0.2',
  ]

  for (const model of models) {
    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: `Analyze the following data and provide key insights:\n\n${truncatedText}\n\nProvide: 1) Main themes, 2) Key points, 3) Important insights, 4) Summary (be concise):`,
            parameters: {
              max_new_tokens: 250,
              temperature: 0.7,
              return_full_text: false,
            },
          }),
          // Add timeout
          signal: AbortSignal.timeout(10000), // 10 second timeout
        }
      )

      if (response.ok) {
        const data = await response.json()
        
        // Handle different response formats
        let aiText = ''
        if (Array.isArray(data)) {
          if (data[0]?.generated_text) {
            aiText = data[0].generated_text.trim()
          } else if (data[0]?.text) {
            aiText = data[0].text.trim()
          }
        } else if (data.generated_text) {
          aiText = data.generated_text.trim()
        } else if (data.text) {
          aiText = data.text.trim()
        }

        if (aiText) {
          return {
            ai_analysis: aiText,
            provider: `huggingface-${model.split('/')[1]}`,
          }
        }
      } else if (response.status === 503) {
        // Model is loading, skip this model
        console.log(`Model ${model} is loading, trying next...`)
        continue
      }
    } catch (error: any) {
      // Skip timeout/network errors and try next model
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        console.log(`Model ${model} timed out, trying next...`)
        continue
      }
      console.log(`Model ${model} failed:`, error.message)
      continue
    }
  }

  // If all models fail, provide intelligent fallback based on text analysis
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)
  const hasDate = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/.test(text)
  const hasNumber = /\d+/.test(text)

  let fallbackInsights = []
  if (hasEmail) fallbackInsights.push('Contains email addresses')
  if (hasDate) fallbackInsights.push('Contains date information')
  if (hasNumber) fallbackInsights.push('Contains numeric data')
  if (words.length > 100) fallbackInsights.push('Large dataset detected')
  
  const fallbackText = fallbackInsights.length > 0
    ? `Quick Insights:\n- ${fallbackInsights.join('\n- ')}\n\nNote: Advanced AI analysis is temporarily unavailable. The data appears to be ${words.length > 50 ? 'structured' : 'brief'} user information.`
    : `Quick Insights:\n- Text contains ${words.length} words\n- ${text.length} characters\n\nNote: Advanced AI analysis is temporarily unavailable. The system analyzed the basic structure of the data.`

  return {
    ai_analysis: fallbackText,
    provider: 'intelligent-fallback',
  }
}
