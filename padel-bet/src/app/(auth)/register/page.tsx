"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Registrierung fehlgeschlagen.");
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #0f1117 0%, #1a1f2e 100%)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-4xl">🎾</span>
            <span className="text-3xl font-black" style={{ color: "#00e5a0" }}>PADEL BET</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mt-2" style={{ background: "rgba(245,197,24,0.15)", color: "#f5c518", border: "1px solid rgba(245,197,24,0.3)" }}>
            🎁 50 Coins gratis bei Registrierung!
          </div>
        </div>

        <div className="glass rounded-2xl p-8">
          <h1 className="text-xl font-bold mb-6" style={{ color: "#f0f2f8" }}>Konto erstellen</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#8892b0" }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: "#242938", border: "1px solid #2d3348", color: "#f0f2f8" }}
                placeholder="Dein Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#8892b0" }}>E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: "#242938", border: "1px solid #2d3348", color: "#f0f2f8" }}
                placeholder="deine@email.ch"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#8892b0" }}>Passwort</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: "#242938", border: "1px solid #2d3348", color: "#f0f2f8" }}
                placeholder="Mindestens 6 Zeichen"
              />
            </div>
            {error && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ background: "rgba(255,71,87,0.1)", color: "#ff4757", border: "1px solid rgba(255,71,87,0.2)" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-50"
              style={{ background: "#00e5a0", color: "#0f1117" }}
            >
              {loading ? "Registriere..." : "Konto erstellen & 50 Coins erhalten 🎁"}
            </button>
          </form>
          <p className="text-center text-sm mt-6" style={{ color: "#8892b0" }}>
            Bereits registriert?{" "}
            <Link href="/login" className="font-semibold" style={{ color: "#00e5a0" }}>Anmelden</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
