"use client";

import { useEffect, useState } from "react";

interface Prediction {
  id: string;
  question: string;
  deadline: string;
  responses: any[];
  resolved: boolean;
  correctAnswer?: string;
  pointValue: number;
  answerType?: string;
  options?: string[];
}

interface Room {
  id: string;
  name: string;
  creator: string;
  predictions: Prediction[];
  createdAt: string;
  comments?: any[];
  category?: string;
}

export default function RoomPage() {
  const [roomId, setRoomId] = useState<string>("");
  const [username, setUsername] = useState("");
  const [tempUsername, setTempUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [pageState, setPageState] = useState<"loading" | "not-found" | "login" | "ready">("loading");
  
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
  const [submittedPredictions, setSubmittedPredictions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{[key: string]: string}>({});
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [bonusAwarded, setBonusAwarded] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const parts = path.split("/room/");
    if (parts[1]) {
      setRoomId(parts[1].split("/")[0]);
    } else {
      setPageState("not-found");
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const loadEverything = async () => {
      let currentUser = "";
      const userStr = localStorage.getItem("omnix-user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          currentUser = user.username || "";
          setUsername(currentUser);
          setIsLoggedIn(true);
        } catch (e) {
          setIsLoggedIn(false);
        }
      }

      try {
        const response = await fetch(`/api/rooms?id=${roomId}`);
        const data = await response.json();
        
        if (data.room) {
          const parsedRoom = typeof data.room === "string" ? JSON.parse(data.room) : data.room;
          setRoom(parsedRoom);
          
          if (currentUser && parsedRoom.predictions) {
            const submitted: string[] = [];
            parsedRoom.predictions.forEach((pred: Prediction) => {
              if (pred.responses?.some((r: any) => r.username === currentUser)) {
                submitted.push(pred.id);
              }
            });
            setSubmittedPredictions(submitted);
          }

          if (currentUser) {
            const joinedRooms = JSON.parse(localStorage.getItem("omnix-joined-rooms") || "[]");
            if (!joinedRooms.includes(roomId)) {
              joinedRooms.push(roomId);
              localStorage.setItem("omnix-joined-rooms", JSON.stringify(joinedRooms));
              setBonusAwarded(true);
              fetch("/api/leaderboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: currentUser, points: 10, correct: 0, total: 0 })
              }).catch(() => {});
            }
            setPageState("ready");
          } else {
            setPageState("login");
          }
        } else {
          setPageState("not-found");
        }
      } catch (error) {
        setPageState("not-found");
      }
    };

    const timeout = setTimeout(() => {
      if (pageState === "loading") setPageState("not-found");
    }, 10000);

    loadEverything();
    return () => clearTimeout(timeout);
  }, [roomId]);

  useEffect(() => {
    if (!room) return;
    const interval = setInterval(() => {
      const newTimeLeft: {[key: string]: string} = {};
      room.predictions?.forEach(pred => {
        const diff = new Date(pred.deadline).getTime() - Date.now();
        if (diff <= 0) {
          newTimeLeft[pred.id] = "Expired";
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          newTimeLeft[pred.id] = `${hours}h ${minutes}m`;
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);
    return () => clearInterval(interval);
  }, [room]);

  const handleLogin = () => {
    if (!tempUsername.trim()) return;
    const user = { username: tempUsername.trim(), createdAt: new Date().toISOString(), stats: { points: 10, level: 1, roomsCreated: 0, roomsJoined: 1 } };
    localStorage.setItem("omnix-user", JSON.stringify(user));
    localStorage.setItem("omnix-joined-rooms", JSON.stringify([roomId]));
    fetch("/api/leaderboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: tempUsername.trim(), points: 10, correct: 0, total: 0 }) }).catch(() => {});
    setUsername(tempUsername.trim());
    setIsLoggedIn(true);
    setBonusAwarded(true);
    setPageState("ready");
  };

  const submitPrediction = async (predictionId: string) => {
    const answer = userAnswers[predictionId];
    if (!answer?.trim() || !room) return;
    setSubmitting(true);
    try {
      const updatedRoom = { ...room, predictions: room.predictions.map(pred => pred.id === predictionId ? { ...pred, responses: [...(pred.responses || []), { username, answer, timestamp: new Date().toISOString() }] } : pred) };
      await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ room: updatedRoom }) });
      setRoom(updatedRoom);
      setSubmittedPredictions([...submittedPredictions, predictionId]);
      setUserAnswers({ ...userAnswers, [predictionId]: "" });
      fetch("/api/leaderboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, points: 5, correct: 0, total: 0 }) }).catch(() => {});
    } catch (error) { alert("Failed to submit"); }
    finally { setSubmitting(false); }
  };

  const addComment = async () => {
    if (!newComment.trim() || !room) return;
    const updatedRoom = { ...room, comments: [...(room.comments || []), { username, message: newComment, timestamp: new Date().toISOString() }] };
    try { await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ room: updatedRoom }) }); setRoom(updatedRoom); setNewComment(""); } catch (e) {}
  };

  const shareWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(`🔮 Join my prediction room!\n\n${room?.name}\n\n👉 https://omnix-app.vercel.app/room/${roomId}`)}`, "_blank"); };
  const copyLink = () => { navigator.clipboard.writeText(`https://omnix-app.vercel.app/room/${roomId}`); alert("Link copied!"); };

  if (pageState === "loading") {
    return (<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: "48px", marginBottom: "15px" }}>🔮</div><p style={{ color: "#8A2BE2", fontSize: "18px" }}>Loading...</p></div></div>);
  }

  if (pageState === "not-found") {
    return (<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", padding: "20px" }}><div style={{ background: "#121212", padding: "40px", borderRadius: "16px", textAlign: "center", maxWidth: "400px" }}><div style={{ fontSize: "48px", marginBottom: "20px" }}>❌</div><h2 style={{ color: "#FFF", marginBottom: "10px" }}>Room Not Found</h2><p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "25px" }}>This room doesnt exist or has expired.</p><button onClick={() => window.location.href = "/"} style={{ padding: "15px 40px", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer" }}>Go Home</button></div></div>);
  }

  if (pageState === "login") {
    return (<div style={{ minHeight: "100vh", background: "#000", padding: "20px" }}><div style={{ maxWidth: "500px", margin: "0 auto", paddingTop: "40px" }}><div style={{ background: "#121212", padding: "25px", borderRadius: "16px", marginBottom: "20px", border: "1px solid rgba(138,43,226,0.3)" }}><h1 style={{ fontSize: "22px", color: "#FFF", margin: "0 0 10px 0" }}>🔮 {room?.name}</h1><p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 15px 0" }}>by {room?.creator}</p><p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "10px" }}>🎯 {room?.predictions?.length || 0} Predictions:</p>{room?.predictions?.slice(0, 3).map((pred, i) => (<div key={i} style={{ background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "8px", marginBottom: "8px" }}><p style={{ color: "#FFF", fontSize: "14px", margin: 0 }}>{pred.question}</p><span style={{ color: "#FFC400", fontSize: "12px" }}>🏆 {pred.pointValue} pts</span></div>))}</div><div style={{ background: "#121212", padding: "30px", borderRadius: "16px", textAlign: "center", border: "1px solid rgba(0,230,163,0.3)" }}><div style={{ fontSize: "40px", marginBottom: "15px" }}>🎁</div><h2 style={{ color: "#FFF", marginBottom: "8px", fontSize: "20px" }}>Join & Get +10 Points!</h2><p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "20px", fontSize: "14px" }}>Enter your name to play</p><input type="text" value={tempUsername} onChange={(e) => setTempUsername(e.target.value)} placeholder="Your name" style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "16px", marginBottom: "15px", boxSizing: "border-box", textAlign: "center" }} onKeyPress={(e) => e.key === "Enter" && handleLogin()} autoFocus /><button onClick={handleLogin} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}>Join Room 🚀</button></div></div></div>);
  }

  return (<div style={{ minHeight: "100vh", background: "#000", padding: "20px" }}><div style={{ maxWidth: "600px", margin: "0 auto" }}>{bonusAwarded && (<div style={{ background: "rgba(0,230,163,0.15)", padding: "15px", borderRadius: "12px", marginBottom: "20px", textAlign: "center", border: "1px solid rgba(0,230,163,0.3)" }}><p style={{ color: "#00E6A3", fontSize: "16px", margin: 0, fontWeight: "600" }}>🎉 +10 Bonus Points!</p></div>)}<div style={{ background: "#121212", padding: "25px", borderRadius: "16px", marginBottom: "20px" }}><h1 style={{ fontSize: "22px", color: "#FFF", margin: "0 0 5px 0" }}>🔮 {room?.name}</h1><p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 15px 0" }}>by {room?.creator} • Playing as <strong style={{ color: "#00E6A3" }}>{username}</strong></p><div style={{ display: "flex", gap: "10px" }}><button onClick={shareWhatsApp} style={{ flex: 1, padding: "14px", background: "rgba(37,211,102,0.15)", color: "#25D366", border: "1px solid rgba(37,211,102,0.4)", borderRadius: "10px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>📱 WhatsApp</button><button onClick={copyLink} style={{ flex: 1, padding: "14px", background: "rgba(0,174,239,0.15)", color: "#00AEEF", border: "1px solid rgba(0,174,239,0.4)", borderRadius: "10px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>🔗 Copy Link</button></div></div><div style={{ background: "#121212", padding: "25px", borderRadius: "16px", marginBottom: "20px" }}><h2 style={{ color: "#FFF", fontSize: "18px", marginBottom: "20px" }}>🎯 Predictions</h2>{room?.predictions?.map((pred, index) => { const userResponse = pred.responses?.find(r => r.username === username); const isExpired = timeLeft[pred.id] === "Expired"; const totalResponses = pred.responses?.length || 0; return (<div key={pred.id} style={{ background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "12px", marginBottom: "15px", border: "1px solid rgba(138,43,226,0.2)" }}><div style={{ marginBottom: "12px" }}><h3 style={{ color: "#FFF", fontSize: "15px", margin: "0 0 8px 0" }}>{index + 1}. {pred.question}</h3><div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}><span style={{ background: "rgba(255,196,0,0.15)", color: "#FFC400", padding: "4px 10px", borderRadius: "12px", fontSize: "12px" }}>🏆 {pred.pointValue} pts</span><span style={{ background: isExpired ? "rgba(255,45,146,0.1)" : "rgba(0,230,163,0.1)", color: isExpired ? "#FF2D92" : "#00E6A3", padding: "4px 10px", borderRadius: "12px", fontSize: "12px" }}>{isExpired ? "⏰ Closed" : `⏳ ${timeLeft[pred.id] || "..."}`}</span><span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", padding: "4px 0" }}>👥 {totalResponses}</span></div></div>{userResponse ? (<div style={{ background: "rgba(138,43,226,0.1)", padding: "12px", borderRadius: "8px" }}><p style={{ color: "#8A2BE2", fontSize: "14px", margin: 0 }}>✅ Your prediction: <strong>{userResponse.answer}</strong></p></div>) : isExpired ? (<p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>⏰ Closed</p>) : (<div>{pred.answerType === "yesno" ? (<div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}><button onClick={() => setUserAnswers({ ...userAnswers, [pred.id]: "Yes" })} style={{ flex: 1, padding: "12px", background: userAnswers[pred.id] === "Yes" ? "rgba(0,230,163,0.3)" : "rgba(0,230,163,0.1)", color: "#00E6A3", border: "1px solid rgba(0,230,163,0.3)", borderRadius: "8px", fontSize: "15px", cursor: "pointer" }}>👍 Yes</button><button onClick={() => setUserAnswers({ ...userAnswers, [pred.id]: "No" })} style={{ flex: 1, padding: "12px", background: userAnswers[pred.id] === "No" ? "rgba(255,45,146,0.3)" : "rgba(255,45,146,0.1)", color: "#FF2D92", border: "1px solid rgba(255,45,146,0.3)", borderRadius: "8px", fontSize: "15px", cursor: "pointer" }}>👎 No</button></div>) : pred.answerType === "multiple" && pred.options ? (<div style={{ marginBottom: "10px" }}>{pred.options.map((opt, i) => (<button key={i} onClick={() => setUserAnswers({ ...userAnswers, [pred.id]: opt })} style={{ width: "100%", padding: "12px", marginBottom: "8px", background: userAnswers[pred.id] === opt ? "rgba(138,43,226,0.3)" : "rgba(138,43,226,0.1)", color: "#FFF", border: "1px solid rgba(138,43,226,0.3)", borderRadius: "8px", fontSize: "14px", cursor: "pointer", textAlign: "left" }}>{opt}</button>))}</div>) : (<input type="text" value={userAnswers[pred.id] || ""} onChange={(e) => setUserAnswers({ ...userAnswers, [pred.id]: e.target.value })} placeholder="Your prediction..." style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "14px", marginBottom: "10px", boxSizing: "border-box" }} />)}<button onClick={() => submitPrediction(pred.id)} disabled={submitting || !userAnswers[pred.id]} style={{ width: "100%", padding: "12px", background: userAnswers[pred.id] ? "linear-gradient(135deg, #8A2BE2, #00AEEF)" : "rgba(255,255,255,0.1)", color: userAnswers[pred.id] ? "#FFF" : "rgba(255,255,255,0.3)", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: userAnswers[pred.id] ? "pointer" : "not-allowed" }}>{submitting ? "..." : "Submit"}</button></div>)}</div>); })}</div><div style={{ background: "#121212", padding: "20px", borderRadius: "16px", marginBottom: "20px" }}><div onClick={() => setShowComments(!showComments)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between" }}><h2 style={{ color: "#FFF", fontSize: "16px", margin: 0 }}>💬 Chat ({room?.comments?.length || 0})</h2><span style={{ color: "#8A2BE2" }}>{showComments ? "▼" : "▶"}</span></div>{showComments && (<div style={{ marginTop: "15px" }}><div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}><input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Say something..." style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "14px" }} onKeyPress={(e) => e.key === "Enter" && addComment()} /><button onClick={addComment} style={{ padding: "10px 15px", background: "rgba(138,43,226,0.2)", color: "#8A2BE2", border: "none", borderRadius: "8px", cursor: "pointer" }}>Send</button></div>{room?.comments?.slice().reverse().map((c, i) => (<div key={i} style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px", marginBottom: "8px" }}><span style={{ color: "#8A2BE2", fontSize: "12px" }}>{c.username}</span><p style={{ color: "#FFF", fontSize: "13px", margin: "4px 0 0 0" }}>{c.message}</p></div>))}</div>)}</div><button onClick={() => window.location.href = "/home"} style={{ width: "100%", padding: "14px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", cursor: "pointer" }}>← Home</button></div></div>);
}
