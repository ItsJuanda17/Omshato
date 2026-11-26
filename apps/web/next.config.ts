import type { NextConfig } from "next";

/** Dirección del API. Solo la ve el servidor de Next: el navegador nunca habla con el API. */
const API_URL = process.env.API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    // Las fotos de los relojes (hasta 5 MB) se suben como acción del servidor.
    serverActions: { bodySizeLimit: "6mb" },
  },
  async rewrites() {
    // Las fotos se piden a este mismo sitio y Next las trae del API. Así el navegador no necesita
    // saber dónde está el API, no hay CORS y el optimizador de imágenes las ve como locales.
    return [{ source: "/fotos/:path*", destination: `${API_URL}/api/fotos/:path*` }];
  },
};

export default nextConfig;
