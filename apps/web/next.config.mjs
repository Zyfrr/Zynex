/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@zynex/shared"],
  async redirects() {
    return [
      {
        source: "/Dashboard",
        destination: "/dashboard",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
