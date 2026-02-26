"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, UserRound, BookOpen, Phone, PhoneCall } from "lucide-react";

function Item({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-4 px-5 py-3 rounded-2xl transition",
        active ? "bg-gray-200/70" : "hover:bg-gray-200/40",
      ].join(" ")}
    >
      <span className="w-6 h-6 text-gray-900">{icon}</span>
      <span className="text-[18px] font-medium text-gray-900">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-[320px] min-h-screen bg-gray-50 px-8 py-10">
      <Item href="/" label="Home" icon={<LayoutGrid className="w-6 h-6" />} />

      <div className="mt-10 text-[18px] font-semibold text-gray-500">
        Inhalte
      </div>

      <div className="mt-6 space-y-4">
        <Item
          href="/assistants"
          label="Assistenten"
          icon={<UserRound className="w-6 h-6" />}
        />
        <Item
          href="/knowledge"
          label="Wissensdatenbank"
          icon={<BookOpen className="w-6 h-6" />}
        />
        <Item
          href="/numbers"
          label="Telefonnummern"
          icon={<Phone className="w-6 h-6" />}
        />
        <Item
          href="/calls"
          label="Anrufverlauf"
          icon={<PhoneCall className="w-6 h-6" />}
        />
      </div>
    </aside>
  );
}