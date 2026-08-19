import { NextResponse } from "next/server";
import { githubGraphql } from "@/lib/github/client";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getGitHubAccessToken } from "@/lib/auth/session";

const VIEWER_QUERY = `query AdminHealth { viewer { login } }`;

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getGitHubAccessToken();
  let rest: "connected" | "disconnected" = "disconnected";
  let graphql: "ok" | "error" = "error";

  try {
    const response = await fetch("https://api.github.com", {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            "User-Agent": "YearOnGit",
          }
        : { "User-Agent": "YearOnGit" },
      cache: "no-store",
    });
    rest = response.ok ? "connected" : "disconnected";
  } catch {
    rest = "disconnected";
  }

  if (token) {
    try {
      await githubGraphql<{ viewer: { login: string } | null }>(
        token,
        VIEWER_QUERY,
      );
      graphql = "ok";
    } catch {
      graphql = "error";
    }
  }

  return NextResponse.json({
    githubApi: rest,
    graphql,
    githubConnected: Boolean(token) && rest === "connected",
  });
}
