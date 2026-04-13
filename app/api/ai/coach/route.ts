import { streamText, convertToModelMessages, UIMessage } from 'ai'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vfit_session')?.value
    
    if (!sessionToken) {
      return new Response('Unauthorized', { status: 401 })
    }

    const sessions = await sql`
      SELECT user_id FROM sessions 
      WHERE token = ${sessionToken} AND expires_at > NOW()
    `
    
    if (sessions.length === 0) {
      return new Response('Session expired', { status: 401 })
    }

    const userId = sessions[0].user_id

    // Get user profile for context
    const profiles = await sql`
      SELECT up.*, u.email
      FROM user_profiles up
      JOIN users u ON u.id = up.user_id
      WHERE up.user_id = ${userId}
    `
    const profile = profiles[0] || {}

    // Get current workout plan
    const plans = await sql`
      SELECT * FROM workout_plans 
      WHERE user_id = ${userId} AND is_active = true
      LIMIT 1
    `
    const workoutPlan = plans[0]

    // Get diet plan
    const diets = await sql`
      SELECT * FROM diet_plans 
      WHERE user_id = ${userId} AND is_active = true
      LIMIT 1
    `
    const dietPlan = diets[0]

    const { messages }: { messages: UIMessage[] } = await request.json()

    // Build system prompt with user context
    const systemPrompt = `You are VisionaryFit AI Coach, a knowledgeable and motivational personal fitness trainer. You have access to the user's profile and current plans.

USER PROFILE:
- Name: ${profile.full_name || 'User'}
- Age: ${profile.age || 'Unknown'}
- Gender: ${profile.gender || 'Unknown'}
- Height: ${profile.height_cm || 'Unknown'} cm
- Weight: ${profile.weight_kg || 'Unknown'} kg
- Fitness Level: ${profile.fitness_level || 'Unknown'}
- Primary Goal: ${profile.primary_goal || 'General fitness'}
- Target Weight: ${profile.target_weight || 'Not set'} kg
- Activity Level: ${profile.activity_level || 'Unknown'}
- Diet Type: ${profile.diet_type || 'Unknown'}
- Medical Conditions: ${profile.medical_conditions || 'None reported'}
- Injuries: ${profile.injuries || 'None reported'}

CURRENT WORKOUT PLAN:
${workoutPlan ? JSON.stringify(workoutPlan.plan_data, null, 2) : 'No active plan'}

CURRENT DIET PLAN:
${dietPlan ? `Calories: ${dietPlan.daily_calories}, Protein: ${dietPlan.protein_grams}g, Carbs: ${dietPlan.carbs_grams}g, Fat: ${dietPlan.fat_grams}g` : 'No active diet plan'}

GUIDELINES:
1. Be encouraging and positive but also honest
2. Provide specific, actionable advice based on their profile
3. Consider their medical conditions and injuries when giving advice
4. Reference their current plans when relevant
5. Keep responses concise but helpful
6. If asked about exercises, explain proper form
7. If asked about nutrition, consider their diet type preferences
8. You can suggest modifications to their plan if needed
9. Always prioritize safety over intensity`

    const result = streamText({
      model: 'openai/gpt-4o-mini',
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    })

    // Save chat message to database (async, don't await)
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === 'user') {
      const textContent = lastMessage.parts
        ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map(p => p.text)
        .join('') || ''
      
      sql`
        INSERT INTO chat_messages (user_id, role, content)
        VALUES (${userId}, 'user', ${textContent})
      `.catch(console.error)
    }

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('AI Coach error:', error)
    return new Response('Failed to process chat', { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vfit_session')?.value
    
    if (!sessionToken) {
      return new Response('Unauthorized', { status: 401 })
    }

    const sessions = await sql`
      SELECT user_id FROM sessions 
      WHERE token = ${sessionToken} AND expires_at > NOW()
    `
    
    if (sessions.length === 0) {
      return new Response('Session expired', { status: 401 })
    }

    const userId = sessions[0].user_id

    // Get recent chat history
    const history = await sql`
      SELECT role, content, created_at
      FROM chat_messages
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `

    return Response.json({ history: history.reverse() })
  } catch (error) {
    console.error('Chat history error:', error)
    return new Response('Failed to fetch history', { status: 500 })
  }
}
