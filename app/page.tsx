"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
  answerType?: "text" | "yesno" | "multiple";
  options?: string[];
}

interface PredictionResponse {
  username: string;
  answer: string;
  timestamp: string;
}

interface Comment {
  username: string;
  message: string;
  timestamp: string;
}

interface Room {
  id: string;
  name: string;
  creator: string;
  predictions: Prediction[];
  createdAt: string;
  comments?: Comment[];
  category?: string;
}

export default function RoomPage() {
  const params = useParams();
  
  const [roomId, setRoomId] = useState<string>("");
  const [username, setUsername] = useState("");
  const [tempUsername, setTempUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomNotFound, setRoomNotFound] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
  const [submittedPredictions, setSubmittedPredictions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{[key: string]: string}>({});
  const [showStats, setShowStats] = useState<{[key: string]: boolean}>({});
  
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [bonusAwarded, setBonusAwarded] = useState(false);

  useEffect(() => {
    if (params?.id) {
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      setRoomId(id);
    }
  }, [params]);

  useEffect(() => {
    if (!roomId) return;
    
    const userStr = localStorage.getItem("omnix-user");
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username || user.name || "");
        setIsLoggedIn(true);
        
        const joinedRooms = JSON.parse(localStorage.getItem("omnix-joined-rooms") || "[]");
        if (!joinedRooms.includes(roomId)) {
          joinedRooms.push(roomId);
          localStorage.setItem("omnix-joined-rooms", JSON.stringify(joinedRooms));
          
          fetch("/api/leaderboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user.username, points: 10, correct: 0, total: 0 })
          }).catch(console.error);
          
          user.stats = user.stats || {};
          user.stats.points = (user.stats.points || 0) + 10;
          user.stats.roomsJoined = (user.stats.roomsJoined || 0) + 1;
          localStorage.setItem("omnix-user", JSON.stringify(user));
          setBonusAwarded(true);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
    
    loadRoomData();
  }, [roomId]);

  const loadRoomData = async () => {
    if (!roomId) return;
    
    setLoadingRoom(true);
    try {
      const response = await fetch(`/api/rooms?id=${roomId}`);
      const data = await response.json();
      
      if (response.ok && data.room) {
        const parsedRoom = typeof data.room === "string" ? JSON.parse(data.room) : data.room;
        setRoom(parsedRoom);
        setRoomNotFound(false);
      } else {
        setRoomNotFound(true);
      }
    } catch (error) {
      setRoomNotFound(true);
    } finally {
      setLoadingRoom(false);
    }
  };

  useEffect(() => {
    if (room && username) {
      const submitted: string[] = [];
      room.predictions?.forEach((pred: Prediction) => {
        if (pred.responses?.some((r: PredictionResponse) => r.username === username)) {
          submitted.push(pred.id);
        }
      });
      setSubmittedPredictions(submitted);
    }
  }, [room, username]);

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

  const shareToWhatsApp = () => {
    const message = `🔮 Join us on Omnix!\n\n📝 *${room?.name}*\nby ${room?.creator}\n\n🎁 Get +10 bonus points for joining!\n\n👉 Click to predict:\nhttps://omnix-app.vercel.app/room/${roomId}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`https://omnix-app.vercel.app/room/${roomId}`);
    alert("Link copied!");
  };

  const handleQuickLogin = () => {
    if (!tempUsername.trim()) {
      alert("Please enter your name");
      return;
    }

    setLoggingIn(true);

    const user = {
      username: tempUsername.trim(),
      createdAt: new Date().toISOString(),
      stats: { points: 10, level: 1, roomsCreated: 0, roomsJoined: 1 }
    };

    localStorage.setItem("omnix-user", JSON.stringify(user));
    
    fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: tempUsername.trim(), points: 10, correct: 0, total: 0 })
    }).catch(console.error);

    const joinedRooms = [roomId];
    localStorage.setItem("omnix-joined-rooms", JSON.stringify(joinedRooms));

    setUsername(tempUsername.trim());
    setIsLoggedIn(true);
    setBonusAwarded(true);
    setLoggingIn(false);
  };

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

  const addComment = async () => {
    if (!newComment.trim() || !room) return;

    const comment: Comment = {
      username,
      message: newComment,
      timestamp: new Date().toISOString()
    };

    const updatedRoom = {
      ...room,
      comments: [...(room.comments || []), comment]
    };

    try {
      await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: updatedRoom })
      });

      setRoom(updatedRoom);
      setNewComment("");
    } catch (error) {
      alert("Failed to add comment");
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

  const getCategoryIcon = (category?: string) => {
    switch(category) {
      case "sports": return "🏆";
      case "fun": return "🎉";
      case "work": return "💼";
      case "entertainment": return "🎬";
      default: return "🔮";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!roomId || loadingRoom) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>🔮</div>
          <p style={{ color: "#8A2BE2", fontSize: "18px" }}>Loading room...</p>
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
          <button onClick={() => window.location.href = "/"} style={{ padding: "15px 40px", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}>Go Home</button>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", padding: "20px" }}>
        <div style={{ maxWidth: "500px", margin: "0 auto", paddingTop: "40px" }}>
          
          <div style={{ background: "#121212", padding: "25px", borderRadius: "16px", marginBottom: "20px", border: "1px solid rgba(138,43,226,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "24px" }}>{getCategoryIcon(room?.category)}</span>
              </div>
              <div>
                <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#FFF", margin: 0 }}>{room?.name}</h1>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "4px 0 0 0" }}>by {room?.creator}</p>
              </div>
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "10px" }}>🎯 {room?.predictions?.length || 0} Predictions to make:</p>
              {room?.predictions?.slice(0, 3).map((pred, i) => (
                <div key={pred.id} style={{ background: "rgba(255,255,255,0.05)", padding: "10px 12px", borderRadius: "8px", marginBottom: "8px" }}>
                  <p style={{ color: "#FFF", fontSize: "14px", margin: 0 }}>{i + 1}. {pred.question}</p>
                  <span style={{ color: "#FFC400", fontSize: "12px" }}>🏆 {pred.pointValue} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#121212", padding: "30px", borderRadius: "16px", border: "1px solid rgba(0,230,163,0.3)", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "15px" }}>🎁</div>
            <h2 style={{ color: "#FFF", marginBottom: "8px", fontSize: "20px" }}>Join & Get +10 Bonus Points!</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "20px", fontSize: "14px" }}>Enter your name to start predicting</p>
            
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="👤 Your name"
              style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "16px", marginBottom: "15px", boxSizing: "border-box", textAlign: "center" }}
              onKeyPress={(e) => e.key === "Enter" && handleQuickLogin()}
              autoFocus
            />
            
            <button
              onClick={handleQuickLogin}
              disabled={loggingIn}
              style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}
            >
              {loggingIn ? "Joining..." : "Join Room 🚀"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", padding: "20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingTop: "20px" }}>

        {bonusAwarded && (
          <div style={{ background: "linear-gradient(135deg, rgba(0,230,163,0.2), rgba(0,174,239,0.2))", padding: "15px", borderRadius: "12px", marginBottom: "20px", border: "1px solid rgba(0,230,163,0.3)", textAlign: "center" }}>
            <p style={{ color: "#00E6A3", fontSize: "16px", margin: 0, fontWeight: "600" }}>🎉 +10 Bonus Points Awarded!</p>
          </div>
        )}

        {/* Room Header with Share Buttons */}
        <div style={{ background: "#121212", padding: "25px", borderRadius: "16px", marginBottom: "20px", border: "1px solid rgba(138,43,226,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
            <div style={{ width: "55px", height: "55px", borderRadius: "50%", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "28px" }}>{getCategoryIcon(room?.category)}</span>
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#FFF", margin: 0 }}>{room?.name}</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: "4px 0 0 0" }}>by {room?.creator}</p>
            </div>
          </div>
          
          <div style={{ background: "rgba(0,230,163,0.1)", padding: "10px 15px", borderRadius: "8px", marginBottom: "15px" }}>
            <p style={{ color: "#00E6A3", fontSize: "13px", margin: 0 }}>👤 Playing as <strong>{username}</strong></p>
          </div>

          {/* SHARE BUTTONS - Prominent */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={shareToWhatsApp}
              style={{ flex: 1, padding: "14px", background: "rgba(37,211,102,0.15)", color: "#25D366", border: "1px solid rgba(37,211,102,0.4)", borderRadius: "10px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              📱 WhatsApp
            </button>
            <button
              onClick={copyLink}
              style={{ flex: 1, padding: "14px", background: "rgba(0,174,239,0.15)", color: "#00AEEF", border: "1px solid rgba(0,174,239,0.4)", borderRadius: "10px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              🔗 Copy Link
            </button>
          </div>
        </div>

        {/* Predictions */}
        <div style={{ background: "#121212", padding: "25px", borderRadius: "16px", border: "1px solid rgba(138,43,226,0.2)", marginBottom: "20px" }}>
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
              <div key={pred.id} style={{ background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "12px", marginBottom: "15px", border: isWinner ? "2px solid rgba(0,230,163,0.5)" : "1px solid rgba(138,43,226,0.2)" }}>
                
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                  <span style={{ background: "rgba(138,43,226,0.2)", color: "#8A2BE2", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "600", flexShrink: 0 }}>
                    {index + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: "#FFF", fontSize: "15px", margin: "0 0 8px 0", fontWeight: "500" }}>{pred.question}</h3>
                    <span style={{ background: "rgba(255,196,0,0.15)", color: "#FFC400", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
                      🏆 {pred.pointValue || 50} pts
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                  {pred.resolved ? (
                    <span style={{ background: "rgba(0,230,163,0.1)", color: "#00E6A3", padding: "5px 12px", borderRadius: "20px", fontSize: "12px" }}>
                      ✅ Answer: {pred.correctAnswer}
                    </span>
                  ) : (
                    <span style={{ background: isExpired ? "rgba(255,45,146,0.1)" : "rgba(255,196,0,0.1)", color: isExpired ? "#FF2D92" : "#FFC400", padding: "5px 12px", borderRadius: "20px", fontSize: "12px" }}>
                      {isExpired ? "⏰ Closed" : `⏳ ${timeLeft[pred.id] || "..."}`}
                    </span>
                  )}
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                    👥 {totalResponses} prediction{totalResponses !== 1 ? "s" : ""}
                  </span>
                </div>

                {pred.resolved && pred.winners && pred.winners.length > 0 && (
                  <div style={{ background: "rgba(0,230,163,0.15)", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
                    <p style={{ color: "#00E6A3", fontSize: "14px", margin: 0, fontWeight: "600" }}>
                      🎉 Winners: {pred.winners.join(", ")}
                    </p>
                  </div>
                )}

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
                        {Object.entries(responseStats).map(([answer, count]) => {
                          const percentage = Math.round((count / totalResponses) * 100);
                          return (
                            <div key={answer} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                              <span style={{ color: "#FFF", fontSize: "13px" }}>{answer}</span>
                              <span style={{ color: "#8A2BE2", fontSize: "13px" }}>{percentage}% ({count})</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {userResponse && (
                  <div style={{ background: isWinner ? "rgba(0,230,163,0.15)" : "rgba(138,43,226,0.1)", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
                    <p style={{ color: isWinner ? "#00E6A3" : "#8A2BE2", fontSize: "14px", margin: 0 }}>
                      ✅ Your prediction: <strong>{userResponse.answer}</strong>
                      {isWinner && ` 🎉 You won!`}
                    </p>
                  </div>
                )}

                {!hasSubmitted && !isExpired && !pred.resolved && (
                  <div>
                    {pred.answerType === "yesno" && (
                      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                        <button
                          onClick={() => setUserAnswers({ ...userAnswers, [pred.id]: "Yes" })}
                          style={{ flex: 1, padding: "12px", background: userAnswers[pred.id] === "Yes" ? "rgba(0,230,163,0.3)" : "rgba(0,230,163,0.1)", color: "#00E6A3", border: userAnswers[pred.id] === "Yes" ? "2px solid #00E6A3" : "1px solid rgba(0,230,163,0.3)", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer" }}
                        >
                          👍 Yes
                        </button>
                        <button
                          onClick={() => setUserAnswers({ ...userAnswers, [pred.id]: "No" })}
                          style={{ flex: 1, padding: "12px", background: userAnswers[pred.id] === "No" ? "rgba(255,45,146,0.3)" : "rgba(255,45,146,0.1)", color: "#FF2D92", border: userAnswers[pred.id] === "No" ? "2px solid #FF2D92" : "1px solid rgba(255,45,146,0.3)", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer" }}
                        >
                          👎 No
                        </button>
                      </div>
                    )}

                    {pred.answerType === "multiple" && pred.options && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
                        {pred.options.map((option, i) => (
                          <button
                            key={i}
                            onClick={() => setUserAnswers({ ...userAnswers, [pred.id]: option })}
                            style={{ padding: "12px", background: userAnswers[pred.id] === option ? "rgba(138,43,226,0.3)" : "rgba(138,43,226,0.1)", color: "#FFF", border: userAnswers[pred.id] === option ? "2px solid #8A2BE2" : "1px solid rgba(138,43,226,0.3)", borderRadius: "8px", fontSize: "14px", cursor: "pointer", textAlign: "left" }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}

                    {(!pred.answerType || pred.answerType === "text") && (
                      <input
                        type="text"
                        value={userAnswers[pred.id] || ""}
                        onChange={(e) => setUserAnswers({ ...userAnswers, [pred.id]: e.target.value })}
                        placeholder="Enter your prediction..."
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "14px", marginBottom: "10px", boxSizing: "border-box" }}
                      />
                    )}

                    <button
                      onClick={() => submitPrediction(pred.id)}
                      disabled={submitting || !userAnswers[pred.id]}
                      style={{ width: "100%", padding: "12px", background: userAnswers[pred.id] ? "linear-gradient(135deg, #8A2BE2, #00AEEF)" : "rgba(255,255,255,0.1)", color: userAnswers[pred.id] ? "#FFF" : "rgba(255,255,255,0.3)", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: userAnswers[pred.id] ? "pointer" : "not-allowed" }}
                    >
                      {submitting ? "Submitting..." : "Submit Prediction"}
                    </button>
                  </div>
                )}

                {isExpired && !userResponse && !pred.resolved && (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>⏰ Prediction closed</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Comments */}
        <div style={{ background: "#121212", padding: "25px", borderRadius: "16px", border: "1px solid rgba(138,43,226,0.2)", marginBottom: "20px" }}>
          <div onClick={() => setShowComments(!showComments)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <h2 style={{ color: "#FFF", fontSize: "18px", margin: 0 }}>💬 Chat ({room?.comments?.length || 0})</h2>
            <span style={{ color: "#8A2BE2" }}>{showComments ? "▼" : "▶"}</span>
          </div>

          {showComments && (
            <div style={{ marginTop: "15px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Say something..."
                  style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "14px" }}
                  onKeyPress={(e) => e.key === "Enter" && addComment()}
                />
                <button onClick={addComment} style={{ padding: "12px 18px", background: "rgba(138,43,226,0.2)", color: "#8A2BE2", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>Send</button>
              </div>

              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {room?.comments?.slice().reverse().map((comment, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: "#8A2BE2", fontSize: "12px", fontWeight: "600" }}>{comment.username}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>{formatTime(comment.timestamp)}</span>
                    </div>
                    <p style={{ color: "#FFF", fontSize: "13px", margin: 0 }}>{comment.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Buttons */}
        <button onClick={() => window.location.href = "/home"} style={{ width: "100%", padding: "14px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
