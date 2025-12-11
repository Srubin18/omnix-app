import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
    hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    urlStart: process.env.UPSTASH_REDIS_REST_URL?.substring(0, 20) || "not set"
  });
}
