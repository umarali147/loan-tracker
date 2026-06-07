import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served at https://arttools.live/loan-tracker behind nginx.
  basePath: "/loan-tracker",
  transpilePackages: [
    "@loan/core",
    "@loan/ui",
    "react-native",
    "react-native-web",
  ],
  turbopack: {
    resolveAlias: {
      "react-native": "react-native-web",
    },
    resolveExtensions: [
      ".web.tsx",
      ".web.ts",
      ".web.jsx",
      ".web.js",
      ".tsx",
      ".ts",
      ".jsx",
      ".js",
      ".mjs",
      ".json",
    ],
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-native$": "react-native-web",
    };
    config.resolve.extensions = [
      ".web.tsx",
      ".web.ts",
      ".web.jsx",
      ".web.js",
      ...(config.resolve.extensions || [".tsx", ".ts", ".jsx", ".js"]),
    ];
    return config;
  },
};

export default nextConfig;
