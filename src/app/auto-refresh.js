"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AutoRefresh({ enabled }) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return undefined;

    const interval = window.setInterval(() => {
      router.refresh();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [enabled, router]);

  return null;
}
