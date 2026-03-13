// app/api/agent/route.ts
// Firecrawl FIRE-1 drives the browser autonomously from any natural language query.
// You never write commands. You just send a task string.

export const runtime = "nodejs";
export const maxDuration = 120;

const FC_BASE = "https://api.firecrawl.dev";
// Use the same API key as firecrawl route
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || "fc-21c577cb2e1a48d1a850e2850aceb4b4";

async function fc(path: string, method = "GET", body?: object, key?: string) {
  const res = await fetch(`${FC_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  
  // Check for HTTP errors before parsing JSON
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Firecrawl API error: ${res.status} - ${errorText}`);
  }
  
  return res.json();
}

// Use Keyplex API to summarize the final raw output into a clean answer
async function summarise(rawOutput: string, query: string, apiKey: string): Promise<string> {
  if (!apiKey || apiKey === "") return rawOutput;
  
  try {
    const res = await fetch("https://api.keyplex.io/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `The user asked: "${query}"\n\nHere is the raw browser output:\n\n${rawOutput}\n\nSummarise the key answer clearly and concisely.`,
        }],
        max_tokens: 800,
      }),
    });
    
    if (!res.ok) {
      // If Keyplex fails, just return raw output without throwing
      return rawOutput;
    }
    
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? rawOutput;
  } catch {
    // Silently fail and return raw output
    return rawOutput;
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") ?? "";
  const keyplex = searchParams.get("keyplex_key") ?? process.env.KEYPLEX_API_KEY ?? "";

  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query" }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      let sessionId: string | null = null;

      try {
        // Step 1: Create browser session
        send("step", { type: "info", desc: "Creating Firecrawl browser session..." });

        const session = await fc("/v2/browser", "POST", { ttl: 300, activityTtl: 120 }, FIRECRAWL_API_KEY);

        if (!session.success) throw new Error(session.error ?? "Failed to create session");

        sessionId = session.id;

        // Step 2: Send liveViewUrl to frontend immediately
        send("session", {
          sessionId: session.id,
          liveViewUrl: session.liveViewUrl,
          interactiveLiveViewUrl: session.interactiveLiveViewUrl,
        });

        send("step", { type: "success", desc: "Live browser ready. FIRE-1 is taking over..." });

        // Step 3: Send ONE natural language task to FIRE-1
        // FIRE-1 figures out ALL the commands itself (clicks, fills, navigation)
        send("step", { type: "executing", desc: `FIRE-1 executing: "${query}"` });

        const taskResult = await fc(
          `/v2/browser/${sessionId}/execute`,
          "POST",
          {
            code: `agent-browser task "${query.replace(/"/g, "'")}"`,
            language: "bash",
          },
          FIRECRAWL_API_KEY
        );

        const rawOutput: string = taskResult.output ?? taskResult.result ?? JSON.stringify(taskResult);

        send("rawResult", { output: rawOutput });

        // Step 4: Optionally summarise with Keyplex
        if (keyplex) {
          send("step", { type: "info", desc: "Summarizing result..." });
          const summary = await summarise(rawOutput, query, keyplex);
          send("summary", { text: summary });
        }

        send("done", { message: "Done! Check the live view above." });

      } catch (err: unknown) {
        send("error", { message: err instanceof Error ? err.message : "Unknown error" });
      } finally {
        controller.close();
        // Clean up session after 5 minutes
        if (sessionId) {
          setTimeout(() => fc(`/v2/browser/${sessionId}`, "DELETE", undefined, FIRECRAWL_API_KEY), 300_000);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// POST endpoint for more complex requests
export async function POST(req: Request) {
  const body = await req.json();
  const { query, keyplex_key } = body;

  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query" }), { status: 400 });
  }

  // Redirect to GET with query params for SSE streaming
  const url = new URL(req.url);
  url.searchParams.set("query", query);
  if (keyplex_key) url.searchParams.set("keyplex_key", keyplex_key);
  
  return GET(new Request(url.toString()));
}
