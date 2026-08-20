import type { Metadata } from "next";
import { ErrorScreen } from "@/components/error/error-screen";
import {
  ERROR_STATUS_CODES,
  parseErrorStatusCode,
} from "@/lib/errors/catalog";
import { buildPageMetadata } from "@/lib/seo/pages";

type ErrorCodePageProps = {
  params: Promise<{ code: string }>;
};

export const metadata: Metadata = buildPageMetadata("errors");

export function generateStaticParams() {
  return ERROR_STATUS_CODES.map((code) => ({ code: String(code) }));
}

export default async function ErrorCodePage({ params }: ErrorCodePageProps) {
  const { code } = await params;
  return <ErrorScreen code={parseErrorStatusCode(code)} />;
}
