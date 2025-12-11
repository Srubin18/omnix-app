"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface LeaderboardEntry {
  username: string;
  points: number;
  level: number;
  roomsCreated: number;
  accuracy: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("");

  useEffect(() => {
    // Get current user
    const userStr = localStorage.getItem("omnix-user");
    if (!userStr) {
      router.push("/");
      return;
    }

    const user = JSON.parse(userStr);
    setCurrentUser(user.username || user.name);

    // For MVP1, create mock leaderboard with current user
    const mockLeaderboard: LeaderboardEntry[] = [
      {
        username: user.username || user.name,
        points: user.stats?.points || 0,
        level: user.stats?.level || 1,
        roomsCreated: user.stats?.roomsCreated || 0,
        accuracy: user.stats?.totalPredictions > 0 
          ? Math.round((user.stats.correctPredictions / user.stats.totalPredictions) * 100) 
          : 0
      },
      // Mock other users for demo
      {
        username: "predictionking",
        points: 450,
        level: 5,
        roomsCreated: 12,
        accuracy: 87
      },
      {
        username: "nostradamus2024",
        points: 380,
        level: 4,
        roomsCreated: 8,
        accuracy: 92
      },
      {
        username: "futureseer",
        points: 320,
        level: 4,
        roomsCreated: 10,
        accuracy: 78
      },
      {
        username: "prophecy_pro",
        points: 280,
        level: 3,
        roomsCreated: 7,
        accuracy: 85
      }
    ];

    // Sort by points
    const sorted = mockLeaderboard.sort((a, b) => b.points - a.points);
    setLeaderboard(sorted);
  }, [router]);

  const getRankIcon = (rank: number) => {
    if (rank === 0) return "🥇";
    if (rank === 1) return "🥈";
    if (rank === 2) return "🥉";
    return `#${rank + 1}`;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000000",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        paddingTop: "40px"
      }}>
        {/* Back Button */}
        <button
          onClick={() => router.push("/home")}
          style={{
            marginBottom: "20px",
            padding: "10px 20px",
            background: "rgba(138, 43, 226, 0.1)",
            color: "#8A2BE2",
            border: "1px solid rgba(138, 43, 226, 0.3)",
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.3s",
            letterSpacing: "0.5px"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#8A2BE2";
            e.currentTarget.style.color = "#FFFFFF";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(138, 43, 226, 0.1)";
            e.currentTarget.style.color = "#8A2BE2";
          }}
        >
          ← Back to Home
        </button>

        {/* Header */}
        <div style={{
          background: "#121212",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(255, 196, 0, 0.15)",
          marginBottom: "30px",
          border: "1px solid rgba(255, 196, 0, 0.3)",
          position: "relative",
          overflow: "hidden",
          textAlign: "center"
        }}>
          <div style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            height: "3px",
            background: "linear-gradient(90deg, #FFC400, #FF2D92, #FFC400)",
          }} />
          
          <div style={{ fontSize: "64px", marginBottom: "10px" }}>🏆</div>
          <h1 style={{
            fontSize: "36px",
            fontWeight: "700",
            color: "#FFFFFF",
            margin: "0 0 10px 0",
            letterSpacing: "2px"
          }}>
            LEADERBOARD
          </h1>
          <p style={{
            color: "#FFC400",
            fontSize: "14px",
            letterSpacing: "1px"
          }}>
            Top Predictors on Omnix
          </p>
        </div>

        {/* Leaderboard List */}
        <div style={{
          background: "#121212",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(138, 43, 226, 0.15)",
          border: "1px solid rgba(138, 43, 226, 0.2)",
          overflow: "hidden"
        }}>
          {leaderboard.map((entry, index) => {
            const isCurrentUser = entry.username === currentUser;
            
            return (
              <div
                key={entry.username}
                style={{
                  padding: "25px 30px",
                  borderBottom: index < leaderboard.length - 1 ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
                  background: isCurrentUser ? "rgba(138, 43, 226, 0.1)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.3s"
                }}
                onMouseOver={(e) => {
                  if (!isCurrentUser) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isCurrentUser) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {/* Rank + User */}
                <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1 }}>
                  <div style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    background: index < 3 ? "linear-gradient(135deg, #FFC400, #FF2D92)" : "rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#FFFFFF"
                  }}>
                    {getRankIcon(index)}
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#FFFFFF",
                      letterSpacing: "0.5px"
                    }}>
                      {entry.username}
                      {isCurrentUser && (
                        <span style={{
                          marginLeft: "10px",
                          fontSize: "12px",
                          color: "#8A2BE2",
                          background: "rgba(138, 43, 226, 0.2)",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          letterSpacing: "1px"
                        }}>
                          YOU
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: "13px",
                      color: "rgba(255, 255, 255, 0.5)",
                      marginTop: "3px",
                      letterSpacing: "0.5px"
                    }}>
                      Level {entry.level} • {entry.roomsCreated} rooms created
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#00E6A3"
                    }}>
                      {entry.accuracy}%
                    </div>
                    <div style={{
                      fontSize: "10px",
                      color: "rgba(255, 255, 255, 0.5)",
                      letterSpacing: "0.5px",
                      marginTop: "2px"
                    }}>
                      ACCURACY
                    </div>
                  </div>
                  
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: "#FFC400"
                    }}>
                      {entry.points}
                    </div>
                    <div style={{
                      fontSize: "10px",
                      color: "rgba(255, 255, 255, 0.5)",
                      letterSpacing: "0.5px",
                      marginTop: "2px"
                    }}>
                      POINTS
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coming Soon Notice */}
        <div style={{
          marginTop: "30px",
          padding: "20px",
          background: "rgba(138, 43, 226, 0.05)",
          border: "1px solid rgba(138, 43, 226, 0.2)",
          borderRadius: "12px",
          textAlign: "center"
        }}>
          <p style={{
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "14px",
            margin: "0",
            letterSpacing: "0.5px"
          }}>
            🚀 Real-time leaderboard updates coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}
