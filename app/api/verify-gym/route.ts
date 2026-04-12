import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Use GPT-4 Vision to analyze if the image shows a gym environment
    const result = await generateText({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: image
            },
            {
              type: 'text',
              text: `Analyze this image and determine if it shows a gym or fitness center environment.

Look for:
1. Exercise equipment (treadmills, weights, machines, benches)
2. Gym flooring (rubber mats, special gym flooring)
3. Mirrors (common in gyms)
4. Other gym features (water fountains, equipment racks)

Respond with a JSON object:
{
  "isGym": boolean,
  "confidence": number (0-100),
  "details": "brief description of what you see",
  "equipmentDetected": ["list", "of", "equipment"]
}

Be strict but fair - home gyms with proper equipment count as valid.
Only return the JSON object, no additional text.`
            }
          ]
        }
      ]
    })

    // Parse the AI response
    let analysis
    try {
      const text = result.text.trim()
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch {
      // Default response if parsing fails
      analysis = {
        isGym: false,
        confidence: 0,
        details: 'Unable to analyze image',
        equipmentDetected: []
      }
    }

    // Log the verification attempt
    await sql`
      INSERT INTO daily_logs (user_id, log_date, notes)
      VALUES (
        ${user.id},
        CURRENT_DATE,
        ${`Gym verification: ${analysis.isGym ? 'SUCCESS' : 'FAILED'} - ${analysis.details}`}
      )
      ON CONFLICT (user_id, log_date) 
      DO UPDATE SET notes = CONCAT(daily_logs.notes, ' | ', EXCLUDED.notes)
    `

    return NextResponse.json({
      success: true,
      isGym: analysis.isGym,
      confidence: analysis.confidence,
      details: analysis.details,
      equipment: analysis.equipmentDetected
    })

  } catch (error) {
    console.error('Gym verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
