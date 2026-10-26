import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Todas as telas dependem de quem está logado (dados por usuário), então não usamos
  // Cache Components / pré-renderização parcial: as páginas são sempre geradas na hora.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
