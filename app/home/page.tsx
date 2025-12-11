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
        
        {/* Header */}
        <div style={{
          background: "#121212",
          padding: "30px",
          borderRadius: "16px",
          marginBottom: "30px",
          border: "1px solid rgba(138,43,226,0.2)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #8A2BE2, #00AEEF, #8A2BE2)" }} />
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <div style={{
                width: "50px", height: "50px", borderRadius: "50%",
                background: "linear-gradient(135deg, #8A2BE2, #00AEEF)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <span style={{ fontSize: "24px" }}>🎯</span>
              </div>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#FFF", margin: 0 }}>{username}</h1>
                <p style={{ color: "#8A2BE2", fontSize: "13px", margin: "5px 0 0 0" }}>
                  Level {stats?.level || 1} • {stats?.points || 0} points
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "25px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#00E6A3" }}>{stats?.roomsCreated || 0}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>ROOMS</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#FFC400" }}>{earnedBadges.length}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>BADGES</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#FF2D92" }}>0%</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>ACCURACY</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
          {/* Create Room */}
          <div style={{
            background: "#121212",
            padding: "30px",
            borderRadius: "16px",
            border: "1px solid rgba(138,43,226,0.2)"
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#FFF", marginBottom: "8px" }}>Create a Prediction Room</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "20px" }}>
              Earn <span style={{ color: "#00E6A3" }}>+20 points</span> for creating a room
            </p>

            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g., 'Premier League Winners 2025'"
              style={{
                width: "100%",
                padding: "14px",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "15px",
                boxSizing: "border-box",
                background: "rgba(255,255,255,0.05)",
                color: "#FFF",
                marginBottom: "15px"
              }}
            />

            <button
              onClick={handleCreateRoom}
              style={{
                width: "100%",
                padding: "16px",
                background: "linear-gradient(135deg, #25D366, #128C7E)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px"
              }}
            >
              <span>📱</span> Share on WhatsApp
            </button>
          </div>

          {/* Badges */}
          <div style={{
            background: "#121212",
            padding: "25px",
            borderRadius: "16px",
            border: "1px solid rgba(138,43,226,0.2)"
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#FFF", marginBottom: "15px" }}>Your Badges</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {badges.map(badge => (
                <div
                  key={badge.id}
                  style={{
                    background: badge.earned ? "rgba(138,43,226,0.1)" : "rgba(255,255,255,0.05)",
                    padding: "12px 8px",
                    borderRadius: "10px",
                    textAlign: "center",
                    border: badge.earned ? "1px solid rgba(138,43,226,0.3)" : "1px solid rgba(255,255,255,0.1)",
                    opacity: badge.earned ? 1 : 0.4
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>{badge.icon}</div>
                  <div style={{ fontSize: "9px", color: badge.earned ? "#8A2BE2" : "rgba(255,255,255,0.5)", fontWeight: "600" }}>
                    {badge.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => router.push("/leaderboard")}
            style={{
              padding: "12px 24px",
              background: "rgba(255,196,0,0.1)",
              color: "#FFC400",
              border: "1px solid rgba(255,196,0,0.3)",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            🏆 View Leaderboard
          </button>

          <button
            onClick={() => { localStorage.removeItem("omnix-user"); router.push("/"); }}
            style={{
              padding: "12px 24px",
              background: "transparent",
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
