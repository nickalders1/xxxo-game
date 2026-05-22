/**
 * Lazy-loaded Capacitor helpers. Every function is a no-op in non-native
 * environments (regular browser, server-side rendering) so callers don't
 * need to feature-detect.
 */

let cachedIsNative: boolean | null = null;

async function isNative(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (cachedIsNative !== null) return cachedIsNative;
  try {
    const { Capacitor } = await import("@capacitor/core");
    cachedIsNative = Capacitor.isNativePlatform();
  } catch {
    cachedIsNative = false;
  }
  return cachedIsNative;
}

/** Light haptic tap — fires on successful moves to make the native app feel native. */
export async function lightHaptic(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* plugin not available — silently ignore */
  }
}

/** Stronger haptic — for game-end / errors. */
export async function notificationHaptic(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* plugin not available — silently ignore */
  }
}

/** Configure status bar + hide splash screen once the app shell has hydrated. */
export async function initNativeShell(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
      import("@capacitor/status-bar"),
      import("@capacitor/splash-screen"),
    ]);
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    await StatusBar.setBackgroundColor({ color: "#0D1117" }).catch(() => {});
    await SplashScreen.hide().catch(() => {});
  } catch {
    /* not running natively */
  }
}
