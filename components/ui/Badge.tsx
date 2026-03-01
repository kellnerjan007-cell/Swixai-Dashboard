import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "red" | "yellow" | "gray" | "blue" | "black";

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900",
  red: "bg-red-50 text-red-700 border-red-100 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
  yellow: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
  gray: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  blue: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900",
  black: "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
