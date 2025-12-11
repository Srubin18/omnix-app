"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    username: ""
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function enterApp() {
    // MVP: No friction login
    localStorage.setItem("omnix-user", JSON.stringify(form));
    router.push("/home");
  }

  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      width: "90%",
      maxWidth: "400px",
      margin: "auto",
      paddingTop: "60px",
      fontFamily: "sans-serif"
    }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", textAlign: "center" }}>
        👋 Welcome to Omnix
      </h1>

      <p style={{ textAlign: "center", opacity: 0.7 }}>
        Community Predictions • Zero friction
      </p>

      <input name="name" placeholder="Your name" onChange={handleChange} />
      <input name="email" placeholder="Email address" onChange={handleChange} />
      <input name="phone" placeholder="Phone number" onChange={handleChange} />
      <input name="username" placeholder="Choose a username" onChange={handleChange} />

      <button
        onClick={enterApp}
        style={{
          background: "black",
          color: "white",
          padding: "14px",
          fontSize: "16px",
          borderRadius: "8px",
          fontWeight: "600",
          cursor: "pointer",
          marginTop: "12px"
        }}
      >
        Enter Omnix 🚀
      </button>
    </main>
  );
}
