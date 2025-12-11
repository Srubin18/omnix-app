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
  const [pointValue, setPointValue] = useState(50);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{[key: string]: string}>({});
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

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
      
      const roomIdsStr = localStorage.getItem(`omnix-room-ids-${user.username}`);
      if (roomIdsStr) {
        const roomIds = JSON.parse(roomIdsStr);
        fetchRoomsFromDatabase(roomIds);
      }
      
      setIsLoading(false);
    } catch (error) {
      router.push("/");
    }
  }, [router]);

  const fetchRoomsFromDatabase = async (roomIds: string[]) => {
    const rooms: Room[] = [];
    for (const id of roomIds) {
      try {
        const response = await fetch(`/api/rooms?id=${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.room) {
            const room = typeof data.room === "string" ? JSON.parse(data.room) : data.room;
            rooms.push(room);
          }
        }
      } catch (error) {
        console.error("Error fetching room:", id);
      }
    }
    setMyRooms(rooms);
  };

  const refreshRooms = async () => {
    const roomIdsStr = localStorage.getItem(`omnix-room-ids-${username}`);
    if (roomIdsStr) {
      const roomIds = JSON.parse(roomIdsStr);
      await fetchRoomsFromDatabase(roomIds);
    }
  };

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
      resolved: false,
      pointValue: pointValue,
      winners: []
    };

    const updatedRoom = {
      ...currentRoom,
      predictions: [...currentRoom.predictions, prediction]
    };

    setCurrentRoom(updatedRoom);
    setNewQuestion("");
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
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: currentRoom })
      });

      if (!response.ok) {
        throw new Error("Failed to save room");
      }

      const roomIdsStr = localStorage.getItem(`omnix-room-ids-${username}`);
      const roomIds = roomIdsStr ? JSON.parse(roomIdsStr) : [];
      if (!roomIds.includes(currentRoom.id)) {
        roomIds.push(currentRoom.id);
        localStorage.setItem(`omnix-room-ids-${username}`, JSON.stringify(roomIds));
      }

      setMyRooms([...myRooms, { ...currentRoom, shared: true }]);

      const predictionsList = currentRoom.predictions.map((p, i) => `${i + 1}. ${p.question} (🏆 ${p.pointValue} pts)`).join("\n");
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
    const message = `⏰ REMINDER!\n\n🔮 "${prediction.question}"\n🏆 ${prediction.pointValue} points to win!\n\n⏳ Time left: ${timeLeft[prediction.id] || "Check now!"}\n\n👉 Make your prediction:\nhttps://omnix-app.vercel.app/room/${room.id}`;
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
    const updatedRooms = await Promise.all(myRooms.map(async (room) => {
      if (room.id === roomId) {
        const updatedPredictions = room.predictions.map(pred => {
          if (pred.id === predictionId) {
            const winners = pred.responses
              ?.filter(r => r.answer.toLowerCase().trim() === answer.toLowerCase().trim())
              .map(r => r.username) || [];
            
            return { ...pred, resolved: true, correctAnswer: answer, winners };
          }
          return pred;
        });

        const updatedRoom = { ...room, predictions: updatedPredictions };
        
        await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room: updatedRoom })
        });

        const resolvedPred = updatedPredictions.find(p => p.id === predictionId);
        if (resolvedPred?.winners && resolvedPred.winners.length > 0) {
          for (const winner of resolvedPred.winners) {
            await fetch("/api/leaderboard", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                username: winner, 
                points: resolvedPred.pointValue,
                correct: 1,
                total: 1
              })
            });
          }
        }

        for (const response of resolvedPred?.responses || []) {
          if (!resolvedPred?.winners?.includes(response.username)) {
            await fetch("/api/leaderboard", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                username: response.username, 
                points: 0,
                correct: 0,
                total: 1
              })
            });
          }
        }
        
        return updatedRoom;
      }
      return room;
    }));
    
    setMyRooms(updatedRooms);

    const room = updatedRooms.find(r => r.id === roomId);
    const pred = room?.predictions.find(p => p.id === predictionId);
    if (pred && pred.winners && pred.winners.length > 0) {
      const shareResults = confirm(`🎉 Winners: ${pred.winners.join(", ")}\n\nShare results on WhatsApp?`);
      if (shareResults) {
        const message = `🎉 RESULTS ARE IN!\n\n🔮 "${pred.question}"\n\n✅ Correct Answer: ${answer}\n\n🏆 Winners (${pred.pointValue} pts each):\n${pred.winners.map(w => `• ${w}`).join("\n")}\n\n📊 See full leaderboard:\nhttps://omnix-app.vercel.app/leaderboard`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
      }
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
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => router.push("/leaderboard")}
                style={{ padding: "8px 16px", background: "rgba(138,43,226,0.1)", color: "#8A2BE2", border: "1px solid rgba(138,43,226,0.3)", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
              >
                🏆 Leaderboard
              </button>
              <button
                onClick={() => { localStorage.removeItem("omnix-user"); router.push("/"); }}
                style={{ padding: "8px 16px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
              >
                Logout
              </button>
            </div>
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

            {/* Question Input */}
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Enter prediction question (e.g., 'Who will win the match?')"
                style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "15px", marginBottom: "15px", boxSizing: "border-box" }}
                onKeyPress={(e) => e.key === "Enter" && addPrediction()}
              />
              
              {/* Settings Row */}
              <div style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap", background: "rgba(255,255,255,0.03)", padding: "15px", borderRadius: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: "#FFC400", fontSize: "14px" }}>🏆 Points:</span>
                  <select
                    value={pointValue}
                    onChange={(e) => setPointValue(Number(e.target.value))}
                    style={{ padding: "10px 15px", borderRadius: "8px", border: "2px solid rgba(255,196,0,0.5)", background: "rgba(255,196,0,0.15)", color: "#FFC400", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}
                  >
                    <option value={10}>10 pts</option>
                    <option value={25}>25 pts</option>
                    <option value={50}>50 pts</option>
                    <option value={100}>100 pts</option>
                    <option value={200}>200 pts</option>
                    <option value={500}>500 pts</option>
                  </select>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: "#00AEEF", fontSize: "14px" }}>⏳ Deadline:</span>
                  <span style={{ color: "#00AEEF", fontSize: "15px", fontWeight: "600" }}>24 hours</span>
                </div>
                
                <button
                  onClick={addPrediction}
                  style={{ marginLeft: "auto", padding: "12px 24px", background: "linear-gradient(135deg, #00E6A3, #00AEEF)", color: "#000", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}
                >
                  + Add Question
                </button>
              </div>
            </div>

            {/* Predictions List */}
            {currentRoom.predictions.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "12px" }}>
                  🔮 Questions ({currentRoom.predictions.length}):
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {currentRoom.predictions.map((pred, i) => (
                    <div key={pred.id} style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(138,43,226,0.3)" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                          <span style={{ color: "#8A2BE2", fontWeight: "700" }}>{i + 1}.</span>
                          <span style={{ color: "#FFF", fontSize: "15px" }}>{pred.question}</span>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <span style={{ color: "#FFC400", fontSize: "12px", background: "rgba(255,196,0,0.1)", padding: "3px 10px", borderRadius: "12px" }}>🏆 {pred.pointValue} pts</span>
                          <span style={{ color: "#00AEEF", fontSize: "12px", background: "rgba(0,174,239,0.1)", padding: "3px 10px", borderRadius: "12px" }}>⏳ 24h</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removePrediction(pred.id)}
                        style={{ padding: "8px 12px", background: "rgba(255,45,146,0.1)", color: "#FF2D92", border: "none", borderRadius: "6px", fontSize: "14px", cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share Button */}
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
              {saving ? "Saving..." : currentRoom.predictions.length > 0 ? "Share on WhatsApp" : "Add questions to share"}
            </button>
          </div>
        )}

        {/* My Rooms */}
        {myRooms.length > 0 && (
          <div style={{ background: "#121212", padding: "25px", borderRadius: "16px", border: "1px solid rgba(138,43,226,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ color: "#FFF", fontSize: "18px", margin: 0 }}>📊 My Rooms ({myRooms.length})</h2>
              <button
                onClick={refreshRooms}
                style={{ padding: "8px 16px", background: "rgba(0,174,239,0.1)", color: "#00AEEF", border: "1px solid rgba(0,174,239,0.3)", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
              >
                🔄 Refresh
              </button>
            </div>
            
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
                      const responseStats = getResponseStats(pred.responses || []);
                      const totalResponses = pred.responses?.length || 0;
                      
                      return (
                        <div key={pred.id} style={{ background: "rgba(0,0,0,0.3)", padding: "15px", borderRadius: "8px", border: pred.resolved ? "1px solid rgba(0,230,163,0.3)" : "1px solid rgba(255,255,255,0.1)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                            <p style={{ color: "#FFF", fontSize: "14px", margin: 0, flex: 1 }}>{pred.question}</p>
                            <span style={{ color: "#FFC400", fontSize: "12px", background: "rgba(255,196,0,0.1)", padding: "3px 10px", borderRadius: "10px", marginLeft: "10px", whiteSpace: "nowrap" }}>🏆 {pred.pointValue || 50} pts</span>
                          </div>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                            {pred.resolved ? (
                              <span style={{ background: "rgba(0,230,163,0.1)", color: "#00E6A3", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" }}>
                                ✅ Answer: {pred.correctAnswer}
                              </span>
                            ) : (
                              <span style={{ background: isExpired ? "rgba(255,45,146,0.1)" : "rgba(255,196,0,0.1)", color: isExpired ? "#FF2D92" : "#FFC400", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" }}>
                                {isExpired ? "⏰ Expired" : `⏳ ${timeLeft[pred.id] || "24h"}`}
                              </span>
                            )}
                            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                              👥 {totalResponses} response{totalResponses !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {pred.resolved && pred.winners && pred.winners.length > 0 && (
                            <div style={{ background: "rgba(0,230,163,0.1)", padding: "10px", borderRadius: "6px", marginBottom: "10px" }}>
                              <p style={{ color: "#00E6A3", fontSize: "13px", margin: 0 }}>
                                🏆 Winners ({pred.pointValue} pts each): <strong>{pred.winners.join(", ")}</strong>
                              </p>
                            </div>
                          )}

                          {pred.resolved && (!pred.winners || pred.winners.length === 0) && (
                            <div style={{ background: "rgba(255,196,0,0.1)", padding: "10px", borderRadius: "6px", marginBottom: "10px" }}>
                              <p style={{ color: "#FFC400", fontSize: "13px", margin: 0 }}>
                                😔 No winners this round
                              </p>
                            </div>
                          )}

                          {totalResponses > 0 && (
                            <div style={{ marginBottom: "10px" }}>
                              <div 
                                onClick={() => setExpandedRoom(expandedRoom === pred.id ? null : pred.id)}
                                style={{ cursor: "pointer", color: "#00AEEF", fontSize: "12px", marginBottom: "8px" }}
                              >
                                {expandedRoom === pred.id ? "▼ Hide responses" : "▶ Show responses"}
                              </div>
                              
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                                {Object.entries(responseStats).map(([answer, count]) => (
                                  <span key={answer} style={{ background: "rgba(138,43,226,0.1)", color: "#8A2BE2", padding: "4px 10px", borderRadius: "12px", fontSize: "11px" }}>
                                    {answer}: {Math.round((count / totalResponses) * 100)}% ({count})
                                  </span>
                                ))}
                              </div>
                              
                              {expandedRoom === pred.id && (
                                <div style={{ background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "6px", marginTop: "8px" }}>
                                  {pred.responses?.map((r, i) => {
                                    const isWinner = pred.resolved && pred.winners?.includes(r.username);
                                    return (
                                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < (pred.responses?.length || 0) - 1 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                                        <span style={{ color: isWinner ? "#00E6A3" : "#FFF", fontSize: "12px" }}>
                                          {r.username} {isWinner && "🏆"}
                                        </span>
                                        <span style={{ color: isWinner ? "#00E6A3" : "#8A2BE2", fontSize: "12px", fontWeight: "600" }}>
                                          {r.answer}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {!pred.resolved && (
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
                      const predictionsList = room.predictions.map((p, i) => `${i + 1}. ${p.question} (🏆 ${p.pointValue || 50} pts)`).join("\n");
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
