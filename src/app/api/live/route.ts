import { loadAppSettings } from "@/lib/admin/settings";
import { subscribeRealtime } from "@/lib/admin/realtime-hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function snapshotPayload() {
  return loadAppSettings().then((settings) =>
    JSON.stringify({
      type: "wrapped-config",
      config: settings.config,
      updatedAt: settings.updatedAt ? settings.updatedAt.toISOString() : null,
      updatedByLogin: settings.updatedByLogin,
    }),
  );
}

function sseResponse() {
  const encoder = new TextEncoder();
  let unsubscribe = () => {};
  let keepAlive: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: string) => {
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      void snapshotPayload()
        .then((payload) => send(payload))
        .catch(() => undefined);

      unsubscribe = subscribeRealtime({ send });
      keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {}
      }, 25_000);
    },
    cancel() {
      if (keepAlive) clearInterval(keepAlive);
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function GET(request: Request) {
  const upgrade = request.headers.get("upgrade")?.toLowerCase();
  if (upgrade !== "websocket") {
    return sseResponse();
  }

  try {
    const { experimental_upgradeWebSocket } = await import("@vercel/functions");
    return experimental_upgradeWebSocket((ws) => {
      const send = (payload: string) => {
        try {
          ws.send(payload);
        } catch {}
      };
      const unsubscribe = subscribeRealtime({ send });
      void snapshotPayload()
        .then((payload) => send(payload))
        .catch(() => undefined);
      ws.on("close", unsubscribe);
      ws.on("error", unsubscribe);
    });
  } catch {
    return sseResponse();
  }
}
