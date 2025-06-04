"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { useAuth } from "../auth-provider"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Save,
  Upload,
  RefreshCw,
  Copy,
  FileDown,
  FileUp,
  Smartphone,
  Monitor,
  Cloud,
  Shield,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Info,
  LogOut,
} from "lucide-react"
import Link from "next/link"

interface Worker {
  id: string
  name: string
  position: string
  phone: string
  createdAt: string
}

interface WorkRecord {
  id: string
  workerId: string
  date: string
  shift: string
  status: "присутній" | "відсутній" | "запізнення" | "лікарняний" | "відпустка"
  arrivalTime?: string
  departureTime?: string
  lunchBreak?: number
  notes?: string
  createdAt: string
}

export default function SyncPage() {
  const { logout } = useAuth()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([])
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle")
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [syncCode, setSyncCode] = useState("")
  const [importData, setImportData] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)

  // Загрузка данных из localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWorkers = localStorage.getItem("atlant-workers")
      const savedRecords = localStorage.getItem("atlant-work-records")
      const savedSyncTime = localStorage.getItem("atlant-last-sync")

      if (savedWorkers) {
        try {
          setWorkers(JSON.parse(savedWorkers))
        } catch (error) {
          console.error("Ошибка загрузки работников:", error)
        }
      }

      if (savedRecords) {
        try {
          setWorkRecords(JSON.parse(savedRecords))
        } catch (error) {
          console.error("Ошибка загрузки записей:", error)
        }
      }

      if (savedSyncTime) {
        setLastSyncTime(savedSyncTime)
      }

      setIsLoaded(true)
    }
  }, [])

  // Генерация кода синхронизации
  const generateSyncCode = () => {
    const data = {
      workers,
      workRecords,
      timestamp: new Date().toISOString(),
      version: "1.0",
    }

    // Используем универсальную функцию кодирования Base64 для Unicode
    const jsonString = JSON.stringify(data)
    const encoded = btoa(unescape(encodeURIComponent(jsonString)))

    setSyncCode(encoded)
  }

  // Импорт данных по коду
  const importDataFromCode = () => {
    try {
      setSyncStatus("syncing")
      // Декодирование с поддержкой Unicode
      const jsonString = decodeURIComponent(escape(atob(importData)))
      const decoded = JSON.parse(jsonString)

      if (decoded.workers && decoded.workRecords) {
        // Сохраняем данные
        localStorage.setItem("atlant-workers", JSON.stringify(decoded.workers))
        localStorage.setItem("atlant-work-records", JSON.stringify(decoded.workRecords))

        const syncTime = new Date().toISOString()
        localStorage.setItem("atlant-last-sync", syncTime)

        setWorkers(decoded.workers)
        setWorkRecords(decoded.workRecords)
        setLastSyncTime(syncTime)
        setSyncStatus("success")
        setImportData("")

        setTimeout(() => setSyncStatus("idle"), 3000)
      } else {
        throw new Error("Неправильний формат даних")
      }
    } catch (error) {
      console.error("Помилка імпорту:", error)
      setSyncStatus("error")
      setTimeout(() => setSyncStatus("idle"), 3000)
    }
  }

  // Экспорт данных в файл
  const exportDataToFile = () => {
    const data = {
      workers,
      workRecords,
      timestamp: new Date().toISOString(),
      version: "1.0",
      appName: "Atlant Work Schedule Tracker",
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `atlant_backup_${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    // Обновляем время последней синхронизации
    const syncTime = new Date().toISOString()
    localStorage.setItem("atlant-last-sync", syncTime)
    setLastSyncTime(syncTime)
  }

  // Импорт данных из файла
  const importDataFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        setSyncStatus("syncing")
        const data = JSON.parse(e.target?.result as string)

        if (data.workers && data.workRecords) {
          // Сохраняем данные
          localStorage.setItem("atlant-workers", JSON.stringify(data.workers))
          localStorage.setItem("atlant-work-records", JSON.stringify(data.workRecords))

          const syncTime = new Date().toISOString()
          localStorage.setItem("atlant-last-sync", syncTime)

          setWorkers(data.workers)
          setWorkRecords(data.workRecords)
          setLastSyncTime(syncTime)
          setSyncStatus("success")

          setTimeout(() => setSyncStatus("idle"), 3000)
        } else {
          throw new Error("Неправильний формат файлу")
        }
      } catch (error) {
        console.error("Помилка імпорту файлу:", error)
        setSyncStatus("error")
        setTimeout(() => setSyncStatus("idle"), 3000)
      }
    }
    reader.readAsText(file)

    // Очищаем input для возможности повторного выбора того же файла
    event.target.value = ""
  }

  // Копирование кода в буфер обмена
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert("Код скопійовано в буфер обміну!")
    } catch (error) {
      console.error("Помилка копіювання:", error)
      // Fallback для старых браузеров
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      alert("Код скопійовано в буфер обміну!")
    }
  }

  // Очистка всех данных
  const clearAllData = () => {
    if (confirm("Ви впевнені, що хочете видалити всі дані? Цю дію неможливо скасувати!")) {
      localStorage.removeItem("atlant-workers")
      localStorage.removeItem("atlant-work-records")
      localStorage.removeItem("atlant-last-sync")
      setWorkers([])
      setWorkRecords([])
      setLastSyncTime(null)
      alert("Всі дані видалено!")
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Завантаження...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100">
      <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
        {/* Заголовок с кнопкой назад */}
        <Card className="bg-white shadow-xl rounded-2xl border-0">
          <CardContent className="p-4 sm:p-8">
            <div className="flex items-center gap-3 sm:gap-6">
              <Link href="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Назад</span>
                </Button>
              </Link>
              <Button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl font-semibold px-4 py-2"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Вийти</span>
                <span className="sm:hidden">Вихід</span>
              </Button>
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-3 sm:p-4 rounded-2xl shadow-lg">
                <RefreshCw className="h-6 w-6 sm:h-10 sm:w-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-1 sm:mb-2 leading-tight">
                  Синхронізація даних
                </h1>
                <p className="text-sm sm:text-xl text-gray-600 font-medium">Резервне копіювання та передача даних</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Статистика данных */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-100">Працівники</CardTitle>
              <Monitor className="h-5 w-5 sm:h-8 sm:w-8 text-green-200" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-2xl sm:text-4xl font-bold">{workers.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-blue-100">Записи</CardTitle>
              <Smartphone className="h-5 w-5 sm:h-8 sm:w-8 text-blue-200" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-2xl sm:text-4xl font-bold">{workRecords.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-purple-100">Унікальні дні</CardTitle>
              <Cloud className="h-5 w-5 sm:h-8 sm:w-8 text-purple-200" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-2xl sm:text-4xl font-bold">{new Set(workRecords.map((r) => r.date)).size}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-100">Останя синхронізація</CardTitle>
              <Shield className="h-5 w-5 sm:h-8 sm:w-8 text-orange-200" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xs sm:text-lg font-bold">
                {lastSyncTime ? new Date(lastSyncTime).toLocaleDateString("uk-UA") : "Ніколи"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Статус синхронизации */}
        {syncStatus !== "idle" && (
          <Card className="bg-white shadow-xl rounded-2xl border-0">
            <CardContent className="p-4 sm:p-6">
              <div
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  syncStatus === "success"
                    ? "bg-green-100 text-green-800"
                    : syncStatus === "error"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                {syncStatus === "syncing" && <RefreshCw className="h-5 w-5 animate-spin" />}
                {syncStatus === "success" && <CheckCircle className="h-5 w-5" />}
                {syncStatus === "error" && <AlertTriangle className="h-5 w-5" />}
                <span className="font-medium">
                  {syncStatus === "syncing" && "🔄 Синхронізація..."}
                  {syncStatus === "success" && "✅ Дані успішно синхронізовано!"}
                  {syncStatus === "error" && "❌ Помилка синхронізації"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Резервное копирование */}
        <Card className="bg-white shadow-xl rounded-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-2xl p-4 sm:p-8">
            <CardTitle className="flex items-center gap-4 text-lg sm:text-2xl">
              <Save className="h-6 w-6 sm:h-8 sm:w-8" />💾 Резервне копіювання
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-8">
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-emerald-800 mb-1">Безпечне зберігання даних</h3>
                    <p className="text-emerald-700 text-sm">
                      Створіть резервну копію всіх даних у вигляді файлу. Файл можна зберегти на комп'ютері, хмарному
                      сховищі або передати іншим користувачам.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 flex-wrap">
                <Button
                  onClick={exportDataToFile}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl text-base font-semibold px-6 py-3"
                >
                  <FileDown className="h-5 w-5 mr-2" />💾 Створити резервну копію
                </Button>

                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importDataFromFile}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl text-base font-semibold px-6 py-3">
                    <FileUp className="h-5 w-5 mr-2" />📂 Відновити з файлу
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Код синхронизации */}
        <Card className="bg-white shadow-xl rounded-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-t-2xl p-4 sm:p-8">
            <CardTitle className="flex items-center gap-4 text-lg sm:text-2xl">
              <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8" />🔗 Швидка синхронізація
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-8">
            <div className="space-y-6">
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-cyan-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-cyan-800 mb-1">Швидка передача даних</h3>
                    <p className="text-cyan-700 text-sm">
                      Створіть код синхронізації для швидкої передачі даних між пристроями. Код можна надіслати через
                      месенджер або електронну пошту.
                    </p>
                  </div>
                </div>
              </div>

              {/* Генерация кода */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📤 Створити код синхронізації</h3>
                <div className="space-y-3">
                  <Button
                    onClick={generateSyncCode}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl text-base font-semibold px-6 py-3"
                  >
                    <Save className="h-5 w-5 mr-2" />🔗 Створити код
                  </Button>

                  {syncCode && (
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium text-gray-700">Код синхронізації:</Label>
                        <Badge className="bg-green-500 text-white">Готовий</Badge>
                      </div>
                      <div className="bg-white p-3 rounded border font-mono text-xs break-all max-h-32 overflow-y-auto mb-3">
                        {syncCode}
                      </div>
                      <Button
                        onClick={() => copyToClipboard(syncCode)}
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        <Copy className="h-4 w-4 mr-2" />📋 Копіювати код
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Импорт по коду */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📥 Імпорт за кодом</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="importCode" className="text-sm font-medium text-gray-700 mb-2 block">
                      Вставте код синхронізації:
                    </Label>
                    <textarea
                      id="importCode"
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="Вставте код синхронізації тут..."
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg font-mono text-xs resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <Button
                    onClick={importDataFromCode}
                    disabled={!importData.trim() || syncStatus === "syncing"}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl text-base font-semibold px-6 py-3 disabled:opacity-50 disabled:transform-none"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    {syncStatus === "syncing" ? "Імпорт..." : "📥 Імпортувати дані"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Управление данными */}
        <Card className="bg-white shadow-xl rounded-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-2xl p-4 sm:p-8">
            <CardTitle className="flex items-center gap-4 text-lg sm:text-2xl">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8" />
              ⚠️ Управління даними
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-8">
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">Небезпечна зона</h3>
                    <p className="text-red-700 text-sm">
                      Ці дії незворотні. Переконайтеся, що у вас є резервна копія даних перед виконанням.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={clearAllData}
                variant="destructive"
                className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg"
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                🗑️ Видалити всі дані
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Инструкции */}
        <Card className="bg-white shadow-xl rounded-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-t-2xl p-4 sm:p-8">
            <CardTitle className="flex items-center gap-4 text-lg sm:text-2xl">
              <Info className="h-6 w-6 sm:h-8 sm:w-8" />📖 Інструкції
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">🔄 Як синхронізувати дані:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>На першому пристрої натисніть "Створити код синхронізації"</li>
                  <li>Скопіюйте згенерований код</li>
                  <li>Надішліть код на другий пристрій (через месенджер, email тощо)</li>
                  <li>На другому пристрої вставте код у поле "Імпорт за кодом"</li>
                  <li>Натисніть "Імпортувати дані"</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">💾 Резервне копіювання:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Регулярно створюйте резервні копії для безпеки даних</li>
                  <li>Зберігайте файли у хмарному сховищі (Google Drive, Dropbox тощо)</li>
                  <li>Файли мають формат JSON і містять всю інформацію про працівників та записи</li>
                  <li>Для відновлення просто завантажте файл через кнопку "Відновити з файлу"</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">🔒 Безпека:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Всі дані зберігаються локально у вашому браузері</li>
                  <li>Коди синхронізації не передаються на сервери</li>
                  <li>Ви повністю контролюєте свої дані</li>
                  <li>Рекомендуємо не передавати коди синхронізації незнайомим особам</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
