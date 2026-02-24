"use client";

import { useRouter } from "next/navigation";
import { Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { ChevronRight } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

type StatusVariant = "green" | "yellow" | "red" | "gray";

const statusVariant: Record<string, StatusVariant> = {
  ACTIVE: "green",
  PAUSED: "yellow",
  SUSPENDED: "red",
};

interface CustomerTableRowProps {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  memberCount: number;
  assistantCount: number;
  callCount: number;
  creditsBalance: number | null;
  monthRevenue: number;
  createdAt: Date;
}

export function CustomerTableRow({
  id,
  name,
  slug,
  plan,
  status,
  memberCount,
  assistantCount,
  callCount,
  creditsBalance,
  monthRevenue,
  createdAt,
}: CustomerTableRowProps) {
  const router = useRouter();

  return (
    <Tr onClick={() => router.push(`/admin/customers/${id}`)}>
      <Td>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{name}</p>
            <p className="text-xs text-gray-400 font-mono">{slug}</p>
          </div>
        </div>
      </Td>
      <Td>
        <Badge variant="blue">{plan}</Badge>
      </Td>
      <Td>
        <Badge variant={statusVariant[status] ?? "gray"}>{status}</Badge>
      </Td>
      <Td>{memberCount}</Td>
      <Td>{assistantCount}</Td>
      <Td>{callCount}</Td>
      <Td>
        <span className={creditsBalance !== null && creditsBalance < 5 ? "text-red-600 font-medium" : ""}>
          {creditsBalance !== null ? formatCurrency(creditsBalance) : "–"}
        </span>
      </Td>
      <Td>{formatCurrency(monthRevenue)}</Td>
      <Td>{formatDate(createdAt)}</Td>
      <Td>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </Td>
    </Tr>
  );
}
