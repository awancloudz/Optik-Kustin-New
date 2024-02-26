/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "http://localhost",
      "http://localhost:3000",
      "http://103.31.39.135:3000",
    ], // Add domains for which the images should be optimized and loaded
    loader: 'default', // Specify the image loader (default is 'default')
    path: 'http://localhost:3000/png', // The base path for image optimization
  },
  async headers() {
    return [
      {
        // Routes this applies to
        source: "/api/(.*)",
        // Headers
        headers: [
          // Allow for specific domains to have access or * for all
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
            // DOES NOT WORK
            // value: process.env.ALLOWED_ORIGIN,
          },
          // Allows for specific methods accepted
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          // Allows for specific headers accepted (These are a few standard ones)
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
