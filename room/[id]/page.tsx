"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
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
      
      // Clear pending room if exists
      localStorage.removeItem("omnix-pending-room");
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/");
    }
  }, [roomId, router]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <p style={{ color: "white", fontSize: "18px" }}>Loading room...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
            background: "rgba(255,255,255,0.2)",
            color: "white",
            border: "2px solid white",
            borderRadius: "6px",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.3s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.color = "#667eea";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.2)";
            e.currentTarget.style.color = "white";
          }}
        >
          ← Back to Home
        </button>

        {/* Room Header */}
        <div style={{
          background: "white",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          marginBottom: "30px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            marginBottom: "15px"
          }}>
            <span style={{ fontSize: "48px" }}>🎯</span>
            <div>
              <h1 style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "#333",
                margin: "0"
              }}>
                Prediction Room
              </h1>
              <p style={{
                color: "#888",
                fontSize: "14px",
                margin: "5px 0 0 0"
              }}>
                Room ID: {roomId}
              </p>
            </div>
          </div>
          
          <div style={{
            background: "#f8f9fa",
            padding: "15px",
            borderRadius: "8px",
            marginTop: "20px"
          }}>
            <p style={{
              color: "#666",
              fontSize: "14px",
              margin: "0"
            }}>
              👤 Joined as: <strong style={{ color: "#333" }}>{username}</strong>
            </p>
          </div>
        </div>

        {/* Predictions Section */}
        <div style={{
          background: "white",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#333",
            marginBottom: "20px"
          }}>
            Predictions
          </h2>

          <div style={{
            background: "#f8f9fa",
            padding: "60px 40px",
            borderRadius: "8px",
            textAlign: "center",
            border: "2px dashed #ddd"
          }}>
            <span style={{ fontSize: "64px", marginBottom: "20px", display: "block" }}>
              🔮
            </span>
            <p style={{
              color: "#888",
              fontSize: "18px",
              margin: "0"
            }}>
              Predictions will appear here
            </p>
            <p style={{
              color: "#aaa",
              fontSize: "14px",
              marginTop: "10px"
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
              padding: "14px",
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
              transition: "transform 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <span>📱</span>
            Share This Room on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
