import { IconGlobe } from "@/components/ui/icons";
import { getLocaleRegion, hasLocaleFlag } from "@/lib/i18n/locale-region";

type LocaleFlagProps = {
  locale: string;
  className?: string;
  size?: "sm" | "md";
};

export function LocaleFlag({
  locale,
  className = "",
  size = "sm",
}: LocaleFlagProps) {
  const region = getLocaleRegion(locale);

  if (!hasLocaleFlag(locale)) {
    return (
      <IconGlobe
        className={`${size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} shrink-0 text-current ${className}`}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={`locale-flag locale-flag--${size} flag:${region} ${className}`.trim()}
      aria-hidden
    />
  );
}
