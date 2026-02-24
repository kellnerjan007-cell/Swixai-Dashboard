import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "red" | "yellow" | "gray" | "blue" | "black";

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  red: "bg-red-50 text-red-700 border-red-100",
  yellow: "bg-amber-50 text-amber-700 border-amber-100",
  gray: "bg-gray-100 text-gray-600 border-gray-200",
  blue: "bg-indigo-50 text-indigo-700 border-indigo-100",
  black: "bg-gray-900 text-white border-gray-900",
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
