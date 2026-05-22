"use client";

import { useEffect } from "react";
import { initNativeShell } from "@/lib/native";

/**
 * Mounts once at the root and configures the native shell (status bar colour,
 * splash dismissal) if the app is running inside Capacitor. Renders nothing
 * and is a no-op on the web.
 */
export function NativeShellInit() {
  useEffect(() => {
    void initNativeShell();
  }, []);
  return null;
}
