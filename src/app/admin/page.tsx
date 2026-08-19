import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin/admin-panel";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  adminRuntimeInfo,
  loadAdminOverview,
  loadAppSettings,
} from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · YearOnGit",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await requireAdmin();
  if (!session) {
    redirect("/");
  }

  const [settings, overview] = await Promise.all([
    loadAppSettings(),
    loadAdminOverview(),
  ]);

  return (
    <AdminPanel
      settings={settings}
      overview={overview}
      runtime={adminRuntimeInfo()}
    />
  );
}
