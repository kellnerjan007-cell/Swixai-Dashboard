"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/customer/Topbar";
import { Card } from "@/components/ui/Card";
import { UserPlus, Trash2, Clock, Mail, Crown, Shield, User } from "lucide-react";

interface Member {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: { id: string; name: string | null; email: string };
}

interface Invite {
  id: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  expiresAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Inhaber",
  ADMIN: "Admin",
  MEMBER: "Mitglied",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [myRole, setMyRole] = useState<"OWNER" | "ADMIN" | "MEMBER">("MEMBER");
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    const res = await fetch("/api/team");
    const data = await res.json();
    setMembers(data.members ?? []);
    setInvites(data.invites ?? []);
    setCurrentUserId(data.currentUserId ?? "");
    const me = (data.members ?? []).find((m: Member) => m.user.id === data.currentUserId);
    setMyRole(me?.role ?? "MEMBER");
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const canManage = myRole === "OWNER" || myRole === "ADMIN";

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Einladen");
      } else {
        setSuccess(`Einladung an ${inviteEmail} gesendet!`);
        setInviteEmail("");
        load();
      }
    } catch {
      setError("Netzwerkfehler – bitte erneut versuchen");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(membershipId: string) {
    if (!confirm("Mitglied wirklich entfernen?")) return;
    await fetch(`/api/team/members?id=${membershipId}`, { method: "DELETE" });
    load();
  }

  async function handleCancelInvite(inviteId: string) {
    await fetch(`/api/team/invite?id=${inviteId}`, { method: "DELETE" });
    load();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Topbar title="Team" subtitle="Mitglieder verwalten & einladen" />
      <main className="flex-1 px-8 py-8 space-y-6 max-w-2xl">

        {/* Invite form */}
        {canManage && (
          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Mitglied einladen</h2>
                <p className="text-sm text-gray-500">Einladungslink wird per E-Mail versendet</p>
              </div>
            </div>

            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@firma.de"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
                className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
              >
                <option value="MEMBER">Mitglied</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50"
              >
                {inviting ? "…" : "Einladen"}
              </button>
            </form>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 mt-3">{error}</p>
            )}
            {success && (
              <p className="text-sm text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100 mt-3">{success}</p>
            )}
          </Card>
        )}

        {/* Member list */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Mitglieder ({members.length})
          </h2>
          <div className="space-y-2">
            {members.map((m) => {
              const RoleIcon = ROLE_ICONS[m.role] ?? User;
              const isMe = m.user.id === currentUserId;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                    {(m.user.name ?? m.user.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {m.user.name ?? m.user.email}
                      {isMe && <span className="ml-1 text-xs text-gray-400">(Du)</span>}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                    <RoleIcon className="w-3 h-3" />
                    {ROLE_LABELS[m.role]}
                  </span>
                  {canManage && !isMe && m.role !== "OWNER" && (
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                      title="Entfernen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Pending invites */}
        {invites.length > 0 && (
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Ausstehende Einladungen ({invites.length})
            </h2>
            <div className="space-y-2">
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{inv.email}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Läuft ab {new Date(inv.expiresAt).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                    {ROLE_LABELS[inv.role]}
                  </span>
                  {canManage && (
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                      title="Einladung widerrufen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </>
  );
}
