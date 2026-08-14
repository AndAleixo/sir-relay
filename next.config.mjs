import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // ponytail: no next/image usage — disable optimizer (shrinks P2-SEC-10 Image Optimizer DoS surface)
  images: { unoptimized: false },
};

export default withNextIntl(nextConfig);
