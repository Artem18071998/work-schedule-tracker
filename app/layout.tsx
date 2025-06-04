import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "./auth-provider"

export const metadata: Metadata = {
  title: "Табель обліку робочого часу - Атлант",
  description: "Система обліку робочого часу для аутсорсингової компанії Атлант",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
