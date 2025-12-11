"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    username: ""
  });

  useEffect(() => {
    const userStr = localStorage.getItem("omnix-user");
    if (userStr) {
      const pendingRoom = localStorage.getItem("omnix-pending-room");
      if (pendingRoom) {
        router.push(`/room/${pendingRoom}`);
      } else {
        router.push("/home");
      }
    }
  }, [router]);

  const handleSubmit = () => {
    if (!formData.name || !formData.username) {
      alert("Please enter your name and username");
      return;
    }

    const user = {
      ...formData,
      stats: { totalPredictions: 0, correctPredictions: 0, roomsCreated: 0, roomsJoined: 0, points: 0, level: 1 }
    };
    localStorage.setItem("omnix-user", JSON.stringify(user));

    const pendingRoom = localStorage.getItem("omnix-pending-room");
    if (pendingRoom) {
      router.push(`/room/${pendingRoom}`);
    } else {
      router.push("/home");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#121212", padding: "40px", borderRadius: "16px", width: "100%", maxWidth: "400px", border: "1px solid rgba(138,43,226,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px" }}>
            <span style={{ fontSize: "40px" }}>🎯</span>
          </div>
          <h1 style={{ color: "#FFF", fontSize: "28px", margin: "0 0 5px 0" }}>OMNIX</h1>
          <p style={{ color: "#8A2BE2", fontSize: "14px", margin: 0 }}>predict everything</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input type="text" placeholder="Your Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "15px" }} />
          <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "15px" }} />
          <input type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "15px" }} />
          <input type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} style={{ padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "15px" }} />
          <button onClick={handleSubmit} style={{ marginTop: "10px", padding: "16px", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}>Get Started</button>
        </div>
      </div>
    </div>
  );
}
