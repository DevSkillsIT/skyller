/** @type {import('next').NextConfig} */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Transpilacao de pacotes ES modules
  transpilePackages: ["use-stick-to-bottom"],

  turbopack: {
    root: __dirname,
  },

  // Permitir todos os subdominios skyller.ai para server actions
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3004",
        "skills.skyller.ai",
        "ramada.skyller.ai",
        "lindacor.skyller.ai",
        "wga.skyller.ai",
        "grupowink.skyller.ai",
        "gsantoexpedito.skyller.ai",
        "servcont.skyller.ai",
        "admin.skyller.ai",
        "*.skyller.ai",
      ],
    },
  },

  // Proxy para backend API (evita CORS)
  async rewrites() {
    const backendUrl = process.env.NEXUS_API_URL || "http://localhost:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },

  // Headers para permitir CORS dos subdominios
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Forwarded-Host" },
        ],
      },
    ];
  },
};

export default nextConfig;
