"use client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-gray-100 dark:border-gray-800">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-50 dark:divide-gray-800">{children}</tbody>;
}

export function Tr({
  children,
  onClick,
  href,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const router = useRouter();
  const handleClick = href ? () => router.push(href) : onClick;
  return (
    <tr
      onClick={handleClick}
      className={cn(
        "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition",
        handleClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn("px-4 py-3 text-gray-700 dark:text-gray-300", className)}>
      {children}
    </td>
  );
}
