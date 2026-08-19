import { ErrorScreen } from "@/components/error/error-screen";

export default function UnauthorizedPage() {
  return <ErrorScreen code={401} />;
}
