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
  pointValue: number;
  winners?: string[];
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
  const [showStats, setShowStats] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (params?.id) {
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      setRoomId(id);
    }
  }, [params]);

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

        // Add participation points
        await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, points: 5, correct: 0, total: 0 })
        });
      }
    } catch (error) {
      alert("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getResponseStats = (responses: PredictionResponse[]) => {
    const stats: {[key: string]: number} = {};
    responses.forEach(r => {
      const answer = r.answer.toLowerCase().trim();
      stats[answer] = (stats[answer] || 0) + 1;
    });
    return stats;
  };

  const refreshRoom = async () => {
    if (!roomId) return;
    setLoadingRoom(true);
    try {
      const response = await fetch(`/api/rooms?id=${roomId}`);
      const data = await response.json();
      if (response.ok && data.room) {
        const parsedRoom = typeof data.room === "string" ? JSON.parse(data.room) : data.room;
        setRoom(parsedRoom);
      }
    } catch (error) {
      console.error("Error refreshing room:", error);
    } finally {
      setLoadingRoom(false);
    }
  };

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
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ background: "rgba(0,230,163,0.1)", padding: "10px 15px", borderRadius: "8px" }}>
              <p style={{ color: "#00E6A3", fontSize: "13px", margin: 0 }}>👤 Playing as <strong>{username}</strong></p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={refreshRoom}
                style={{ padding: "8px 12px", background: "rgba(0,174,239,0.1)", color: "#00AEEF", border: "1px solid rgba(0,174,239,0.3)", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => router.push("/leaderboard")}
                style={{ padding: "8px 12px", background: "rgba(138,43,226,0.1)", color: "#8A2BE2", border: "1px solid rgba(138,43,226,0.3)", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
              >
                🏆 Leaderboard
              </button>
            </div>
          </div>
        </div>

        {/* Predictions */}
        <div style={{ background: "#121212", padding: "25px", borderRadius: "16px", border: "1px solid rgba(138,43,226,0.2)" }}>
          <h2 style={{ color: "#FFF", fontSize: "18px", marginBottom: "20px" }}>🎯 Predictions</h2>

          {room?.predictions?.map((pred, index) => {
            const hasSubmitted = submittedPredictions.includes(pred.id) || pred.responses?.some(r => r.username === username);
            const userResponse = pred.responses?.find(r => r.username === username);
            const isExpired = timeLeft[pred.id] === "Expired";
            const totalResponses = pred.responses?.length || 0;
            const responseStats = getResponseStats(pred.responses || []);
            const isWinner = pred.resolved && pred.winners?.includes(username);
            const isLoser = pred.resolved && userResponse && !pred.winners?.includes(username);

            return (
              <div key={pred.id} style={{ background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "12px", marginBottom: "15px", border: isWinner ? "2px solid rgba(0,230,163,0.5)" : isLoser ? "1px solid rgba(255,45,146,0.3)" : "1px solid rgba(138,43,226,0.2)" }}>
                
                {/* Question and Points */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                  <span style={{ background: "rgba(138,43,226,0.2)", color: "#8A2BE2", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "600", flexShrink: 0 }}>
                    {index + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: "#FFF", fontSize: "15px", margin: "0 0 8px 0", fontWeight: "500" }}>{pred.question}</h3>
                    <span style={{ background: "rgba(255,196,0,0.15)", color: "#FFC400", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
                      🏆 {pred.pointValue || 50} points to win!
                    </span>
                  </div>
                </div>

                {/* Status badges */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                  {pred.resolved ? (
                    <span style={{ background: "rgba(0,230,163,0.1)", color: "#00E6A3", padding: "5px 12px", borderRadius: "20px", fontSize: "12px" }}>
                      ✅ Answer: {pred.correctAnswer}
                    </span>
                  ) : (
                    <span style={{ background: isExpired ? "rgba(255,45,146,0.1)" : "rgba(255,196,0,0.1)", color: isExpired ? "#FF2D92" : "#FFC400", padding: "5px 12px", borderRadius: "20px", fontSize: "12px" }}>
                      {isExpired ? "⏰ Closed" : `⏳ ${timeLeft[pred.id] || "24h"}`}
                    </span>
                  )}
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                    👥 {totalResponses} prediction{totalResponses !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Winners announcement */}
                {pred.resolved && pred.winners && pred.winners.length > 0 && (
                  <div style={{ background: "rgba(0,230,163,0.15)", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
                    <p style={{ color: "#00E6A3", fontSize: "14px", margin: 0, fontWeight: "600" }}>
                      🎉 Winners: {pred.winners.join(", ")} (+{pred.pointValue || 50} pts each!)
                    </p>
                  </div>
                )}

                {pred.resolved && (!pred.winners || pred.winners.length === 0) && (
                  <div style={{ background: "rgba(255,196,0,0.1)", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
                    <p style={{ color: "#FFC400", fontSize: "13px", margin: 0 }}>
                      😔 No winners this round
                    </p>
                  </div>
                )}

                {/* Response Stats - visible to all */}
                {totalResponses > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <div 
                      onClick={() => setShowStats({ ...showStats, [pred.id]: !showStats[pred.id] })}
                      style={{ cursor: "pointer", color: "#00AEEF", fontSize: "12px", marginBottom: "8px" }}
                    >
                      {showStats[pred.id] ? "▼ Hide stats" : "▶ Show live stats"}
                    </div>
                    
                    {showStats[pred.id] && (
                      <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "8px" }}>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", margin: "0 0 8px 0" }}>Current predictions:</p>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {Object.entries(responseStats).map(([answer, count]) => {
                            const percentage = Math.round((count / totalResponses) * 100);
                            const isCorrectAnswer = pred.resolved && answer === pred.correctAnswer?.toLowerCase().trim();
                            return (
                              <div key={answer} style={{ background: isCorrectAnswer ? "rgba(0,230,163,0.15)" : "rgba(138,43,226,0.15)", padding: "8px 12px", borderRadius: "8px", minWidth: "80px", border: isCorrectAnswer ? "1px solid rgba(0,230,163,0.3)" : "none" }}>
                                <p style={{ color: isCorrectAnswer ? "#00E6A3" : "#8A2BE2", fontSize: "13px", fontWeight: "600", margin: 0 }}>{answer} {isCorrectAnswer && "✅"}</p>
                                <p style={{ color: "#FFF", fontSize: "16px", fontWeight: "700", margin: "4px 0 0 0" }}>{percentage}%</p>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", margin: "2px 0 0 0" }}>{count} vote{count !== 1 ? "s" : ""}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* User's prediction */}
                {userResponse && (
                  <div style={{ background: isWinner ? "rgba(0,230,163,0.15)" : isLoser ? "rgba(255,45,146,0.1)" : "rgba(138,43,226,0.1)", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
                    <p style={{ color: isWinner ? "#00E6A3" : isLoser ? "#FF2D92" : "#8A2BE2", fontSize: "14px", margin: 0 }}>
                      Your prediction: <strong>{userResponse.answer}</strong>
                      {isWinner && ` 🎉 You won +${pred.pointValue || 50} pts!`}
                      {isLoser && " ❌ Better luck next time!"}
                    </p>
                  </div>
                )}

                {/* Submit prediction */}
                {!hasSubmitted && !isExpired && !pred.resolved && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      value={userAnswers[pred.id] || ""}
                      onChange={(e) => setUserAnswers({ ...userAnswers, [pred.id]: e.target.value })}
                      placeholder="Enter your prediction..."
                      style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "14px" }}
                    />
                    <button
                      onClick={() => submitPrediction(pred.id)}
                      disabled={submitting}
                      style={{ padding: "12px 18px", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                    >
                      {submitting ? "..." : "Submit"}
                    </button>
                  </div>
                )}

                {isExpired && !userResponse && !pred.resolved && (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0, fontStyle: "italic" }}>
                    ⏰ Prediction closed - you missed it!
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Share button */}
        <button
          onClick={() => {
            const message = `🔮 Join us on Omnix!\n\n📝 *${room?.name}*\n\n👉 Click to predict:\nhttps://omnix-app.vercel.app/room/${roomId}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
          }}
          style={{ marginTop: "20px", width: "100%", padding: "16px", background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "10px", fontSize: "15px", fontWeight: "600", cursor: "pointer" }}
        >
          📱 Invite More Friends
        </button>

        <button
          onClick={() => router.push("/home")}
          style={{ marginTop: "10px", width: "100%", padding: "14px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
