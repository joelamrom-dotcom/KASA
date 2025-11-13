import { NextRequest, NextResponse } from 'next/server'
import { HfInference } from '@huggingface/inference'

// Using free AI libraries and services for ChatGPT-like experience
// This implementation uses @huggingface/inference SDK for better reliability and TypeScript support

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationHistory = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Use only free AI services (no API keys required)
    
    // Option 1: Try Hugging Face Inference API using official SDK (free, no API key needed)
    // Using multiple models for best results with automatic retry and better error handling
    const hf = new HfInference() // No API key needed for free tier
    
    const hfModels = [
      'mistralai/Mistral-7B-Instruct-v0.2',
      'google/gemma-2b-it',
      'meta-llama/Meta-Llama-3.1-8B-Instruct',
    ]

    // Build messages array for chat completion format
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a helpful AI assistant.',
      },
      ...conversationHistory.map((msg: any) => ({
        role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ]

    for (const model of hfModels) {
      try {
        // Use chat completion API (more modern and better for conversations)
        const chatCompletion = await hf.chatCompletion({
          model,
          messages,
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9,
        })

        if (chatCompletion.choices?.[0]?.message?.content) {
          const aiResponse = chatCompletion.choices[0].message.content.trim()
          
          return NextResponse.json({
            response: aiResponse,
            provider: `huggingface-${model.split('/')[1]}`,
          })
        }
      } catch (error: any) {
        // SDK handles 503 errors automatically, but if model is unavailable, try next
        if (error?.status === 503 || error?.message?.includes('loading')) {
          console.log(`Model ${model} is loading, trying next...`)
          continue
        }
        console.log(`Model ${model} unavailable: ${error?.message || 'Unknown error'}, trying next...`)
        continue
      }
    }

    // Final fallback: Intelligent rule-based responses
    return NextResponse.json({
      response: generateIntelligentResponse(message, conversationHistory),
      provider: 'fallback',
      note: 'Free AI models may be loading. Try again in a moment for full AI capabilities!',
    })

  } catch (error: any) {
    console.error('AI Chat error:', error)
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to get AI response',
        suggestion: 'Free AI models may be initializing. Please try again in a moment!'
      },
      { status: 500 }
    )
  }
}

// Intelligent fallback response generator
function generateIntelligentResponse(message: string, conversationHistory: any[]): string {
  const lowerMessage = message.toLowerCase()
  
  // Coding questions
  if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('function') || lowerMessage.includes('react') || lowerMessage.includes('python') || lowerMessage.includes('javascript')) {
    return `I'd be happy to help with coding! Here's a structured approach:\n\n1. **Understand the problem** - Break it down into smaller parts\n2. **Plan your solution** - Think about the logic and data structures\n3. **Write clean code** - Use meaningful names, comments, and best practices\n4. **Test thoroughly** - Check edge cases and handle errors\n\nCould you provide more specific details about what you're trying to build? I can help with:\n- Code examples and snippets\n- Debugging assistance\n- Best practices and patterns\n- Architecture advice\n\nNote: For detailed code examples, the free AI models provide excellent responses. They may take 10-30 seconds to load initially, but then work great!`
  }
  
  // Business questions
  if (lowerMessage.includes('business') || lowerMessage.includes('startup') || lowerMessage.includes('strategy') || lowerMessage.includes('marketing')) {
    return `Great question about business! Here are key principles:\n\n**Core Strategies:**\n• Focus on customer value - Solve real problems\n• Start small, scale smart - Validate before expanding\n• Build a strong team - Surround yourself with talented people\n• Monitor metrics - Track what matters (KPIs, user engagement)\n• Stay adaptable - Be ready to pivot when needed\n• Build relationships - Network and partnerships matter\n\n**Common Areas:**\n- Marketing strategies and channels\n- Product development and MVP\n- Funding and financial planning\n- Team building and culture\n- Growth and scaling\n\nWhat specific aspect would you like to explore? The free AI models can provide detailed, tailored advice!`
  }
  
  // Technical questions
  if (lowerMessage.includes('technical') || lowerMessage.includes('database') || lowerMessage.includes('api') || lowerMessage.includes('server')) {
    return `I can help with technical questions! Here's a framework:\n\n**Technical Problem-Solving:**\n1. Define the problem clearly\n2. Research available solutions\n3. Consider trade-offs (performance, complexity, cost)\n4. Implement and test\n5. Monitor and optimize\n\n**Common Technical Topics:**\n- Database design and optimization\n- API design and best practices\n- Server architecture and scaling\n- Security and authentication\n- Performance optimization\n- DevOps and deployment\n\nWhat specific technical challenge are you facing? I can provide detailed guidance!`
  }
  
  // General questions
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return `Hello! 👋 I'm your AI assistant, powered by free AI models.\n\nI can help with:\n• Coding and programming questions\n• Business and strategy advice\n• Technical explanations\n• Problem-solving\n• General knowledge\n\nJust ask me anything! The free AI models provide intelligent, detailed responses. They may take a moment to load initially (10-30 seconds), but then work great!\n\nWhat would you like to know?`
  }
  
  if (lowerMessage.includes('help')) {
    return `I'm here to help! Here's what I can assist with:\n\n**Coding & Development**\n- Programming languages (Python, JavaScript, React, etc.)\n- Code examples and debugging\n- Best practices and patterns\n- Architecture and design\n\n**Business & Strategy**\n- Startup advice\n- Marketing strategies\n- Product development\n- Growth tactics\n\n**Technical Topics**\n- Database design\n- API development\n- Server architecture\n- Security\n\n**General Knowledge**\n- Explanations and tutorials\n- Problem-solving\n- Learning resources\n\nJust ask me a question, and I'll provide a detailed, helpful response! The free AI models give excellent answers.`
  }
  
  // Default response
  return `You asked: "${message}"\n\nI understand your question! I'm using free AI models that provide intelligent, detailed responses.\n\n**How it works:**\n• Free AI models via Hugging Face (no API key needed)\n• Multiple model fallbacks for reliability\n• First request may take 10-30 seconds (model loading)\n• Subsequent requests are fast!\n\n**What I can help with:**\n- Coding questions with examples\n- Business strategy and advice\n- Technical explanations\n- Problem-solving\n- General knowledge\n\nCould you provide a bit more context? That will help me give you the most useful answer!\n\n**Tip:** The free AI models are very capable. If one is loading, the system automatically tries others, so you'll always get a response!`
}
