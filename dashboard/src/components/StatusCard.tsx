import type { ReactNode } from "react";
import Card from "@/components/ui/Card.tsx";

interface StatusCardProps {
  label: string;
  value: string;
  accent: "teal" | "amber" | "red";
  icon?: ReactNode;
  subText?: string;
}

export default function StatusCard({
  label,
  value,
  accent,
  icon,
  subText,
}: StatusCardProps) {
  const accentStyles = {
    teal: {
      icon: "bg-teal-50 text-teal-700",
      detail: "bg-teal-500",
    },
    amber: {
      icon: "bg-amber-50 text-amber-700",
      detail: "bg-amber-500",
    },
    red: {
      icon: "bg-red-50 text-red-700",
      detail: "bg-red-500",
    },
  }[accent];

  return (
    <Card className="relative min-h-32 overflow-hidden">
      <span
        className={`absolute inset-x-0 top-0 h-0.5 ${accentStyles.detail}`}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-stone-500">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-stone-950">
            {value}
          </p>
          {subText && (
            <p className="mt-2 truncate text-[11px] text-stone-400">
              {subText}
            </p>
          )}
        </div>
        {icon && (
          <div className={`shrink-0 rounded-xl p-2.5 ${accentStyles.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
