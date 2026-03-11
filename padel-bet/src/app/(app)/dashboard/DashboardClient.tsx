"use client";

import { useState } from "react";
import Link from "next/link";
import { AD_LIMIT_PER_DAY, isNewDay } from "@/lib/coins";

type Match = {
  id: string;
  homePlayer: string;
  awayPlayer: string;
  tournament: string;
  matchType: string;
  scheduledAt: Date;
  coinCost: number;
  status: string;
};

type User = {
  name: string | null;
  coins: number;
  loginStreak: number;
  lastLoginDate: Date | null;
  adsWatchedToday: number;
  lastAdWatchDate: Date | null;
  _count: { predictions: number };
};

export function DashboardClient({ user, recentMatches }: { user: User; recentMatches: Match[] }) {
  const [coins, setCoins] = useState(user.coins);
  const [adLoading, setAdLoading] = useState(false);
  const [loginClaimed, setLoginClaimed] = useState(!isNewDay(user.lastLoginDate));
  const [toast, setToast] = useState<string | null>(null);

  const adsToday = isNewDay(user.lastAdWatchDate) ? 0 : user.adsWatchedToday;
  const adsRemaining = AD_LIMIT_PER_DAY - adsToday;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function claimLogin() {
    const res = await fetch("/api/coins/daily-login", { method: "POST" });
    const data = await res.json();
    if (data.alreadyClaimed) {
      showToast("Heute bereits eingeloggt.");
      setLoginClaimed(true);
      return;
    }
    if (data.earned) {
      setCoins(data.coins);
      setLoginClaimed(true);
      showToast(`+${data.earned} Coins! Login-Streak: ${data.streak} Tage 🔥`);
    }
  }

  async function watchAd() {
    if (adsRemaining <= 0) { showToast("Heute bereits 5 Videos geschaut."); return; }
    setAdLoading(true);
    // Simulate video ad (2s)
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch("/api/coins/watch-ad", { method: "POST" });
    const data = await res.json();
    setAdLoading(false);
    if (data.earned) {
      setCoins(data.coins);
      showToast(`+${data.earned} Coins! Noch ${data.adsRemaining} Videos heute.`);
    } else {
      showToast(data.error ?? "Fehler");
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl font-medium text-sm shadow-lg" style={{ background: "#00e5a0", color: "#0f1117" }}>
          {toast}
        </div>
      )}

      {/* Welcome */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black" style={{ color: "#f0f2f8" }}>
              Hey, {user.name ?? "Spieler"} 👋
            </h1>
            <p style={{ color: "#8892b0" }}>Bereit für die nächsten Tipps?</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black" style={{ color: "#f5c518" }}>🪙 {coins}</div>
            <div className="text-xs" style={{ color: "#8892b0" }}>Coins verfügbar</div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Tipps gesamt", value: user._count.predictions, icon: "🎯" },
          { label: "Login Streak", value: `${user.loginStreak} Tage`, icon: "🔥" },
          { label: "Videos heute", value: `${adsToday}/${AD_LIMIT_PER_DAY}`, icon: "📺" },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-lg font-bold" style={{ color: "#f0f2f8" }}>{s.value}</div>
            <div className="text-xs" style={{ color: "#8892b0" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Earn coins */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-4" style={{ color: "#f0f2f8" }}>Coins verdienen</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Daily login */}
          <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: "#242938", border: "1px solid #2d3348" }}>
            <span className="text-3xl">📅</span>
            <div className="flex-1">
              <div className="font-semibold" style={{ color: "#f0f2f8" }}>Täglicher Login</div>
              <div className="text-xs" style={{ color: "#8892b0" }}>
                Streak-Bonus: Tag 1=5, Tag 3=10, Tag 7=25 Coins
              </div>
            </div>
            <button
              onClick={claimLogin}
              disabled={loginClaimed}
              className="px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-40 transition"
              style={{ background: loginClaimed ? "#242938" : "#00e5a0", color: loginClaimed ? "#8892b0" : "#0f1117", border: "1px solid #2d3348" }}
            >
              {loginClaimed ? "Erhalten ✓" : "Abholen"}
            </button>
          </div>

          {/* Video ad */}
          <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: "#242938", border: "1px solid #2d3348" }}>
            <span className="text-3xl">📺</span>
            <div className="flex-1">
              <div className="font-semibold" style={{ color: "#f0f2f8" }}>Video anschauen</div>
              <div className="text-xs" style={{ color: "#8892b0" }}>
                +10 Coins pro Video · noch {adsRemaining} heute
              </div>
            </div>
            <button
              onClick={watchAd}
              disabled={adLoading || adsRemaining <= 0}
              className="px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-40 transition"
              style={{ background: adsRemaining > 0 ? "#f5c518" : "#242938", color: adsRemaining > 0 ? "#0f1117" : "#8892b0", border: "1px solid #2d3348" }}
            >
              {adLoading ? "Läuft..." : adsRemaining > 0 ? "+10 🪙" : "Limit"}
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming matches */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg" style={{ color: "#f0f2f8" }}>Nächste Matches</h2>
          <Link href="/matches" className="text-sm font-medium" style={{ color: "#00e5a0" }}>Alle anzeigen →</Link>
        </div>
        <div className="space-y-3">
          {recentMatches.length === 0 && (
            <div className="glass rounded-xl p-6 text-center" style={{ color: "#8892b0" }}>
              Keine anstehenden Matches.
            </div>
          )}
          {recentMatches.map(match => (
            <Link key={match.id} href={`/matches`} className="glass rounded-xl p-4 flex items-center justify-between hover:opacity-80 transition block">
              <div>
                <div className="font-semibold" style={{ color: "#f0f2f8" }}>
                  {match.homePlayer} <span style={{ color: "#8892b0" }}>vs</span> {match.awayPlayer}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#8892b0" }}>
                  {match.tournament} · {new Date(match.scheduledAt).toLocaleDateString("de-CH")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {match.matchType === "TOP_MATCH" && (
                  <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: "rgba(245,197,24,0.2)", color: "#f5c518" }}>TOP</span>
                )}
                <span className="text-sm font-bold" style={{ color: "#f5c518" }}>🪙 {match.coinCost}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick buy */}
      <div className="glass rounded-2xl p-6 text-center">
        <p className="font-semibold mb-3" style={{ color: "#f0f2f8" }}>Coins ausgehen? Lade schnell auf!</p>
        <Link href="/coins" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition hover:opacity-80" style={{ background: "#00e5a0", color: "#0f1117" }}>
          🛒 Coins kaufen
        </Link>
      </div>
    </div>
  );
}
