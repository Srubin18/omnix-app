"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function enterApp() {
    // No friction login
    localStorage.setItem("omnix-user", JSON.stringify(form));
    router.push("/home");
  }

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "90%",
        maxWidth: "400px",
        margin: "auto",
        paddingTop: "60px",
      }}
    >
      <h1>Login to Omnix</h1>

      <input
        name="username"
        placeholder="Enter username"
        onChange={handleChange}
        style={{ padding: "12px", fontSize: "16px" }}
      />

      <button
        onClick={enterApp}
        style={{
          padding: "12px",
          background: "black",
          color: "white",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Enter
      </button>
    </main>
  );
}
