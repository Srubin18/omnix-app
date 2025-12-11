export default function HomePage() {
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("omnix-user") || "{}")
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
        Hello {user.username || "user"} – you're now inside the app.
      </p>

      <p style={{ marginTop: "20px" }}>
        This is your home dashboard. Features will load here soon.
      </p>
    </main>
  );
}
