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

      <input name="username" placeholder="Username" onChange={handleChange} />
      <input name="email" placeholder="Email" onChange={handleChange} />
      <input name="phone" placeholder="Phone" onChange={handleChange} />

      <button
        style={{ marginTop: "20px", padding: "10px", fontSize: "18px" }}
        onClick={enterApp}
      >
        Enter
      </button>
    </main>
  );
}
