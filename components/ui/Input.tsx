import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        {...props}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition text-sm",
          error ? "border-red-300" : "border-gray-200",
          className
        )}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <textarea
        {...props}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition text-sm resize-none",
          error ? "border-red-300" : "border-gray-200",
          className
        )}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <select
        {...props}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl border bg-white text-gray-900",
          "focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition text-sm",
          error ? "border-red-300" : "border-gray-200",
          className
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
