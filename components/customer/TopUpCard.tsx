"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

const PRESETS = [10, 25, 50, 100];

export function TopUpCard({ currency = "EUR" }: { currency?: string }) {
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState<number | "custom" | null>(null);

  async function checkout(amount: number, key: number | "custom") {
    if (!amount || amount < 1) return;
    setLoading(key);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(null);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      {PRESETS.map((amount) => (
        <button
          key={amount}
          disabled={loading !== null}
          onClick={() => checkout(amount, amount)}
          className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
        >
          {loading === amount ? "Weiterleitung…" : `+ ${formatCurrency(amount, currency)}`}
        </button>
      ))}

      {/* Custom amount */}
      <div className="flex gap-2 pt-1">
        <input
          type="number"
          min="1"
          step="1"
          placeholder="Eigener Betrag"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
        />
        <button
          disabled={!custom || Number(custom) < 1 || loading !== null}
          onClick={() => checkout(Math.floor(Number(custom)), "custom")}
          className="px-4 py-2 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition disabled:opacity-40"
        >
          {loading === "custom" ? "…" : "Aufladen"}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center pt-1">Powered by Stripe</p>
    </div>
  );
}
