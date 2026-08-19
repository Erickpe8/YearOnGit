import { auth } from "@/auth";
import { isAdminLogin } from "@/lib/admin/access";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !isAdminLogin(session.user.login)) {
    return null;
  }
  return session;
}
