/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    const isDev = process.env.NODE_ENV !== 'production';
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || (isDev ? 'http://localhost:5000/api/v1' : 'https://bizerp-api.vercel.app/api/v1');
    return [
      {
        source: '/backend-api/:path*',
        destination: `${backendUrl}/:path*`
      }
    ];
  }
};

export default nextConfig;
