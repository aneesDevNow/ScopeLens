import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Trigger rebuild for deployment verification
};

export default nextConfig;
