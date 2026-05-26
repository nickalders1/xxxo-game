import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Disable the service worker entirely during `next dev` so hot-reload works
  // and the SW cache doesn't pin stale assets while iterating.
  disable: process.env.NODE_ENV === "development",
  cacheOnNavigation: true,
  reloadOnOnline: true,
});

// Bundle analyzer lives in devDependencies (it pulls in webpack-bundle-analyzer
// which is large). On production VMs that install with --omit=dev or
// --production, the package is absent — so we only require it when actually
// running an analysis. With ANALYZE=false (or unset) this stays a no-op
// passthrough and Node never touches the module.
const withBundleAnalyzer: (config: NextConfig) => NextConfig =
  process.env.ANALYZE === "true"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@next/bundle-analyzer")({ enabled: true })
    : (config: NextConfig) => config;

const nextConfig: NextConfig = {
  devIndicators: false,
};

export default withBundleAnalyzer(withSerwist(nextConfig));
