"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Loader2, Mic } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
  });

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registrierung fehlgeschlagen.");
        setLoading(false);
        return;
      }

      // Auto sign-in after signup
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      const callbackUrl = searchParams.get("callbackUrl");
      router.push(callbackUrl ?? "/app");
      router.refresh();
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
      setLoading(false);
    }
  }

  const fields = [
    { key: "name", label: "Dein Name", type: "text", placeholder: "Max Mustermann" },
    { key: "companyName", label: "Firmenname", type: "text", placeholder: "Mustermann GmbH" },
    { key: "email", label: "E-Mail", type: "email", placeholder: "max@firma.de" },
    { key: "password", label: "Passwort", type: "password", placeholder: "Mindestens 8 Zeichen" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">SwixAI</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Konto erstellen</h1>
          <p className="text-gray-500 text-sm mb-6">
            Starte kostenlos mit SwixAI Voice Agents.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => updateForm(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
                />
              </div>
            ))}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Konto erstellen
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Bereits registriert?{" "}
            <Link href="/login" className="text-black font-semibold hover:underline">
              Einloggen
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
