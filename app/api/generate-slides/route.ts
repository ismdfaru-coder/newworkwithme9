const MANUS_API_URL = "https://api.manus.ai/v1/tasks"

interface SlideData {
  title: string
  content: string[]
}

// Helper to extract text from various content formats
function extractText(item: unknown): string {
  if (typeof item === 'string') return item
  if (typeof item === 'object' && item !== null) {
    const obj = item as Record<string, unknown>
    // Handle {type: "text", text: "..."} format
    if (obj.text && typeof obj.text === 'string') return obj.text
    // Handle {content: "..."} format
    if (obj.content && typeof obj.content === 'string') return obj.content
    // Handle {value: "..."} format
    if (obj.value && typeof obj.value === 'string') return obj.value
  }
  return String(item)
}

// Normalize slides to ensure content is always string[]
function normalizeSlides(slides: unknown[]): SlideData[] {
  return slides.map((slide) => {
    const s = slide as Record<string, unknown>
    const title = extractText(s.title)
    const rawContent = s.content
    let content: string[] = []
    
    if (Array.isArray(rawContent)) {
      content = rawContent.map(extractText)
    } else if (rawContent) {
      content = [extractText(rawContent)]
    }
    
    return { title, content }
  })
}

export async function POST(req: Request) {
  const { topic, audience, slideCount, style } = await req.json()

  const apiKey = process.env.MANUS_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: "MANUS_API_KEY is not configured" },
      { status: 500 }
    )
  }

  const prompt = `You are an expert presentation creator and researcher. Create a ${slideCount}-slide presentation about "${topic}".

Target audience: ${audience || 'general audience'}
Style: ${style || 'professional'}

IMPORTANT INSTRUCTIONS:
1. First, research and gather key information about the topic
2. Identify the most important points, facts, statistics, and insights
3. Structure the presentation logically with a clear flow
4. Include specific data, examples, and actionable insights where relevant
5. Make each slide focused and impactful

The presentation should include:
- Slide 1: Title slide with topic and subtitle
- Slides 2-${parseInt(slideCount) - 1}: Main content slides with key points, research findings, and insights
- Slide ${slideCount}: Conclusion/Thank you slide with key takeaways

For each bullet point, provide substantive content - not generic placeholders. Include real facts, statistics, best practices, or actionable information where applicable.

CRITICAL: Your response MUST be valid JSON in this exact format:
{
  "slides": [
    { "title": "Slide Title", "content": ["Point 1", "Point 2", "Point 3"] }
  ]
}

Do not include any text before or after the JSON. Only output the JSON object.`

  try {
    // Create task with Manus API
    const createResponse = await fetch(MANUS_API_URL, {
      method: "POST",
      headers: {
        "API_KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        agentProfile: "manus-1.6",
        taskMode: "chat",
      }),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      throw new Error(`Manus API error: ${createResponse.status} - ${errorText}`)
    }

    const createData = await createResponse.json()
    
    // The Manus API might return the task ID in different fields or return the result directly
    const taskId = createData.taskId || createData.id || createData.task_id
    
    // If response already contains the output/result, use it directly (some APIs return inline)
    if (createData.output || createData.result || createData.response || createData.message) {
      const directOutput = createData.output || createData.result || createData.response || createData.message || ''
      let slides: SlideData[] = []
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = typeof directOutput === 'string' 
          ? directOutput.match(/\{[\s\S]*"slides"[\s\S]*\}/)
          : null
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          slides = parsed.slides
        } else if (typeof directOutput === 'object' && directOutput.slides) {
          slides = directOutput.slides
        }
      } catch {
        // JSON parsing failed, will use text parser
      }
      
      if (!slides || slides.length === 0) {
        slides = parseTextToSlides(typeof directOutput === 'string' ? directOutput : JSON.stringify(directOutput), topic, parseInt(slideCount))
      }
      
      return Response.json({ slides: normalizeSlides(slides) })
    }

    if (!taskId) {
      throw new Error('No task ID returned from Manus API')
    }

    // Poll for completion
    let attempts = 0
    const maxAttempts = 30
    let result = null

    // Initial delay
    await new Promise(resolve => setTimeout(resolve, 3000))

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`${MANUS_API_URL}/${taskId}?convert=true`, {
        method: "GET",
        headers: {
          "API_KEY": apiKey,
        },
      })

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        
        if (statusData.status === 'completed' || statusData.status === 'finished') {
          result = statusData
          break
        } else if (statusData.status === 'failed' || statusData.status === 'error') {
          throw new Error('Task failed')
        }
      }

      attempts++
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    if (!result) {
      throw new Error('Task timed out')
    }

    // Parse the response to extract slides
    const rawOutput = result.output || result.result || result.response || result.content || ''
    
    // Convert to string if it's an object
    const output = typeof rawOutput === 'string' ? rawOutput : JSON.stringify(rawOutput)
    let slides: SlideData[] = []

    try {
      // If rawOutput is already an object with slides, use it directly
      if (typeof rawOutput === 'object' && rawOutput !== null) {
        if (rawOutput.slides) {
          slides = rawOutput.slides
        } else if (Array.isArray(rawOutput)) {
          slides = rawOutput
        }
      }
      
      // Try to extract JSON from the string response
      if (slides.length === 0) {
        const jsonMatch = output.match(/\{[\s\S]*"slides"[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          slides = parsed.slides
        }
      }
    } catch (e) {
      // If JSON parsing fails, create slides from the text response
      console.log('[v0] JSON parsing failed:', e)
    }

    if (!slides || slides.length === 0) {
      slides = parseTextToSlides(output, topic, parseInt(slideCount))
    }

    return Response.json({ slides: normalizeSlides(slides) })
  } catch (error) {
    console.error('Error generating slides:', error)
    return Response.json(
      { error: 'Failed to generate slides. Please try again.' },
      { status: 500 }
    )
  }
}

// Fallback function to parse text response into slides
function parseTextToSlides(text: string, topic: string, slideCount: number): SlideData[] {
  const slides: SlideData[] = [
    { title: topic, content: ['A comprehensive presentation', 'Created with AI assistance'] }
  ]

  // Try to extract sections from the text
  const lines = text.split('\n').filter(line => line.trim())
  let currentSlide: SlideData | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    
    // Check if it's a header/title (starts with # or has title-like formatting)
    if (trimmed.startsWith('#') || trimmed.match(/^(Slide \d+:|^\d+\.|^[A-Z][^.!?]*$)/)) {
      if (currentSlide && currentSlide.content.length > 0) {
        slides.push(currentSlide)
      }
      currentSlide = {
        title: trimmed.replace(/^#+\s*/, '').replace(/^Slide \d+:\s*/, '').replace(/^\d+\.\s*/, ''),
        content: []
      }
    } else if (currentSlide && trimmed.length > 0) {
      // Add as content point
      const cleanedLine = trimmed.replace(/^[-*•]\s*/, '')
      if (cleanedLine.length > 0 && currentSlide.content.length < 5) {
        currentSlide.content.push(cleanedLine)
      }
    }
  }

  if (currentSlide && currentSlide.content.length > 0) {
    slides.push(currentSlide)
  }

  // Ensure we have the requested number of slides
  while (slides.length < slideCount) {
    slides.push({
      title: `Section ${slides.length}`,
      content: ['Key information about ' + topic]
    })
  }

  // Add conclusion slide if not already there
  if (slides.length >= slideCount) {
    slides[slides.length - 1] = {
      title: 'Thank You',
      content: ['Questions?', 'Key takeaways from this presentation']
    }
  }

  return slides.slice(0, slideCount)
}
