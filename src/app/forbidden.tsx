import { ErrorScreen } from "@/components/error/error-screen";

export default function ForbiddenPage() {
  return <ErrorScreen code={403} />;
}
