"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserStats {
  totalPredictions: number;
  correctPredictions: number;
  roomsCreated: number;
  roomsJoined: number;
  currentStreak: number;
  longestStreak: number;
  points: number;
  level: number;
  lastActiveDate: string;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
  description: string;
}

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem("omnix-user");
    
    if (!userStr) {
      router.push("/");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUsername(user.username || user.name || "User");
      
      // Initialize stats if not exists
      if (!user.stats) {
        user.stats = {
          totalPredictions: 0,
          correctPredictions: 0,
          roomsCreated: 0,
          roomsJoined: 0,
          currentStreak: 0,
          longestStreak: 0,
          points: 0,
          level: 1,
          lastActiveDate: new Date().toISOString()
        };
        localStorage.setItem("omnix-user", JSON.stringify(user));
      }
      
      setStats(user.stats);
      checkAndAwardBadges(user);
      setIsLoading(false);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/");
    }
  }, [router]);

  const checkAndAwardBadges = (user: any) => {
    const allBadges: Badge[] = [
      {
        id: "first_room",
        name: "Room Creator",
        icon: "🏠",
        earned: (user.stats?.roomsCreated || 0) >= 1,
        description: "Create your first room"
      },
      {
        id: "social_butterfly",
        name: "Social Butterfly",
        icon: "🦋",
        earned: (user.stats?.roomsJoined || 0) >= 5,
        description: "Join 5 rooms"
      },
      {
        id: "points_master",
        name: "Points Master",
        icon: "💎",
        earned: (user.stats?.points || 0) >= 100,
        description: "Earn 100 points"
      },
      {
        id: "level_up",
        name: "Rising Star",
        icon: "⭐",
        earned: (user.stats?.level || 1) >= 3,
        description: "Reach level 3"
      },
      {
        id: "predictor",
        name: "Predictor",
        icon: "🔮",
        earned: (user.stats?.totalPredictions || 0) >= 1,
        description: "Make your first prediction"
      },
      {
        id: "sharp_shooter",
        name: "Sharp Shooter",
        icon: "🎯",
        earned: (user.stats?.correctPredictions || 0) >= 5,
        description: "Get 5 predictions correct"
      }
    ];
    
    setBadges(allBadges);
  };

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      alert("Please enter a room name");
      return;
    }

    // Generate simple room ID
    const roomId = Math.random().toString(36).substring(2, 10);
    
    // Award points and update stats
    const userStr = localStorage.getItem("omnix-user");
    if (userStr) {
      const user = JSON.parse(userStr);
      user.stats.roomsCreated = (user.stats.roomsCreated || 0) + 1;
      user.stats.points = (user.stats.points || 0) + 20;
      user.stats.level = Math.floor(user.stats.points / 100) + 1;
      localStorage.setItem("omnix-user", JSON.stringify(user));
      setStats(user.stats);
      checkAndAwardBadges(user);
    }
    
    // Create WhatsApp share message
    const message = `Join my Omnix prediction room: *${roomName}*\n\nClick to join:\nhttps://omnix-app.vercel.app/room/${roomId}`;
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp with the message
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
    
    // Clear the room name input
    setRoomName("");
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000"
      }}>
        <p style={{ color: "#8A2BE2", fontSize: "18px", letterSpacing: "1px" }}>Loading...</p>
      </div>
    );
  }

  const earnedBadges = badges.filter(b => b.earned);
  const accuracy = stats && stats.totalPredictions > 0 
    ? Math.round((stats.correctPredictions / stats.totalPredictions) * 100) 
    : 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000000",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
        paddingTop: "40px"
      }}>
        {/* Header with Logo and Stats */}
        <div style={{
          background: "#121212",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(138, 43, 226, 0.15)",
          marginBottom: "30px",
          border: "1px solid rgba(138, 43, 226, 0.2)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            height: "3px",
            background: "linear-gradient(90deg, #8A2BE2, #00AEEF, #8A2BE2)",
          }} />
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #8A2BE2 0%, #00AEEF 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 5px 15px rgba(138, 43, 226, 0.4)"
              }}>
                <svg width="35" height="25" viewBox="0 0 60 40" fill="none">
                  <path 
                    d="M15,20 Q20,10 30,20 Q40,30 45,20 Q50,10 55,20 Q50,30 45,20 Q40,10 30,20 Q20,30 15,20 Z" 
                    fill="white"
                    opacity="0.95"
                  />
                </svg>
              </div>
              
              <div>
                <h1 style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#FFFFFF",
                  margin: "0",
                  letterSpacing: "1px"
                }}>
                  {username}
                </h1>
                <p style={{
                  color: "#8A2BE2",
                  fontSize: "13px",
                  margin: "5px 0 0 0",
                  letterSpacing: "1px"
                }}>
                  Level {stats?.level || 1} • {stats?.points || 0} points
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: "flex", gap: "25px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#00E6A3" }}>
                  {stats?.roomsCreated || 0}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px" }}>
                  ROOMS
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#FFC400" }}>
                  {earnedBadges.length}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px" }}>
                  BADGES
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#FF2D92" }}>
                  {accuracy}%
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px" }}>
                  ACCURACY
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
          {/* Create Room Card */}
          <div style={{
            background: "#121212",
            padding: "40px",
            borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(138, 43, 226, 0.15)",
            border: "1px solid rgba(138, 43, 226, 0.2)"
          }}>
            <h2 style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#FFFFFF",
              marginBottom: "8px",
              letterSpacing: "1px"
            }}>
              Create a Prediction Room
            </h2>
            <p style={{
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: "14px",
              marginBottom: "25px"
            }}>
              Earn <span style={{color: "#00E6A3"}}>+20 points</span> for creating a room
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "10px",
                color: "#FFFFFF",
                fontWeight: "500",
                fontSize: "13px",
                letterSpacing: "0.5px"
              }}>
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g., 'Premier League Winners 2025'"
                style={{
                  width: "100%",
                  padding: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#FFFFFF",
                  transition: "all 0.3s"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#8A2BE2";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(138, 43, 226, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <button
              onClick={handleCreateRoom}
              style={{
                width: "100%",
                padding: "18px",
                background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "all 0.3s",
                boxShadow: "0 4px 15px rgba(37, 211, 102, 0.3)",
                letterSpacing: "0.5px"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(37, 211, 102, 0.5)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(37, 211, 102, 0.3)";
              }}
            >
              <span>📱</span>
              Share on WhatsApp
            </button>
          </div>

          {/* Badges Card */}
          <div style={{
            background: "#121212",
            padding: "30px",
            borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(138, 43, 226, 0.15)",
            border: "1px solid rgba(138, 43, 226, 0.2)"
          }}>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#FFFFFF",
              marginBottom: "20px",
              letterSpacing: "1px"
            }}>
              Your Badges
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px" }}>
              {badges.slice(0, 6).map(badge => (
                <div
                  key={badge.id}
                  style={{
                    background: badge.earned ? "rgba(138, 43, 226, 0.1)" : "rgba(255, 255, 255, 0.05)",
                    padding: "15px 10px",
                    borderRadius: "12px",
                    textAlign: "center",
                    border: badge.earned ? "1px solid rgba(138, 43, 226, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                    opacity: badge.earned ? 1 : 0.4,
                    transition: "all 0.3s",
                    cursor: "pointer"
                  }}
                  title={badge.description}
                >
                  <div style={{ fontSize: "28px", marginBottom: "5px" }}>{badge.icon}</div>
                  <div style={{ fontSize: "10px", color: badge.earned ? "#8A2BE2" : "rgba(255,255,255,0.5)", fontWeight: "600", letterSpacing: "0.5px" }}>
                    {badge.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard Link + Logout */}
        <div style={{
          marginTop: "30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <button
            onClick={() => router.push("/leaderboard")}
            style={{
              padding: "12px 24px",
              background: "rgba(255, 196, 0, 0.1)",
              color: "#FFC400",
              border: "1px solid rgba(255, 196, 0, 0.3)",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.3s",
              letterSpacing: "0.5px",
              fontWeight: "600"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#FFC400";
              e.currentTarget.style.color = "#000000";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255, 196, 0, 0.1)";
              e.currentTarget.style.color = "#FFC400";
            }}
          >
            🏆 View Leaderboard
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("omnix-user");
              router.push("/");
            }}
            style={{
              padding: "12px 24px",
              background: "transparent",
              color: "rgba(255, 255, 255, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.3s",
              letterSpacing: "0.5px"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#8A2BE2";
              e.currentTarget.style.color = "#8A2BE2";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
