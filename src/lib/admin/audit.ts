import { prisma } from "@/lib/db";

export type AdminLogRow = {
  id: string;
  action: string;
  summary: string;
  actorLogin: string | null;
  createdAt: Date;
};

export async function recordAdminLog(input: {
  action: string;
  summary: string;
  actorLogin: string | null;
}): Promise<void> {
  const id = `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    await prisma.adminAuditLog.create({
      data: {
        id,
        action: input.action,
        summary: input.summary,
        actorLogin: input.actorLogin,
      },
    });
    return;
  } catch {
  }
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "AdminAuditLog" (id, action, summary, "actorLogin", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      id,
      input.action,
      input.summary,
      input.actorLogin,
    );
  } catch (error) {
    console.error("[admin-log]", error);
  }
}
