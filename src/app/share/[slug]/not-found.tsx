import { ErrorScreen } from "@/components/error/error-screen";

export default function ShareNotFound() {
  return (
    <ErrorScreen
      code={404}
      titleKey="errorShareTitle"
      descriptionKey="errorShareDescription"
    />
  );
}
