import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";

export default function ShareNotFound() {
  return (
    <PageShell immersive className="items-center justify-center">
      <main className="relative z-10 flex min-h-[60dvh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="glass-card w-full rounded-2xl p-8">
          <h1 className="mb-3 font-display text-2xl font-bold text-on-surface">
            Wrapped not found
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-on-surface-variant">
            This share link is invalid, expired, or was revoked.
          </p>
          <Link
            href="/"
            className="btn-primary inline-flex w-full items-center justify-center rounded-full py-3 font-bold text-white"
          >
            Go home
          </Link>
        </div>
      </main>
    </PageShell>
  );
}
