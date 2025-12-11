"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserStats {
  totalPredictions: number;
  correctPredictions: number;
  roomsCreated: number;
  roomsJoined: number;
  points: number;
  level: number;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem("omnix-user");
    
    if (!userStr) {
      router.push("/");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUsername(user.username || user.name || "User");
      
      if (!user.stats) {
        user.stats = {
          totalPredictions: 0,
          correctPredictions: 0,
          roomsCreated: 0,
          roomsJoined: 0,
          points: 0,
          level: 1
        };
        localStorage.setItem("omnix-user", JSON.stringify(user));
      }
      
      setStats(user.stats);
      
      const allBadges: Badge[] = [
        { id: "first_room", name: "Room Creator", icon: "🏠", earned: (user.stats?.roomsCreated || 0) >= 1 },
        { id: "social", name: "Social Butterfly", icon: "🦋", earned: (user.stats?.roomsJoined || 0) >= 5 },
        { id: "points", name: "Points Master", icon: "💎", earned: (user.stats?.points || 0) >= 100 },
        { id: "level", name: "Rising Star", icon: "⭐", earned: (user.stats?.level || 1) >= 3 },
        { id: "predictor", name: "Predictor", icon: "🔮", earned: (user.stats?.totalPredictions || 0) >= 1 },
        { id: "accurate", name: "Sharp Shooter", icon: "🎯", earned: (user.stats?.correctPredictions || 0) >= 5 }
      ];
      setBadges(allBadges);
      setIsLoading(false);
    } catch (error) {
      router.push("/");
    }
  }, [router]);

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      alert("Please enter a room name");
      return;
    }

    const roomId = Math.random().toString(36).substring(2, 10);
    
    const userStr = localStorage.getItem("omnix-user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (!user.stats) user.stats = { roomsCreated: 0, points: 0, level: 1 };
      user.stats.roomsCreated = (user.stats.roomsCreated || 0) + 1;
      user.stats.points = (user.stats.points || 0) + 20;
      user.stats.level = Math.floor(user.stats.points / 100) + 1;
      localStorage.setItem("omnix-user", JSON.stringify(user));
      setStats(user.stats);
    }
    
    const message = `Join my Omnix prediction room: *${roomName}*\n\nClick to join:\nhttps://omnix-app.vercel.app/room/${roomId}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    setRoomName("");
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <p style={{ color: "#8A2BE2", fontSize: "18px" }}>Loading...</p>
      </div>
    );
  }

  const earnedBadges = badges.filter(b => b.earned);

  return (
    <div style={{ minHeight: "100vh", background: "#000", padding: "20px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", paddingTop: "40px" }}>
        
        {/* Header *
