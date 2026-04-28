/** @type {import('next').NextConfig} */
const path = require('path');
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || '';
const basePath = rawBasePath && rawBasePath !== '/'
  ? `/${rawBasePath.replace(/^\/+|\/+$/g, '')}`
  : '';

const nextConfig = {
  // static export so you can deploy anywhere (Vercel, Netlify, Cloudflare, S3, etc.)
  output: 'export',
  basePath,
  trailingSlash: true, // matches WordPress URL style: /hello-in-morse-code/
  turbopack: { root: path.join(__dirname) },
  images: {
    unoptimized: true, // required for static export; we use plain <img> for live-domain assets anyway
    remotePatterns: [
      { protocol: 'https', hostname: 'morse-codetranslator.com' },
    ],
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
