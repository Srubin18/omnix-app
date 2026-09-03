import { NextResponse } from "next/server";

export const maxDuration = 60;

const REQUEST_TIMEOUT_MS = 55_000;

interface ProviderResult {
  model: string;
  answer: string;
}

interface ProviderConfig {
  keyEnvVars: string[];
  ask: (question: string, apiKey: string) => Promise<ProviderResult>;
}

function getKey(envVars: string[]): string | undefined {
  for (const name of envVars) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  if (!response.ok) {
    const message =
      data?.error?.message || data?.message || text.slice(0, 300) || response.statusText;
    throw new Error(`HTTP ${response.status}: ${message}`);
  }
  return data;
}

// OpenAI-compatible chat completions shape, shared by OpenAI, Perplexity, Kimi and Grok
async function askChatCompletions(
  url: string,
  apiKey: string,
  model: string,
  question: string
): Promise<ProviderResult> {
  const data = await postJson(
    url,
    { authorization: `Bearer ${apiKey}` },
    { model, messages: [{ role: "user", content: question }] }
  );
  const choice = data?.choices?.[0];
  let answer: string = choice?.message?.content ?? "";
  if (!answer) throw new Error("Empty response from provider");
  if (Array.isArray(data?.citations) && data.citations.length > 0) {
    const sources = data.citations
      .map((c: string, i: number) => `[${i + 1}] ${c}`)
      .join("\n");
    answer += `\n\nSources:\n${sources}`;
  }
  return { model: data?.model ?? model, answer };
}

const providers: Record<string, ProviderConfig> = {
  anthropic: {
    keyEnvVars: ["ANTHROPIC_API_KEY"],
    ask: async (question, apiKey) => {
      const model = process.env.ANTHROPIC_MODEL || "claude-opus-5";
      const data = await postJson(
        "https://api.anthropic.com/v1/messages",
        { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        { model, max_tokens: 4096, messages: [{ role: "user", content: question }] }
      );
      const answer = (data?.content ?? [])
        .filter((block: any) => block.type === "text")
        .map((block: any) => block.text)
        .join("");
      if (!answer) throw new Error("Empty response from provider");
      return { model: data?.model ?? model, answer };
    },
  },
  openai: {
    keyEnvVars: ["OPENAI_API_KEY"],
    ask: (question, apiKey) =>
      askChatCompletions(
        "https://api.openai.com/v1/chat/completions",
        apiKey,
        process.env.OPENAI_MODEL || "gpt-5.1",
        question
      ),
  },
  gemini: {
    keyEnvVars: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    ask: async (question, apiKey) => {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const data = await postJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        { "x-goog-api-key": apiKey },
        { contents: [{ parts: [{ text: question }] }] }
      );
      const answer = (data?.candidates?.[0]?.content?.parts ?? [])
        .map((part: any) => part.text ?? "")
        .join("");
      if (!answer) throw new Error("Empty response from provider");
      return { model, answer };
    },
  },
  perplexity: {
    keyEnvVars: ["PERPLEXITY_API_KEY"],
    ask: (question, apiKey) =>
      askChatCompletions(
        "https://api.perplexity.ai/chat/completions",
        apiKey,
        process.env.PERPLEXITY_MODEL || "sonar",
        question
      ),
  },
  kimi: {
    keyEnvVars: ["KIMI_API_KEY", "MOONSHOT_API_KEY"],
    ask: (question, apiKey) =>
      askChatCompletions(
        "https://api.moonshot.ai/v1/chat/completions",
        apiKey,
        // "kimi-latest" always points at Moonshot's newest Kimi model;
        // set KIMI_MODEL to pin a specific version (e.g. a K3 model id)
        process.env.KIMI_MODEL || "kimi-latest",
        question
      ),
  },
  grok: {
    keyEnvVars: ["XAI_API_KEY", "GROK_API_KEY"],
    ask: (question, apiKey) =>
      askChatCompletions(
        "https://api.x.ai/v1/chat/completions",
        apiKey,
        process.env.XAI_MODEL || "grok-4",
        question
      ),
  },
};

// Reports which providers have an API key configured, so the UI can grey out the rest
export async function GET() {
  const configured: Record<string, boolean> = {};
  for (const [id, config] of Object.entries(providers)) {
    configured[id] = !!getKey(config.keyEnvVars);
  }
  return NextResponse.json({ configured });
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const provider = typeof body?.provider === "string" ? body.provider : "";
  const question = typeof body?.question === "string" ? body.question.trim() : "";

  const config = providers[provider];
  if (!config) {
    return NextResponse.json(
      { error: `Unknown provider "${provider}"` },
      { status: 400 }
    );
  }
  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }
  if (question.length > 8000) {
    return NextResponse.json({ error: "Question is too long" }, { status: 400 });
  }

  const apiKey = getKey(config.keyEnvVars);
  if (!apiKey) {
    return NextResponse.json(
      { provider, error: `API key not configured — set ${config.keyEnvVars[0]}` },
      { status: 400 }
    );
  }

  const started = Date.now();
  try {
    const result = await config.ask(question, apiKey);
    return NextResponse.json({ provider, ...result, ms: Date.now() - started });
  } catch (error: any) {
    const message =
      error?.name === "TimeoutError" ? "Request timed out" : error?.message || "Request failed";
    return NextResponse.json(
      { provider, error: message, ms: Date.now() - started },
      { status: 502 }
    );
  }
}
