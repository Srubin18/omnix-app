"use client";

import React from "react";
import { useState, useEffect } from "react";

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

      {/* --- Create Room Section --- */}
      <div style={{ marginTop: "60px" }}>
        <h2>Create a Room</h2>

        <input
          type="text"
          placeholder="Room name"
          style={{
            padding: "12px",
            fontSize: "16px",
            width: "280px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />

        <button
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
    </main>
  );
}
