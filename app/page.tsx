"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const userStr = localStorage.getItem("omnix-user");
    if (userStr) {
      // Check for pending room
      const pendingRoom = localStorage.getItem("omnix-pending-room");
      if (pendingRoom) {
        localStorage.removeItem("omnix-pending-room");
        router.push(`/room/${pendingRoom}`);
      } else {
        router.push("/home");
      }
    }
  }, [router]);

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
      router.push(`/room/${pendingRoom}`);
    } else {
      router.push("/home");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", padding: "20px" }}>
      <div style={{ background: "#121212", padding: "40px", borderRadius: "16px", textAlign: "center", maxWidth: "400px", width: "100%", border: "1px solid rgba(138,43,226,0.3)" }}>
        <div style={{ fontSize: "60px", marginBottom: "20px" }}>🔮</div>
        <h1 style={{ color: "#FFF", fontSize: "28px", marginBottom: "10px" }}>Omnix</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "30px", fontSize: "14px" }}>Predict with friends</p>
        
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "16px", marginBottom: "15px", boxSizing: "border-box" }}
          onKeyPress={(e) => e.key === "Enter" && handleLogin()}
        />
        
        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}
        >
          {isLoading ? "Loading..." : "Join Omnix"}
        </button>
      </div>
    </div>
  );
}
