import { auth } from "@/auth";
import { AuthSessionProvider } from "@/providers/auth-session-provider";

export async function AuthSessionProviderServer({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  return (
    <AuthSessionProvider session={session}>{children}</AuthSessionProvider>
  );
}
