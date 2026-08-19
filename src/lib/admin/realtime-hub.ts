export type WrappedConfigEvent = {
  type: "wrapped-config";
  config: unknown;
  updatedAt: string | null;
  updatedByLogin: string | null;
};

export type AdminRealtimeEvent = WrappedConfigEvent;

type HubClient = {
  send: (payload: string) => void;
};

const globalForHub = globalThis as unknown as {
  __yearongitAdminHub?: Set<HubClient>;
};

function hub(): Set<HubClient> {
  if (!globalForHub.__yearongitAdminHub) {
    globalForHub.__yearongitAdminHub = new Set();
  }
  return globalForHub.__yearongitAdminHub;
}

export function subscribeRealtime(client: HubClient): () => void {
  hub().add(client);
  return () => {
    hub().delete(client);
  };
}

export function broadcastRealtime(event: AdminRealtimeEvent): void {
  const payload = JSON.stringify(event);
  for (const client of hub()) {
    try {
      client.send(payload);
    } catch {
      hub().delete(client);
    }
  }
}

export function realtimeClientCount(): number {
  return hub().size;
}
