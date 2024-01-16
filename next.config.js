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
}

module.exports = nextConfig
