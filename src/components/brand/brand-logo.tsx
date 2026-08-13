import Link from "next/link";
import { brandName } from "@/lib/brand/assets";
import { BrandWordmark } from "./brand-wordmark";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  href?: string | null;
  className?: string;
};

export function BrandLogo({
  size = "md",
  href = "/",
  className = "",
}: BrandLogoProps) {
  const wordmark = <BrandWordmark size={size} className={className} />;

  if (href) {
    return (
      <Link
        href={href}
        aria-label={brandName}
        className="inline-flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {wordmark}
      </Link>
    );
  }

  return <span className="inline-flex shrink-0 items-center">{wordmark}</span>;
}
