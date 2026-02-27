"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Mic, Loader2 } from "lucide-react";

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = searchParams.get("token") ?? "";

  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  async function accept() {
    setAccepting(true);
    setError("");
    try {
      const res = await fetch("/api/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        setAccepted(true);
        setTimeout(() => router.push("/app"), 1500);
      } else {
        setError(data.error ?? "Fehler beim Annehmen der Einladung");
      }
    } catch {
      setError("Netzwerkfehler – bitte erneut versuchen");
    } finally {
      setAccepting(false);
    }
  }

  // Auto-accept once logged in
  useEffect(() => {
    if (status === "authenticated" && token && !accepted && !accepting && !error) {
      accept();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, token]);

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <p className="text-red-600 text-sm">Ungültiger Einladungslink.</p>
        <Link href="/" className="text-sm font-semibold text-black hover:underline">Zur Startseite</Link>
      </div>
    );
  }

  return (
    <div className="text-center space-y-5">
      {accepted ? (
        <>
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900">Einladung angenommen!</p>
          <p className="text-sm text-gray-500">Du wirst weitergeleitet…</p>
        </>
      ) : status === "loading" || (status === "authenticated" && !error) ? (
        <>
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          <p className="text-sm text-gray-500">Einladung wird verarbeitet…</p>
        </>
      ) : status === "unauthenticated" ? (
        <>
          <p className="text-lg font-bold text-gray-900">Teameinladung</p>
          <p className="text-sm text-gray-500">
            Bitte melde dich an oder registriere dich, um die Einladung anzunehmen.
          </p>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-100">{error}</p>
          )}
          <div className="flex flex-col gap-2">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/join?token=${token}`)}`}
              className="w-full bg-black text-white py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition text-sm block"
            >
              Einloggen & annehmen
            </Link>
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent(`/join?token=${token}`)}`}
              className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition text-sm block"
            >
              Registrieren & annehmen
            </Link>
          </div>
        </>
      ) : (
        <>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-100">{error}</p>
          )}
          <button
            onClick={accept}
            disabled={accepting}
            className="w-full bg-black text-white py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            {accepting && <Loader2 className="w-4 h-4 animate-spin" />}
            Einladung annehmen
          </button>
        </>
      )}
    </div>
  );
}

export default function JoinPage() {
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
          <Suspense fallback={<div className="text-center text-gray-400">Laden…</div>}>
            <JoinContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
