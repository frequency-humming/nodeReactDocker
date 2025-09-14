/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig

//for dev 

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   async rewrites() {
//     return [
//       {
//         source: '/api/:path*',  // Only proxy /api routes
//         destination: 'http://localhost:8000/api/:path*',
//       },
//     ]
//   },
// }

// module.exports = nextConfig