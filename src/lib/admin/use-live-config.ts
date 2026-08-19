"use client";

import { useEffect, useRef } from "react";
import {
  mergeWrappedConfig,
  type WrappedAdminConfig,
} from "@/lib/admin/wrapped-config";

export type LiveConfigPayload = {
  type: "wrapped-config";
  config: unknown;
  updatedAt: string | null;
  updatedByLogin: string | null;
};

function liveUrls() {
  const sse = "/api/live";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const ws = `${protocol}//${window.location.host}/api/live`;
  return { sse, ws };
}

function parseEvent(raw: string): LiveConfigPayload | null {
  try {
    const data = JSON.parse(raw) as LiveConfigPayload;
    if (data?.type !== "wrapped-config") return null;
    return data;
  } catch {
    return null;
  }
}

export function useLiveWrappedConfig(
  onEvent: (payload: {
    config: WrappedAdminConfig;
    updatedAt: string | null;
    updatedByLogin: string | null;
  }) => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let stopped = false;
    let socket: WebSocket | null = null;
    let source: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let delay = 1000;
    let usedSse = false;
    let handedOff = false;

    const emit = (raw: string) => {
      const parsed = parseEvent(raw);
      if (!parsed?.updatedAt) return;
      onEventRef.current({
        config: mergeWrappedConfig(parsed.config),
        updatedAt: parsed.updatedAt,
        updatedByLogin: parsed.updatedByLogin,
      });
    };

    const connectSse = () => {
      if (stopped || source) return;
      usedSse = true;
      source = new EventSource(liveUrls().sse);
      source.onmessage = (event) => emit(event.data);
      source.onerror = () => {
        source?.close();
        source = null;
        if (stopped) return;
        reconnectTimer = window.setTimeout(() => {
          if (!stopped) connectSse();
        }, delay);
        delay = Math.min(delay * 2, 30_000);
      };
    };

    const connectWs = () => {
      if (stopped) return;
      const { ws } = liveUrls();
      let opened = false;
      try {
        socket = new WebSocket(ws);
      } catch {
        connectSse();
        return;
      }

      socket.addEventListener("open", () => {
        opened = true;
        delay = 1000;
      });
      socket.addEventListener("message", (event) => {
        emit(String(event.data));
      });
      const fallbackOrReconnect = () => {
        if (stopped || handedOff) return;
        handedOff = true;
        socket = null;
        if (!opened && !usedSse) {
          connectSse();
          return;
        }
        reconnectTimer = window.setTimeout(() => {
          handedOff = false;
          if (stopped) return;
          if (usedSse) connectSse();
          else connectWs();
        }, delay);
        delay = Math.min(delay * 2, 30_000);
      };
      socket.addEventListener("error", fallbackOrReconnect);
      socket.addEventListener("close", fallbackOrReconnect);
    };

    connectWs();

    return () => {
      stopped = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socket?.close();
      source?.close();
    };
  }, []);
}
