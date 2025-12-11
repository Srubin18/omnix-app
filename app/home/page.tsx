"use client";

import React from "react";

export default function HomePage() {
  // Load stored user
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("omnix-user")) || {}
      : {};

  return (
    <main
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
      }}
    >
      <h1>Welcome to Omnix 👋</h1>

      <p style={{ opacity: 0.7 }}>
        Hello {user.username || "user"} — you're now inside the app.
      </p>

      <p style={{ marginTop: "40px" }}>
        This is your home dashboard. Features will load here soon.
      </p>

      <div style={{ marginTop: "60px" }}>
        <h2>Create a Room</h2>

        <input
          id="roomName"
          placeholder="Enter room name (e.g. My Crypto Room)"
          style={{
            padding: "12px",
            fontSize: "16px",
            width: "80%",
            marginTop: "10px",
            border: "1px solid #ccc",
            borderRadius: "6px",
          }}
        />

        <button
          onClick={() => {
            const name = document.getElementById("roomName").value;
            if (!name) return alert("Please enter a room name");

            const roomUrl = `https://omnix-app.vercel.app/room/${encodeURIComponent(
              name
            )}`;

            navigator.clipboard.writeText(roomUrl);
            alert("Room created! Link copied:\n\n" + roomUrl);
          }}
          style={{
            marginTop: "16px",
            padding: "14px",
            background: "black",
            color: "white",
            borderRadius: "6px",
            cursor: "pointer",
            width: "50%",
          }}
        >
          Create Room
        </button>

        <p style={{ marginTop: "20px", fontSize: "14px", opacity: 0.6 }}>
          After creating a room, share your link on WhatsApp.
        </p>
      </div>
    </main>
  );
}
