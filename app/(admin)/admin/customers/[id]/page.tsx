"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatCurrency, formatDuration } from "@/lib/utils";
import {
  ArrowLeft,
  Users,
  UserRound,
  PhoneCall,
  CreditCard,
  Pause,
  Play,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";

interface WorkspaceDetail {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  createdAt: string;
  billing: { creditsBalance: number; totalSpent: number; currency: string } | null;
  members: { id: string; role: string; user: { id: string; name: string | null; email: string } }[];
  assistants: { id: string; name: string; status: string; phoneNumber: string | null }[];
  calls: {
    id: string;
    startedAt: string;
    durationSec: number | null;
    outcome: string | null;
    costTotal: number | null;
    assistant: { name: string } | null;
  }[];
}

export default function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [ws, setWs] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCredits, setShowCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/admin/customers/${id}`);
    const data = await res.json();
    setWs(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function adjustCredits(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/admin/customers/${id}/credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(creditAmount), reason: creditReason }),
    });
    setSaving(false);
    setShowCredits(false);
    setCreditAmount("");
    setCreditReason("");
    load();
  }

  async function toggleStatus() {
    const newStatus = ws?.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  async function changePlan(newPlan: string) {
    setPlanSaving(true);
    await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newPlan }),
    });
    setPlanSaving(false);
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!ws) return <div className="p-8 text-gray-500">Nicht gefunden.</div>;

  const statusVariant: Record<string, "green" | "yellow" | "red" | "gray"> = {
    ACTIVE: "green",
    PAUSED: "yellow",
    SUSPENDED: "red",
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">{ws.name}</h1>
            <Badge variant={statusVariant[ws.status] ?? "gray"}>{ws.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCredits(true)}
          >
            <CreditCard className="w-4 h-4" />
            Credits anpassen
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleStatus}
          >
            {ws.status === "ACTIVE" ? (
              <><Pause className="w-4 h-4" /> Pausieren</>
            ) : (
              <><Play className="w-4 h-4" /> Aktivieren</>
            )}
          </Button>
        </div>
      </div>

      <main className="flex-1 px-8 py-8 space-y-6">
        {/* Meta */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Mitglieder", value: ws.members.length.toString() },
            { icon: UserRound, label: "Assistenten", value: ws.assistants.length.toString() },
            { icon: PhoneCall, label: "Anrufe gesamt", value: ws.calls.length.toString() },
            {
              icon: CreditCard,
              label: "Guthaben",
              value: ws.billing ? formatCurrency(ws.billing.creditsBalance) : "–",
            },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Icon className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Plan */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Aktueller Plan</p>
              <p className="text-xs text-gray-400 mt-0.5">Änderungen werden sofort gespeichert</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={ws.plan}
                onChange={(e) => changePlan(e.target.value)}
                disabled={planSaving}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
              >
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
              </select>
              {planSaving && (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>
        </Card>

        {/* Members */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Mitglieder
            </span>
          </h2>
          <div className="space-y-2">
            {ws.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {m.user.name ?? m.user.email}
                  </p>
                  <p className="text-xs text-gray-400">{m.user.email}</p>
                </div>
                <Badge variant="gray">{m.role}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Assistants */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            <span className="flex items-center gap-2">
              <UserRound className="w-4 h-4" /> Assistenten
            </span>
          </h2>
          <div className="space-y-2">
            {ws.assistants.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.name}</p>
                  <p className="text-xs text-gray-400 font-mono">
                    {a.phoneNumber ?? "Keine Nummer"}
                  </p>
                </div>
                <Badge
                  variant={
                    a.status === "ACTIVE" ? "green" : a.status === "PAUSED" ? "yellow" : "gray"
                  }
                >
                  {a.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Calls */}
        <Card padding={false}>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              Letzte Anrufe
            </h2>
          </div>
          <Table>
            <Thead>
              <Th>Zeit</Th>
              <Th>Assistent</Th>
              <Th>Dauer</Th>
              <Th>Ergebnis</Th>
              <Th>Kosten</Th>
            </Thead>
            <Tbody>
              {ws.calls.slice(0, 10).map((call) => (
                <Tr key={call.id}>
                  <Td>{formatDate(call.startedAt)}</Td>
                  <Td>{call.assistant?.name ?? "–"}</Td>
                  <Td>{call.durationSec ? formatDuration(call.durationSec) : "–"}</Td>
                  <Td>{call.outcome ?? "–"}</Td>
                  <Td>{call.costTotal != null ? `€ ${call.costTotal.toFixed(4)}` : "–"}</Td>
                </Tr>
              ))}
              {ws.calls.length === 0 && (
                <Tr>
                  <Td colSpan={5} className="text-center text-gray-400 py-8">
                    Keine Anrufe
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Card>
      </main>

      {/* Credits Modal */}
      <Modal
        open={showCredits}
        onClose={() => setShowCredits(false)}
        title="Credits anpassen"
        size="sm"
      >
        <form onSubmit={adjustCredits} className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-sm text-gray-600">Aktuelles Guthaben</span>
            <span className="font-semibold text-gray-900">
              {ws.billing ? formatCurrency(ws.billing.creditsBalance) : "–"}
            </span>
          </div>
          <Input
            label="Betrag (€) — negativ zum Abziehen"
            type="number"
            step="0.01"
            placeholder="z.B. 10.00 oder -5.00"
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
            required
          />
          <Input
            label="Grund"
            placeholder="z.B. Korrektur, Nachfüllung…"
            value={creditReason}
            onChange={(e) => setCreditReason(e.target.value)}
            required
          />
          <div className="flex gap-3">
            <Button type="submit" loading={saving}>Anpassen</Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowCredits(false)}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
