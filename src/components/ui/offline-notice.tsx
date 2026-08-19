"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/providers/toast-provider";
import { useApp } from "@/providers/app-provider";

export function OfflineNotice() {
  const { t } = useApp();
  const { notify } = useToast();
  const [online, setOnline] = useState(true);
  const wasOffline = useRef(false);

  useEffect(() => {
    const goOffline = () => {
      setOnline(false);
      wasOffline.current = true;
      notify({ kind: "warning", title: t("toastOffline"), durationMs: 5000 });
    };
    const goOnline = () => {
      setOnline(true);
      if (wasOffline.current) {
        notify({ kind: "success", title: t("toastOnline"), durationMs: 3200 });
      }
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [notify, t]);

  if (online) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex justify-center px-4">
      <p className="glass-pill px-4 py-2 text-xs font-semibold text-on-surface">
        {t("toastOffline")}
      </p>
    </div>
  );
}
