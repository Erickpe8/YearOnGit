import { ErrorScreen } from "@/components/error/error-screen";
import {
  ERROR_STATUS_CODES,
  parseErrorStatusCode,
} from "@/lib/errors/catalog";

type ErrorCodePageProps = {
  params: Promise<{ code: string }>;
};

export function generateStaticParams() {
  return ERROR_STATUS_CODES.map((code) => ({ code: String(code) }));
}

export default async function ErrorCodePage({ params }: ErrorCodePageProps) {
  const { code } = await params;
  return <ErrorScreen code={parseErrorStatusCode(code)} />;
}
