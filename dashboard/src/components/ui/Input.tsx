import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  prefix?: ReactNode;
  rightElement?: ReactNode;
  hint?: string;
  inputSize?: "md" | "lg";
}

const sizeClasses = {
  md: "h-10",
  lg: "h-11"
};

export default function Input({
  label,
  error,
  prefix,
  rightElement,
  hint,
  className = "",
  inputSize = "md",
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</label>}
      <div className="relative">
        {prefix && (
          <span className="text-sm pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            {prefix}
          </span>
        )}
        <input
          className={`${sizeClasses[inputSize]} w-full rounded-lg border bg-white px-3 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${prefix ? "pl-10" : ""} ${rightElement ? "pr-10" : ""} ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-stone-300"} ${className}`}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">{rightElement}</span>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  );
}
