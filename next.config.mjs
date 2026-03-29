/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cho phép import .mjs files
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },

  // Headers bảo mật
  async headers() {
    return [
      {
        source: '/api/lti/:path*',
        headers: [
          // Cho phép Microsoft embed trong iframe (nếu cần)
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          {
            key: 'Content-Security-Policy',
            value:
              "frame-ancestors 'self' https://*.microsoft.com https://*.microsoftonline.com",
          },
        ],
      },
      {
        // JWKS endpoint — cho phép cache công khai
        source: '/api/lti/keys',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

export default nextConfig;
