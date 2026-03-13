import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { topic, audience, style, format } = await request.json()

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      )
    }

    // Use Vercel AI Gateway for document generation
    const prompt = `Create a professional document about "${topic}".
${audience ? `Target audience: ${audience}` : ""}
Document style: ${style || "professional"}

Generate a well-structured document with:
1. A compelling title
2. An executive summary/introduction
3. 3-5 main sections with clear headings
4. Key points and supporting details for each section
5. A conclusion or summary

Format the response as JSON with this structure:
{
  "title": "Document title",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Section content with paragraphs separated by newlines"
    }
  ]
}

Make the content informative, well-researched, and professionally written.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional document writer. Always respond with valid JSON only, no markdown code blocks."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || "Failed to generate document")
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ""
    
    // Parse the JSON response
    let docData
    try {
      // Clean up the response - remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      docData = JSON.parse(cleanContent)
    } catch {
      // If parsing fails, create a simple structure from the text
      docData = {
        title: topic,
        sections: [
          {
            heading: "Introduction",
            content: content
          }
        ]
      }
    }

    return NextResponse.json(docData)
  } catch (error) {
    console.error("Error generating document:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate document" },
      { status: 500 }
    )
  }
}
