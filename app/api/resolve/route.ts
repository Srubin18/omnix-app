import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    const searchQuery = encodeURIComponent(`${question} result winner 2024 2025`);
    
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${searchQuery}&format=json&no_html=1`
    );

    if (response.ok) {
      const data = await response.json();
      
      if (data.Answer) {
        return NextResponse.json({
          answer: data.Answer,
          source: "DuckDuckGo Instant Answer"
        });
      }
      
      if (data.AbstractText) {
        const abstract = data.AbstractText;
        const shortAnswer = abstract.split(".")[0];
        return NextResponse.json({
          answer: shortAnswer,
          source: data.AbstractSource || "Web Search"
        });
      }
    }

    return NextResponse.json({
      answer: null,
      message: "No definitive answer found. Please resolve manually."
    });

  } catch (error) {
    console.error("AI resolve error:", error);
    return NextResponse.json({ error: "Failed to search for answer" }, { status: 500 });
  }
}
