"use client";

import { useState, useEffect } from "react";

interface Room {
  id: string;
  name: string;
  creator: string;
  predictions: Prediction[];
  createdAt: string;
  comments?: Comment[];
  category?: string;
}

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

interface SportsEvent {
  id: string;
  league: string;
  home: string;
  away: string;
  date: string;
  time: string;
  icon: string;
}

const sportsList = [
  { id: "football", name: "Soccer", icon: "⚽" },
  { id: "rugby", name: "Rugby", icon: "🏉" },
  { id: "cricket", name: "Cricket", icon: "🏏" },
  { id: "basketball", name: "Basketball", icon: "🏀" },
  { id: "mma", name: "MMA/UFC", icon: "🥊" },
  { id: "tennis", name: "Tennis", icon: "🎾" },
];

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomCategory, setRoomCategory] = useState("sports");
  const [predictions, setPredictions] = useState<{question: string; deadline: string; pointValue: number; answerType: "text" | "yesno" | "multiple"; options: string[]}[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newPointValue, setNewPointValue] = useState(50);
  const [newAnswerType, setNewAnswerType] = useState<"text" | "yesno" | "multiple">("text");
  const [newOptions, setNewOptions] = useState<string[]>(["", ""]);
  const [creating, setCreating] = useState(false);
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [userStats, setUserStats] = useState({ points: 0, level: 1, roomsCreated: 0 });

  // Sports modal state
  const [showSportsModal, setShowSportsModal] = useState(false);
  const [selectedSport, setSelectedSport] = useState("football");
  const [sportsEvents, setSportsEvents] = useState<SportsEvent[]>([]);
  const [sportsLoading, setSportsLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("omnix-user");
    if (!userStr) {
      window.location.href = "/";
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUsername(user.username || "");
      setUserStats(user.stats || { points: 0, level: 1, roomsCreated: 0 });
    } catch (e) {
      window.location.href = "/";
      return;
    }

    loadMyRooms();
  }, []);

  const loadMyRooms = async () => {
    setLoadingRooms(true);
    try {
      const userStr = localStorage.getItem("omnix-user");
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const response = await fetch(`/api/rooms?creator=${user.username}`);
      const data = await response.json();

      if (data.rooms) {
        const parsed = data.rooms.map((r: any) => typeof r === "string" ? JSON.parse(r) : r);
        setMyRooms(parsed);
      }
    } catch (error) {
      console.error("Error loading rooms:", error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchSportsEvents = async (sport: string) => {
    setSportsLoading(true);
    try {
      const response = await fetch(`/api/sports?sport=${sport}`);
      const data = await response.json();

      if (data.events && data.events.length > 0) {
        setSportsEvents(data.events);
      } else {
        const fallbackEvents = [
          { id: "1", league: "Premier League", home: "Arsenal", away: "Chelsea", date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: "15:00", icon: "⚽" },
          { id: "2", league: "Premier League", home: "Liverpool", away: "Man United", date: new Date(Date.now() + 172800000).toISOString().split('T')[0], time: "17:30", icon: "⚽" },
        ];
        setSportsEvents(fallbackEvents);
      }
    } catch (error) {
      console.error("Sports fetch error:", error);
      const fallbackEvents = [
        { id: "1", league: "Premier League", home: "Arsenal", away: "Chelsea", date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: "15:00", icon: "⚽" },
      ];
      setSportsEvents(fallbackEvents);
    } finally {
      setSportsLoading(false);
    }
  };

  const openSportsModal = () => {
    setShowSportsModal(true);
    fetchSportsEvents(selectedSport);
  };

  const handleSportChange = (sport: string) => {
    setSelectedSport(sport);
    fetchSportsEvents(sport);
  };

  const createRoomFromEvent = (event: SportsEvent) => {
    setShowSportsModal(false);
    setShowCreateRoom(true);
    setRoomName(`${event.home} vs ${event.away}`);
    setRoomCategory("sports");

    const eventDate = new Date(event.date + "T" + event.time);
    const deadlineDate = new Date(eventDate.getTime() - 30 * 60000);
    const deadlineStr = deadlineDate.toISOString().slice(0, 16);

    setPredictions([
      { question: `Who will win: ${event.home} or ${event.away}?`, deadline: deadlineStr, pointValue: 50, answerType: "text", options: [] },
      { question: "What will be the final score?", deadline: deadlineStr, pointValue: 100, answerType: "text", options: [] },
      { question: "Will there be overtime/extra time?", deadline: deadlineStr, pointValue: 30, answerType: "yesno", options: [] },
    ]);
  };

  const addPrediction = () => {
    if (!newQuestion.trim() || !newDeadline) {
      alert("Please enter a question and deadline");
      return;
    }

    setPredictions([...predictions, {
      question: newQuestion,
      deadline: newDeadline,
      pointValue: newPointValue,
      answerType: newAnswerType,
      options: newAnswerType === "multiple" ? newOptions.filter(o => o.trim()) : []
    }]);

    setNewQuestion("");
    setNewDeadline("");
    setNewPointValue(50);
    setNewAnswerType("text");
    setNewOptions(["", ""]);
  };

  const removePrediction = (index: number) => {
    setPredictions(predictions.filter((_, i) => i !== index));
  };

  const createRoom = async () => {
    if (!roomName.trim()) {
      alert("Please enter a room name");
      return;
    }

    if (predictions.length === 0) {
      alert("Please add at least one prediction");
      return;
    }

    setCreating(true);

    try {
      const roomId = Math.random().toString(36).substring(2, 10);
      const room: Room = {
        id: roomId,
        name: roomName,
        creator: username,
        category: roomCategory,
        predictions: predictions.map((p, i) => ({
          id: `pred-${i}-${Date.now()}`,
          question: p.question,
          createdAt: new Date().toISOString(),
          deadline: new Date(p.deadline).toISOString(),
          responses: [],
          resolved: false,
          pointValue: p.pointValue,
          answerType: p.answerType,
          options: p.options
        })),
        createdAt: new Date().toISOString(),
        comments: []
      };

      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room })
      });

      if (response.ok) {
        const userStr = localStorage.getItem("omnix-user");
        if (userStr) {
          const user = JSON.parse(userStr);
          user.stats = user.stats || {};
          user.stats.roomsCreated = (user.stats.roomsCreated || 0) + 1;
          user.stats.points = (user.stats.points || 0) + 20;
          localStorage.setItem("omnix-user", JSON.stringify(user));
        }

        await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, points: 20, correct: 0, total: 0 })
        });

        window.location.href = `/room/${roomId}`;
      }
    } catch (error) {
      alert("Error creating room");
    } finally {
      setCreating(false);
    }
  };

  const shareRoom = (roomId: string, roomName: string) => {
    const message = `🔮 Join my prediction room on Omnix!\n\n📝 *${roomName}*\n\n🎁 Get +10 bonus points for joining!\n\n👉 Click to play:\nhttps://omnix-app.vercel.app/room/${roomId}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const logout = () => {
    localStorage.removeItem("omnix-user");
    window.location.href = "/";
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", padding: "20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <div>
            <h1 style={{ color: "#FFF", fontSize: "24px", margin: 0 }}>{username}</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "4px 0 0 0" }}>⭐ {userStats.points || 0} pts • Level {userStats.level || 1}</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => window.location.href = "/leaderboard"} style={{ padding: "10px 15px", background: "rgba(255,196,0,0.1)", color: "#FFC400", border: "1px solid rgba(255,196,0,0.3)", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>🏆</button>
            <button onClick={logout} style={{ padding: "10px 15px", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>Logout</button>
          </div>
        </div>

        {/* Sports Events Button */}
        <button
          onClick={openSportsModal}
          style={{ width: "100%", padding: "18px", background: "linear-gradient(135deg, rgba(0,174,239,0.2), rgba(138,43,226,0.2))", border: "1px solid rgba(0,174,239,0.3)", borderRadius: "12px", marginBottom: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
        >
          <span style={{ fontSize: "24px" }}>⚽</span>
          <span style={{ color: "#FFF", fontSize: "16px", fontWeight: "600" }}>Browse Live Sports Events</span>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>🇿🇦</span>
        </button>

        {/* Create Room Button */}
        <button
          onClick={() => setShowCreateRoom(true)}
          style={{ width: "100%", padding: "18px", background: "linear-gradient(135deg, #8A2BE2, #00AEEF)", border: "none", borderRadius: "12px", marginBottom: "25px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
        >
          <span style={{ fontSize: "20px" }}>✨</span>
          <span style={{ color: "#FFF", fontSize: "16px", fontWeight: "600" }}>Create Prediction Room</span>
        </button>

        {/* My Rooms */}
        <div style={{ background: "#121212", padding: "20px", borderRadius: "16px", border: "1px solid rgba(138,43,226,0.2)" }}>
          <h2 style={{ color: "#FFF", fontSize: "18px", marginBottom: "15px" }}>📋 My Rooms ({myRooms.length})</h2>

          {loadingRooms ? (
            <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "20px" }}>Loading...</p>
          ) : myRooms.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "20px", fontSize: "14px" }}>No rooms yet. Create your first one!</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {myRooms.map(room => (
                <div key={room.id} style={{ background: "rgba(255,255,255,0.03)", padding: "15px", borderRadius: "10px", border: "1px solid rgba(138,43,226,0.15)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "24px" }}>{getCategoryIcon(room.category)}</span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: "#FFF", fontSize: "15px", margin: 0 }}>{room.name}</h3>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "3px 0 0 0" }}>
                        {room.predictions?.length || 0} predictions • {room.predictions?.reduce((sum, p) => sum + (p.responses?.length || 0), 0) || 0} responses
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => window.location.href = `/room/${room.id}`} style={{ flex: 1, padding: "10px", background: "rgba(138,43,226,0.1)", color: "#8A2BE2", border: "1px solid rgba(138,43,226,0.3)", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}>View</button>
                    <button onClick={() => shareRoom(room.id, room.name)} style={{ flex: 1, padding: "10px", background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}>📱 Share</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sports Modal */}
        {showSportsModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#121212", borderRadius: "16px", width: "100%", maxWidth: "500px", maxHeight: "80vh", overflow: "hidden", border: "1px solid rgba(138,43,226,0.3)" }}>
              <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ color: "#FFF", fontSize: "18px", margin: 0 }}>⚽ Live Sports Events</h2>
                <button onClick={() => setShowSportsModal(false)} style={{ background: "none", border: "none", color: "#FFF", fontSize: "24px", cursor: "pointer" }}>×</button>
              </div>

              {/* Sport Tabs */}
              <div style={{ padding: "15px", display: "flex", gap: "8px", flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                {sportsList.map(sport => (
                  <button
                    key={sport.id}
                    onClick={() => handleSportChange(sport.id)}
                    style={{ padding: "8px 14px", background: selectedSport === sport.id ? "linear-gradient(135deg, #8A2BE2, #00AEEF)" : "rgba(255,255,255,0.05)", color: "#FFF", border: selectedSport === sport.id ? "none" : "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                  >
                    <span>{sport.icon}</span>
                    <span>{sport.name}</span>
                  </button>
                ))}
              </div>

              {/* Events List */}
              <div style={{ padding: "15px", overflowY: "auto", maxHeight: "400px" }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "12px" }}>Click an event to create a prediction room:</p>

                {sportsLoading ? (
                  <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "30px" }}>Loading events...</p>
                ) : sportsEvents.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "30px" }}>No upcoming events. Try another sport!</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {sportsEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={() => createRoomFromEvent(event)}
                        style={{ width: "100%", padding: "15px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(138,43,226,0.2)", borderRadius: "10px", cursor: "pointer", textAlign: "left" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ color: "#8A2BE2", fontSize: "11px", fontWeight: "600" }}>{event.league}</span>
                          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{formatDate(event.date)} • {event.time}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px" }}>
                          <span style={{ color: "#FFF", fontSize: "15px", fontWeight: "600", flex: 1, textAlign: "right" }}>{event.home}</span>
                          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>vs</span>
                          <span style={{ color: "#FFF", fontSize: "15px", fontWeight: "600", flex: 1, textAlign: "left" }}>{event.away}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Room Modal */}
        {showCreateRoom && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, overflowY: "auto", padding: "20px" }}>
            <div style={{ maxWidth: "500px", margin: "0 auto", background: "#121212", borderRadius: "16px", padding: "25px", border: "1px solid rgba(138,43,226,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ color: "#FFF", fontSize: "20px", margin: 0 }}>✨ Create Room</h2>
                <button onClick={() => { setShowCreateRoom(false); setRoomName(""); setPredictions([]); }} style={{ background: "none", border: "none", color: "#FFF", fontSize: "24px", cursor: "pointer" }}>×</button>
              </div>

              {/* Room Details */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", display: "block", marginBottom: "8px" }}>Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g., Champions League Final"
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "15px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", display: "block", marginBottom: "8px" }}>Category</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { id: "sports", icon: "🏆", label: "Sports" },
                    { id: "entertainment", icon: "🎬", label: "Entertainment" },
                    { id: "fun", icon: "🎉", label: "Fun" },
                    { id: "work", icon: "💼", label: "Work" }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setRoomCategory(cat.id)}
                      style={{ padding: "10px 15px", background: roomCategory === cat.id ? "linear-gradient(135deg, #8A2BE2, #00AEEF)" : "rgba(255,255,255,0.05)", color: "#FFF", border: roomCategory === cat.id ? "none" : "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Predictions */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", display: "block", marginBottom: "12px" }}>Predictions ({predictions.length})</label>

                {predictions.map((pred, i) => (
                  <div key={i} style={{ background: "rgba(138,43,226,0.1)", padding: "12px", borderRadius: "8px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: "#FFF", fontSize: "14px", margin: "0 0 5px 0" }}>{pred.question}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: 0 }}>
                        🏆 {pred.pointValue} pts • ⏰ {new Date(pred.deadline).toLocaleString()}
                        {pred.answerType === "yesno" && " • Yes/No"}
                        {pred.answerType === "multiple" && ` • ${pred.options.length} options`}
                      </p>
                    </div>
                    <button onClick={() => removePrediction(i)} style={{ background: "rgba(255,45,146,0.2)", color: "#FF2D92", border: "none", borderRadius: "4px", padding: "5px 10px", fontSize: "12px", cursor: "pointer" }}>✕</button>
                  </div>
                ))}

                {/* Add Prediction Form */}
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "15px", borderRadius: "8px", marginTop: "15px" }}>
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Enter your prediction question..."
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "14px", marginBottom: "10px", boxSizing: "border-box" }}
                  />

                  <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "140px" }}>
                      <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", display: "block", marginBottom: "5px" }}>Deadline</label>
                      <input
                        type="datetime-local"
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ width: "100px" }}>
                      <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", display: "block", marginBottom: "5px" }}>Points</label>
                      <input
                        type="number"
                        value={newPointValue}
                        onChange={(e) => setNewPointValue(Number(e.target.value))}
                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", display: "block", marginBottom: "5px" }}>Answer Type</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {[
                        { id: "text", label: "Text" },
                        { id: "yesno", label: "Yes/No" },
                        { id: "multiple", label: "Multiple Choice" }
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => setNewAnswerType(type.id as "text" | "yesno" | "multiple")}
                          style={{ padding: "8px 12px", background: newAnswerType === type.id ? "rgba(138,43,226,0.3)" : "rgba(255,255,255,0.05)", color: newAnswerType === type.id ? "#8A2BE2" : "#FFF", border: "1px solid rgba(138,43,226,0.2)", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {newAnswerType === "multiple" && (
                    <div style={{ marginBottom: "10px" }}>
                      <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", display: "block", marginBottom: "5px" }}>Options</label>
                      {newOptions.map((opt, i) => (
                        <input
                          key={i}
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newOptions];
                            updated[i] = e.target.value;
                            setNewOptions(updated);
                          }}
                          placeholder={`Option ${i + 1}`}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "13px", marginBottom: "5px", boxSizing: "border-box" }}
                        />
                      ))}
                      <button
                        onClick={() => setNewOptions([...newOptions, ""])}
                        style={{ padding: "6px 12px", background: "rgba(0,174,239,0.1)", color: "#00AEEF", border: "1px solid rgba(0,174,239,0.3)", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                      >
                        + Add Option
                      </button>
                    </div>
                  )}

                  <button
                    onClick={addPrediction}
                    style={{ width: "100%", padding: "12px", background: "rgba(0,230,163,0.1)", color: "#00E6A3", border: "1px solid rgba(0,230,163,0.3)", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                  >
                    + Add Prediction
                  </button>
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={createRoom}
                disabled={creating || !roomName.trim() || predictions.length === 0}
                style={{ width: "100%", padding: "16px", background: (roomName.trim() && predictions.length > 0) ? "linear-gradient(135deg, #8A2BE2, #00AEEF)" : "rgba(255,255,255,0.1)", color: (roomName.trim() && predictions.length > 0) ? "#FFF" : "rgba(255,255,255,0.3)", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "600", cursor: (roomName.trim() && predictions.length > 0) ? "pointer" : "not-allowed" }}
              >
                {creating ? "Creating..." : "Create Room 🚀"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
