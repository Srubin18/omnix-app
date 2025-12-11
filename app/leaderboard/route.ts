import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  try {
    // Get all user scores from Redis
    const scores = await redis.hgetall("leaderboard") || {};
    
    const leaderboard = Object.entries(scores).map(([username, data]) => {
      const userData = typeof data === "string" ? JSON.parse(data) : data;
      return {
        username,
        points: userData.points || 0,
        correctPredictions: userData.correct || 0,
        totalPredictions: userData.total || 0,
        accuracy: userData.total > 0 ? Math.round((userData.correct / userData.total) * 100) : 0
      };
    });

    // Sort by points descending
    leaderboard.sort((a, b) => b.points - a.points);

    return NextResponse.json({ leaderboard: leaderboard.slice(0, 50) });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ leaderboard: [] });
  }
}

export async function POST(request: Request) {
  try {
    const { username, points, correct, total } = await request.json();

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    // Get existing data
    const existing = await redis.hget("leaderboard", username);
    const userData = existing 
      ? (typeof existing === "string" ? JSON.parse(existing) : existing)
      : { points: 0, correct: 0, total: 0 };

    // Update scores
    userData.points = (userData.points || 0) + (points || 0);
    userData.correct = (userData.correct || 0) + (correct || 0);
    userData.total = (userData.total || 0) + (total || 0);

    await redis.hset("leaderboard", { [username]: JSON.stringify(userData) });

    return NextResponse.json({ success: true, userData });
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
