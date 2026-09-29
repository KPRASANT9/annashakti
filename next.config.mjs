/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/", destination: "/home.html" },
      { source: "/index.html", destination: "/home.html" },
      { source: "/kitchen", destination: "/kitchen.html" },
      { source: "/kitchen/", destination: "/kitchen.html" },
    ];
  },
};
export default nextConfig;
