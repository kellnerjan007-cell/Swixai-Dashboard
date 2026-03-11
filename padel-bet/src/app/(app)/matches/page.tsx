"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Match = {
  id: string;
  homePlayer: string;
  awayPlayer: string;
  tournament: string;
  matchType: string;
  scheduledAt: string;
  coinCost: number;
  status: string;
  venue: string | null;
  round: string | null;
  predictions: Array<{ predictedWinner: string; status: string; coinsSpent: number }>;
};

const MATCH_TYPE_LABELS: Record<string, string> = {
  NORMAL: "Normal",
  TOP_MATCH: "⭐ Top Match",
  COMBO: "🔀 Kombi",
};

const MATCH_TYPE_COLORS: Record<string, string> = {
  NORMAL: "#8892b0",
  TOP_MATCH: "#f5c518",
  COMBO: "#00e5a0",
};

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/matches")
      .then(r => r.json())
      .then(data => { setMatches(data); setLoading(false); });
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function predict(matchId: string, winner: "home" | "away") {
    setPredicting(matchId);
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, predictedWinner: winner }),
    });
    const data = await res.json();
    setPredicting(null);
    if (!res.ok) {
      if (res.status === 402) {
        showToast("Nicht genug Coins! Kaufe mehr im Shop.");
        setTimeout(() => router.push("/coins"), 1500);
      } else {
        showToast(data.error ?? "Fehler beim Tippen.");
      }
    } else {
      showToast("Tipp gespeichert! Viel Erfolg 🎾");
      setMatches(prev => prev.map(m =>
        m.id === matchId
          ? { ...m, predictions: [{ predictedWinner: winner, status: "PENDING", coinsSpent: m.coinCost }] }
          : m
      ));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-3">🎾</div>
          <p style={{ color: "#8892b0" }}>Lade Matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl font-medium text-sm shadow-lg" style={{ background: "#00e5a0", color: "#0f1117" }}>
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-black mb-1" style={{ color: "#f0f2f8" }}>Matches</h1>
        <p style={{ color: "#8892b0" }}>Tippe auf den Gewinner und verdiene Coins!</p>
      </div>

      {/* Cost legend */}
      <div className="glass rounded-xl p-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span style={{ color: "#8892b0" }}>Normal:</span>
          <span className="font-bold" style={{ color: "#f5c518" }}>🪙 10</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: "#8892b0" }}>Top Match:</span>
          <span className="font-bold" style={{ color: "#f5c518" }}>🪙 25</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: "#8892b0" }}>Kombi:</span>
          <span className="font-bold" style={{ color: "#f5c518" }}>🪙 30</span>
        </div>
        <div className="ml-auto flex items-center gap-1" style={{ color: "#00e5a0" }}>
          ✓ Richtig = +15 Coins zurück
        </div>
      </div>

      {matches.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🎾</div>
          <p className="font-semibold" style={{ color: "#f0f2f8" }}>Keine Matches verfügbar</p>
          <p className="text-sm mt-1" style={{ color: "#8892b0" }}>Schau später wieder vorbei!</p>
        </div>
      )}

      <div className="space-y-4">
        {matches.map(match => {
          const hasPrediction = match.predictions.length > 0;
          const myPick = hasPrediction ? match.predictions[0].predictedWinner : null;
          const isLoading = predicting === match.id;

          return (
            <div key={match.id} className="glass rounded-2xl p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,229,160,0.1)", color: MATCH_TYPE_COLORS[match.matchType] || "#8892b0", border: `1px solid ${MATCH_TYPE_COLORS[match.matchType]}33` }}>
                    {MATCH_TYPE_LABELS[match.matchType] ?? match.matchType}
                  </span>
                  {match.status === "LIVE" && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full pulse-green" style={{ background: "rgba(0,229,160,0.2)", color: "#00e5a0" }}>
                      LIVE
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold" style={{ color: "#f5c518" }}>🪙 {match.coinCost}</div>
              </div>

              {/* Players */}
              <div className="grid grid-cols-3 gap-3 items-center mb-4">
                <button
                  onClick={() => !hasPrediction && predict(match.id, "home")}
                  disabled={hasPrediction || isLoading}
                  className="rounded-xl p-3 text-center transition disabled:cursor-default"
                  style={{
                    background: myPick === "home" ? "rgba(0,229,160,0.15)" : "#242938",
                    border: myPick === "home" ? "2px solid #00e5a0" : "2px solid transparent",
                  }}
                >
                  <div className="text-2xl mb-1">🏓</div>
                  <div className="font-bold text-sm" style={{ color: "#f0f2f8" }}>{match.homePlayer}</div>
                  {myPick === "home" && <div className="text-xs mt-1" style={{ color: "#00e5a0" }}>Mein Tipp ✓</div>}
                </button>

                <div className="text-center">
                  <div className="font-black text-lg" style={{ color: "#8892b0" }}>VS</div>
                  <div className="text-xs mt-1" style={{ color: "#8892b0" }}>
                    {new Date(match.scheduledAt).toLocaleDateString("de-CH", { day: "2-digit", month: "short" })}
                  </div>
                  <div className="text-xs" style={{ color: "#8892b0" }}>
                    {new Date(match.scheduledAt).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                <button
                  onClick={() => !hasPrediction && predict(match.id, "away")}
                  disabled={hasPrediction || isLoading}
                  className="rounded-xl p-3 text-center transition disabled:cursor-default"
                  style={{
                    background: myPick === "away" ? "rgba(0,229,160,0.15)" : "#242938",
                    border: myPick === "away" ? "2px solid #00e5a0" : "2px solid transparent",
                  }}
                >
                  <div className="text-2xl mb-1">🏓</div>
                  <div className="font-bold text-sm" style={{ color: "#f0f2f8" }}>{match.awayPlayer}</div>
                  {myPick === "away" && <div className="text-xs mt-1" style={{ color: "#00e5a0" }}>Mein Tipp ✓</div>}
                </button>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs" style={{ color: "#8892b0" }}>
                <span>{match.tournament}{match.round ? ` · ${match.round}` : ""}</span>
                {!hasPrediction && !isLoading && (
                  <span>Klick auf einen Spieler zum Tippen</span>
                )}
                {isLoading && <span style={{ color: "#00e5a0" }}>Tipp wird gespeichert...</span>}
                {hasPrediction && <span style={{ color: "#00e5a0" }}>Tipp abgegeben ✓</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
