import { redirect } from "next/navigation";
import { LoadingScreen } from "@/components/loading/loading-screen";
import { auth } from "@/auth";

export default async function LoadingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  return <LoadingScreen />;
}
