/** @type {import('next').NextConfig} */
const nextConfig = {
  // Commenté pour permettre les APIs dynamiques
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
