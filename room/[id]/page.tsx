"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// CRITICAL FIX: Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string || "unknown";
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem("omnix-user");
    
    if (!userStr) {
      // Save the room ID and redirect to login
      localStorage.setItem("omnix-pending-room", roomId);
      router.push("/");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUsername(user.username || user.name || "User");
      setIsLoading(false);
      
      // Award points for joining a room
      awardPoints(user, 10, "Joined a room");
      
      // Clear pending room if exists
      localStorage.removeItem("omnix-pending-room");
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/");
    }
  }, [roomId, router]);

  const awardPoints = (user: any, points: number, reason: string) => {
    if (!user.stats) {
      user.stats = {
        totalPredictions: 0,
        correctPredictions: 0,
        roomsCreated: 0,
        roomsJoined: 1,
        currentStreak: 0,
        longestStreak: 0,
        points: points,
        level: 1,
        lastActiveDate: new Date().toISOString()
      };
    } else {
      user.stats.points = (user.stats.points || 0) + points;
      user.stats.roomsJoined = (user.stats.roomsJoined || 0) + 1;
      user.stats.lastActiveDate = new Date().toISOString();
      
      // Level up logic (every 100 points = 1 level)
      user.stats.level = Math.floor(user.stats.points / 100) + 1;
    }
    
    localStorage.setItem("omnix-user", JSON.stringify(user));
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
        <p style={{ color: "#8A2BE2", fontSize: "18px", letterSpacing: "1px" }}>Loading room...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000000",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        paddingTop: "40px"
      }}>
        {/* Back to Home Button */}
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

        {/* Room Header */}
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
          {/* Purple accent bar */}
          <div style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            height: "3px",
            background: "linear-gradient(90deg, #8A2BE2, #00AEEF, #8A2BE2)",
          }} />
          
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "15px"
          }}>
            {/* Mini logo */}
            <div style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #8A2BE2 0%, #00AEEF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 5px 15px rgba(138, 43, 226, 0.4)"
            }}>
              <svg width="40" height="30" viewBox="0 0 60 40" fill="none">
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
                Prediction Room
              </h1>
              <p style={{
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "13px",
                margin: "5px 0 0 0",
                letterSpacing: "1px"
              }}>
                Room ID: {roomId}
              </p>
            </div>
          </div>
          
          <div style={{
            background: "rgba(138, 43, 226, 0.1)",
            padding: "15px",
            borderRadius: "8px",
            marginTop: "20px",
            border: "1px solid rgba(138, 43, 226, 0.2)"
          }}>
            <p style={{
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "14px",
              margin: "0"
            }}>
              👤 Joined as: <strong style={{ color: "#8A2BE2", letterSpacing: "0.5px" }}>{username}</strong>
              <span style={{ 
                color: "#00E6A3", 
                marginLeft: "15px",
                fontSize: "12px"
              }}>
                +10 points earned! 🎯
              </span>
            </p>
          </div>
        </div>

        {/* Predictions Section */}
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
            marginBottom: "25px",
            letterSpacing: "1px"
          }}>
            Predictions
          </h2>

          <div style={{
            background: "rgba(138, 43, 226, 0.05)",
            padding: "60px 40px",
            borderRadius: "12px",
            textAlign: "center",
            border: "2px dashed rgba(138, 43, 226, 0.2)"
          }}>
            <span style={{ fontSize: "64px", marginBottom: "20px", display: "block" }}>
              🔮
            </span>
            <p style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "18px",
              margin: "0",
              letterSpacing: "0.5px"
            }}>
              Predictions will appear here
            </p>
            <p style={{
              color: "rgba(255, 255, 255, 0.4)",
              fontSize: "14px",
              marginTop: "10px",
              letterSpacing: "0.5px"
            }}>
              Share this room with friends to start making predictions
            </p>
          </div>

          {/* Share Again Button */}
          <button
            onClick={() => {
              const message = `Join my Omnix prediction room!\n\nClick to join:\nhttps://omnix-app.vercel.app/room/${roomId}`;
              const encodedMessage = encodeURIComponent(message);
              const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
              window.open(whatsappUrl, "_blank");
            }}
            style={{
              marginTop: "30px",
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
            Share This Room on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
