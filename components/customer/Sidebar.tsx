"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutGrid,
  UserRound,
  BookOpen,
  PhoneCall,
  BarChart3,
  CalendarDays,
  CreditCard,
  LogOut,
  Mic,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app", label: "Übersicht", icon: LayoutGrid, exact: true },
];

const contentItems = [
  { href: "/app/assistants", label: "Assistenten", icon: UserRound },
  { href: "/app/knowledge", label: "Wissensdatenbank", icon: BookOpen },
  { href: "/app/calls", label: "Anrufe", icon: PhoneCall },
];

const insightItems = [
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/calendar", label: "Kalender", icon: CalendarDays },
];

const settingsItems = [
  { href: "/app/billing", label: "Billing & Credits", icon: CreditCard },
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
          ? "bg-black text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function NavSection({
  title,
  items,
}: {
  title: string;
  items: typeof contentItems;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        {title}
      </p>
      {items.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}
    </div>
  );
}

interface CustomerSidebarProps {
  workspaceName?: string;
  isAdmin?: boolean;
}

export function CustomerSidebar({ workspaceName, isAdmin }: CustomerSidebarProps) {
  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">SwixAI</p>
            {workspaceName && (
              <p className="text-xs text-gray-500 truncate max-w-[140px]">
                {workspaceName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
        <NavSection title="Inhalte" items={contentItems} />
        <NavSection title="Einblicke" items={insightItems} />
        <NavSection title="Konto" items={settingsItems} />
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        {/* Admin-Panel-Button: nur für Admins sichtbar */}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
          >
            <Shield className="w-4 h-4" />
            <span>Admin Dashboard</span>
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Abmelden</span>
        </button>
      </div>
    </aside>
  );
}
