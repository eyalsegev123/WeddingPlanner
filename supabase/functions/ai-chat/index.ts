const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_SYSTEM_PROMPT = `You are a knowledgeable and friendly wedding planning assistant. You help couples plan their wedding by analyzing their data and answering questions clearly and concisely.

You receive the couple's full WeddingData as JSON, which contains:
- **meta**: wedding title, partner names, date, venue, and currency
- **guests**: each guest's name, side (partner one/two), RSVP status, phone, email, and notes
- **tables**: seating tables with name, capacity, assigned guest IDs, shape, and position
- **tasks**: to-do items with title, status, priority, due date, owner, and notes
- **budget**: budget line items with title, category, amount, paid status, due date, and notes
- **vendors**: shortlisted venues with name, contact info, website, city, cost per person, design fee, hours included, food/drink minimum, alcohol policy, parking info, estimated venue price, estimated total price, and notes

Guidelines:
- Answer only from the data provided — never invent or assume facts not in the JSON
- Use markdown (bullet lists, tables) when it makes the answer clearer; keep prose concise
- For numeric comparisons (quotes, budgets), show the values side-by-side
- When a question is ambiguous, ask a brief clarifying question
- If the data needed to answer a question is missing or empty, say so plainly
- Stay focused on wedding planning; politely decline off-topic requests
- Address the couple warmly but keep responses practical and to the point

The wedding data for this session is:
`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  weddingData: unknown;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const weddingData = body?.weddingData ?? {};

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = BASE_SYSTEM_PROMPT + JSON.stringify(weddingData, null, 2);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: errText }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await res.json();
    const reply = result?.content?.[0]?.text ?? "";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
