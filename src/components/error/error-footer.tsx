import { BrandWordmark } from "@/components/brand/brand-wordmark";

export function ErrorFooter({ label }: { label: string }) {
  return (
    <p className="mt-5 flex items-center justify-center gap-2 font-display text-[10px] font-semibold text-on-surface-variant/70">
      <BrandWordmark size="sm" className="opacity-80" />
      <span aria-hidden>·</span>
      <span>{label}</span>
    </p>
  );
}
