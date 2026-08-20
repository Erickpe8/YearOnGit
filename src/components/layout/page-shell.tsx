"use client";

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
  if (wrapped) {
    return (
      <>
        <HeaderRestorePill />
        <div className={`wrapped-root relative flex flex-col ${className}`}>
          <GlassHeader />
          <AmbientBackground />
          {children}
          <NoiseOverlay />
        </div>
      </>
    );
  }

  return (
    <div className={`relative flex min-h-dvh flex-col ${className}`}>
      <GlassHeader />
      <HeaderRestorePill />
      <AmbientBackground />
      <div
        className={
          fitContent
            ? "relative z-10 flex flex-col"
            : "relative z-10 flex min-h-0 flex-1 flex-col"
        }
      >
        {children}
      </div>
      <SiteFooter
        compact={footerCompact || immersive}
        showLinks={showFooterLinks}
      />
      <NoiseOverlay />
    </div>
  );
}
