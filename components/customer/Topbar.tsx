"use client";

import { useSession } from "next-auth/react";
import { getInitials } from "@/lib/utils";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? session?.user?.email ?? "";

  return (
    <header className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {actions}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{getInitials(name)}</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900 leading-none">{name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
