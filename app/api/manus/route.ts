import { NextRequest, NextResponse } from "next/server"

const MANUS_API_URL = "https://api.manus.ai/v1/tasks"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, taskMode = "chat" } = body

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.MANUS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "MANUS_API_KEY is not configured" },
        { status: 500 }
      )
    }

    console.log("[v0] POST to Manus API:", { prompt: prompt.substring(0, 50), taskMode })
    
    const response = await fetch(MANUS_API_URL, {
      method: "POST",
      headers: {
        "API_KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        agentProfile: "manus-1.6",
        taskMode,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] POST Error:", response.status, errorText)
      return NextResponse.json(
        { error: `Manus API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[v0] POST Response from Manus:", JSON.stringify(data, null, 2))
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error calling Manus API:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}

// Get task status with convert=true for final output
// Includes retry logic for 404 errors (task may not be immediately available after creation)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get("taskId")
  const isFirstPoll = searchParams.get("firstPoll") === "true"

  if (!taskId) {
    return NextResponse.json(
      { error: "Task ID is required" },
      { status: 400 }
    )
  }

  const apiKey = process.env.MANUS_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "MANUS_API_KEY is not configured" },
      { status: 500 }
    )
  }

  // Add a delay on first poll to allow task to be created in Manus system
  if (isFirstPoll) {
    console.log("[v0] First poll - waiting 2.5s for task to be created...")
    await new Promise(resolve => setTimeout(resolve, 2500))
  }

  try {
    const url = `${MANUS_API_URL}/${taskId}?convert=true`
    console.log("[v0] GET from Manus API:", url)
    
    // Retry logic for 404 errors (task may not be immediately available)
    let response: Response | null = null
    let retries = 5
    
    while (retries > 0) {
      response = await fetch(url, {
        method: "GET",
        headers: {
          "API_KEY": apiKey,
        },
      })
      
      // If 404, wait and retry - task may not be available yet
      if (response.status === 404 && retries > 1) {
        console.log("[v0] Task not found, retrying in 2s... (retries left:", retries - 1, ")")
        await new Promise(resolve => setTimeout(resolve, 2000))
        retries--
        continue
      }
      break
    }

    if (!response || !response.ok) {
      const errorText = await response?.text() || "Unknown error"
      console.log("[v0] GET Error:", response?.status, errorText)
      return NextResponse.json(
        { error: `Manus API error: ${response?.status} - ${errorText}` },
        { status: response?.status || 500 }
      )
    }

    const data = await response.json()
    console.log("[v0] GET Response from Manus:", JSON.stringify(data, null, 2))
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching task status:", error)
    return NextResponse.json(
      { error: "Failed to fetch task status" },
      { status: 500 }
    )
  }
}
