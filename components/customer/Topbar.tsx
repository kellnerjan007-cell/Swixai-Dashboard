"use client";

import { useSession } from "next-auth/react";
import { getInitials } from "@/lib/utils";
import { ThemeToggle } from "@/components/customer/ThemeToggle";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? session?.user?.email ?? "";

  return (
    <header className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle />
          <div className="flex items-center gap-2.5 ml-2">
            <div className="w-8 h-8 bg-gray-900 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{getInitials(name)}</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none">{name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
