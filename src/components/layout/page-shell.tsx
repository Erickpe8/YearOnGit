"use client";

import { useApp } from "@/providers/app-provider";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { NoiseOverlay } from "@/components/ui/noise-overlay";
import { GlassHeader } from "./glass-header";
import { HeaderRestorePill } from "./header-restore-pill";
import { SiteFooter } from "./site-footer";

type PageShellProps = {
  children: React.ReactNode;
  immersive?: boolean;
  wrapped?: boolean;
  className?: string;
  footerCompact?: boolean;
  showFooterLinks?: boolean;
  fitContent?: boolean;
};

export function PageShell({
  children,
  immersive = false,
  wrapped = false,
  className = "",
  footerCompact = false,
  showFooterLinks = true,
  fitContent = false,
}: PageShellProps) {
  const { headerVisible } = useApp();

  if (wrapped) {
    return (
      <>
        <GlassHeader />
        <HeaderRestorePill />
        <div
          className={`wrapped-root relative flex flex-col ${
            headerVisible ? "wrapped-root--header" : ""
          } ${className}`}
        >
          <AmbientBackground />
          {children}
          <NoiseOverlay />
        </div>
      </>
    );
  }

  const topPadding = headerVisible
    ? "pt-14 md:pt-16"
    : immersive
      ? "pt-0"
      : "pt-4";

  return (
    <>
      <GlassHeader />
      <HeaderRestorePill />
      <div
        className={`relative flex min-h-screen flex-col ${topPadding} ${className}`}
      >
        <AmbientBackground />
        <div className={fitContent ? "flex flex-col" : "flex flex-1 flex-col"}>
          {children}
        </div>
        <SiteFooter
          compact={footerCompact || immersive}
          showLinks={showFooterLinks}
        />
        <NoiseOverlay />
      </div>
    </>
  );
}
