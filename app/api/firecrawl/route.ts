import { NextRequest, NextResponse } from "next/server"

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v2/browser"
const FIRECRAWL_API_KEY = "fc-21c577cb2e1a48d1a850e2850aceb4b4"

// Create a new browser session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, sessionId, code, language = "node" } = body

    // Create a new browser session
    if (action === "create") {
      console.log("[v0] Creating new Firecrawl browser session...")
      
      const response = await fetch(FIRECRAWL_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ttl: 600, // 10 minutes
          activityTtl: 300, // 5 minutes inactivity timeout
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Create session error:", response.status, errorText)
        return NextResponse.json(
          { error: `Firecrawl API error: ${response.status} - ${errorText}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      console.log("[v0] Session created:", data)
      return NextResponse.json(data)
    }

    // Execute code in an existing session
    if (action === "execute" && sessionId) {
      console.log("[v0] Executing code in session:", sessionId, "language:", language)
      console.log("[v0] Code to execute:", code)
      
      const response = await fetch(`${FIRECRAWL_API_URL}/${sessionId}/execute`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language, // "bash" for agent-browser commands, "node" or "python" for Playwright
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Execute error:", response.status, errorText)
        return NextResponse.json(
          { error: `Firecrawl API error: ${response.status} - ${errorText}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      console.log("[v0] Execute result:", data)
      return NextResponse.json(data)
    }

    // Close a browser session
    if (action === "close" && sessionId) {
      console.log("[v0] Closing session:", sessionId)
      
      const response = await fetch(FIRECRAWL_API_URL, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: sessionId }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Close session error:", response.status, errorText)
        return NextResponse.json(
          { error: `Firecrawl API error: ${response.status} - ${errorText}` },
          { status: response.status }
        )
      }

      return NextResponse.json({ success: true, message: "Session closed" })
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'create', 'execute', or 'close'" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error in Firecrawl API:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}

// Get session status or list sessions
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")

  try {
    // Get specific session info
    if (sessionId) {
      console.log("[v0] Getting session info:", sessionId)
      
      const response = await fetch(`${FIRECRAWL_API_URL}/${sessionId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        return NextResponse.json(
          { error: `Firecrawl API error: ${response.status} - ${errorText}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    }

    // List all sessions
    console.log("[v0] Listing all sessions...")
    
    const response = await fetch(FIRECRAWL_API_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Firecrawl API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching Firecrawl session:", error)
    return NextResponse.json(
      { error: "Failed to fetch session info" },
      { status: 500 }
    )
  }
}
