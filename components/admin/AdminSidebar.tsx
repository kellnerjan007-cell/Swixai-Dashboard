"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutGrid,
  Users,
  UserRound,
  BarChart3,
  Webhook,
  LogOut,
  Mic,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Übersicht", icon: LayoutGrid, exact: true },
  { href: "/admin/customers", label: "Kunden", icon: Users },
  { href: "/admin/assistants", label: "Assistenten", icon: UserRound },
  { href: "/admin/usage", label: "Usage & Finance", icon: BarChart3 },
  { href: "/admin/webhooks", label: "Webhooks", icon: Webhook },
];

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-sm font-medium",
        active
          ? "bg-gray-900 text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function AdminSidebar() {
  return (
    <aside className="w-64 h-full bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">SwixAI</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-gray-400" />
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <Link
          href="/app"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
        >
          <Users className="w-4 h-4" />
          <span>Customer View</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Abmelden</span>
        </button>
      </div>
    </aside>
  );
}
