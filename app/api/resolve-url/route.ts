import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { urls } = body as { urls: string[] }

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: "URLs array is required" },
        { status: 400 }
      )
    }

    // Resolve each URL by following redirects
    const resolvedUrls = await Promise.all(
      urls.map(async (url) => {
        try {
          // Check if it's a vertex AI search URL or other redirect URL
          if (url.includes('vertexaisearch.cloud.google.com') || 
              url.includes('google.com/url') ||
              url.includes('bing.com/ck')) {
            
            // Follow redirects to get final URL
            const response = await fetch(url, {
              method: 'HEAD',
              redirect: 'follow',
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; URL Resolver)',
              },
            })
            
            // The final URL after redirects
            const finalUrl = response.url
            
            // If it's still a vertex URL, try to extract the actual URL from query params
            if (finalUrl.includes('vertexaisearch.cloud.google.com')) {
              const urlObj = new URL(finalUrl)
              const redirectUrl = urlObj.searchParams.get('url') || 
                                  urlObj.searchParams.get('q') ||
                                  urlObj.searchParams.get('redirect')
              if (redirectUrl) {
                return { original: url, resolved: redirectUrl }
              }
            }
            
            return { original: url, resolved: finalUrl }
          }
          
          // Not a redirect URL, return as-is
          return { original: url, resolved: url }
        } catch (error) {
          console.error(`Error resolving URL ${url}:`, error)
          // On error, try to extract URL from vertex search URL query params
          try {
            const urlObj = new URL(url)
            if (url.includes('vertexaisearch.cloud.google.com')) {
              // Try different query parameter names
              const extractedUrl = urlObj.searchParams.get('url') || 
                                   urlObj.searchParams.get('redirect') ||
                                   urlObj.searchParams.get('q')
              if (extractedUrl) {
                return { original: url, resolved: extractedUrl }
              }
            }
          } catch {
            // Ignore parsing errors
          }
          return { original: url, resolved: url }
        }
      })
    )

    return NextResponse.json({ resolvedUrls })
  } catch (error) {
    console.error("Error resolving URLs:", error)
    return NextResponse.json(
      { error: "Failed to resolve URLs" },
      { status: 500 }
    )
  }
}
