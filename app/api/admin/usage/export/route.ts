import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspaces = await db.workspace.findMany({
    include: {
      billing: true,
      calls: { select: { costTotal: true, durationSec: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Workspace",
    "Plan",
    "Status",
    "Anrufe",
    "Minuten",
    "Kosten (EUR)",
    "Revenue (EUR)",
    "Margin (EUR)",
    "Guthaben (EUR)",
  ];

  const rows = workspaces.map((ws) => {
    const cost = ws.calls.reduce((s, c) => s + (c.costTotal ?? 0), 0);
    const revenue = cost * 1.4;
    const margin = revenue - cost;
    const minutes = Math.round(
      ws.calls.reduce((s, c) => s + (c.durationSec ?? 0), 0) / 60
    );
    return [
      ws.name,
      ws.plan,
      ws.status,
      ws.calls.length,
      minutes,
      cost.toFixed(4),
      revenue.toFixed(4),
      margin.toFixed(4),
      (ws.billing?.creditsBalance ?? 0).toFixed(2),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="swixai-usage-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
