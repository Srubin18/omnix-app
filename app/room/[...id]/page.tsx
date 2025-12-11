"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Prediction {
  id: string;
  question: string;
  createdAt: string;
  deadline: string;
  predictions: UserPrediction[];
  resolved: boolean;
  correctAnswer?: string;
}

interface UserPrediction {
  username: string;
  answer: string;
  timestamp: string;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = Array.isArray(params?.id) ? params.id[0] : params?.id || "unknown";
  
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const userStr = localStorage.getItem("omnix-user");
    
    if (!userStr) {
      localStorage.setItem("omnix-pending-room", roomId);
      setCheckingAuth(false);
      setIsLoggedIn(false);
    } else {
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username || user.name || "User");
        setIsLoggedIn(true);
        setCheckingAuth(false);
        
        const roomData = localStorage.getItem(`omnix-room-${roomId}`);
        if (roomData) {
          const room = JSON.parse(roomData);
          setIsCreator(room.creator === user.username);
          setPredictions(room.predictions || []);
        } else {
          const newRoom = {
            id: roomId,
            creator: user.username,
            predictions: [],
            createdAt: new Date().toISOString()
          };
          localStorage.setItem(`omnix-room-${roomId}`, JSON.stringify(newRoom));
          setIsCreator(true);
        }
        
        if (!user.stats) {
          user.stats = { totalPredictions: 0, correctPredictions: 0, roomsCreated: 0, roomsJoined: 1, points: 10, level: 1 };
        } else {
          user.stats.points = (user.stats.points || 0) + 10;
          user.stats.roomsJoined = (user.stats.roomsJoined || 0) + 1;
          user.stats.level = Math.floor(user.stats.points / 100) + 1;
        }
        localStorage.setItem("omnix-user", JSON.stringify(user));
        localStorage.removeItem("omnix-pending-room");
      } catch (error) {
        setCheckingAuth(false);
        setIsLoggedIn(false);
      }
    }
  }, [roomId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft: {[key: string]: string} = {};
      predictions.forEach(pred => {
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
  }, [predictions]);

  const createPrediction = () => {
    if (!newQuestion.trim()) {
      alert("Please enter a prediction question");
      return;
    }

    const prediction: Prediction = {
      id: Math.random().toString(36).substring(2, 10),
      question: newQuestion,
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      predictions: [],
      resolved: false
    };

    const updatedPredictions = [...predictions, prediction];
    setPredictions(updatedPredictions);
    
    const roomData = localStorage.getItem(`omnix-room-${roomId}`);
    if (roomData) {
      const room = JSON.parse(roomData);
      room.predictions = updatedPredictions;
      localStorage.setItem(`omnix-room-${roomId}`, JSON.stringify(room));
    }

    setNewQuestion("");
    setShowCreateForm(false);

    const userStr = localStorage.getItem("omnix-user");
    if (userStr) {
      const user = JSON.parse(userStr);
      user.stats.points = (user.stats.points || 0) + 15;
      localStorage.setItem("omnix-user", JSON.stringify(user));
    }
  };

  const submitPrediction = (predictionId: string) => {
    if (!userAnswer.trim()) {
      alert("Please enter your prediction");
      return;
    }

    const updatedPredictions = predictions.map(pred => {
      if (pred.id === predictionId) {
        const existingIndex = pred.predictions.findIndex(p => p.username === username);
        if (existingIndex >= 0) {
          pred.predictions[existingIndex].answer = userAnswer;
        } else {
          pred.predictions.push({
            username,
            answer: userAnswer,
            timestamp: new Date().toISOString()
          });
        }
      }
      return pred;
    });

    setPredictions(updatedPredictions);
    
    const roomData = localStorage.getItem(`omnix-room-${roomId}`);
    if (roomData) {
      const room = JSON.parse(roomData);
      room.predictions = updatedPredictions;
      localStorage.setItem(`omnix-room-${roomId}`, JSON.stringify(room));
    }

    const userStr = localStorage.getItem("omnix-user");
    if (userStr) {
      const user = JSON.parse(userStr);
      user.stats.totalPredictions = (user.stats.totalPredictions || 0) + 1;
      user.stats.points = (user.stats.points || 0) + 5;
      localStorage.setItem("omnix-user", JSON.stringify(user));
    }

    setUserAnswer("");
    setSelectedPrediction(null);
  };

  const resolvePrediction = (predictionId: string, correctAnswer: string) => {
    const updatedPredictions = predictions.map(pred => {
      if (pred.id === predictionId) {
        pred.resolved = true;
        pred.correctAnswer = correctAnswer;
        
        pred.predictions.forEach(p => {
          if (p.answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
            const userStr = localStorage.getItem("omnix-user");
            if (userStr) {
              const user = JSON.parse(userStr);
              if (user.username === p.username) {
                user.stats.correctPredictions = (user.stats.correctPredictions || 0) + 1;
                user.stats.points = (user.stats.points || 0) + 50;
                localStorage.setItem("omnix-user", JSON.stringify(user));
              }
            }
          }
        });
      }
      return pred;
    });

    setPredictions(updatedPredictions);
    
    const roomData = localStorage.getItem(`omnix-room-${roomId}`);
    if (roomData) {
      const room = JSON.parse(roomData);
      room.predictions = updatedPredictions;
      localStorage.setItem(`omnix-room-${roomId}`, JSON.stringify(room));
    }
  };

  const sendReminder = (prediction: Prediction) => {
    const message = `⏰ REMINDER: Prediction closing soon!\n\n🔮 "${prediction.question}"\n\n⏳ Time left: ${timeLeft[prediction.id]}\n\nMake your prediction now:\nhttps://omnix-app.vercel.app/room/${roomId}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const resolveWithAI = async (prediction: Prediction) => {
    const confirmed = confirm(`🤖 Use AI to find the answer for:\n\n"${prediction.question}"\n\nThis works best for sports results, elections, awards, and real-world events.\n\nContinue?`);
    
    if (!confirmed) return;

    setAiLoading(true);

    try {
      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prediction.question })
      });

      if (!response.ok) throw new Error("Failed to get answer");

      const data = await response.json();
      
      setAiLoading(false);

      if (data.answer) {
        const useAnswer = confirm(`🤖 AI Found:\n\n"${data.answer}"\n\nSource: ${data.source || "Web search"}\n\nUse this as the correct answer?`);
        if (useAnswer) {
          resolvePrediction(prediction.id, data.answer);
        }
      } else {
        alert("❌ Couldn't find a definitive answer. Please resolve manually.");
      }
    } catch (error) {
      setAiLoading(false);
      alert("❌ AI search failed. Please resolve manually or try again.");
    }
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <p style={{ color: "#8A2BE2", fontSize: "18px" }}>Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", padding: "20px" }}>
        <div style={{ background: "#121212", padding: "40px", borderRadius: "16px", textAlign: "center", maxWidth: "400px", border: "1px solid rgba(138,43,226,0.3)" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔮</div>
          <h2 style={{ color: "#FFF", marginBottom: "10px" }}>Join Prediction Room</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "15px", fontSize: "14px" }}>Room ID: {roomId}</p>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "25px", fontSize: "14px" }}>Please login first to join this room</p>
          <button onClick={() => router.push("/")} style={{ padding: "15px 40px", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}>
            Login to Join
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", padding: "20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", paddingTop: "20px" }}>
        
        {/* AI Loading Overlay */}
        {aiLoading && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "#121212", padding: "40px", borderRadius: "16px", textAlign: "center", border: "1px solid rgba(138,43,226,0.3)" }}>
              <div style={{ fontSize: "48px", marginBottom: "15px", animation: "pulse 1.5s infinite" }}>🤖</div>
              <p style={{ color: "#8A2BE2", fontSize: "16px", margin: 0 }}>Searching for answer...</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginTop: "10px" }}>This may take a moment</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <button onClick={() => router.push("/home")} style={{ padding: "10px 20px", background: "rgba(138,43,226,0.1)", color: "#8A2BE2", border: "1px solid rgba(138,43,226,0.3)", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>
            ← Back to Home
          </button>
          {isCreator && (
            <span style={{ background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", color: "#FFF", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
              👑 Room Creator
            </span>
          )}
        </div>

        {/* Room Info Card */}
        <div style={{ background: "#121212", padding: "30px", borderRadius: "16px", marginBottom: "20px", border: "1px solid rgba(138,43,226,0.2)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #8A2BE2, #00AEEF, #8A2BE2)" }} />
          
          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "30px" }}>🔮</span>
            </div>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#FFF", margin: 0 }}>Prediction Room</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "5px 0 0 0" }}>Room ID: {roomId}</p>
            </div>
          </div>
          
          <div style={{ background: "rgba(138,43,226,0.1)", padding: "12px 15px", borderRadius: "8px", border: "1px solid rgba(138,43,226,0.2)" }}>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", margin: 0 }}>
              👤 Joined as: <strong style={{ color: "#8A2BE2" }}>{username}</strong>
              <span style={{ color: "#00E6A3", marginLeft: "15px", fontSize: "12px" }}>+10 points earned! 🎯</span>
            </p>
          </div>
        </div>

        {/* Create Prediction Button (Creator Only) */}
        {isCreator && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            style={{ width: "100%", padding: "18px", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: "pointer", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
          >
            <span style={{ fontSize: "20px" }}>✨</span>
            Create New Prediction
          </button>
        )}

        {/* Create Prediction Form */}
        {showCreateForm && (
          <div style={{ background: "#121212", padding: "25px", borderRadius: "16px", marginBottom: "20px", border: "1px solid rgba(138,43,226,0.3)" }}>
            <h3 style={{ color: "#FFF", marginBottom: "15px", fontSize: "18px" }}>📝 Create a Prediction</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginBottom: "15px" }}>
              Earn <span style={{ color: "#00E6A3" }}>+15 points</span> • Closes in 24 hours
            </p>
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="e.g., 'Who will win the Champions League final?'"
              style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "15px", boxSizing: "border-box", marginBottom: "15px" }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={createPrediction} style={{ flex: 1, padding: "14px", background: "linear-gradient(135deg, #00E6A3, #00B386)", color: "#000", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer" }}>
                Create Prediction
              </button>
              <button onClick={() => setShowCreateForm(false)} style={{ padding: "14px 20px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", fontSize: "15px", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Predictions List */}
        <div style={{ background: "#121212", padding: "25px", borderRadius: "16px", border: "1px solid rgba(138,43,226,0.2)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#FFF", marginBottom: "20px" }}>
            🔮 Predictions ({predictions.length})
          </h2>

          {predictions.length === 0 ? (
            <div style={{ background: "rgba(138,43,226,0.05)", padding: "50px 30px", borderRadius: "12px", textAlign: "center", border: "2px dashed rgba(138,43,226,0.2)" }}>
              <span style={{ fontSize: "50px", display: "block", marginBottom: "15px" }}>🔮</span>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", margin: 0 }}>No predictions yet</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginTop: "8px" }}>
                {isCreator ? "Create your first prediction above!" : "Waiting for room creator to add predictions..."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {predictions.map(pred => {
                const isExpired = timeLeft[pred.id] === "Expired";
                const userPredicted = pred.predictions.some(p => p.username === username);
                const userPrediction = pred.predictions.find(p => p.username === username);
                
                return (
                  <div key={pred.id} style={{ background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "12px", border: pred.resolved ? "1px solid rgba(0,230,163,0.3)" : isExpired ? "1px solid rgba(255,45,146,0.3)" : "1px solid rgba(138,43,226,0.2)" }}>
                    
                    <h3 style={{ color: "#FFF", fontSize: "16px", margin: "0 0 10px 0", fontWeight: "600" }}>{pred.question}</h3>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px", flexWrap: "wrap" }}>
                      {pred.resolved ? (
                        <span style={{ background: "rgba(0,230,163,0.1)", color: "#00E6A3", padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>✅ Resolved</span>
                      ) : isExpired ? (
                        <span style={{ background: "rgba(255,45,146,0.1)", color: "#FF2D92", padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>⏰ Expired</span>
                      ) : (
                        <span style={{ background: "rgba(255,196,0,0.1)", color: "#FFC400", padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>⏳ {timeLeft[pred.id] || "Loading..."}</span>
                      )}
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>👥 {pred.predictions.length} prediction{pred.predictions.length !== 1 ? "s" : ""}</span>
                    </div>

                    {pred.resolved && (
                      <div style={{ background: "rgba(0,230,163,0.1)", padding: "12px 15px", borderRadius: "8px", marginBottom: "15px" }}>
                        <p style={{ color: "#00E6A3", fontSize: "14px", margin: 0 }}>🏆 Correct Answer: <strong>{pred.correctAnswer}</strong></p>
                      </div>
                    )}

                    {userPredicted && (
                      <div style={{ background: "rgba(138,43,226,0.1)", padding: "12px 15px", borderRadius: "8px", marginBottom: "15px" }}>
                        <p style={{ color: "#8A2BE2", fontSize: "14px", margin: 0 }}>
                          Your prediction: <strong>{userPrediction?.answer}</strong>
                          {pred.resolved && userPrediction?.answer.toLowerCase().trim() === pred.correctAnswer?.toLowerCase().trim() && (
                            <span style={{ color: "#00E6A3", marginLeft: "10px" }}>✅ Correct! +50 pts</span>
                          )}
                        </p>
                      </div>
                    )}

                    {!pred.resolved && !isExpired && !userPredicted && (
                      <div>
                        {selectedPrediction === pred.id ? (
                          <div style={{ display: "flex", gap: "10px" }}>
                            <input
                              type="text"
                              value={userAnswer}
                              onChange={(e) => setUserAnswer(e.target.value)}
                              placeholder="Enter your prediction..."
                              style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "14px" }}
                            />
                            <button onClick={() => submitPrediction(pred.id)} style={{ padding: "12px 20px", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                              Submit
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setSelectedPrediction(pred.id)} style={{ padding: "12px 20px", background: "rgba(138,43,226,0.1)", color: "#8A2BE2", border: "1px solid rgba(138,43,226,0.3)", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                            Make Your Prediction (+5 pts)
                          </button>
                        )}
                      </div>
                    )}

                    {/* Creator Actions */}
                    {isCreator && !pred.resolved && (
                      <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button onClick={() => sendReminder(pred)} style={{ padding: "10px 15px", background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}>
                          📱 Send Reminder
                        </button>
                        {(isExpired || pred.predictions.length > 0) && (
                          <>
                            <button
                              onClick={() => {
                                const answer = prompt("Enter the correct answer:");
                                if (answer) resolvePrediction(pred.id, answer);
                              }}
                              style={{ padding: "10px 15px", background: "rgba(0,230,163,0.1)", color: "#00E6A3", border: "1px solid rgba(0,230,163,0.3)", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
                            >
                              ✍️ Manual Answer
                            </button>
                            <button
                              onClick={() => resolveWithAI(pred)}
                              style={{ padding: "10px 15px", background: "rgba(138,43,226,0.1)", color: "#8A2BE2", border: "1px solid rgba(138,43,226,0.3)", borderRadius: "6px", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                            >
                              🤖 Use AI
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {pred.resolved && pred.predictions.length > 0 && (
                      <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "10px" }}>All Predictions:</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          {pred.predictions.map((p, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
                              <span>{p.username}</span>
                              <span style={{ color: p.answer.toLowerCase().trim() === pred.correctAnswer?.toLowerCase().trim() ? "#00E6A3" : "#FF2D92" }}>
                                {p.answer} {p.answer.toLowerCase().trim() === pred.correctAnswer?.toLowerCase().trim() ? "✅" : "❌"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Share Button */}
        <button
          onClick={() => {
            const message = `Join my Omnix prediction room!\n\n🔮 ${predictions.length} active prediction${predictions.length !== 1 ? "s" : ""}\n\nClick to join:\nhttps://omnix-app.vercel.app/room/${roomId}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
          }}
          style={{ marginTop: "20px", width: "100%", padding: "18px", background: "linear-gradient(135deg, #25D366, #128C7E)", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
        >
          <span>📱</span>
          Share Room on WhatsApp
        </button>
      </div>
    </div>
  );
}
