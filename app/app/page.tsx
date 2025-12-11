"use client";

import React, { useState, useEffect } from "react";

export default function HomePage() {
  const [roomName, setRoomName] = useState("");

  // Load stored user
  const user =
    typeof window !== "undefined"
     JSON.parse(localStorage.getItem("omnix-user") || "{}")
      : {};

  // Create room handler (temporary)
  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      alert("Please enter a room name.");
      return;
    }

    // Generate a simple mock room ID
    const roomId = Math.random().toString(36).substring(2, 8);

    // WhatsApp message
  const whatsappMsg = `Join my Omnix prediction room: *${roomName}*\n\nClick to join:\nhttps://omnix-app.vercel.app/room/${roomId}`;


    const url = "https://wa.me/?text=" + encodeURIComponent(whatsappMsg);

    window.location.href = url;
  };

  return (
    <main
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "32px", fontWeight: 700 }}>
        Welcome to Omnix 👋
      </h1>

      <p style={{ opacity: 0.7, marginBottom: "30px" }}>
        Hello {user.username || "user"} — you're now inside the app.
      </p>

      {/* Room creation UI */}
      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          display: "inline-block",
          width: "300px",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>Create a Room</h2>

        <input
          type="text"
          placeholder="Room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          style={{
            padding: "12px",
            fontSize: "16px",
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={handleCreateRoom}
          style={{
            marginTop: "16px",
            padding: "12px 24px",
            background: "black",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
            width: "100%",
          }}
        >
          Create Room & Share on WhatsApp
        </button>
      </div>
    </main>
  );
}
