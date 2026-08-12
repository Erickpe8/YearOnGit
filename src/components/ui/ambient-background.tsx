export function AmbientBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 hero-gradient" />
      <div className="pointer-events-none absolute top-1/4 -left-20 h-96 w-96 animate-pulse rounded-full bg-primary/10 blur-[120px]" />
      <div
        className="pointer-events-none absolute -right-20 bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-secondary/10 blur-[120px]"
        style={{ animationDelay: "2s" }}
      />
    </>
  );
}
