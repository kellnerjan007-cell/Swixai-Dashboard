"use client";

import { useEffect, useState } from "react";
import { COIN_PACKAGES, AD_LIMIT_PER_DAY, COIN_COSTS } from "@/lib/coins";

type Transaction = {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
};

const TYPE_ICONS: Record<string, string> = {
  SIGNUP_BONUS: "🎁",
  DAILY_LOGIN: "📅",
  AD_REWARD: "📺",
  PREDICTION_SPEND: "🎯",
  PREDICTION_WIN: "🏆",
  PURCHASE: "💳",
  STATS_VIEW: "📊",
  DAILY_STATS_PASS: "📊",
};

export default function CoinsPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [adLoading, setAdLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [adsRemaining, setAdsRemaining] = useState(AD_LIMIT_PER_DAY);

  useEffect(() => {
    fetch("/api/coins/balance").then(r => r.json()).then(d => setBalance(d.coins));
    fetch("/api/coins/history").then(r => r.json()).then(setHistory);
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function watchAd() {
    setAdLoading(true);
    // Simulate video ad
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch("/api/coins/watch-ad", { method: "POST" });
    const data = await res.json();
    setAdLoading(false);
    if (data.earned) {
      setBalance(data.coins);
      setAdsRemaining(data.adsRemaining);
      showToast(`+${data.earned} Coins verdient! 🎉`);
      // Refresh history
      fetch("/api/coins/history").then(r => r.json()).then(setHistory);
    } else {
      showToast(data.error ?? "Fehler");
    }
  }

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl font-medium text-sm shadow-lg" style={{ background: "#00e5a0", color: "#0f1117" }}>
          {toast}
        </div>
      )}

      {/* Balance */}
      <div className="glass rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #1a1f2e, #242938)" }}>
        <div className="text-6xl font-black mb-2" style={{ color: "#f5c518" }}>
          🪙 {balance ?? "..."}
        </div>
        <p style={{ color: "#8892b0" }}>Deine Coins</p>
      </div>

      {/* Coin costs info */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-bold text-lg mb-4" style={{ color: "#f0f2f8" }}>Was kosten Vorhersagen?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Normal Match", cost: COIN_COSTS.NORMAL_MATCH, icon: "🎾" },
            { label: "Top Match", cost: COIN_COSTS.TOP_MATCH, icon: "⭐" },
            { label: "Kombi", cost: COIN_COSTS.COMBO, icon: "🔀" },
            { label: "Stats ansehen", cost: COIN_COSTS.STATS_VIEW, icon: "📊" },
            { label: "Tages-Stats-Pass", cost: COIN_COSTS.DAILY_STATS_PASS, icon: "🎫" },
          ].map(item => (
            <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: "#242938", border: "1px solid #2d3348" }}>
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-xs mb-1" style={{ color: "#8892b0" }}>{item.label}</div>
              <div className="font-bold" style={{ color: "#f5c518" }}>🪙 {item.cost}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Free coins */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-bold text-lg mb-4" style={{ color: "#f0f2f8" }}>Gratis Coins verdienen</h2>
        <div className="space-y-3">
          {/* Watch ad */}
          <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: "#242938", border: "1px solid #2d3348" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "rgba(245,197,24,0.15)" }}>
              📺
            </div>
            <div className="flex-1">
              <div className="font-semibold" style={{ color: "#f0f2f8" }}>Video anschauen</div>
              <div className="text-xs" style={{ color: "#8892b0" }}>
                +10 Coins pro Video · max. {AD_LIMIT_PER_DAY}/Tag · noch {adsRemaining} verfügbar
              </div>
            </div>
            <button
              onClick={watchAd}
              disabled={adLoading || adsRemaining <= 0}
              className="px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 transition whitespace-nowrap"
              style={{ background: "#f5c518", color: "#0f1117" }}
            >
              {adLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Läuft...
                </span>
              ) : adsRemaining > 0 ? "+10 🪙" : "Limit erreicht"}
            </button>
          </div>

          {/* Daily login */}
          <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: "#242938", border: "1px solid #2d3348" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "rgba(0,229,160,0.1)" }}>
              📅
            </div>
            <div className="flex-1">
              <div className="font-semibold" style={{ color: "#f0f2f8" }}>Täglicher Login</div>
              <div className="text-xs" style={{ color: "#8892b0" }}>
                Tag 1: 5 Coins · Tag 3: 10 Coins · Tag 7: 25 Coins
              </div>
            </div>
            <span className="text-sm" style={{ color: "#8892b0" }}>Automatisch</span>
          </div>

          {/* Win predictions */}
          <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: "#242938", border: "1px solid #2d3348" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "rgba(0,229,160,0.1)" }}>
              🏆
            </div>
            <div className="flex-1">
              <div className="font-semibold" style={{ color: "#f0f2f8" }}>Richtige Vorhersage</div>
              <div className="text-xs" style={{ color: "#8892b0" }}>
                +15 Coins für jeden richtigen Tipp
              </div>
            </div>
            <span className="font-bold text-sm" style={{ color: "#00e5a0" }}>+15 🪙</span>
          </div>
        </div>
      </div>

      {/* Coin packages */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-bold text-lg mb-4" style={{ color: "#f0f2f8" }}>Coins kaufen</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {COIN_PACKAGES.map(pkg => (
            <div
              key={pkg.id}
              className="rounded-2xl p-5 relative transition"
              style={{
                background: (pkg as { popular?: boolean }).popular ? "linear-gradient(135deg, rgba(0,229,160,0.1), rgba(0,184,127,0.05))" : "#242938",
                border: (pkg as { popular?: boolean }).popular ? "2px solid #00e5a0" : "2px solid #2d3348",
              }}
            >
              {(pkg as { popular?: boolean }).popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "#00e5a0", color: "#0f1117" }}>
                  ⭐ Beliebt
                </div>
              )}
              {(pkg as { isSubscription?: boolean }).isSubscription && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "#f5c518", color: "#0f1117" }}>
                  👑 VIP
                </div>
              )}

              <div className="text-center mb-4">
                <div className="text-3xl font-black mb-1" style={{ color: "#f5c518" }}>
                  {(pkg as { isSubscription?: boolean }).isSubscription
                    ? "30 🪙/Tag"
                    : `${pkg.coins} 🪙`}
                </div>
                <div className="font-bold" style={{ color: "#f0f2f8" }}>{pkg.name}</div>
                {(pkg as { description?: string }).description && (
                  <div className="text-xs mt-1" style={{ color: "#8892b0" }}>
                    {(pkg as { description?: string }).description}
                  </div>
                )}
              </div>

              <div className="text-center mb-4">
                <span className="text-2xl font-black" style={{ color: "#f0f2f8" }}>
                  CHF {pkg.priceChf.toFixed(2)}
                </span>
                {(pkg as { isSubscription?: boolean }).isSubscription && (
                  <span className="text-sm" style={{ color: "#8892b0" }}>/Monat</span>
                )}
              </div>

              <button
                className="w-full py-3 rounded-xl font-bold text-sm transition hover:opacity-80"
                style={{
                  background: (pkg as { popular?: boolean }).popular ? "#00e5a0" : (pkg as { isSubscription?: boolean }).isSubscription ? "#f5c518" : "#2d3348",
                  color: ((pkg as { popular?: boolean }).popular || (pkg as { isSubscription?: boolean }).isSubscription) ? "#0f1117" : "#f0f2f8",
                }}
                onClick={() => alert("Stripe-Integration wird eingerichtet. Bald verfügbar!")}
              >
                {(pkg as { isSubscription?: boolean }).isSubscription ? "VIP werden 👑" : "Kaufen"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-bold text-lg mb-4" style={{ color: "#f0f2f8" }}>Transaktionsverlauf</h2>
        {history.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "#8892b0" }}>Noch keine Transaktionen.</p>
        ) : (
          <div className="space-y-2">
            {history.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "#2d3348" }}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{TYPE_ICONS[tx.type] ?? "🪙"}</span>
                  <div>
                    <div className="text-sm" style={{ color: "#f0f2f8" }}>{tx.description}</div>
                    <div className="text-xs" style={{ color: "#8892b0" }}>
                      {new Date(tx.createdAt).toLocaleDateString("de-CH", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                <span className="font-bold text-sm" style={{ color: tx.amount > 0 ? "#00e5a0" : "#ff4757" }}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount} 🪙
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
