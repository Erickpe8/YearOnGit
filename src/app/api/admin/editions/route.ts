import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { loadWrappedConfig } from "@/lib/admin/settings";
import { listEditions } from "@/lib/admin/catalog-lists";
import { parseListQuery } from "@/lib/admin/list-query";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { search, page, pageSize, status } = parseListQuery(
    new URL(request.url),
  );
  const config = await loadWrappedConfig();
  return NextResponse.json(
    listEditions(config, search, status, page, pageSize),
  );
}
