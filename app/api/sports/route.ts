import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport") || "football";

  const today = new Date();
  const getDateString = (daysFromNow: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  };

  const sportsData: { [key: string]: any[] } = {
    football: [
      // South African PSL
      { league: "PSL 🇿🇦", home: "Kaizer Chiefs", away: "Orlando Pirates", date: getDateString(1), time: "15:30", icon: "⚽" },
      { league: "PSL 🇿🇦", home: "Mamelodi Sundowns", away: "SuperSport United", date: getDateString(2), time: "17:30", icon: "⚽" },
      { league: "PSL 🇿🇦", home: "AmaZulu FC", away: "Cape Town City", date: getDateString(3), time: "15:00", icon: "⚽" },
      { league: "PSL 🇿🇦", home: "Stellenbosch FC", away: "Sekhukhune United", date: getDateString(4), time: "19:30", icon: "⚽" },
      // Premier League
      { league: "Premier League", home: "Arsenal", away: "Everton", date: getDateString(1), time: "15:00", icon: "⚽" },
      { league: "Premier League", home: "Liverpool", away: "Fulham", date: getDateString(2), time: "17:30", icon: "⚽" },
      { league: "Premier League", home: "Man City", away: "Man United", date: getDateString(3), time: "16:30", icon: "⚽" },
      // La Liga
      { league: "La Liga", home: "Real Madrid", away: "Getafe", date: getDateString(1), time: "21:00", icon: "⚽" },
      { league: "La Liga", home: "Barcelona", away: "Atletico Madrid", date: getDateString(2), time: "20:00", icon: "⚽" },
    ],
    rugby: [
      // South African URC & Currie Cup
      { league: "URC 🇿🇦", home: "Stormers", away: "Bulls", date: getDateString(1), time: "17:00", icon: "🏉" },
      { league: "URC 🇿🇦", home: "Sharks", away: "Lions", date: getDateString(2), time: "15:00", icon: "🏉" },
      { league: "URC 🇿🇦", home: "Bulls", away: "Stormers", date: getDateString(5), time: "17:00", icon: "🏉" },
      { league: "Currie Cup 🇿🇦", home: "Cheetahs", away: "Griquas", date: getDateString(3), time: "19:00", icon: "🏉" },
      { league: "Currie Cup 🇿🇦", home: "Pumas", away: "Griffons", date: getDateString(4), time: "15:00", icon: "🏉" },
      // Springboks
      { league: "Test Match 🇿🇦", home: "Springboks", away: "All Blacks", date: getDateString(7), time: "17:00", icon: "🏉" },
      // International
      { league: "Six Nations", home: "England", away: "Ireland", date: getDateString(6), time: "16:45", icon: "🏉" },
    ],
    cricket: [
      // South African Cricket
      { league: "SA20 🇿🇦", home: "Joburg Super Kings", away: "Pretoria Capitals", date: getDateString(1), time: "18:00", icon: "🏏" },
      { league: "SA20 🇿🇦", home: "Durban Super Giants", away: "MI Cape Town", date: getDateString(2), time: "14:00", icon: "🏏" },
      { league: "SA20 🇿🇦", home: "Paarl Royals", away: "Sunrisers Eastern Cape", date: getDateString(3), time: "18:00", icon: "🏏" },
      { league: "CSA T20 🇿🇦", home: "Titans", away: "Lions", date: getDateString(4), time: "14:00", icon: "🏏" },
      { league: "Proteas 🇿🇦", home: "South Africa", away: "India", date: getDateString(5), time: "10:00", icon: "🏏" },
      // International
      { league: "Test Match", home: "Australia", away: "England", date: getDateString(2), time: "04:00", icon: "🏏" },
      { league: "IPL", home: "Mumbai Indians", away: "Chennai Super Kings", date: getDateString(6), time: "16:00", icon: "🏏" },
    ],
    basketball: [
      { league: "NBA", home: "Lakers", away: "Warriors", date: getDateString(0), time: "22:30", icon: "🏀" },
      { league: "NBA", home: "Celtics", away: "Heat", date: getDateString(1), time: "19:30", icon: "🏀" },
      { league: "NBA", home: "Bucks", away: "76ers", date: getDateString(1), time: "20:00", icon: "🏀" },
      { league: "NBA", home: "Nuggets", away: "Suns", date: getDateString(2), time: "21:00", icon: "🏀" },
    ],
    mma: [
      { league: "UFC 311", home: "Makhachev", away: "Tsarukyan", date: getDateString(5), time: "22:00", icon: "🥊" },
      { league: "UFC Fight Night", home: "Holloway", away: "Allen", date: getDateString(8), time: "23:00", icon: "🥊" },
      { league: "UFC 312", home: "Pereira", away: "Ankalaev", date: getDateString(12), time: "22:00", icon: "🥊" },
      { league: "EFC 🇿🇦", home: "Sobze", away: "Dalcha", date: getDateString(6), time: "20:00", icon: "🥊" },
    ],
    tennis: [
      { league: "ATP Finals", home: "Sinner", away: "Alcaraz", date: getDateString(2), time: "14:00", icon: "🎾" },
      { league: "ATP Finals", home: "Djokovic", away: "Medvedev", date: getDateString(3), time: "20:00", icon: "🎾" },
      { league: "WTA Finals", home: "Swiatek", away: "Sabalenka", date: getDateString(2), time: "18:00", icon: "🎾" },
    ],
  };

  const events = sportsData[sport] || [];
  const eventsWithIds = events.map((e, i) => ({ ...e, id: `${sport}-${i}-${Date.now()}` }));

  return NextResponse.json({ events: eventsWithIds });
}
