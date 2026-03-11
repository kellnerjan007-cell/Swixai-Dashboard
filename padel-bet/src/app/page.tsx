import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0f1117 0%, #1a1f2e 50%, #0f1117 100%)" }}>
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ background: "rgba(0,229,160,0.1)", color: "#00e5a0", border: "1px solid rgba(0,229,160,0.3)" }}>
          🎁 50 Coins gratis bei Registrierung
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-4" style={{ color: "#f0f2f8" }}>
          🎾 PADEL BET
        </h1>
        <p className="text-xl mb-8 max-w-xl mx-auto" style={{ color: "#8892b0" }}>
          Tippe auf Padel-Matches, verdiene Coins und beweise dein Padel-Wissen!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="/register" className="px-8 py-4 rounded-2xl font-black text-lg transition hover:opacity-90" style={{ background: "#00e5a0", color: "#0f1117" }}>
            Jetzt starten – Gratis! 🚀
          </Link>
          <Link href="/login" className="px-8 py-4 rounded-2xl font-bold text-lg transition hover:opacity-80" style={{ border: "2px solid #2d3348", color: "#f0f2f8" }}>
            Anmelden
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {[
            {
              icon: "🪙",
              title: "Coin-System",
              desc: "Tippe kostenlos mit Gratis-Coins. Schau Videos für mehr, oder kaufe Pakete ab CHF 1.90.",
            },
            {
              icon: "🎯",
              title: "Vorhersagen",
              desc: "Wähle den Gewinner von Matches — Normal, Top oder Kombi. Richtig getippt = Coins zurück!",
            },
            {
              icon: "🔥",
              title: "Login-Streak",
              desc: "Täglich einloggen bringt Bonus-Coins. Tag 7 = 25 Coins gratis!",
            },
          ].map(f => (
            <div key={f.title} className="glass rounded-2xl p-6">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2" style={{ color: "#f0f2f8" }}>{f.title}</h3>
              <p className="text-sm" style={{ color: "#8892b0" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <h2 className="text-3xl font-black text-center mb-8" style={{ color: "#f0f2f8" }}>Coin-Pakete</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { name: "Starter", coins: "100 🪙", price: "CHF 1.90", popular: false, vip: false },
            { name: "Pro", coins: "300 🪙", price: "CHF 4.90", popular: true, vip: false },
            { name: "Champion", coins: "800 🪙", price: "CHF 9.90", popular: false, vip: false },
            { name: "VIP/Monat", coins: "30 🪙/Tag", price: "CHF 7.90", popular: false, vip: true },
          ].map(p => (
            <div
              key={p.name}
              className="glass rounded-2xl p-5 text-center relative"
              style={{ border: `2px solid ${p.popular ? "#00e5a0" : p.vip ? "#f5c518" : "#2d3348"}` }}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold" style={{ background: "#00e5a0", color: "#0f1117" }}>
                  Beliebt
                </div>
              )}
              <div className="font-bold mb-2" style={{ color: "#8892b0" }}>{p.name}</div>
              <div className="text-2xl font-black mb-1" style={{ color: "#f5c518" }}>{p.coins}</div>
              <div className="font-bold" style={{ color: "#f0f2f8" }}>{p.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
