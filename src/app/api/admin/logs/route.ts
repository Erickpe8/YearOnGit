import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { listLogs } from "@/lib/admin/catalog-lists";
import { parseListQuery } from "@/lib/admin/list-query";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { search, page, pageSize } = parseListQuery(new URL(request.url));
  const result = await listLogs(search, page, pageSize);
  return NextResponse.json(result);
}
