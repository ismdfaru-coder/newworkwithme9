import { NextRequest, NextResponse } from "next/server"

const KEYPLEX_API_URL = "https://keyplex.ai/api/v1/chat/completions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, model = "openai/gpt-4o-mini" } = body

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.KEYPLEX_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "KEYPLEX_API_KEY is not configured" },
        { status: 500 }
      )
    }

    console.log("[v0] POST to Keyplex API:", { prompt: prompt.substring(0, 50), model })
    
    const response = await fetch(KEYPLEX_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] Keyplex POST Error:", response.status, errorText)
      return NextResponse.json(
        { error: `Keyplex API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[v0] Keyplex Response:", JSON.stringify(data, null, 2))
    
    // Extract the content from OpenAI-compatible response format
    const content = data.choices?.[0]?.message?.content || ""
    
    return NextResponse.json({
      status: "completed",
      output: content,
      model: data.model,
      usage: data.usage,
    })
  } catch (error) {
    console.error("Error calling Keyplex API:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
