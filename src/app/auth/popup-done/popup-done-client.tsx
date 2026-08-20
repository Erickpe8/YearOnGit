"use client";

import { useEffect } from "react";

const MESSAGE = { type: "yearongit:oauth" } as const;

export default function AuthPopupDonePage() {
  useEffect(() => {
    try {
      window.opener?.postMessage(MESSAGE, window.location.origin);
    } catch {}
    window.close();
    window.setTimeout(() => {
      window.location.replace("/loading");
    }, 250);
  }, []);

  return null;
}
