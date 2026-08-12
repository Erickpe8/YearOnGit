import { redirect } from "next/navigation";
import { WrappedExperience } from "@/components/wrapped/wrapped-experience";
import { auth } from "@/auth";

export default async function WrappedPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  return <WrappedExperience />;
}
