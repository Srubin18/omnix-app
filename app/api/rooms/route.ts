import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("id");
    const creator = searchParams.get("creator");

    if (roomId) {
      const room = await redis.get(`room:${roomId}`);
      if (!room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }
      return NextResponse.json({ room });
    }

    if (creator) {
      const keys = await redis.keys("room:*");
      const rooms = [];
      for (const key of keys) {
        const room = await redis.get(key);
        if (room) {
          const parsed = typeof room === "string" ? JSON.parse(room) : room;
          if (parsed.creator === creator) {
            rooms.push(parsed);
          }
        }
      }
      return NextResponse.json({ rooms });
    }

    return NextResponse.json({ error: "Room ID or creator required" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room } = body;

    if (!room || !room.id) {
      return NextResponse.json({ error: "Room data required" }, { status: 400 });
    }

    await redis.set(`room:${room.id}`, JSON.stringify(room), { ex: 604800 });

    return NextResponse.json({ success: true, roomId: room.id });
  } catch (error) {
    console.error("Error saving room:", error);
    return NextResponse.json({ error: "Failed to save room" }, { status: 500 });
  }
}
