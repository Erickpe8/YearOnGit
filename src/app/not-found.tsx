import { ErrorScreen } from "@/components/error/error-screen";

export default function NotFound() {
  return <ErrorScreen code={404} />;
}
