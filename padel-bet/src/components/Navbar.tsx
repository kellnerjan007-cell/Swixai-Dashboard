"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [coins, setCoins] = useState<number | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch("/api/coins/balance")
      .then(r => r.json())
      .then(d => setCoins(d.coins));
  }, [session]);

  if (!session) return null;

  return (
    <nav className="sticky top-0 z-50 glass border-b" style={{ borderColor: "#2d3348" }}>
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🎾</span>
          <span className="font-black text-lg" style={{ color: "#00e5a0" }}>PADEL BET</span>
        </Link>

        <div className="flex items-center gap-3">
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "/dashboard", label: "Home" },
              { href: "/matches", label: "Matches" },
              { href: "/predictions", label: "Meine Tipps" },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition hover:opacity-80"
                style={{ color: "#8892b0" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link href="/coins" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm transition hover:opacity-80" style={{ background: "rgba(245,197,24,0.15)", color: "#f5c518", border: "1px solid rgba(245,197,24,0.3)" }}>
            <span>🪙</span>
            <span>{coins ?? "..."}</span>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm px-3 py-1.5 rounded-xl transition hover:opacity-80"
            style={{ color: "#8892b0", border: "1px solid #2d3348" }}
          >
            Abmelden
          </button>
        </div>
      </div>
    </nav>
  );
}
