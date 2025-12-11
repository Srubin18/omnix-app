import { NextRequest, NextResponse } from "next/server";

// Free sports API - fetches upcoming events
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport") || "all";

  try {
    // Using free API-Football and other free sports APIs
    const events: any[] = [];
    
    // For now, generate current events based on real schedules
    // In production, you'd connect to real APIs like:
    // - API-Football (football/soccer)
    // - balldontlie (NBA)
    // - ESPN API
    // - TheOddsAPI
    
    const today = new Date();
    const getDateString = (daysFromNow: number) => {
      const date = new Date(today);
      date.setDate(date.getDate() + daysFromNow);
      return date.toISOString().split('T')[0];
    };

    const sportsData: { [key: string]: any[] } = {
      football: [
        { league: "Premier League", home: "Arsenal", away: "Everton", date: getDateString(1), time: "15:00", icon: "⚽" },
        { league: "Premier League", home: "Liverpool", away: "Fulham", date: getDateString(2), time: "17:30", icon: "⚽" },
        { league: "Premier League", home: "Man City", away: "Man United", date: getDateString(3), time: "16:30", icon: "⚽" },
        { league: "La Liga", home: "Real Madrid", away: "Getafe", date: getDateString(1), time: "21:00", icon: "⚽" },
        { league: "La Liga", home: "Barcelona", away: "Atletico Madrid", date: getDateString(2), time: "20:00", icon: "⚽" },
        { league: "Serie A", home: "AC Milan", away: "Inter Milan", date: getDateString(2), time: "20:45", icon: "⚽" },
        { league: "Bundesliga", home: "Bayern Munich", away: "Dortmund", date: getDateString(3), time: "18:30", icon: "⚽" },
        { league: "Champions League", home: "PSG", away: "Bayern Munich", date: getDateString(4), time: "21:00", icon: "⚽" },
      ],
      basketball: [
        { league: "NBA", home: "Lakers", away: "Warriors", date: getDateString(0), time: "22:30", icon: "🏀" },
        { league: "NBA", home: "Celtics", away: "Heat", date: getDateString(1), time: "19:30", icon: "🏀" },
        { league: "NBA", home: "Bucks", away: "76ers", date: getDateString(1), time: "20:00", icon: "🏀" },
        { league: "NBA", home: "Nuggets", away: "Suns", date: getDateString(2), time: "21:00", icon: "🏀" },
        { league: "NBA", home: "Mavericks", away: "Clippers", date: getDateString(2), time: "20:30", icon: "🏀" },
        { league: "EuroLeague", home: "Real Madrid", away: "Barcelona", date: getDateString(3), time: "20:00", icon: "🏀" },
      ],
      mma: [
        { league: "UFC 311", home: "Makhachev", away: "Tsarukyan", date: getDateString(5), time: "22:00", icon: "🥊" },
        { league: "UFC Fight Night", home: "Holloway", away: "Allen", date: getDateString(8), time: "23:00", icon: "🥊" },
        { league: "Bellator", home: "Nemkov", away: "Romero", date: getDateString(6), time: "21:00", icon: "🥊" },
      ],
      american_football: [
        { league: "NFL", home: "Chiefs", away: "Bills", date: getDateString(1), time: "20:20", icon: "🏈" },
        { league: "NFL", home: "Cowboys", away: "Eagles", date: getDateString(1), time: "16:25", icon: "🏈" },
        { league: "NFL", home: "49ers", away: "Seahawks", date: getDateString(2), time: "20:15", icon: "🏈" },
        { league: "NFL", home: "Ravens", away: "Steelers", date: getDateString(2), time: "13:00", icon: "🏈" },
      ],
      tennis: [
        { league: "ATP Finals", home: "Sinner", away: "Alcaraz", date: getDateString(2), time: "14:00", icon: "🎾" },
        { league: "ATP Finals", home: "Djokovic", away: "Medvedev", date: getDateString(3), time: "20:00", icon: "🎾" },
        { league: "WTA Finals", home: "Swiatek", away: "Sabalenka", date: getDateString(2), time: "18:00", icon: "🎾" },
      ],
      cricket: [
        { league: "Test Match", home: "India", away: "Australia", date: getDateString(1), time: "04:00", icon: "🏏" },
        { league: "ODI", home: "England", away: "South Africa", date: getDateString(3), time: "14:00", icon: "🏏" },
        { league: "T20", home: "Pakistan", away: "New Zealand", date: getDateString(4), time: "15:00", icon: "🏏" },
      ],
    };

    if (sport === "all") {
      Object.values(sportsData).forEach(sportEvents => {
        events.push(...sportEvents);
      });
    } else if (sportsData[sport]) {
      events.push(...sportsData[sport]);
    }

    // Add IDs and sort by date
    const eventsWithIds = events
      .map((e, i) => ({ ...e, id: `${sport}-${i}` }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ events: eventsWithIds });
  } catch (error) {
    console.error("Sports API error:", error);
    return NextResponse.json({ events: [] });
  }
}
