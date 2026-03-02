"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Loader2, Mic, CheckCircle, XCircle } from "lucide-react";

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [invite, setInvite] = useState<{ email: string; workspaceName: string } | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);

  useEffect(() => {
    if (!token) { setTokenError("Token fehlt."); return; }

    fetch(`/api/auth/accept-invite?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setTokenError(data.error); return; }
        setInvite(data);
        // Prüfen ob User bereits existiert
        fetch(`/api/auth/check-email?email=${encodeURIComponent(data.email)}`)
          .then((r) => r.json())
          .then((d) => setIsExistingUser(d.exists));
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name: name || undefined, password: password || undefined }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Fehler.");
      return;
    }

    setDone(true);
    // Auto-login
    if (password) {
      await signIn("credentials", { email: data.email, password, redirect: false });
    }
    setTimeout(() => router.push("/app"), 2000);
  }

  if (!token || tokenError) {
    return (
      <div className="text-center py-4">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Ungültiger Link</h1>
        <p className="text-gray-500 text-sm">{tokenError || "Dieser Einladungslink ist ungültig."}</p>
      </div>
    );
  }

  if (!invite) {
    return <div className="text-center py-8 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Willkommen bei {invite.workspaceName}!</h1>
        <p className="text-gray-500 text-sm">Du wirst weitergeleitet...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Einladung annehmen</h1>
      <p className="text-gray-500 text-sm mb-6">
        Du wurdest eingeladen, <strong>{invite.workspaceName}</strong> beizutreten.
      </p>

      <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6 text-sm text-gray-600">
        E-Mail: <strong>{invite.email}</strong>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isExistingUser && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Dein Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Max Mustermann"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Passwort wählen</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 8 Zeichen"
                required
                minLength={8}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
              />
            </div>
          </>
        )}

        {isExistingUser && (
          <p className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            Du hast bereits ein Konto. Klicke auf &quot;Beitreten&quot; um dem Workspace hinzugefügt zu werden.
          </p>
        )}

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
          {isExistingUser ? "Workspace beitreten" : "Konto erstellen & beitreten"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Bereits registriert?{" "}
        <Link href="/login" className="text-black font-semibold hover:underline">
          Einloggen
        </Link>
      </p>
    </>
  );
}

export default function AcceptInvitePage() {
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
          <Suspense fallback={<div className="text-center py-8 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}>
            <AcceptInviteForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
