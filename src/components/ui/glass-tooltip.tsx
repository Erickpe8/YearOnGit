import type { ReactNode } from "react";

type GlassTooltipProps = {
  label: string;
  children: ReactNode;
  align?: "start" | "center" | "end";
  disabled?: boolean;
};

export function GlassTooltip({
  label,
  children,
  align = "center",
  disabled = false,
}: GlassTooltipProps) {
  return (
    <span className={`glass-tooltip glass-tooltip--${align}`}>
      {children}
      {disabled ? null : (
        <span className="glass-tooltip__label" role="tooltip">
          {label}
        </span>
      )}
    </span>
  );
}
