"use client";

import { useState, useEffect } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already logged in
    const userStr = localStorage.getItem("omnix-user");
    if (userStr) {
      // Already logged in, redirect to home
      window.location.href = "/home";
    } else {
      setChecking(false);
    }
  }, []);

  const handleLogin = () => {
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }

    setIsLoading(true);

    const user = {
      username: username.trim(),
      createdAt: new Date().toISOString(),
      stats: { points: 0, level: 1, roomsCreated: 0, roomsJoined: 0 }
    };

    localStorage.setItem("omnix-user", JSON.stringify(user));

    // Check for pending room
    const pendingRoom = localStorage.getItem("omnix-pending-room");
    if (pendingRoom) {
      localStorage.removeItem("omnix-pending-room");
      window.location.href = `/room/${pendingRoom}`;
    } else {
      window.location.href = "/home";
    }
  };

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>🔮</div>
          <p style={{ color: "#8A2BE2", fontSize: "18px" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", padding: "20px" }}>
      <div style={{ background: "#121212", padding: "40px", borderRadius: "16px", textAlign: "center", maxWidth: "400px", width: "100%", border: "1px solid rgba(138,43,226,0.3)" }}>
        <div style={{ fontSize: "60px", marginBottom: "20px" }}>🔮</div>
        <h1 style={{ color: "#FFF", fontSize: "28px", marginBottom: "10px" }}>Omnix</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "30px", fontSize: "14px" }}>Predict with friends • Earn points • Compete!</p>
        
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="👤 Enter your name"
          style={{ 
            width: "100%", 
            padding: "15px", 
            borderRadius: "8px", 
            border: "1px solid rgba(255,255,255,0.1)", 
            background: "rgba(255,255,255,0.05)", 
            color: "#FFF", 
            fontSize: "16px", 
            marginBottom: "15px", 
            boxSizing: "border-box",
            textAlign: "center"
          }}
          onKeyPress={(e) => e.key === "Enter" && handleLogin()}
          autoFocus
        />
        
        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={{ 
            width: "100%", 
            padding: "15px", 
            background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", 
            color: "#FFF", 
            border: "none", 
            borderRadius: "8px", 
            fontSize: "16px", 
            fontWeight: "600", 
            cursor: "pointer" 
          }}
        >
          {isLoading ? "Loading..." : "Join Omnix 🚀"}
        </button>

        <div style={{ marginTop: "25px", padding: "15px", background: "rgba(0,230,163,0.1)", borderRadius: "8px" }}>
          <p style={{ color: "#00E6A3", fontSize: "13px", margin: 0 }}>
            🎯 Create prediction rooms<br/>
            🏆 Compete with friends<br/>
            📊 Climb the leaderboard
          </p>
        </div>
      </div>
    </div>
  );
}
