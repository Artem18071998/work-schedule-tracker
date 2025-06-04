"use client"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  isAuthenticated: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Проверяем аутентификацию
    const checkAuth = () => {
      const authStatus = localStorage.getItem("atlant-auth-status")
      const authTimestamp = localStorage.getItem("atlant-auth-timestamp")
      const hasPassword = localStorage.getItem("atlant-auth-hash")

      // Если пароль еще не установлен, перенаправляем на страницу входа
      if (!hasPassword) {
        setIsAuthenticated(false)
        if (pathname !== "/login") {
          router.push("/login")
        }
        setIsLoading(false)
        return
      }

      // Если пользователь не аутентифицирован, перенаправляем на страницу входа
      if (authStatus !== "authenticated") {
        setIsAuthenticated(false)
        if (pathname !== "/login") {
          router.push("/login")
        }
        setIsLoading(false)
        return
      }

      // Проверяем срок действия сессии (24 часа)
      if (authTimestamp) {
        const timestamp = new Date(authTimestamp).getTime()
        const now = new Date().getTime()
        const hoursDiff = (now - timestamp) / (1000 * 60 * 60)

        if (hoursDiff > 24) {
          // Сессия истекла
          localStorage.removeItem("atlant-auth-status")
          setIsAuthenticated(false)
          if (pathname !== "/login") {
            router.push("/login")
          }
          setIsLoading(false)
          return
        }
      }

      // Пользователь аутентифицирован
      setIsAuthenticated(true)
      if (pathname === "/login") {
        router.push("/")
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [pathname, router])

  // Функция выхода из системы
  const logout = () => {
    localStorage.removeItem("atlant-auth-status")
    setIsAuthenticated(false)
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Завантаження...</p>
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={{ isAuthenticated, logout }}>{children}</AuthContext.Provider>
}
