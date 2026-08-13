import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import {
  buildShareMetaDescription,
  buildShareMetaTitle,
  buildShareUrl,
  getAppBaseUrl,
  isValidShareSlug,
  isWrappedStats,
} from "@/lib/wrapped/share";
import type { WrappedPayload, WrappedStats } from "@/lib/wrapped/types";
import { SharedWrappedExperience } from "@/components/wrapped/shared-wrapped-experience";

type SharePageProps = {
  params: Promise<{ slug: string }>;
};

async function getActiveShare(slug: string): Promise<WrappedPayload | null> {
  if (!isValidShareSlug(slug)) return null;

  const share = await prisma.wrappedShare.findFirst({
    where: {
      slug: slug.toLowerCase(),
      isActive: true,
    },
    select: {
      username: true,
      year: true,
      stats: true,
    },
  });

  if (!share || !isWrappedStats(share.stats)) return null;

  return {
    username: share.username,
    year: share.year,
    stats: share.stats as WrappedStats,
  };
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getActiveShare(slug);

  if (!payload) {
    return {
      title: "Wrapped not found | YearOnGit",
      description: "This shared Year on Git link is unavailable.",
    };
  }

  const title = buildShareMetaTitle(payload);
  const description = buildShareMetaDescription(payload);
  const url = buildShareUrl(slug.toLowerCase());
  const ogImage = `${getAppBaseUrl()}/share/${slug.toLowerCase()}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "YearOnGit",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;
  const payload = await getActiveShare(slug);

  if (!payload) {
    notFound();
  }

  return <SharedWrappedExperience payload={payload} />;
}
