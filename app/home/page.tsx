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
  answerType?: "text" | "yesno" | "multiple";
  options?: string[];
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
  category?: string;
}

// Prediction Templates
const TEMPLATES = {
  fun: [
    { q: "Who will be the last to arrive?", type: "text" },
    { q: "Who will drink the most?", type: "text" },
    { q: "Who will fall asleep first?", type: "text" },
    { q: "Who will tell the funniest joke?", type: "text" },
    { q: "Will there be drama tonight?", type: "yesno" },
    { q: "Who's most likely to lose their phone?", type: "text" },
    { q: "What time will the party end?", type: "text" },
    { q: "Who will dance the most?", type: "text" },
  ],
  sports: [
    { q: "Who will win the match?", type: "text" },
    { q: "What will be the final score?", type: "text" },
    { q: "Who will score first?", type: "text" },
    { q: "Will there be a red card?", type: "yesno" },
    { q: "Total goals over/under 2.5?", type: "multiple", options: ["Over 2.5", "Under 2.5"] },
    { q: "Man of the match?", type: "text" },
    { q: "Will there be a penalty?", type: "yesno" },
    { q: "Halftime score?", type: "text" },
  ],
  work: [
    { q: "Will we hit our deadline?", type: "yesno" },
    { q: "Who will send the first Monday email?", type: "text" },
    { q: "How many meetings this week?", type: "text" },
    { q: "Will the project be approved?", type: "yesno" },
    { q: "Who will stay latest on Friday?", type: "text" },
    { q: "Will we get new clients this month?", type: "yesno" },
    { q: "Team lunch spot this week?", type: "text" },
    { q: "Who will be employee of the month?", type: "text" },
  ],
  entertainment: [
    { q: "Who will win the award?", type: "text" },
    { q: "Will there be a plot twist?", type: "yesno" },
    { q: "Who will be eliminated next?", type: "text" },
    { q: "Rotten Tomatoes score prediction?", type: "text" },
    { q: "Will the album go #1?", type: "yesno" },
    { q: "Who will win the reality show?", type: "text" },
    { q: "Box office opening weekend ($M)?", type: "text" },
    { q: "Will there be a sequel announcement?", type: "yesno" },
  ]
};

// Live Sports Events (simulated - in production, fetch from API)
const LIVE_SPORTS = [
  { id: "1", league: "Premier League", home: "Arsenal", away: "Chelsea", date: "2024-12-14", time: "15:00", icon: "⚽" },
  { id: "2", league: "Premier League", home: "Man United", away: "Liverpool", date: "2024-12-15", time: "16:30", icon: "⚽" },
  { id: "3", league: "La Liga", home: "Real Madrid", away: "Barcelona", date: "2024-12-14", time: "20:00", icon: "⚽" },
  { id: "4", league: "NBA", home: "Lakers", away: "Warriors", date: "2024-12-13", time: "22:00", icon: "🏀" },
  { id: "5", league: "NBA", home: "Celtics", away: "Heat", date: "2024-12-14", time: "19:30", icon: "🏀" },
  { id: "6", league: "UFC 310", home: "Pantoja", away: "Asakura", date: "2024-12-14", time: "22:00", icon: "🥊" },
  { id: "7", league: "NFL", home: "Cowboys", away: "Eagles", date: "2024-12-15", time: "20:20", icon: "🏈" },
  { id: "8", league: "Champions League", home: "Bayern", away: "PSG", date: "2024-12-17", time: "21:00", icon: "⚽" },
];

const CATEGORIES = [
  { id: "sports", name: "Sports", icon: "🏆", color: "#00AEEF" },
  { id: "fun", name: "Fun & Social", icon: "🎉", color: "#FF2D92" },
  { id: "work", name: "Work", icon: "💼", color: "#FFC400" },
  { id: "entertainment", name: "Entertainment", icon: "🎬", color: "#8A2BE2" },
];

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  
  const [roomName, setRoomName] = useState("");
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("fun");
  
  const [newQuestion, setNewQuestion] = useState("");
  const [pointValue, setPointValue] = useState(50);
  const [answerType, setAnswerType] = useState<"text" | "yesno" | "multiple">("text");
  const [multipleOptions, setMultipleOptions] = useState<string[]>(["", ""]);
  const [deadlineHours, setDeadlineHours] = useState(24);
  
  const [showTemplates, setShowTemplates] = useState(false);
  const [showLiveSports, setShowLiveSports] = useState(false);
  
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{[key: string]: string}>({});
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

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

  useEffect(() => {
    const userStr = localStorage.getItem("omnix-user");
    
    if (!userStr) {
      window.location.href = "/";
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
      console.error("Error loading user:", error);
      setIsLoading(false);
    }
  }, []);

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
      shared: false,
      category: selectedCategory
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

    if (answerType === "multiple") {
      const validOptions = multipleOptions.filter(o => o.trim());
      if (validOptions.length < 2) {
        alert("Please add at least 2 options for multiple choice");
        return;
      }
    }

    if (!currentRoom) return;

    const prediction: Prediction = {
      id: Math.random().toString(36).substring(2, 10),
      question: newQuestion,
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + deadlineHours * 60 * 60 * 1000).toISOString(),
      responses: [],
      resolved: false,
      pointValue: pointValue,
      winners: [],
      answerType: answerType,
      options: answerType === "multiple" ? multipleOptions.filter(o => o.trim()) : undefined
    };

    const updatedRoom = {
      ...currentRoom,
      predictions: [...currentRoom.predictions, prediction]
    };

    setCurrentRoom(updatedRoom);
    setNewQuestion("");
    setAnswerType("text");
    setMultipleOptions(["", ""]);
  };

  const addFromTemplate = (template: { q: string; type: string; options?: string[] }) => {
    setNewQuestion(template.q);
    setAnswerType(template.type as "text" | "yesno" | "multiple");
    if (template.options) {
      setMultipleOptions(template.options);
    }
    setShowTemplates(false);
  };

  const addFromSportsEvent = (event: typeof LIVE_SPORTS[0]) => {
    const roomName = `${event.home} vs ${event.away}`;
    setRoomName(roomName);
    setSelectedCategory("sports");
    setShowLiveSports(false);
    
    // Auto-create room with event
    const roomId = Math.random().toString(36).substring(2, 10);
    const newRoom: Room = {
      id: roomId,
      name: roomName,
      creator: username,
      predictions: [
        {
          id: Math.random().toString(36).substring(2, 10),
          question: `Who will win: ${event.home} vs ${event.away}?`,
          createdAt: new Date().toISOString(),
          deadline: new Date(`${event.date}T${event.time}`).toISOString(),
          responses: [],
          resolved: false,
          pointValue: 100,
          winners: [],
          answerType: "multiple",
          options: [event.home, event.away, "Draw"]
        }
      ],
      createdAt: new Date().toISOString(),
      shared: false,
      category: "sports"
    };
    setCurrentRoom(newRoom);
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

      const categoryIcon = CATEGORIES.find(c => c.id === currentRoom.category)?.icon || "🔮";
      const predictionsList = currentRoom.predictions.map((p, i) => `${i + 1}. ${p.question} (🏆 ${p.pointValue} pts)`).join("\n");
      const userStr = localStorage.getItem("omnix-user");
      const user = userStr ? JSON.parse(userStr) : { stats: { level: 1 } };
      
      const message = `${categoryIcon} *${currentRoom.name}*\n\nby ${username} (Level ${user.stats?.level || 1})\n\n${predictionsList}\n\n🎁 +10 bonus points for joining!\n\n👉 https://omnix-app.vercel.app/room/${currentRoom.id}`;
      
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
      
      setCurrentRoom(null);
    } catch (error) {
      alert("Failed to save room. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const shareOnTelegram = async () => {
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

      if (!response.ok) throw new Error("Failed to save room");

      const roomIdsStr = localStorage.getItem(`omnix-room-ids-${username}`);
      const roomIds = roomIdsStr ? JSON.parse(roomIdsStr) : [];
      if (!roomIds.includes(currentRoom.id)) {
        roomIds.push(currentRoom.id);
        localStorage.setItem(`omnix-room-ids-${username}`, JSON.stringify(roomIds));
      }

      setMyRooms([...myRooms, { ...currentRoom, shared: true }]);

      const categoryIcon = CATEGORIES.find(c => c.id === currentRoom.category)?.icon || "🔮";
      const predictionsList = currentRoom.predictions.map((p, i) => `${i + 1}. ${p.question} (🏆 ${p.pointValue} pts)`).join("\n");
      
      const message = `${categoryIcon} ${currentRoom.name}\n\n${predictionsList}\n\n🎁 +10 bonus points for joining!\n\n👉 https://omnix-app.vercel.app/room/${currentRoom.id}`;
      
      window.open(`https://t.me/share/url?url=${encodeURIComponent(`https://omnix-app.vercel.app/room/${currentRoom.id}`)}&text=${encodeURIComponent(message)}`, "_blank");
      
      setCurrentRoom(null);
    } catch (error) {
      alert("Failed to save room. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
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

      if (!response.ok) throw new Error("Failed to save room");

      const roomIdsStr = localStorage.getItem(`omnix-room-ids-${username}`);
      const roomIds = roomIdsStr ? JSON.parse(roomIdsStr) : [];
      if (!roomIds.includes(currentRoom.id)) {
        roomIds.push(currentRoom.id);
        localStorage.setItem(`omnix-room-ids-${username}`, JSON.stringify(roomIds));
      }

      setMyRooms([...myRooms, { ...currentRoom, shared: true }]);

      await navigator.clipboard.writeText(`https://omnix-app.vercel.app/room/${currentRoom.id}`);
      alert("Link copied to clipboard! 📋");
      
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
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>🔮</div>
          <p style={{ color: "#8A2BE2", fontSize: "18px" }}>Loading...</p>
        </div>
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
                onClick={() => window.location.href = "/leaderboard"}
                style={{ padding: "8px 16px", background: "rgba(138,43,226,0.1)", color: "#8A2BE2", border: "1px solid rgba(138,43,226,0.3)", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
              >
                🏆 Leaderboard
              </button>
              <button
                onClick={() => { localStorage.removeItem("omnix-user"); window.location.href = "/"; }}
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

            {/* Category Selection */}
            <div style={{ marginBottom: "20px" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "10px" }}>Select Category:</p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{ 
                      padding: "10px 16px", 
                      background: selectedCategory === cat.id ? `${cat.color}20` : "rgba(255,255,255,0.05)", 
                      color: selectedCategory === cat.id ? cat.color : "rgba(255,255,255,0.6)", 
                      border: selectedCategory === cat.id ? `2px solid ${cat.color}` : "1px solid rgba(255,255,255,0.1)", 
                      borderRadius: "8px", 
                      fontSize: "14px", 
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Sports Button */}
            <button
              onClick={() => setShowLiveSports(true)}
              style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, rgba(0,174,239,0.1), rgba(0,230,163,0.1))", color: "#00AEEF", border: "1px solid rgba(0,174,239,0.3)", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", marginBottom: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              ⚽ Browse Live Sports Events
            </button>
            
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
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                  <span style={{ fontSize: "20px" }}>{CATEGORIES.find(c => c.id === currentRoom.category)?.icon || "🔮"}</span>
                  <h2 style={{ color: "#FFF", fontSize: "20px", margin: 0 }}>{currentRoom.name}</h2>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>Add your prediction questions below</p>
              </div>
              <button
                onClick={() => setCurrentRoom(null)}
                style={{ padding: "8px 16px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>

            {/* Templates Button */}
            <button
              onClick={() => setShowTemplates(true)}
              style={{ width: "100%", padding: "12px", background: "rgba(255,196,0,0.1)", color: "#FFC400", border: "1px solid rgba(255,196,0,0.3)", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              💡 Use a Template Question
            </button>

            {/* Question Input */}
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Enter prediction question..."
                style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "15px", marginBottom: "15px", boxSizing: "border-box" }}
              />
              
              {/* Answer Type Selection */}
              <div style={{ marginBottom: "15px" }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "8px" }}>Answer Type:</p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setAnswerType("text")}
                    style={{ padding: "8px 14px", background: answerType === "text" ? "rgba(138,43,226,0.2)" : "rgba(255,255,255,0.05)", color: answerType === "text" ? "#8A2BE2" : "rgba(255,255,255,0.6)", border: answerType === "text" ? "2px solid #8A2BE2" : "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
                  >
                    ✏️ Text
                  </button>
                  <button
                    onClick={() => setAnswerType("yesno")}
                    style={{ padding: "8px 14px", background: answerType === "yesno" ? "rgba(0,230,163,0.2)" : "rgba(255,255,255,0.05)", color: answerType === "yesno" ? "#00E6A3" : "rgba(255,255,255,0.6)", border: answerType === "yesno" ? "2px solid #00E6A3" : "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
                  >
                    👍👎 Yes/No
                  </button>
                  <button
                    onClick={() => setAnswerType("multiple")}
                    style={{ padding: "8px 14px", background: answerType === "multiple" ? "rgba(0,174,239,0.2)" : "rgba(255,255,255,0.05)", color: answerType === "multiple" ? "#00AEEF" : "rgba(255,255,255,0.6)", border: answerType === "multiple" ? "2px solid #00AEEF" : "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
                  >
                    📋 Multiple Choice
                  </button>
                </div>
              </div>

              {/* Multiple Choice Options */}
              {answerType === "multiple" && (
                <div style={{ marginBottom: "15px", padding: "15px", background: "rgba(0,174,239,0.1)", borderRadius: "8px" }}>
                  <p style={{ color: "#00AEEF", fontSize: "13px", marginBottom: "10px" }}>Options:</p>
                  {multipleOptions.map((opt, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...multipleOptions];
                          newOpts[i] = e.target.value;
                          setMultipleOptions(newOpts);
                        }}
                        placeholder={`Option ${i + 1}`}
                        style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#FFF", fontSize: "14px" }}
                      />
                      {multipleOptions.length > 2 && (
                        <button
                          onClick={() => setMultipleOptions(multipleOptions.filter((_, idx) => idx !== i))}
                          style={{ padding: "10px", background: "rgba(255,45,146,0.1)", color: "#FF2D92", border: "none", borderRadius: "6px", cursor: "pointer" }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setMultipleOptions([...multipleOptions, ""])}
                    style={{ padding: "8px 12px", background: "transparent", color: "#00AEEF", border: "1px dashed rgba(0,174,239,0.5)", borderRadius: "6px", fontSize: "13px", cursor: "pointer", width: "100%" }}
                  >
                    + Add Option
                  </button>
                </div>
              )}
              
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
                  <select
                    value={deadlineHours}
                    onChange={(e) => setDeadlineHours(Number(e.target.value))}
                    style={{ padding: "10px 15px", borderRadius: "8px", border: "2px solid rgba(0,174,239,0.5)", background: "rgba(0,174,239,0.15)", color: "#00AEEF", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}
                  >
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={12}>12 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={48}>48 hours</option>
                    <option value={72}>3 days</option>
                    <option value={168}>1 week</option>
                  </select>
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
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          <span style={{ color: "#FFC400", fontSize: "12px", background: "rgba(255,196,0,0.1)", padding: "3px 10px", borderRadius: "12px" }}>🏆 {pred.pointValue} pts</span>
                          <span style={{ color: "#00AEEF", fontSize: "12px", background: "rgba(0,174,239,0.1)", padding: "3px 10px", borderRadius: "12px" }}>⏳ {deadlineHours}h</span>
                          <span style={{ color: "#8A2BE2", fontSize: "12px", background: "rgba(138,43,226,0.1)", padding: "3px 10px", borderRadius: "12px" }}>
                            {pred.answerType === "yesno" ? "👍👎 Yes/No" : pred.answerType === "multiple" ? "📋 Multiple" : "✏️ Text"}
                          </span>
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

            {/* Share Buttons */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={shareOnWhatsApp}
                disabled={currentRoom.predictions.length === 0 || saving}
                style={{
                  flex: 1,
                  minWidth: "140px",
                  padding: "16px",
                  background: currentRoom.predictions.length > 0 ? "rgba(37,211,102,0.1)" : "rgba(255,255,255,0.05)",
                  color: currentRoom.predictions.length > 0 ? "#25D366" : "rgba(255,255,255,0.3)",
                  border: currentRoom.predictions.length > 0 ? "1px solid rgba(37,211,102,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: currentRoom.predictions.length > 0 ? "pointer" : "not-allowed",
                }}
              >
                📱 WhatsApp
              </button>
              <button
                onClick={shareOnTelegram}
                disabled={currentRoom.predictions.length === 0 || saving}
                style={{
                  flex: 1,
                  minWidth: "140px",
                  padding: "16px",
                  background: currentRoom.predictions.length > 0 ? "rgba(0,136,204,0.1)" : "rgba(255,255,255,0.05)",
                  color: currentRoom.predictions.length > 0 ? "#0088CC" : "rgba(255,255,255,0.3)",
                  border: currentRoom.predictions.length > 0 ? "1px solid rgba(0,136,204,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: currentRoom.predictions.length > 0 ? "pointer" : "not-allowed",
                }}
              >
                ✈️ Telegram
              </button>
              <button
                onClick={copyLink}
                disabled={currentRoom.predictions.length === 0 || saving}
                style={{
                  flex: 1,
                  minWidth: "140px",
                  padding: "16px",
                  background: currentRoom.predictions.length > 0 ? "rgba(138,43,226,0.1)" : "rgba(255,255,255,0.05)",
                  color: currentRoom.predictions.length > 0 ? "#8A2BE2" : "rgba(255,255,255,0.3)",
                  border: currentRoom.predictions.length > 0 ? "1px solid rgba(138,43,226,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: currentRoom.predictions.length > 0 ? "pointer" : "not-allowed",
                }}
              >
                🔗 Copy Link
              </button>
            </div>
          </div>
        )}

        {/* Templates Modal */}
        {showTemplates && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ background: "#121212", padding: "25px", borderRadius: "16px", maxWidth: "500px", width: "100%", maxHeight: "80vh", overflow: "auto", border: "1px solid rgba(138,43,226,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ color: "#FFF", fontSize: "18px", margin: 0 }}>💡 Template Questions</h3>
                <button onClick={() => setShowTemplates(false)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "20px", cursor: "pointer" }}>✕</button>
              </div>
              
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginBottom: "15px" }}>
                {CATEGORIES.find(c => c.id === selectedCategory)?.icon} {CATEGORIES.find(c => c.id === selectedCategory)?.name} templates:
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {TEMPLATES[selectedCategory as keyof typeof TEMPLATES]?.map((template, i) => (
                  <button
                    key={i}
                    onClick={() => addFromTemplate(template)}
                    style={{ padding: "12px 15px", background: "rgba(255,255,255,0.05)", color: "#FFF", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "14px", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <span>{template.q}</span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>
                      {template.type === "yesno" ? "👍👎" : template.type === "multiple" ? "📋" : "✏️"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live Sports Modal */}
        {showLiveSports && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ background: "#121212", padding: "25px", borderRadius: "16px", maxWidth: "500px", width: "100%", maxHeight: "80vh", overflow: "auto", border: "1px solid rgba(0,174,239,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ color: "#FFF", fontSize: "18px", margin: 0 }}>⚽ Live Sports Events</h3>
                <button onClick={() => setShowLiveSports(false)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "20px", cursor: "pointer" }}>✕</button>
              </div>
              
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginBottom: "15px" }}>
                Click an event to create a prediction room:
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {LIVE_SPORTS.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => addFromSportsEvent(event)}
                    style={{ padding: "15px", background: "rgba(255,255,255,0.05)", color: "#FFF", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ color: "#00AEEF", fontSize: "12px", fontWeight: "600" }}>{event.icon} {event.league}</span>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{event.date} • {event.time}</span>
                    </div>
                    <p style={{ color: "#FFF", fontSize: "16px", margin: 0, fontWeight: "600" }}>
                      {event.home} vs {event.away}
                    </p>
                  </button>
                ))}
              </div>
            </div>
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
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "18px" }}>{CATEGORIES.find(c => c.id === room.category)?.icon || "🔮"}</span>
                      <h3 style={{ color: "#FFF", fontSize: "16px", margin: 0 }}>{room.name}</h3>
                    </div>
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
                      const categoryIcon = CATEGORIES.find(c => c.id === room.category)?.icon || "🔮";
                      const predictionsList = room.predictions.map((p, i) => `${i + 1}. ${p.question} (🏆 ${p.pointValue || 50} pts)`).join("\n");
                      const message = `${categoryIcon} *${room.name}*\n\n${predictionsList}\n\n🎁 +10 bonus points for joining!\n\n👉 https://omnix-app.vercel.app/room/${room.id}`;
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
