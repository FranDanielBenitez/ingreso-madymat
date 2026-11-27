/** @type {import('next').NextConfig} */
const nextConfig = {
  // Esta app quedó en desuso: todo el tráfico se redirige a la nueva aplicación.
  async redirects() {
    return [
      {
        source: "/:path*",
        destination: "https://madymat.vercel.app/:path*",
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
