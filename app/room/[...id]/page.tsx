"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Prediction {
  id: string;
  question: string;
  createdAt: string;
  deadline: string;
  responses: PredictionResponse[];
  resolved: boolean;
  correctAnswer?: string;
}

interface PredictionResponse {
  username: string;
  answer: string;
  timestamp: string;
}

interface Room {
  id: string;
  name: string;
  creator: string;
  predictions: Prediction[];
  createdAt: string;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  
  const [roomId, setRoomId] = useState<string>("");
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomNotFound, setRoomNotFound] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(true);
  
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
  const [submittedPredictions, setSubmittedPredictions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{[key: string]: string}>({});

  // Get room ID from params
  useEffect(() => {
    if (params?.id) {
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      setRoomId(id);
    }
  }, [params]);

  // Check auth
  useEffect(() => {
    if (!roomId) return;
    
    const userStr = localStorage.getItem("omnix-user");
    
    if (!userStr) {
      localStorage.setItem("omnix-pending-room", roomId);
      setCheckingAuth(false);
      setIsLoggedIn(false);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUsername(user.username || user.name || "User");
      setIsLoggedIn(true);
      setCheckingAuth(false);
      localStorage.removeItem("omnix-pending-room");
    } catch (error) {
      setCheckingAuth(false);
      setIsLoggedIn(false);
    }
  }, [roomId]);

  // Load room from database
  useEffect(() => {
    if (!roomId || !isLoggedIn) return;

    const loadRoom = async () => {
      try {
        const response = await fetch(`/api/rooms?id=${roomId}`);
        const data = await response.json();
        
        if (response.ok && data.room) {
          const parsedRoom = typeof data.room === "string" ? JSON.parse(data.room) : data.room;
          setRoom(parsedRoom);
          
          const submitted: string[] = [];
          parsedRoom.predictions?.forEach((pred: Prediction) => {
            if (pred.responses?.some((r: PredictionResponse) => r.username === username)) {
              submitted.push(pred.id);
            }
          });
          setSubmittedPredictions(submitted);
        } else {
          setRoomNotFound(true);
        }
      } catch (error) {
        console.error("Error loading room:", error);
        setRoomNotFound(true);
      } finally {
        setLoadingRoom(false);
      }
    };

    loadRoom();
  }, [roomId, isLoggedIn, username]);

  // Update countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      if (!room) return;
      
      const newTimeLeft: {[key: string]: string} = {};
      room.predictions?.forEach(pred => {
        const deadline = new Date(pred.deadline).getTime();
        const now = Date.now();
        const diff = deadline - now;
        
        if (diff <= 0) {
          newTimeLeft[pred.id] = "Expired";
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          newTimeLeft[pred.id] = `${hours}h ${minutes}m ${seconds}s`;
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [room]);

  const submitPrediction = async (predictionId: string) => {
    const answer = userAnswers[predictionId];
    if (!answer?.trim()) {
      alert("Please enter your prediction");
      return;
    }

    if (!room) return;

    setSubmitting(true);

    try {
      const updatedRoom = {
        ...room,
        predictions: room.predictions.map(pred => {
          if (pred.id === predictionId) {
            const responses = pred.responses || [];
            responses.push({
              username,
              answer,
              timestamp: new Date().toISOString()
            });
            return { ...pred, responses };
          }
          return pred;
        })
      };

      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: updatedRoom })
      });

      if (response.ok) {
        setRoom(updatedRoom);
        setSubmittedPredictions([...submittedPredictions, predictionId]);
        setUserAnswers({ ...userAnswers, [predictionId]: "" });
      }
    } catch (error) {
      alert("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (!roomId || checkingAuth || (isLoggedIn && loadingRoom)) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>🔮</div>
          <p style={{ color: "#8A2BE2", fontSize: "18px" }}>Loading room...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", padding: "20px" }}>
        <div style={{ background: "#121212", padding: "40px", borderRadius: "16px", textAlign: "center", maxWidth: "400px", border: "1px solid rgba(138,43,226,0.3)" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔮</div>
          <h2 style={{ color: "#FFF", marginBottom: "10px", fontSize: "22px" }}>Join Prediction Room</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "25px", fontSize: "14px" }}>Login to make your predictions!</p>
          <button 
            onClick={() => router.push("/")} 
            style={{ padding: "15px 40px", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}
          >
            Login to Join
          </button>
        </div>
      </div>
    );
  }

  // Room not found
  if (roomNotFound) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", padding: "20px" }}>
        <div style={{ background: "#121212", padding: "40px", borderRadius: "16px", textAlign: "center", maxWidth: "400px", border: "1px solid rgba(255,45,146,0.3)" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>❌</div>
          <h2 style={{ color: "#FFF", marginBottom: "10px", fontSize: "22px" }}>Room Not Found</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "25px", fontSize: "14px" }}>This room doesn't exist or has expired.</p>
          <button 
            onClick={() => router.push("/home")} 
            style={{ padding: "15px 40px", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Room loaded
  return (
    <div style={{ minHeight: "100vh", background: "#000", padding: "20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingTop: "20px" }}>

        {/* Room Header */}
        <div style={{ background: "#121212", padding: "25px", borderRadius: "16px", marginBottom: "20px", border: "1px solid rgba(138,43,226,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
            <div style={{ width: "55px", height: "55px", borderRadius: "50%", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "28px" }}>🔮</span>
            </div>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#FFF", margin: 0 }}>{room?.name}</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: "4px 0 0 0" }}>by {room?.creator}</p>
            </div>
          </div>
          
          <div style={{ background: "rgba(0,230,163,0.1)", padding: "10px 15px", borderRadius: "8px" }}>
            <p style={{ color: "#00E6A3", fontSize: "13px", margin: 0 }}>👤 Playing as <strong>{username}</strong></p>
          </div>
        </div>

        {/* Predictions */}
        <div style={{ background: "#121212", padding: "25px", borderRadius: "16px", border: "1px solid rgba(138,43,226,0.2)" }}>
          <h2 style={{ color: "#FFF", fontSize: "18px", marginBottom: "20px" }}>🎯 Predictions</h2>

          {room?.predictions?.map((pred, index) => {
            const hasSubmitted = submittedPredictions.includes(pred.id) || pred.responses?.some(r => r.username === username);
            const userResponse = pred.responses?.find(r => r.username === username);
            const isExpired = timeLeft[pred.id] === "Expired";

            return (
              <div key={pred.id} style={{ background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "12px", marginBottom: "15px", border: "1px solid rgba(138,43,226,0.2)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                  <span style={{ background: "rgba(138,43,226,0.2)", color: "#8A2BE2", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "600" }}>
                    {index + 1}
                  </span>
                  <h3 style={{ color: "#FFF", fontSize: "15px", margin: 0, fontWeight: "500" }}>{pred.question}</h3>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <span style={{ background: isExpired ? "rgba(255,45,146,0.1)" : "rgba(255,196,0,0.1)", color: isExpired ? "#FF2D92" : "#FFC400", padding: "5px 12px", borderRadius: "20px", fontSize: "12px" }}>
                    {isExpired ? "⏰ Closed" : `⏳ ${timeLeft[pred.id] || "24h"}`}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginLeft: "10px" }}>
                    👥 {pred.responses?.length || 0} predictions
                  </span>
                </div>

                {userResponse && (
                  <div style={{ background: "rgba(138,43,226,0.1)", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
                    <p style={{ color: "#8A2BE2", fontSize: "14px", margin: 0 }}>Your prediction: <strong>{userResponse.answer}</strong></p>
                  </div>
                )}

                {!hasSubmitted && !isExpired && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      value={userAnswers[pred.id] || ""}
                      onChange={(e) => setUserAnswers({ ...userAnswers, [pred.id]: e.target.value })}
                      placeholder="Your prediction..."
                      style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "14px" }}
                    />
                    <button
                      onClick={() => submitPrediction(pred.id)}
                      disabled={submitting}
                      style={{ padding: "12px 18px", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Submit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => router.push("/home")}
          style={{ marginTop: "20px", width: "100%", padding: "14px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
