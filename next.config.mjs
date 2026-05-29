/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export: the app is fully client-side (IndexedDB), so every route
  // prerenders to static HTML served by Cloudflare Workers static assets.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
