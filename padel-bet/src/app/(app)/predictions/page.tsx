"use client";

import { useEffect, useState } from "react";

type Prediction = {
  id: string;
  predictedWinner: string;
  coinsSpent: number;
  coinsEarned: number;
  status: string;
  createdAt: string;
  match: {
    homePlayer: string;
    awayPlayer: string;
    tournament: string;
    status: string;
    winner: string | null;
  };
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Ausstehend", color: "#f5c518", bg: "rgba(245,197,24,0.1)" },
  WON: { label: "Gewonnen ✓", color: "#00e5a0", bg: "rgba(0,229,160,0.1)" },
  LOST: { label: "Verloren", color: "#ff4757", bg: "rgba(255,71,87,0.1)" },
  REFUNDED: { label: "Rückerstattung", color: "#8892b0", bg: "rgba(136,146,176,0.1)" },
};

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/predictions")
      .then(r => r.json())
      .then(data => { setPredictions(data); setLoading(false); });
  }, []);

  const won = predictions.filter(p => p.status === "WON").length;
  const total = predictions.filter(p => p.status !== "PENDING").length;
  const totalEarned = predictions.reduce((s, p) => s + p.coinsEarned, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p style={{ color: "#8892b0" }}>Lade Tipps...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black mb-1" style={{ color: "#f0f2f8" }}>Meine Tipps</h1>
        <p style={{ color: "#8892b0" }}>Dein Tipp-Verlauf</p>
      </div>

      {/* Stats */}
      {predictions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-black" style={{ color: "#00e5a0" }}>{won}/{total}</div>
            <div className="text-xs mt-1" style={{ color: "#8892b0" }}>Gewonnen</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-black" style={{ color: "#f5c518" }}>
              {total > 0 ? Math.round((won / total) * 100) : 0}%
            </div>
            <div className="text-xs mt-1" style={{ color: "#8892b0" }}>Trefferquote</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-black" style={{ color: "#f5c518" }}>🪙 {totalEarned}</div>
            <div className="text-xs mt-1" style={{ color: "#8892b0" }}>Coins verdient</div>
          </div>
        </div>
      )}

      {predictions.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <p className="font-semibold" style={{ color: "#f0f2f8" }}>Noch keine Tipps abgegeben</p>
          <p className="text-sm mt-1 mb-4" style={{ color: "#8892b0" }}>Tippe auf Matches und verdiene Coins!</p>
          <a href="/matches" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm" style={{ background: "#00e5a0", color: "#0f1117" }}>
            Zu den Matches →
          </a>
        </div>
      )}

      <div className="space-y-3">
        {predictions.map(pred => {
          const sc = STATUS_CONFIG[pred.status] ?? STATUS_CONFIG.PENDING;
          const playerPicked = pred.predictedWinner === "home" ? pred.match.homePlayer : pred.match.awayPlayer;

          return (
            <div key={pred.id} className="glass rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold" style={{ color: "#f0f2f8" }}>
                    {pred.match.homePlayer} vs {pred.match.awayPlayer}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#8892b0" }}>
                    {pred.match.tournament}
                  </div>
                  <div className="text-sm mt-2" style={{ color: "#8892b0" }}>
                    Mein Tipp: <span className="font-semibold" style={{ color: "#f0f2f8" }}>{playerPicked}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "#8892b0" }}>
                    <span>Einsatz: 🪙 {pred.coinsSpent}</span>
                    {pred.coinsEarned > 0 && <span style={{ color: "#00e5a0" }}>Gewinn: +🪙 {pred.coinsEarned}</span>}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
