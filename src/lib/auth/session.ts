import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session;
}

export async function getGitHubAccessToken(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      provider: "github",
    },
    select: {
      access_token: true,
    },
  });

  return account?.access_token ?? null;
}
