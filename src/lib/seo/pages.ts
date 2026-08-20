import type { Metadata } from "next";
import { getAppBaseUrl } from "@/lib/app-url";
import { brandAssets, brandName } from "@/lib/brand/assets";

export type SeoPageId =
  | "landing"
  | "howItWorks"
  | "faq"
  | "privacy"
  | "terms"
  | "wrapped"
  | "loading"
  | "shareFallback"
  | "errors";

/**
 * Search intent + unique title/description per public surface.
 * Titles ≠ on-page H1 copy (H1 stays the landing tagline / legal document title).
 */
export const SEO_PAGES = {
  landing: {
    intent: "informational+transactional",
    intentNote: "Generate your GitHub year-in-review / Wrapped",
    title: "Generate Your GitHub Wrapped 2026",
    description:
      "Sign in with GitHub and get a cinematic year-in-review: commits, languages, streaks, and a shareable card. Free, read-only access.",
    path: "/",
    index: true,
  },
  howItWorks: {
    intent: "informational",
    intentNote: "Three steps from GitHub sign-in to a shareable Wrapped",
    title: "How YearOnGit Works",
    description:
      "Sign in with GitHub, generate your cinematic year-in-review, and share a link or README card. Free and read-only.",
    path: "/how-it-works",
    index: true,
  },
  faq: {
    intent: "informational",
    intentNote: "Common questions about YearOnGit pricing, scopes, and sharing",
    title: "YearOnGit FAQ",
    description:
      "Answers about YearOnGit: free access, GitHub permissions, README cards, public share links, and data storage.",
    path: "/faq",
    index: true,
  },
  privacy: {
    intent: "informational",
    intentNote: "How YearOnGit handles GitHub data and privacy",
    title: "Privacy Policy",
    description:
      "How YearOnGit uses GitHub OAuth, what data we store, and how sharing and profile cards work. Read-only scopes only.",
    path: "/privacy",
    index: true,
  },
  terms: {
    intent: "informational",
    intentNote: "Terms of use for YearOnGit",
    title: "Terms of Use",
    description:
      "Terms for using YearOnGit: GitHub Wrapped generation, sharing links, and acceptable use of the product.",
    path: "/terms",
    index: true,
  },
  wrapped: {
    intent: "private",
    intentNote: "Authenticated Wrapped experience — not for search",
    title: "Your Wrapped",
    description: "Your private GitHub year-in-review on YearOnGit.",
    path: "/wrapped",
    index: false,
  },
  loading: {
    intent: "private",
    intentNote: "Auth loading state — not for search",
    title: "Building your Wrapped",
    description: "Loading your GitHub Wrapped on YearOnGit.",
    path: "/loading",
    index: false,
  },
  shareFallback: {
    intent: "social",
    intentNote: "Public shared Wrapped when slug metadata fails",
    title: "Shared GitHub Wrapped",
    description: "A shared Year on Git recap from YearOnGit.",
    path: "/share",
    index: true,
  },
  errors: {
    intent: "utility",
    intentNote: "Error screens — keep out of the index",
    title: "Something went wrong",
    description: "An error page on YearOnGit.",
    path: "/errors",
    index: false,
  },
} as const satisfies Record<
  SeoPageId,
  {
    intent: string;
    intentNote: string;
    title: string;
    description: string;
    path: string;
    index: boolean;
  }
>;

export function absoluteUrl(path: string): string {
  const base = getAppBaseUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildPageMetadata(
  page: SeoPageId,
  overrides?: Partial<Metadata>,
): Metadata {
  const config = SEO_PAGES[page];
  const url = absoluteUrl(config.path);
  const title = config.title;
  const description = config.description;

  return {
    title,
    description,
    alternates: config.index ? { canonical: url } : undefined,
    robots: config.index
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title: `${title} | ${brandName}`,
      description,
      url,
      siteName: brandName,
      type: "website",
      images: [{ url: brandAssets.og, alt: `${brandName} Open Graph preview` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${brandName}`,
      description,
      images: [brandAssets.og],
    },
    ...overrides,
  };
}

export const LANDING_FAQ = [
  {
    question: "Is YearOnGit free?",
    answer:
      "Yes. Signing in with GitHub and viewing your Wrapped is free. We do not charge to generate or view your recap.",
  },
  {
    question: "Do I need to grant access to private repositories?",
    answer:
      "We ask for read-only permission so public and private activity can appear in your Wrapped. We never ask for permission to change anything, and we never ask for your password.",
  },
  {
    question: "How is the README / profile card generated?",
    answer:
      "When your Wrapped is ready, you can create a link and copy a short snippet that shows an image of your year stats on your GitHub profile README.",
  },
  {
    question: "Can I share my Wrapped publicly?",
    answer:
      "Yes. From the summary you can create a share link. Anyone who opens it can see that year's recap without signing in.",
  },
  {
    question: "What data do you store?",
    answer:
      "We keep what you need to stay signed in and reopen your Wrapped. If you create a public share link or a profile card, we store that too. We never save your GitHub password—access stays on the server. See the Privacy Policy for full details.",
  },
] as const;
