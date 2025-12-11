"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem("omnix-user");
    
    if (!userStr) {
      // No user found, redirect to login
      router.push("/");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUsername(user.username || user.name || "User");
      setIsLoading(false);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/");
    }
  }, [router]);

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      alert("Please enter a room name");
      return;
    }

    // Generate simple room ID
    const roomId = Math.random().toString(36).substring(2, 10);
    
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
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <p style={{ color: "white", fontSize: "18px" }}>Loading...</p>
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
        maxWidth: "800px",
        margin: "0 auto",
        paddingTop: "40px"
      }}>
        {/* Header */}
        <div style={{
          background: "white",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          marginBottom: "30px"
        }}>
          <h1 style={{
            fontSize: "36px",
            fontWeight: "bold",
            color: "#333",
            marginBottom: "10px"
          }}>
            Welcome to Omnix, {username}! 🎯
          </h1>
          <p style={{
            color: "#666",
            fontSize: "16px"
          }}>
            Create prediction rooms and share them with your friends
          </p>
        </div>

        {/* Create Room Card */}
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
            Create a Prediction Room
          </h2>

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "10px",
              color: "#333",
              fontWeight: "500",
              fontSize: "14px"
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
                padding: "14px",
                border: "2px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
                boxSizing: "border-box",
                transition: "border-color 0.3s"
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
              onBlur={(e) => e.currentTarget.style.borderColor = "#ddd"}
            />
          </div>

          <button
            onClick={handleCreateRoom}
            style={{
              width: "100%",
              padding: "16px",
              background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "18px",
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
            Share on WhatsApp
          </button>

          <p style={{
            marginTop: "15px",
            fontSize: "13px",
            color: "#888",
            textAlign: "center"
          }}>
            Create a room and share the link with friends via WhatsApp
          </p>
        </div>

        {/* Logout Button */}
        <div style={{
          marginTop: "30px",
          textAlign: "center"
        }}>
          <button
            onClick={() => {
              localStorage.removeItem("omnix-user");
              router.push("/");
            }}
            style={{
              padding: "10px 20px",
              background: "transparent",
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
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "white";
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
