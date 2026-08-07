import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Ship Chromium's shared libraries with the two routes that render a PDF.
   *
   * v0.6.66 deployed and then failed at runtime with:
   *   /tmp/chromium: error while loading shared libraries: libnss3.so
   *
   * The cause: @sparticuz/chromium keeps the browser AND its dependencies as
   * Brotli archives in its bin/ directory, and extracts them to /tmp at first
   * use. Next.js file tracing follows `import` statements, so it found the
   * package's JavaScript and shipped that — but the .br archives are opened at
   * runtime by path, never imported, so nothing pointed at them and they were
   * left out. chromium.br happened to survive; al2023.tar.br, which carries
   * libnss3, did not. Hence a binary that exists and cannot start.
   *
   * These paths are relative to the workspace root, and the keys are route
   * paths, so only the two functions that actually render a PDF carry the
   * ~76 MB. Every other function is unaffected.
   */
  outputFileTracingIncludes: {
    "/api/onboarding/contract/[id]/pdf": [
      "./node_modules/@sparticuz/chromium/bin/**",
    ],
    "/api/onboarding/contract/sign": [
      "./node_modules/@sparticuz/chromium/bin/**",
    ],
  },
};

export default nextConfig;
