import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Transpile Three.js ecosystem packages.
   * R3F and Drei use ESM that needs to be transpiled
   * for full Next.js compatibility.
   */
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
