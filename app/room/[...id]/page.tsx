"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = Array.isArray(params?.id) ? params.id[0] : params?.id || "unknown";
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("omnix-user");
    
    if (!userStr) {
      localStorage.setItem("omnix-pending-room", roomId);
      setCheckingAuth(false);
      setIsLoggedIn(false);
    } else {
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username || user.name || "User");
        setIsLoggedIn(true);
        setCheckingAuth(false);
        
        // Award points
        if (!user.stats) {
          user.stats = {
            totalPredictions: 0,
            correctPredictions: 0,
            roomsCreated: 0,
            roomsJoined: 1,
            currentStreak: 0,
            longestStreak: 0,
            points: 10,
            level: 1,
            lastActiveDate: new Date().toISOString()
          };
        } else {
          user.stats.points = (user.stats.points || 0) + 10;
          user.stats.roomsJoined = (user.stats.roomsJoined || 0) + 1;
          user.stats.level = Math.floor(user.stats.points / 100) + 1;
        }
        localStorage.setItem("omnix-user", JSON.stringify(user));
        localStorage.removeItem("omnix-pending-room");
      } catch (error) {
        setCheckingAuth(false);
        setIsLoggedIn(false);
      }
    }
  }, [roomId]);

  // Still checking auth
  if (checkingAuth) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000"
      }}>
        <p style={{ color: "#8A2BE2", fontSize: "18px" }}>Loading...</p>
      </div>
    );
  }

  // Not logged in - show login prompt
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        padding: "20px"
      }}>
        <div style={{
          background: "#121212",
          padding: "40px",
          borderRadius: "16px",
          textAlign: "center",
          maxWidth: "400px",
          border: "1px solid rgba(138, 43, 226, 0.3)"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔮</div>
          <h2 style={{ color: "#FFFFFF", marginBottom: "10px" }}>Join Prediction Room</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "25px", fontSize: "14px" }}>
            Room ID: {roomId}
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "25px", fontSize: "14px" }}>
            Please login first to join this room
          </p>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "15px 40px",
              background: "linear-gradient(135deg, #8A2BE2, #00AEEF)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Login to Join
          </button>
        </div>
      </div>
    );
  }

  // Logged in - show room
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
            cursor: "pointer"
          }}
        >
          ← Back to Home
        </button>

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
          
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "15px"
          }}>
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
                <path d="M15,20 Q20,10 30,20 Q40,30 45,20 Q50,10 55,20 Q50,30 45,20 Q40,10 30,20 Q20,30 15,20 Z" fill="white" opacity="0.95"/>
              </svg>
            </div>
            
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#FFFFFF", margin: "0" }}>
                Prediction Room
              </h1>
              <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "13px", margin: "5px 0 0 0" }}>
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
            <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", margin: "0" }}>
              👤 Joined as: <strong style={{ color: "#8A2BE2" }}>{username}</strong>
              <span style={{ color: "#00E6A3", marginLeft: "15px", fontSize: "12px" }}>
                +10 points earned! 🎯
              </span>
            </p>
          </div>
        </div>

        <div style={{
          background: "#121212",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(138, 43, 226, 0.15)",
          border: "1px solid rgba(138, 43, 226, 0.2)"
        }}>
          <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#FFFFFF", marginBottom: "25px" }}>
            Predictions
          </h2>

          <div style={{
            background: "rgba(138, 43, 226, 0.05)",
            padding: "60px 40px",
            borderRadius: "12px",
            textAlign: "center",
            border: "2px dashed rgba(138, 43, 226, 0.2)"
          }}>
            <span style={{ fontSize: "64px", marginBottom: "20px", display: "block" }}>🔮</span>
            <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "18px", margin: "0" }}>
              Predictions will appear here
            </p>
            <p style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "14px", marginTop: "10px" }}>
              Share this room with friends to start making predictions
            </p>
          </div>

          <button
            onClick={() => {
              const message = `Join my Omnix prediction room!\n\nClick to join:\nhttps://omnix-app.vercel.app/room/${roomId}`;
              const encodedMessage = encodeURIComponent(message);
              window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
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
              boxShadow: "0 4px 15px rgba(37, 211, 102, 0.3)"
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
