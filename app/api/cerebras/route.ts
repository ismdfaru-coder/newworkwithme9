import { NextRequest, NextResponse } from "next/server"

const CEREBRAS_API_KEY = "csk-2mv3thvve58j94933h4krmv2mf6yfrp5y8x9cjyhyny8cw3j"
const CEREBRAS_BASE_URL = "https://api.cerebras.ai/v1"

export async function POST(request: NextRequest) {
  try {
    const { prompt, model = "llama3.1-8b", stream = false } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const response = await fetch(`${CEREBRAS_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        stream,
        messages: [
          {
            role: "system",
            content: "You are a helpful, fast AI assistant. Provide concise, accurate, and helpful responses. Use markdown formatting for code blocks, lists, and emphasis where appropriate."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 1,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[Cerebras API Error]", response.status, errorData)
      return NextResponse.json(
        { error: errorData.error?.message || `Cerebras API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Extract the response content
    const content = data.choices?.[0]?.message?.content || ""
    const reasoning = data.choices?.[0]?.message?.reasoning || null
    
    return NextResponse.json({
      output: content,
      reasoning,
      model: data.model,
      usage: data.usage,
      time_info: data.time_info,
    })
  } catch (error) {
    console.error("[Cerebras API Error]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
