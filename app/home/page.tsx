"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  shared: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  
  const [roomName, setRoomName] = useState("");
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  
  const [newQuestion, setNewQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const userStr = localStorage.getItem("omnix-user");
    
    if (!userStr) {
      router.push("/");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUsername(user.username || user.name || "User");
      setStats(user.stats || { points: 0, level: 1, roomsCreated: 0 });
      
      const roomsStr = localStorage.getItem(`omnix-my-rooms-${user.username}`);
      if (roomsStr) {
        setMyRooms(JSON.parse(roomsStr));
      }
      
      setIsLoading(false);
    } catch (error) {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      const allPredictions = [...(currentRoom?.predictions || []), ...myRooms.flatMap(r => r.predictions)];
      const newTimeLeft: {[key: string]: string} = {};
      
      allPredictions.forEach(pred => {
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
  }, [currentRoom, myRooms]);

  const createRoom = () => {
    if (!roomName.trim()) {
      alert("Please enter a room name");
      return;
    }

    const roomId = Math.random().toString(36).substring(2, 10);
    const newRoom: Room = {
      id: roomId,
      name: roomName,
      creator: username,
      predictions: [],
      createdAt: new Date().toISOString(),
      shared: false
    };

    setCurrentRoom(newRoom);
    setRoomName("");

    const userStr = localStorage.getItem("omnix-user");
    if (userStr) {
      const user = JSON.parse(userStr);
      user.stats = user.stats || {};
      user.stats.roomsCreated = (user.stats.roomsCreated || 0) + 1;
      user.stats.points = (user.stats.points || 0) + 20;
      localStorage.setItem("omnix-user", JSON.stringify(user));
      setStats(user.stats);
    }
  };

  const addPrediction = () => {
    if (!newQuestion.trim()) {
      alert("Please enter a prediction question");
      return;
    }

    if (!currentRoom) return;

    const prediction: Prediction = {
      id: Math.random().toString(36).substring(2, 10),
      question: newQuestion,
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      responses: [],
      resolved: false
    };

    const updatedRoom = {
      ...currentRoom,
      predictions: [...currentRoom.predictions, prediction]
    };

    setCurrentRoom(updatedRoom);
    setNewQuestion("");

    const userStr = localStorage.getItem("omnix-user");
    if (userStr) {
      const user = JSON.parse(userStr);
      user.stats.points = (user.stats.points || 0) + 15;
      localStorage.setItem("omnix-user", JSON.stringify(user));
      setStats(user.stats);
    }
  };

  const removePrediction = (predId: string) => {
    if (!currentRoom) return;
    
    const updatedRoom = {
      ...currentRoom,
      predictions: currentRoom.predictions.filter(p => p.id !== predId)
    };
    setCurrentRoom(updatedRoom);
  };

  const shareOnWhatsApp = async () => {
    if (!currentRoom) return;
    
    if (currentRoom.predictions.length === 0) {
      alert("Please add at least one prediction before sharing!");
      return;
    }

    setSaving(true);

    try {
      // Save room to database
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: currentRoom })
      });

      if (!response.ok) {
        throw new Error("Failed to save room");
      }

      // Save to local storage for My Rooms
      const updatedRooms = [...myRooms, { ...currentRoom, shared: true }];
      setMyRooms(updatedRooms);
      localStorage.setItem(`omnix-my-rooms-${username}`, JSON.stringify(updatedRooms));

      // Create WhatsApp message
      const predictionsList = currentRoom.predictions.map((p, i) => `${i + 1}. ${p.question}`).join("\n");
      const message = `🔮 Join my Omnix prediction room!\n\n📝 *${currentRoom.name}*\n\n${predictionsList}\n\n⏳ You have 24 hours to predict!\n\n👉 Click to join:\nhttps://omnix-app.vercel.app/room/${currentRoom.id}`;
      
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
      
      setCurrentRoom(null);
    } catch (error) {
      alert("Failed to save room. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const sendReminder = (room: Room, prediction: Prediction) => {
    const message = `⏰ REMINDER!\n\n🔮 "${prediction.question}"\n\n⏳ Time left: ${timeLeft[prediction.id] || "Check now!"}\n\n👉 Make your prediction:\nhttps://omnix-app.vercel.app/room/${room.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const resolveWithAI = async (room: Room, prediction: Prediction) => {
    const confirmed = confirm(`🤖 Use AI to find the answer for:\n\n"${prediction.question}"\n\nContinue?`);
    if (!confirmed) return;

    setAiLoading(true);

    try {
      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prediction.question })
      });

      const data = await response.json();
      setAiLoading(false);

      if (data.answer) {
        const useAnswer = confirm(`🤖 AI Found:\n\n"${data.answer}"\n\nSource: ${data.source || "Web search"}\n\nUse this as the correct answer?`);
        if (useAnswer) {
          resolvePrediction(room.id, prediction.id, data.answer);
        }
      } else {
        alert("❌ Couldn't find a definitive answer. Please resolve manually.");
      }
    } catch (error) {
      setAiLoading(false);
      alert("❌ AI search failed. Please try again.");
    }
  };

  const resolvePrediction = async (roomId: string, predictionId: string, answer: string) => {
    const updatedRooms = myRooms.map(room => {
      if (room.id === roomId) {
        room.predictions = room.predictions.map(pred => {
          if (pred.id === predictionId) {
            pred.resolved = true;
            pred.correctAnswer = answer;
          }
          return pred;
        });
        
        // Update in database
        fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room })
        });
      }
      return room;
    });
    
    setMyRooms(updatedRooms);
    localStorage.setItem(`omnix-my-rooms-${username}`, JSON.stringify(updatedRooms));

    const userStr = localStorage.getItem("omnix-user");
    if (userStr) {
      const user = JSON.parse(userStr);
      user.stats.points = (user.stats.points || 0) + 10;
      localStorage.setItem("omnix-user", JSON.stringify(user));
      setStats(user.stats);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <p style={{ color: "#8A2BE2", fontSize: "18px" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", padding: "20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", paddingTop: "20px" }}>

        {(aiLoading || saving) && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "15px" }}>{aiLoading ? "🤖" : "💾"}</div>
              <p style={{ color: "#8A2BE2", fontSize: "16px" }}>{aiLoading ? "Searching for answer..." : "Saving room..."}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ background: "#121212", padding: "25px", borderRadius: "16px", marginBottom: "20px", border: "1px solid rgba(138,43,226,0.2)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #8A2BE2, #00AEEF, #8A2BE2)" }} />
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "24px" }}>👑</span>
              </div>
              <div>
                <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#FFF", margin: 0 }}>{username}</h1>
                <p style={{ color: "#8A2BE2", fontSize: "13px", margin: "3px 0 0 0" }}>Level {stats?.level || 1} • {stats?.points || 0} pts</p>
              </div>
            </div>
            
            <button
              onClick={() => { localStorage.removeItem("omnix-user"); router.push("/"); }}
              style={{ padding: "8px 16px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Create Room */}
        {!currentRoom ? (
          <div style={{ background: "#121212", padding: "30px", borderRadius: "16px", marginBottom: "20px", border: "1px solid rgba(138,43,226,0.2)" }}>
            <h2 style={{ color: "#FFF", fontSize: "20px", marginBottom: "8px" }}>🔮 Create Prediction Room</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "20px" }}>
              Earn <span style={{ color: "#00E6A3" }}>+20 points</span> for creating a room
            </p>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name (e.g., 'Champions League Final')"
                style={{ flex: 1, padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "15px" }}
              />
              <button
                onClick={createRoom}
                style={{ padding: "14px 24px", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Create Room
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: "#121212", padding: "30px", borderRadius: "16px", marginBottom: "20px", border: "1px solid rgba(0,230,163,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ color: "#FFF", fontSize: "20px", margin: 0 }}>📝 {currentRoom.name}</h2>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "5px 0 0 0" }}>Add your prediction questions below</p>
              </div>
              <button
                onClick={() => setCurrentRoom(null)}
                style={{ padding: "8px 16px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Enter prediction question..."
                style={{ flex: 1, padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "15px" }}
                onKeyPress={(e) => e.key === "Enter" && addPrediction()}
              />
              <button
                onClick={addPrediction}
                style={{ padding: "14px 20px", background: "rgba(0,230,163,0.1)", color: "#00E6A3", border: "1px solid rgba(0,230,163,0.3)", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer" }}
              >
                + Add
              </button>
            </div>

            {currentRoom.predictions.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "10px" }}>
                  🔮 Predictions ({currentRoom.predictions.length}):
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {currentRoom.predictions.map((pred, i) => (
                    <div key={pred.id} style={{ background: "rgba(255,255,255,0.03)", padding: "15px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(138,43,226,0.2)" }}>
                      <div>
                        <span style={{ color: "#8A2BE2", marginRight: "10px" }}>{i + 1}.</span>
                        <span style={{ color: "#FFF" }}>{pred.question}</span>
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginLeft: "10px" }}>⏳ 24h</span>
                      </div>
                      <button
                        onClick={() => removePrediction(pred.id)}
                        style={{ padding: "5px 10px", background: "rgba(255,45,146,0.1)", color: "#FF2D92", border: "none", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={shareOnWhatsApp}
              disabled={currentRoom.predictions.length === 0 || saving}
              style={{
                width: "100%",
                padding: "18px",
                background: currentRoom.predictions.length > 0 ? "linear-gradient(135deg, #25D366, #128C7E)" : "rgba(255,255,255,0.1)",
                color: currentRoom.predictions.length > 0 ? "#FFF" : "rgba(255,255,255,0.3)",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: currentRoom.predictions.length > 0 ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px"
              }}
            >
              <span>📱</span>
              {saving ? "Saving..." : currentRoom.predictions.length > 0 ? "Share on WhatsApp" : "Add predictions to share"}
            </button>
          </div>
        )}

        {/* My Rooms */}
        {myRooms.length > 0 && (
          <div style={{ background: "#121212", padding: "25px", borderRadius: "16px", border: "1px solid rgba(138,43,226,0.2)" }}>
            <h2 style={{ color: "#FFF", fontSize: "18px", marginBottom: "20px" }}>📊 My Rooms ({myRooms.length})</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {myRooms.map(room => (
                <div key={room.id} style={{ background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(138,43,226,0.2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h3 style={{ color: "#FFF", fontSize: "16px", margin: 0 }}>{room.name}</h3>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>ID: {room.id}</span>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {room.predictions.map(pred => {
                      const isExpired = timeLeft[pred.id] === "Expired" || new Date(pred.deadline) < new Date();
                      
                      return (
                        <div key={pred.id} style={{ background: "rgba(0,0,0,0.3)", padding: "15px", borderRadius: "8px", border: pred.resolved ? "1px solid rgba(0,230,163,0.3)" : "1px solid rgba(255,255,255,0.1)" }}>
                          <p style={{ color: "#FFF", fontSize: "14px", margin: "0 0 10px 0" }}>{pred.question}</p>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            {pred.resolved ? (
                              <span style={{ background: "rgba(0,230,163,0.1)", color: "#00E6A3", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" }}>
                                ✅ Answer: {pred.correctAnswer}
                              </span>
                            ) : (
                              <>
                                <span style={{ background: isExpired ? "rgba(255,45,146,0.1)" : "rgba(255,196,0,0.1)", color: isExpired ? "#FF2D92" : "#FFC400", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" }}>
                                  {isExpired ? "⏰ Expired" : `⏳ ${timeLeft[pred.id] || "24h"}`}
                                </span>
                                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                                  👥 {pred.responses?.length || 0} responses
                                </span>
                              </>
                            )}
                          </div>
                          
                          {!pred.resolved && (
                            <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              <button
                                onClick={() => sendReminder(room, pred)}
                                style={{ padding: "8px 12px", background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                              >
                                📱 Reminder
                              </button>
                              <button
                                onClick={() => {
                                  const answer = prompt("Enter the correct answer:");
                                  if (answer) resolvePrediction(room.id, pred.id, answer);
                                }}
                                style={{ padding: "8px 12px", background: "rgba(0,230,163,0.1)", color: "#00E6A3", border: "1px solid rgba(0,230,163,0.3)", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                              >
                                ✍️ Manual
                              </button>
                              <button
                                onClick={() => resolveWithAI(room, pred)}
                                style={{ padding: "8px 12px", background: "rgba(138,43,226,0.1)", color: "#8A2BE2", border: "1px solid rgba(138,43,226,0.3)", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                              >
                                🤖 Use AI
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => {
                      const predictionsList = room.predictions.map((p, i) => `${i + 1}. ${p.question}`).join("\n");
                      const message = `🔮 Join my Omnix prediction room!\n\n📝 *${room.name}*\n\n${predictionsList}\n\n👉 Click to join:\nhttps://omnix-app.vercel.app/room/${room.id}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
                    }}
                    style={{ marginTop: "15px", padding: "10px 15px", background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "6px", fontSize: "13px", cursor: "pointer", width: "100%" }}
                  >
                    📱 Share Again
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
