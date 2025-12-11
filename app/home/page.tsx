"use client";

import React, { useState, useEffect } from "react";

export default function HomePage() {
  // Load stored user
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("omnix-user")) || {}
      : {};

  // Room states
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");

  // Load stored rooms on page load
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("omnix-rooms") || "[]");
    setRooms(saved);
  }, []);

  const saveRooms = (newRooms) => {
    setRooms(newRooms);
    localStorage.setItem("omnix-rooms", JSON.stringify(newRooms));
  };

  // Create room
  const createRoom = () => {
    if (!roomName.trim()) return;

    const id = Date.now(); // unique room ID

    const newRoom = {
      id,
      name: roomName,
      link: ⁠ https://omnix-app.vercel.app/room/${id} ⁠,
    };

    const updated = [...rooms, newRoom];
    saveRooms(updated);
    setRoomName("");
  };

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

      {/* --- Create Room Section --- */}
      <div style={{ marginTop: "60px" }}>
        <h2>Create a Room</h2>

        <input
          type="text"
          placeholder="Room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          style={{
            padding: "12px",
            fontSize: "16px",
            width: "280px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={createRoom}
          style={{
            marginTop: "16px",
            padding: "12px 24px",
            background: "black",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Create Room
        </button>
      </div>

      {/* --- Rooms List --- */}
      <div style={{ marginTop: "60px" }}>
        <h2>Your Rooms</h2>

        {rooms.length === 0 && (
          <p style={{ opacity: 0.6 }}>No rooms yet. Create one above.</p>
        )}

        {rooms.map((room) => (
          <div
            key={room.id}
            style={{
              margin: "20px auto",
              padding: "20px",
              width: "320px",
              borderRadius: "8px",
              background: "#f8f8f8",
              textAlign: "left",
            }}
          >
            <h3>{room.name}</h3>
            <p style={{ fontSize: "14px", wordBreak: "break-all" }}>
              {room.link}
            </p>

            <a
              href={`https://wa.me/?text=Join my Omnix room: ${encodeURIComponent(
                room.link
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                marginTop: "10px",
                padding: "10px 20px",
                background: "#25D366",
                color: "white",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Share on WhatsApp
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
