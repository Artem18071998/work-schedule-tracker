"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, LogIn, Shield } from "lucide-react"

// Простая функция хеширования для пароля
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSetup, setIsSetup] = useState(false)
  const [setupPassword, setSetupPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const router = useRouter()

  // Проверяем, установлен ли пароль
  useEffect(() => {
    const hasPassword = localStorage.getItem("atlant-auth-hash")
    setIsSetup(!!hasPassword)
  }, [])

  // Функция для установки пароля
  const handleSetupPassword = () => {
    if (setupPassword.length < 6) {
      setError("Пароль повинен містити не менше 6 символів")
      return
    }

    if (setupPassword !== confirmPassword) {
      setError("Паролі не співпадають")
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      const hashedPassword = simpleHash(setupPassword)
      localStorage.setItem("atlant-auth-hash", hashedPassword)
      localStorage.setItem("atlant-auth-timestamp", new Date().toISOString())
      setIsLoading(false)
      setIsSetup(true)
      setError("")
    }, 1000)
  }

  // Функция для входа
  const handleLogin = () => {
    setError("")
    if (!password) {
      setError("Введіть пароль")
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      const storedHash = localStorage.getItem("atlant-auth-hash")
      const inputHash = simpleHash(password)

      if (storedHash === inputHash) {
        // Успешный вход
        localStorage.setItem("atlant-auth-status", "authenticated")
        localStorage.setItem("atlant-auth-timestamp", new Date().toISOString())
        router.push("/")
      } else {
        setError("Невірний пароль")
        setIsLoading(false)
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl rounded-2xl border-0">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-2xl p-6 sm:p-8">
          <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8" />
            {isSetup ? "Вхід до системи" : "Налаштування доступу"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          {isSetup ? (
            // Форма входа
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">Введіть пароль для доступу до системи обліку робочого часу.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-semibold">
                  Пароль
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введіть пароль"
                    className="border-2 border-gray-200 focus:border-blue-500 rounded-lg pr-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLogin()
                    }}
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg shadow-md"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Перевірка...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Увійти
                  </span>
                )}
              </Button>
            </div>
          ) : (
            // Форма установки пароля
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  Вітаємо! Це перший запуск системи. Встановіть пароль для захисту ваших даних.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="setupPassword" className="text-gray-700 font-semibold">
                  Створіть пароль
                </Label>
                <Input
                  id="setupPassword"
                  type="password"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="Мінімум 6 символів"
                  className="border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold">
                  Підтвердіть пароль
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторіть пароль"
                  className="border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSetupPassword()
                  }}
                />
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <Button
                onClick={handleSetupPassword}
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg shadow-md"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Збереження...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Встановити пароль
                  </span>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
