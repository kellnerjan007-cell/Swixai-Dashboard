"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Falsche E-Mail oder Passwort.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #0f1117 0%, #1a1f2e 100%)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-4xl">🎾</span>
            <span className="text-3xl font-black" style={{ color: "#00e5a0" }}>PADEL BET</span>
          </div>
          <p style={{ color: "#8892b0" }}>Melde dich an und tippe auf Siege</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <h1 className="text-xl font-bold mb-6" style={{ color: "#f0f2f8" }}>Anmelden</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#8892b0" }}>E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
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
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                style={{ background: "#242938", border: "1px solid #2d3348", color: "#f0f2f8" }}
                placeholder="••••••••"
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
              {loading ? "Laden..." : "Anmelden"}
            </button>
          </form>
          <p className="text-center text-sm mt-6" style={{ color: "#8892b0" }}>
            Noch kein Konto?{" "}
            <Link href="/register" className="font-semibold" style={{ color: "#00e5a0" }}>
              Jetzt registrieren & 50 Coins erhalten
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
