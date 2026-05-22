import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nalders.xxxo",
  appName: "XXXo",
  // The native app loads the remote web build, so the local web bundle here
  // is essentially unused. We still need to point webDir at *something*
  // Capacitor can read; `public/` always exists.
  webDir: "public",
  // Remote URL strategy: the native shell wraps the deployed web app.
  // Override CAP_DEV=1 + CAP_DEV_URL during local development to point at
  // your laptop's LAN address (e.g. http://192.168.1.42:3000).
  server: {
    url:
      process.env.CAP_DEV === "1"
        ? process.env.CAP_DEV_URL || "http://localhost:3000"
        : "https://xxxo-game.com",
    cleartext: process.env.CAP_DEV === "1",
    androidScheme: "https",
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0D1117",
  },
  android: {
    backgroundColor: "#0D1117",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0D1117",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0D1117",
      overlaysWebView: false,
    },
  },
};

export default config;
