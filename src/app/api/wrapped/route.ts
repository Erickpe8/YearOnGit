import { AuthenticationError, AuthorizationError } from "@/lib/errors/app-error";
import { jsonError, jsonOk, getApiRequestId } from "@/lib/http/api-response";
import { isAdminLogin } from "@/lib/admin/access";
import { loadWrappedConfig } from "@/lib/admin/settings";
import { getGitHubAccessToken, requireAuth } from "@/lib/auth/session";
import { fetchViewerWrapped } from "@/lib/wrapped/fetch-viewer-wrapped";

export async function GET(request: Request) {
  const requestId = getApiRequestId(request);
  const session = await requireAuth();
  if (!session) {
    return jsonError(
      new AuthenticationError({
        message: "Unauthorized",
        userMessage: "Your GitHub connection needs attention.",
        statusCode: 401,
        requestId,
      }),
      { requestId, endpoint: "/api/wrapped" },
    );
  }

  const config = await loadWrappedConfig();
  const preview =
    new URL(request.url).searchParams.get("preview") === "1" &&
    isAdminLogin(session.user.login);
  if (!config.wrappedEnabled && !preview) {
    return jsonError(
      new AuthorizationError({
        message: "Wrapped is disabled",
        userMessage: "This Wrapped isn't available right now.",
        statusCode: 403,
        requestId,
      }),
      { requestId, endpoint: "/api/wrapped" },
    );
  }

  const token = await getGitHubAccessToken();
  if (!token) {
    return jsonError(
      new AuthenticationError({
        message: "GitHub account not connected",
        userMessage: "Your GitHub connection needs attention.",
        statusCode: 401,
        requestId,
      }),
      { requestId, endpoint: "/api/wrapped" },
    );
  }

  try {
    const payload = await fetchViewerWrapped(token, config);
    return jsonOk(payload, { requestId });
  } catch (error) {
    return jsonError(error, { requestId, endpoint: "/api/wrapped" });
  }
}
