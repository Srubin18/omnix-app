"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface LeaderboardEntry {
  username: string;
  points: number;
  correctPredictions: number;
  totalPredictions: number;
  accuracy: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("omnix-user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user.username);
    }
    
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboard");
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}`;
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return { background: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#000" };
    if (index === 1) return { background: "linear-gradient(135deg, #C0C0C0, #A0A0A0)", color: "#000" };
    if (index === 2) return { background: "linear-gradient(135deg, #CD7F32, #8B4513)", color: "#FFF" };
    return { background: "rgba(138,43,226,0.2)", color: "#8A2BE2" };
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>🏆</div>
          <p style={{ color: "#8A2BE2", fontSize: "18px" }}>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", padding: "20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingTop: "20px" }}>
        
        {/* Header */}
        <div style={{ background: "#121212", padding: "25px", borderRadius: "16px", marginBottom: "20px", border: "1px solid rgba(138,43,226,0.2)", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>🏆</div>
          <h1 style={{ color: "#FFF", fontSize: "24px", margin: "0 0 5px 0" }}>Leaderboard</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>Top predictors this week</p>
        </div>

        {/* Leaderboard */}
        <div style={{ background: "#121212", padding: "20px", borderRadius: "16px", border: "1px solid rgba(138,43,226,0.2)" }}>
          
          {leaderboard.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "40px", marginBottom: "15px" }}>📊</div>
              <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "10px" }}>No predictions yet!</p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Be the first to make predictions and climb the leaderboard.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {leaderboard.map((entry, index) => {
                const isCurrentUser = entry.username === currentUser;
                const rankStyle = getRankStyle(index);
                
                return (
                  <div 
                    key={entry.username} 
                    style={{ 
                      background: isCurrentUser ? "rgba(0,230,163,0.1)" : "rgba(255,255,255,0.03)", 
                      padding: "15px", 
                      borderRadius: "12px", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "15px",
                      border: isCurrentUser ? "1px solid rgba(0,230,163,0.3)" : "1px solid rgba(255,255,255,0.05)"
                    }}
                  >
                    {/* Rank */}
                    <div style={{ 
                      width: "40px", 
                      height: "40px", 
                      borderRadius: "50%", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      fontSize: index < 3 ? "20px" : "14px",
                      fontWeight: "700",
                      ...rankStyle
                    }}>
                      {getRankEmoji(index)}
                    </div>
                    
                    {/* User info */}
                    <div style={{ flex: 1 }}>
                      <p style={{ color: "#FFF", fontSize: "15px", fontWeight: "600", margin: "0 0 4px 0" }}>
                        {entry.username} {isCurrentUser && <span style={{ color: "#00E6A3", fontSize: "12px" }}>(You)</span>}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>
                        {entry.correctPredictions}/{entry.totalPredictions} correct • {entry.accuracy}% accuracy
                      </p>
                    </div>
                    
                    {/* Points */}
                    <div style={{ textAlign: "right" }}>
                      <p style={{ color: "#8A2BE2", fontSize: "18px", fontWeight: "700", margin: "0 0 2px 0" }}>{entry.points}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: 0 }}>points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* How points work */}
        <div style={{ background: "#121212", padding: "20px", borderRadius: "16px", marginTop: "20px", border: "1px solid rgba(138,43,226,0.2)" }}>
          <h3 style={{ color: "#FFF", fontSize: "14px", marginBottom: "15px" }}>💡 How to earn points</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Create a room</span>
              <span style={{ color: "#00E6A3", fontSize: "13px" }}>+20 pts</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Make a prediction</span>
              <span style={{ color: "#00E6A3", fontSize: "13px" }}>+5 pts</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Correct prediction</span>
              <span style={{ color: "#00E6A3", fontSize: "13px" }}>+50 pts</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Resolve a prediction</span>
              <span style={{ color: "#00E6A3", fontSize: "13px" }}>+10 pts</span>
            </div>
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={() => router.push("/home")}
          style={{ marginTop: "20px", width: "100%", padding: "14px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
