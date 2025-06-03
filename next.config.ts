import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Настройки изображений
  images: {
    unoptimized: true,
  },

  // Отключаем проверки во время сборки
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Настройки безопасности
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ]
  },

  // Переменные окружения для клиента
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || "",
  },
}

export default nextConfig
