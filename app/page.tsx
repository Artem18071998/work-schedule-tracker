"use client"
import { useState, useEffect } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useAuth } from "./auth-provider"
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  UserPlus,
  Trash2,
  Menu,
  X,
  Save,
  Download,
  FileSpreadsheet,
  RefreshCw,
  LogOut,
} from "lucide-react"

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

interface ShiftSchedule {
  name: string
  start: string
  end: string
  days: string[]
}

const shifts: ShiftSchedule[] = [
  { name: "Перша зміна", start: "08:00", end: "17:00", days: ["Пн", "Вт", "Ср", "Чт", "Пт"] },
  { name: "Друга зміна", start: "11:00", end: "20:00", days: ["Пн", "Вт", "Ср", "Чт", "Пт"] },
  { name: "Субота", start: "09:00", end: "16:00", days: ["Сб"] },
]

export default function WorkScheduleTracker() {
  const { logout } = useAuth()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [newWorker, setNewWorker] = useState({ name: "", position: "", phone: "" })
  const [workerToDelete, setWorkerToDelete] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const [timeModalOpen, setTimeModalOpen] = useState(false)
  const [timeModalData, setTimeModalData] = useState<{
    workerId: string
    shift: string
    status: WorkRecord["status"]
    currentRecord?: WorkRecord
  }>()
  const [tempTimes, setTempTimes] = useState({
    arrivalTime: "",
    departureTime: "",
    lunchBreak: 60,
  })

  // Загрузка данных из localStorage при монтировании компонента
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWorkers = localStorage.getItem("atlant-workers")
      const savedRecords = localStorage.getItem("atlant-work-records")

      if (savedWorkers) {
        try {
          setWorkers(JSON.parse(savedWorkers))
        } catch (error) {
          console.error("Ошибка загрузки работников:", error)
          const defaultWorkers = [
            {
              id: "1",
              name: "Іван Петренко",
              position: "Комплектувальник",
              phone: "+380501234567",
              createdAt: new Date().toISOString(),
            },
            {
              id: "2",
              name: "Марія Коваленко",
              position: "Комплектувальник",
              phone: "+380671234567",
              createdAt: new Date().toISOString(),
            },
            {
              id: "3",
              name: "Олександр Сидоренко",
              position: "Старший комплектувальник",
              phone: "+380931234567",
              createdAt: new Date().toISOString(),
            },
          ]
          setWorkers(defaultWorkers)
          localStorage.setItem("atlant-workers", JSON.stringify(defaultWorkers))
        }
      } else {
        const defaultWorkers = [
          {
            id: "1",
            name: "Іван Петренко",
            position: "Комплектувальник",
            phone: "+380501234567",
            createdAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Марія Коваленко",
            position: "Комплектувальник",
            phone: "+380671234567",
            createdAt: new Date().toISOString(),
          },
          {
            id: "3",
            name: "Олександр Сидоренко",
            position: "Старший комплектувальник",
            phone: "+380931234567",
            createdAt: new Date().toISOString(),
          },
        ]
        setWorkers(defaultWorkers)
        localStorage.setItem("atlant-workers", JSON.stringify(defaultWorkers))
      }

      if (savedRecords) {
        try {
          setWorkRecords(JSON.parse(savedRecords))
        } catch (error) {
          console.error("Ошибка загрузки записей:", error)
          setWorkRecords([])
        }
      }

      setIsLoaded(true)
    }
  }, [])

  // Сохранение работников в localStorage при изменении
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem("atlant-workers", JSON.stringify(workers))
    }
  }, [workers, isLoaded])

  // Сохранение записей в localStorage при изменении
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem("atlant-work-records", JSON.stringify(workRecords))
    }
  }, [workRecords, isLoaded])

  // Добавление нового работника
  const addWorker = () => {
    if (newWorker.name && newWorker.position) {
      const worker: Worker = {
        id: Date.now().toString(),
        ...newWorker,
        createdAt: new Date().toISOString(),
      }
      setWorkers([...workers, worker])
      setNewWorker({ name: "", position: "", phone: "" })
    }
  }

  // Удаление работника
  const deleteWorker = (workerId: string) => {
    setWorkers(workers.filter((worker) => worker.id !== workerId))
    setWorkRecords(workRecords.filter((record) => record.workerId !== workerId))
    setWorkerToDelete(null)
  }

  // Подтверждение удаления
  const confirmDelete = (workerId: string) => {
    setWorkerToDelete(workerId)
  }

  // Отмена удаления
  const cancelDelete = () => {
    setWorkerToDelete(null)
  }

  // Отметка присутствия
  const markAttendance = (
    workerId: string,
    shift: string,
    status: WorkRecord["status"],
    arrivalTime?: string,
    departureTime?: string,
  ) => {
    const existingRecord = workRecords.find(
      (r) => r.workerId === workerId && r.date === selectedDate && r.shift === shift,
    )

    const currentTime = new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })

    if (existingRecord) {
      setWorkRecords(
        workRecords.map((r) =>
          r.id === existingRecord.id
            ? {
                ...r,
                status,
                arrivalTime:
                  arrivalTime ||
                  r.arrivalTime ||
                  (status === "присутній" || status === "запізнення" ? currentTime : undefined),
                departureTime: departureTime || r.departureTime,
                lunchBreak: r.lunchBreak || 60,
              }
            : r,
        ),
      )
    } else {
      const newRecord: WorkRecord = {
        id: Date.now().toString(),
        workerId,
        date: selectedDate,
        shift,
        status,
        arrivalTime: status === "присутній" || status === "запізнення" ? arrivalTime || currentTime : undefined,
        departureTime: departureTime,
        lunchBreak: 60,
        createdAt: new Date().toISOString(),
      }
      setWorkRecords([...workRecords, newRecord])
    }
  }

  // Расчет отработанных часов
  const calculateWorkedHours = (
    record: WorkRecord,
    shift: ShiftSchedule,
  ): { hours: number; minutes: number; totalMinutes: number } => {
    if (
      !record.arrivalTime ||
      record.status === "відсутній" ||
      record.status === "лікарняний" ||
      record.status === "відпустка"
    ) {
      return { hours: 0, minutes: 0, totalMinutes: 0 }
    }

    const arrivalTime = new Date(`${record.date}T${record.arrivalTime}:00`)
    const departureTime = record.departureTime
      ? new Date(`${record.date}T${record.departureTime}:00`)
      : new Date(`${record.date}T${shift.end}:00`)

    const workedMinutes = Math.max(0, (departureTime.getTime() - arrivalTime.getTime()) / (1000 * 60))
    const lunchBreak = record.lunchBreak || 60
    const totalWorkedMinutes = Math.max(0, workedMinutes - lunchBreak)

    return {
      hours: Math.floor(totalWorkedMinutes / 60),
      minutes: totalWorkedMinutes % 60,
      totalMinutes: totalWorkedMinutes,
    }
  }

  // Получение информации о смене по названию
  const getShiftByName = (shiftName: string): ShiftSchedule => {
    return shifts.find((s) => s.name === shiftName) || shifts[0]
  }

  // Открытие модального окна для ввода времени
  const openTimeModal = (workerId: string, shift: string, status: WorkRecord["status"]) => {
    const existingRecord = getWorkRecord(workerId, shift)
    const currentTime = new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })

    setTimeModalData({ workerId, shift, status, currentRecord: existingRecord })
    setTempTimes({
      arrivalTime:
        existingRecord?.arrivalTime || (status === "присутній" || status === "запізнення" ? currentTime : ""),
      departureTime: existingRecord?.departureTime || "",
      lunchBreak: existingRecord?.lunchBreak || 60,
    })
    setTimeModalOpen(true)
  }

  // Сохранение времени
  const saveTimeData = () => {
    if (!timeModalData) return

    markAttendance(
      timeModalData.workerId,
      timeModalData.shift,
      timeModalData.status,
      tempTimes.arrivalTime,
      tempTimes.departureTime,
    )

    const existingRecord = getWorkRecord(timeModalData.workerId, timeModalData.shift)
    if (existingRecord) {
      setWorkRecords(
        workRecords.map((r) => (r.id === existingRecord.id ? { ...r, lunchBreak: tempTimes.lunchBreak } : r)),
      )
    }

    setTimeModalOpen(false)
    setTimeModalData(undefined)
  }

  // Получение статистики работника
  const getWorkerStats = (workerId: string) => {
    const workerRecords = workRecords.filter((r) => r.workerId === workerId)
    const totalDays = workerRecords.length
    const presentDays = workerRecords.filter((r) => r.status === "присутній").length
    const absentDays = workerRecords.filter((r) => r.status === "відсутній").length
    const lateDays = workerRecords.filter((r) => r.status === "запізнення").length

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
    }
  }

  // Получение записи для конкретного работника и смены
  const getWorkRecord = (workerId: string, shift: string) => {
    return workRecords.find((r) => r.workerId === workerId && r.date === selectedDate && r.shift === shift)
  }

  const getStatusBadge = (status: WorkRecord["status"], record?: WorkRecord, shift?: ShiftSchedule) => {
    const statusConfig = {
      присутній: {
        className: "bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm",
        icon: "✓",
      },
      відсутній: {
        className: "bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm",
        icon: "✗",
      },
      запізнення: {
        className: "bg-yellow-500 hover:bg-yellow-600 text-white text-xs sm:text-sm",
        icon: "⏰",
      },
      лікарняний: {
        className: "bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm",
        icon: "🏥",
      },
      відпустка: {
        className: "bg-purple-500 hover:bg-purple-600 text-white text-xs sm:text-sm",
        icon: "🏖️",
      },
    }

    const config = statusConfig[status]

    let timeInfo = ""
    if (record && shift && (status === "присутній" || status === "запізнення")) {
      const worked = calculateWorkedHours(record, shift)
      timeInfo = ` (${worked.hours}г ${worked.minutes}м)`
    }

    return (
      <div className="flex flex-col items-center gap-1">
        <Badge className={config.className}>
          <span className="mr-1">{config.icon}</span>
          <span className="hidden sm:inline">{status}</span>
          <span className="sm:hidden">{config.icon}</span>
        </Badge>
        {timeInfo && <span className="text-xs text-gray-600 font-medium">{timeInfo}</span>}
        {record?.arrivalTime && (
          <span className="text-xs text-gray-500">
            {record.arrivalTime}
            {record.departureTime ? ` - ${record.departureTime}` : ""}
          </span>
        )}
      </div>
    )
  }

  // Экспорт в PDF с поддержкой украинского
  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      // Создаем HTML контент
      const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Табель обліку робочого часу</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
        h1 { color: #3b82f6; text-align: center; font-size: 18px; margin-bottom: 10px; }
        h2 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; font-size: 14px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 10px; }
        th { background-color: #3b82f6; color: white; }
        .stats { background-color: #f3f4f6; padding: 8px; border-radius: 5px; margin: 10px 0; }
        .company { text-align: center; font-weight: bold; margin-bottom: 5px; }
        .date { text-align: center; margin-bottom: 20px; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <h1>Табель обліку робочого часу</h1>
      <p class="company">Аутсорсингова компанія "Атлант"</p>
      <p class="date">Дата: ${new Date().toLocaleDateString("uk-UA")}</p>
      
      <h2>Загальна статистика</h2>
      <div class="stats">
        <p><strong>Всього працівників:</strong> ${workers.length}</p>
        <p><strong>Присутні сьогодні:</strong> ${workRecords.filter((r) => r.date === selectedDate && r.status === "присутній").length}</p>
        <p><strong>Відсутні сьогодні:</strong> ${workRecords.filter((r) => r.date === selectedDate && r.status === "відсутній").length}</p>
        <p><strong>Середня відвідуваність:</strong> ${workers.length > 0 ? Math.round(workers.reduce((acc, worker) => acc + getWorkerStats(worker.id).attendanceRate, 0) / workers.length) : 0}%</p>
      </div>

      <h2>Статистика по працівниках</h2>
      <table>
        <thead>
          <tr>
            <th>Працівник</th>
            <th>Посада</th>
            <th>Всього днів</th>
            <th>Присутній</th>
            <th>Відсутній</th>
            <th>Запізнення</th>
            <th>Відвідуваність</th>
          </tr>
        </thead>
        <tbody>
          ${workers
            .map((worker) => {
              const stats = getWorkerStats(worker.id)
              return `
              <tr>
                <td>${worker.name}</td>
                <td>${worker.position}</td>
                <td>${stats.totalDays}</td>
                <td>${stats.presentDays}</td>
                <td>${stats.absentDays}</td>
                <td>${stats.lateDays}</td>
                <td>${stats.attendanceRate}%</td>
              </tr>
            `
            })
            .join("")}
        </tbody>
      </table>

      <h2>Записи за ${new Date(selectedDate).toLocaleDateString("uk-UA")}</h2>
      <table>
        <thead>
          <tr>
            <th>Працівник</th>
            <th>Зміна</th>
            <th>Статус</th>
            <th>Час приходу</th>
            <th>Час відходу</th>
            <th>Відпрацьовано</th>
          </tr>
        </thead>
        <tbody>
          ${workRecords
            .filter((r) => r.date === selectedDate)
            .map((record) => {
              const worker = workers.find((w) => w.id === record.workerId)
              const shift = getShiftByName(record.shift)
              const worked = calculateWorkedHours(record, shift)
              return `
              <tr>
                <td>${worker?.name || "Невідомий"}</td>
                <td>${record.shift}</td>
                <td>${record.status}</td>
                <td>${record.arrivalTime || "-"}</td>
                <td>${record.departureTime || "-"}</td>
                <td>${worked.hours}:${worked.minutes.toString().padStart(2, "0")}</td>
              </tr>
            `
            })
            .join("")}
        </tbody>
      </table>

      <h2>Розклад змін</h2>
      <table>
        <thead>
          <tr>
            <th>Зміна</th>
            <th>Час роботи</th>
            <th>Дні тижня</th>
          </tr>
        </thead>
        <tbody>
          ${shifts
            .map(
              (shift) => `
            <tr>
              <td>${shift.name}</td>
              <td>${shift.start} - ${shift.end}</td>
              <td>${shift.days.join(", ")}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `

      // Создаем Blob и открываем для печати
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const newWindow = window.open(url, "_blank")

      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => {
            newWindow.print()
            newWindow.close()
            URL.revokeObjectURL(url)
          }, 500)
        }
      }
    } catch (error) {
      console.error("Помилка експорту PDF:", error)
      alert("Помилка при створенні PDF файлу")
    } finally {
      setIsExporting(false)
    }
  }

  // Экспорт в Word
  const exportToWord = async () => {
    setIsExporting(true)
    try {
      const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Табель обліку робочого часу</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12pt; }
        h1 { color: #3b82f6; text-align: center; font-size: 18pt; margin-bottom: 10pt; }
        h2 { color: #1f2937; border-bottom: 2pt solid #3b82f6; padding-bottom: 5pt; font-size: 14pt; margin-top: 20pt; }
        table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
        th, td { border: 1pt solid #000; padding: 6pt; text-align: left; font-size: 10pt; }
        th { background-color: #3b82f6; color: white; }
        .stats { background-color: #f3f4f6; padding: 8pt; margin: 10pt 0; }
        .company { text-align: center; font-weight: bold; margin-bottom: 5pt; }
        .date { text-align: center; margin-bottom: 20pt; }
      </style>
    </head>
    <body>
      <h1>Табель обліку робочого часу</h1>
      <p class="company">Аутсорсингова компанія "Атлант"</p>
      <p class="date">Дата: ${new Date().toLocaleDateString("uk-UA")}</p>
      
      <h2>Загальна статистика</h2>
      <div class="stats">
        <p><strong>Всього працівників:</strong> ${workers.length}</p>
        <p><strong>Присутні сьогодні:</strong> ${workRecords.filter((r) => r.date === selectedDate && r.status === "присутній").length}</p>
        <p><strong>Відсутні сьогодні:</strong> ${workRecords.filter((r) => r.date === selectedDate && r.status === "відсутній").length}</p>
        <p><strong>Середня відвідуваність:</strong> ${workers.length > 0 ? Math.round(workers.reduce((acc, worker) => acc + getWorkerStats(worker.id).attendanceRate, 0) / workers.length) : 0}%</p>
      </div>

      <h2>Статистика по працівниках</h2>
      <table>
        <thead>
          <tr>
            <th>Працівник</th>
            <th>Посада</th>
            <th>Всього днів</th>
            <th>Присутній</th>
            <th>Відсутній</th>
            <th>Запізнення</th>
            <th>Відвідуваність</th>
          </tr>
        </thead>
        <tbody>
          ${workers
            .map((worker) => {
              const stats = getWorkerStats(worker.id)
              return `
              <tr>
                <td>${worker.name}</td>
                <td>${worker.position}</td>
                <td>${stats.totalDays}</td>
                <td>${stats.presentDays}</td>
                <td>${stats.absentDays}</td>
                <td>${stats.lateDays}</td>
                <td>${stats.attendanceRate}%</td>
              </tr>
            `
            })
            .join("")}
        </tbody>
      </table>

      <h2>Записи за ${new Date(selectedDate).toLocaleDateString("uk-UA")}</h2>
      <table>
        <thead>
          <tr>
            <th>Працівник</th>
            <th>Зміна</th>
            <th>Статус</th>
            <th>Час приходу</th>
            <th>Час відходу</th>
            <th>Відпрацьовано</th>
          </tr>
        </thead>
        <tbody>
          ${workRecords
            .filter((r) => r.date === selectedDate)
            .map((record) => {
              const worker = workers.find((w) => w.id === record.workerId)
              const shift = getShiftByName(record.shift)
              const worked = calculateWorkedHours(record, shift)
              return `
              <tr>
                <td>${worker?.name || "Невідомий"}</td>
                <td>${record.shift}</td>
                <td>${record.status}</td>
                <td>${record.arrivalTime || "-"}</td>
                <td>${record.departureTime || "-"}</td>
                <td>${worked.hours}:${worked.minutes.toString().padStart(2, "0")}</td>
              </tr>
            `
            })
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `

      // Создаем Blob для Word документа
      const blob = new Blob([htmlContent], {
        type: "application/msword;charset=utf-8",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `atlant_report_${new Date().toISOString().split("T")[0]}.doc`
      a.click()
      URL.revokeObjectURL(url)

      console.log("Word файл успішно створено")
    } catch (error) {
      console.error("Помилка експорту Word:", error)
      alert("Помилка при створенні Word файлу")
    } finally {
      setIsExporting(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Завантаження...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
        {/* Заголовок */}
        <Card className="bg-white shadow-xl rounded-2xl border-0">
          <CardContent className="p-4 sm:p-8">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 sm:p-4 rounded-2xl shadow-lg">
                <Users className="h-6 w-6 sm:h-10 sm:w-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2 leading-tight">
                  Табель обліку робочого часу
                </h1>
                <p className="text-sm sm:text-xl text-gray-600 font-medium">
                  Аутсорсингова компанія &quot;Атлант&quot;
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/sync">
                  <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl font-semibold px-4 py-2">
                    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Синхронізація</span>
                    <span className="sm:hidden">Sync</span>
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Основные вкладки */}
        <Tabs defaultValue="attendance" className="space-y-4 sm:space-y-8">
          {/* Мобильные вкладки */}
          <div className="block sm:hidden">
            <div className="bg-white shadow-lg rounded-xl p-2">
              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-full flex items-center justify-between bg-blue-500 hover:bg-blue-600 text-white"
              >
                <span>Меню</span>
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              {isMobileMenuOpen && (
                <div className="mt-2 space-y-2">
                  <TabsList className="grid w-full grid-cols-1 bg-transparent p-0 h-auto space-y-2">
                    <TabsTrigger
                      value="attendance"
                      className="w-full data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all duration-300 font-medium p-3 justify-start"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      📋 Облік присутності
                    </TabsTrigger>
                    <TabsTrigger
                      value="workers"
                      className="w-full data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg transition-all duration-300 font-medium p-3 justify-start"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      👥 Працівники
                    </TabsTrigger>
                    <TabsTrigger
                      value="statistics"
                      className="w-full data-[state=active]:bg-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300 font-medium p-3 justify-start"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      📊 Статистика
                    </TabsTrigger>
                    <TabsTrigger
                      value="schedule"
                      className="w-full data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg transition-all duration-300 font-medium p-3 justify-start"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      ⏰ Розклад змін
                    </TabsTrigger>
                  </TabsList>
                </div>
              )}
            </div>
          </div>

          {/* Десктопные вкладки */}
          <TabsList className="hidden sm:grid w-full grid-cols-4 bg-white shadow-lg rounded-xl p-2 h-16">
            <TabsTrigger
              value="attendance"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all duration-300 font-medium"
            >
              📋 Облік присутності
            </TabsTrigger>
            <TabsTrigger
              value="workers"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg transition-all duration-300 font-medium"
            >
              👥 Працівники
            </TabsTrigger>
            <TabsTrigger
              value="statistics"
              className="data-[state=active]:bg-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300 font-medium"
            >
              📊 Статистика
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg transition-all duration-300 font-medium"
            >
              ⏰ Розклад змін
            </TabsTrigger>
          </TabsList>

          {/* Содержимое вкладок */}
          <TabsContent value="attendance" className="space-y-4 sm:space-y-8">
            <Card className="bg-white shadow-xl rounded-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-2xl p-4 sm:p-8">
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-lg sm:text-2xl">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8" />
                    <span className="text-sm sm:text-2xl">Облік присутності</span>
                  </div>
                  <span className="text-sm sm:text-2xl">на {new Date(selectedDate).toLocaleDateString("uk-UA")}</span>
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 sm:mt-6">
                  <Label htmlFor="date" className="text-blue-100 text-sm sm:text-lg font-medium">
                    Дата:
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full sm:w-auto bg-white/20 border-white/30 text-white placeholder:text-blue-100 rounded-lg"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                <div className="space-y-4 sm:space-y-8">
                  {shifts.map((shift) => (
                    <Card key={shift.name} className="bg-gray-50 border-2 border-gray-200 rounded-xl shadow-md">
                      <CardHeader className="pb-2 sm:pb-4">
                        <CardTitle className="flex items-center gap-2 sm:gap-4 text-base sm:text-xl text-gray-800">
                          <div className="bg-blue-500 p-2 sm:p-3 rounded-xl shadow-lg">
                            <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-sm sm:text-xl">{shift.name}</span>
                            <span className="text-xs sm:text-xl text-gray-600">
                              ({shift.start} - {shift.end})
                            </span>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                          {/* Мобильная версия - карточки */}
                          <div className="block sm:hidden space-y-3">
                            {workers.map((worker) => {
                              const record = getWorkRecord(worker.id, shift.name)
                              const shiftData = getShiftByName(shift.name)
                              return (
                                <div key={worker.id} className="border border-gray-200 rounded-lg p-3">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <p className="font-semibold text-gray-800 text-sm">{worker.name}</p>
                                      <p className="text-gray-600 text-xs">{worker.position}</p>
                                    </div>
                                    <div>
                                      {record ? (
                                        getStatusBadge(record.status, record, shiftData)
                                      ) : (
                                        <Badge variant="outline" className="bg-gray-100 text-gray-600 text-xs">
                                          ❓ Не відмічено
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-1">
                                    <Button
                                      size="sm"
                                      onClick={() => openTimeModal(worker.id, shift.name, "присутній")}
                                      className="bg-green-500 hover:bg-green-600 text-white shadow-md text-xs p-2"
                                    >
                                      ✓
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => markAttendance(worker.id, shift.name, "відсутній")}
                                      className="bg-red-500 hover:bg-red-600 text-white shadow-md text-xs p-2"
                                    >
                                      ✗
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => openTimeModal(worker.id, shift.name, "запізнення")}
                                      className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-md text-xs p-2"
                                    >
                                      ⏰
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Десктопная версия - таблица */}
                          <div className="hidden sm:block">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-100">
                                  <TableHead className="font-bold text-gray-700">Працівник</TableHead>
                                  <TableHead className="font-bold text-gray-700">Посада</TableHead>
                                  <TableHead className="font-bold text-gray-700">Статус</TableHead>
                                  <TableHead className="font-bold text-gray-700">Дії</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {workers.map((worker) => {
                                  const record = getWorkRecord(worker.id, shift.name)
                                  const shiftData = getShiftByName(shift.name)
                                  return (
                                    <TableRow key={worker.id} className="hover:bg-blue-50 transition-colors">
                                      <TableCell className="font-semibold text-gray-800">{worker.name}</TableCell>
                                      <TableCell className="text-gray-600">{worker.position}</TableCell>
                                      <TableCell>
                                        {record ? (
                                          getStatusBadge(record.status, record, shiftData)
                                        ) : (
                                          <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                            ❓ Не відмічено
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-2 flex-wrap">
                                          <Button
                                            size="sm"
                                            onClick={() => openTimeModal(worker.id, shift.name, "присутній")}
                                            className="bg-green-500 hover:bg-green-600 text-white shadow-md"
                                          >
                                            ✓ Присутній
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => markAttendance(worker.id, shift.name, "відсутній")}
                                            className="bg-red-500 hover:bg-red-600 text-white shadow-md"
                                          >
                                            ✗ Відсутній
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => openTimeModal(worker.id, shift.name, "запізнення")}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-md"
                                          >
                                            ⏰ Запізнення
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workers" className="space-y-4 sm:space-y-8">
            <Card className="bg-white shadow-xl rounded-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-2xl p-4 sm:p-8">
                <CardTitle className="flex items-center gap-2 sm:gap-4 text-lg sm:text-2xl">
                  <UserPlus className="h-6 w-6 sm:h-8 sm:w-8" />
                  Додати нового працівника
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label htmlFor="name" className="text-gray-700 font-semibold text-sm sm:text-base">
                      {"Ім'я та прізвище"}
                    </Label>
                    <Input
                      id="name"
                      value={newWorker.name}
                      onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                      placeholder="Іван Петренко"
                      className="border-2 border-gray-200 focus:border-green-500 rounded-lg h-10 sm:h-12 text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label htmlFor="position" className="text-gray-700 font-semibold text-sm sm:text-base">
                      Посада
                    </Label>
                    <Input
                      id="position"
                      value={newWorker.position}
                      onChange={(e) => setNewWorker({ ...newWorker, position: e.target.value })}
                      placeholder="Комплектувальник"
                      className="border-2 border-gray-200 focus:border-green-500 rounded-lg h-10 sm:h-12 text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label htmlFor="phone" className="text-gray-700 font-semibold text-sm sm:text-base">
                      Телефон
                    </Label>
                    <Input
                      id="phone"
                      value={newWorker.phone}
                      onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                      placeholder="+380501234567"
                      className="border-2 border-gray-200 focus:border-green-500 rounded-lg h-10 sm:h-12 text-sm sm:text-base"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={addWorker}
                      className="w-full h-10 sm:h-12 bg-green-500 hover:bg-green-600 text-white shadow-lg rounded-lg font-semibold text-sm sm:text-base"
                    >
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Додати працівника</span>
                      <span className="sm:hidden">Додати</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-xl rounded-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-2xl p-4 sm:p-8">
                <CardTitle className="text-lg sm:text-2xl">👥 Список працівників</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                {/* Мобильная версия - карточки */}
                <div className="block sm:hidden space-y-3">
                  {workers.map((worker) => {
                    const stats = getWorkerStats(worker.id)
                    return (
                      <div key={worker.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">{worker.name}</p>
                            <p className="text-gray-600 text-xs">{worker.position}</p>
                            <p className="text-gray-600 text-xs">{worker.phone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`${
                                stats.attendanceRate >= 90
                                  ? "bg-green-500 text-white"
                                  : stats.attendanceRate >= 70
                                    ? "bg-yellow-500 text-white"
                                    : "bg-red-500 text-white"
                              } font-bold text-xs`}
                            >
                              {stats.attendanceRate}%
                            </Badge>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => confirmDelete(worker.id)}
                              className="bg-red-500 hover:bg-red-600 text-white shadow-md p-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Десктопная версия - таблица */}
                <div className="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="font-bold text-gray-700">{"Ім'я"}</TableHead>
                        <TableHead className="font-bold text-gray-700">Посада</TableHead>
                        <TableHead className="font-bold text-gray-700">Телефон</TableHead>
                        <TableHead className="font-bold text-gray-700">Відвідуваність</TableHead>
                        <TableHead className="font-bold text-gray-700">Дії</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workers.map((worker) => {
                        const stats = getWorkerStats(worker.id)
                        return (
                          <TableRow key={worker.id} className="hover:bg-green-50 transition-colors">
                            <TableCell className="font-semibold text-gray-800">{worker.name}</TableCell>
                            <TableCell className="text-gray-600">{worker.position}</TableCell>
                            <TableCell className="text-gray-600">{worker.phone}</TableCell>
                            <TableCell>
                              <Badge
                                className={`${
                                  stats.attendanceRate >= 90
                                    ? "bg-green-500 text-white"
                                    : stats.attendanceRate >= 70
                                      ? "bg-yellow-500 text-white"
                                      : "bg-red-500 text-white"
                                } font-bold`}
                              >
                                {stats.attendanceRate}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => confirmDelete(worker.id)}
                                className="bg-red-500 hover:bg-red-600 text-white shadow-md"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Видалити
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4 sm:space-y-8">
            {/* Статистические карточки */}
            <div className="grid gridd-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-blue-100">Всього працівників</CardTitle>
                  <Users className="h-5 w-5 sm:h-8 sm:w-8 text-blue-200" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-2xl sm:text-4xl font-bold">{workers.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-green-100">Присутні сьогодні</CardTitle>
                  <CheckCircle className="h-5 w-5 sm:h-8 sm:w-8 text-green-200" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-2xl sm:text-4xl font-bold">
                    {workRecords.filter((r) => r.date === selectedDate && r.status === "присутній").length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-red-100">Відсутні сьогодні</CardTitle>
                  <AlertTriangle className="h-5 w-5 sm:h-8 sm:w-8 text-red-200" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-2xl sm:text-4xl font-bold">
                    {workRecords.filter((r) => r.date === selectedDate && r.status === "відсутній").length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-purple-100">
                    Середня відвідуваність
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 sm:h-8 sm:w-8 text-purple-200" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-2xl sm:text-4xl font-bold">
                    {workers.length > 0
                      ? Math.round(
                          workers.reduce((acc, worker) => acc + getWorkerStats(worker.id).attendanceRate, 0) /
                            workers.length,
                        )
                      : 0}
                    %
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white shadow-xl rounded-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-2xl p-4 sm:p-8">
                <CardTitle className="text-lg sm:text-2xl">📈 Детальна статистика по працівниках</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                {/* Мобильная версия - карточки */}
                <div className="block sm:hidden space-y-3">
                  {workers.map((worker) => {
                    const stats = getWorkerStats(worker.id)
                    return (
                      <div key={worker.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <p className="font-semibold text-gray-800 text-sm mb-2">{worker.name}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Всього днів:</span>
                            <span className="font-bold ml-1">{stats.totalDays}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Присутній:</span>
                            <span className="font-bold ml-1 text-green-600">{stats.presentDays}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Відсутній:</span>
                            <span className="font-bold ml-1 text-red-600">{stats.absentDays}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Запізнення:</span>
                            <span className="font-bold ml-1 text-yellow-600">{stats.lateDays}</span>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-center">
                          <Badge
                            className={`${
                              stats.attendanceRate >= 90
                                ? "bg-green-500 text-white"
                                : stats.attendanceRate >= 70
                                  ? "bg-yellow-500 text-white"
                                  : "bg-red-500 text-white"
                            } font-bold text-xs`}
                          >
                            Відвідуваність: {stats.attendanceRate}%
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Десктопная версия - таблица */}
                <div className="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="font-bold text-gray-700">Працівник</TableHead>
                        <TableHead className="font-bold text-gray-700">Всього днів</TableHead>
                        <TableHead className="font-bold text-gray-700">Присутній</TableHead>
                        <TableHead className="font-bold text-gray-700">Відсутній</TableHead>
                        <TableHead className="font-bold text-gray-700">Запізнення</TableHead>
                        <TableHead className="font-bold text-gray-700">Відвідуваність</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workers.map((worker) => {
                        const stats = getWorkerStats(worker.id)
                        return (
                          <TableRow key={worker.id} className="hover:bg-purple-50 transition-colors">
                            <TableCell className="font-semibold text-gray-800">{worker.name}</TableCell>
                            <TableCell className="text-gray-600 text-center">{stats.totalDays}</TableCell>
                            <TableCell className="text-green-600 font-bold text-center">{stats.presentDays}</TableCell>
                            <TableCell className="text-red-600 font-bold text-center">{stats.absentDays}</TableCell>
                            <TableCell className="text-yellow-600 font-bold text-center">{stats.lateDays}</TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={`${
                                  stats.attendanceRate >= 90
                                    ? "bg-green-500 text-white"
                                    : stats.attendanceRate >= 70
                                      ? "bg-yellow-500 text-white"
                                      : "bg-red-500 text-white"
                                } font-bold`}
                              >
                                {stats.attendanceRate}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Кнопки экспорта */}
            <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 sm:p-8">
                <CardTitle className="flex items-center gap-4 text-lg sm:text-2xl">
                  <Download className="h-6 w-6 sm:h-8 sm:w-8" />
                  Експорт звітів
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                <div className="flex gap-4 flex-wrap">
                  <Button
                    onClick={exportToPDF}
                    disabled={isExporting}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl text-base font-semibold px-6 py-3"
                  >
                    <FileSpreadsheet className="h-5 w-5 mr-2" />
                    {isExporting ? "Експорт..." : "📄 PDF звіт"}
                  </Button>

                  <Button
                    onClick={exportToWord}
                    disabled={isExporting}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl text-base font-semibold px-6 py-3"
                  >
                    <FileSpreadsheet className="h-5 w-5 mr-2" />
                    {isExporting ? "Експорт..." : "📝 Word документ"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 sm:space-y-8">
            <Card className="bg-white shadow-xl rounded-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-2xl p-4 sm:p-8">
                <CardTitle className="text-lg sm:text-2xl">⏰ Розклад робочих змін</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                <div className="space-y-4 sm:space-y-6">
                  {shifts.map((shift) => (
                    <Card key={shift.name} className="bg-orange-50 border-2 border-orange-200 rounded-xl shadow-md">
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="font-bold text-lg sm:text-2xl text-gray-800 mb-2 sm:mb-4">{shift.name}</h3>
                        <div className="space-y-2 sm:space-y-3">
                          <p className="text-gray-600 text-sm sm:text-lg flex items-center gap-2 sm:gap-3">
                            <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-orange-500" />
                            <span className="font-semibold">Час:</span> {shift.start} - {shift.end}
                          </p>
                          <p className="text-gray-600 text-sm sm:text-lg flex items-center gap-2 sm:gap-3">
                            <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-orange-500" />
                            <span className="font-semibold">Дні:</span> {shift.days.join(", ")}
                          </p>
                        </div>
                        {shift.name === "Субота" && (
                          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-100 border border-blue-300 rounded-lg">
                            <p className="text-blue-800 font-medium flex items-center gap-2 text-xs sm:text-base">
                              <span className="text-base sm:text-xl">ℹ️</span>
                              Робота в суботу за бажанням працівника
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Диалог подтверждения удаления */}
        {workerToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="bg-white shadow-2xl rounded-2xl border-0 max-w-md w-full">
              <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-2xl p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
                  Підтвердження видалення
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <p className="text-gray-700 text-sm sm:text-lg">
                    Ви впевнені, що хочете видалити працівника{" "}
                    <span className="font-bold text-red-600">{workers.find((w) => w.id === workerToDelete)?.name}</span>
                    ?
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                    <p className="text-yellow-800 text-xs sm:text-sm flex items-start gap-2">
                      <span className="text-base sm:text-xl">⚠️</span>
                      <span>
                        Це також видалить всі записи відвідуваності цього працівника. Цю дію неможливо скасувати.
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={cancelDelete}
                      variant="outline"
                      className="flex-1 border-2 border-gray-300 hover:bg-gray-50 text-sm sm:text-base"
                    >
                      Скасувати
                    </Button>
                    <Button
                      onClick={() => deleteWorker(workerToDelete)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm sm:text-base"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Видалити
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Модальное окно для ввода времени */}
        {timeModalOpen && timeModalData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="bg-white shadow-2xl rounded-2xl border-0 max-w-md w-full">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-2xl p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                  Введіть час роботи
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700 text-sm sm:text-base mb-2">
                      Працівник:{" "}
                      <span className="font-bold">{workers.find((w) => w.id === timeModalData.workerId)?.name}</span>
                    </p>
                    <p className="text-gray-700 text-sm sm:text-base mb-4">
                      Зміна: <span className="font-bold">{timeModalData.shift}</span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="arrivalTime" className="text-gray-700 font-semibold text-sm">
                        Час приходу
                      </Label>
                      <Input
                        id="arrivalTime"
                        type="time"
                        value={tempTimes.arrivalTime}
                        onChange={(e) => setTempTimes({ ...tempTimes, arrivalTime: e.target.value })}
                        className="border-2 border-gray-200 focus:border-blue-500 rounded-lg h-10 text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="departureTime" className="text-gray-700 font-semibold text-sm">
                        Час відходу (необов'язково)
                      </Label>
                      <Input
                        id="departureTime"
                        type="time"
                        value={tempTimes.departureTime}
                        onChange={(e) => setTempTimes({ ...tempTimes, departureTime: e.target.value })}
                        className="border-2 border-gray-200 focus:border-blue-500 rounded-lg h-10 text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lunchBreak" className="text-gray-700 font-semibold text-sm">
                        Обідня перерва (хвилини)
                      </Label>
                      <Input
                        id="lunchBreak"
                        type="number"
                        min="0"
                        max="120"
                        value={tempTimes.lunchBreak}
                        onChange={(e) =>
                          setTempTimes({ ...tempTimes, lunchBreak: Number.parseInt(e.target.value) || 60 })
                        }
                        className="border-2 border-gray-200 focus:border-blue-500 rounded-lg h-10 text-sm"
                      />
                    </div>
                  </div>

                  {tempTimes.arrivalTime && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-blue-800 text-sm font-medium">💡 Розрахунок робочого часу:</p>
                      <p className="text-blue-700 text-xs mt-1">
                        {(() => {
                          const shift = getShiftByName(timeModalData.shift)
                          const mockRecord: WorkRecord = {
                            id: "",
                            workerId: timeModalData.workerId,
                            date: selectedDate,
                            shift: timeModalData.shift,
                            status: timeModalData.status,
                            arrivalTime: tempTimes.arrivalTime,
                            departureTime: tempTimes.departureTime || undefined,
                            lunchBreak: tempTimes.lunchBreak,
                            createdAt: "",
                          }
                          const worked = calculateWorkedHours(mockRecord, shift)
                          return `Відпрацьовано: ${worked.hours} год ${worked.minutes} хв (без урахування ${tempTimes.lunchBreak} хв обіду)`
                        })()}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => setTimeModalOpen(false)}
                      variant="outline"
                      className="flex-1 border-2 border-gray-300 hover:bg-gray-50 text-sm"
                    >
                      Скасувати
                    </Button>
                    <Button onClick={saveTimeData} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm">
                      <Save className="h-3 w-3 mr-1" />
                      Зберегти
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
