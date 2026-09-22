"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useFormatter, useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Booking } from "@/lib/types"
import { getBookings, updateBookingStatus, exportBookingsCSV } from "@/lib/bookings"
import { ArrowLeft, Download, RefreshCw, Car } from "lucide-react"

const ADMIN_PASSWORD = "SURA2024" // In production, use ENV variable

interface Column {
  id: string
  label: string
}

interface StatusOption {
  id: Booking["status"]
  label: string
}

export default function AdminPage() {
  const t = useTranslations("Admin")
  const tl = useTranslations("Admin.login")
  const format = useFormatter()

  const columns = t.raw("columns") as Column[]
  const statuses = t.raw("statuses") as StatusOption[]
  const statusLabel = (status: Booking["status"]) =>
    statuses.find((s) => s.id === status)?.label ?? status

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setPasswordError("")
    } else {
      setPasswordError(tl("incorrect"))
    }
  }

  const loadBookings = () => {
    setIsLoading(true)
    const data = getBookings()
    setBookings(data)
    setIsLoading(false)
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadBookings()
    }
  }, [isAuthenticated])

  const handleStatusChange = (id: string, status: Booking["status"]) => {
    updateBookingStatus(id, status)
    loadBookings()
  }

  const handleExport = () => {
    const csv = exportBookingsCSV()
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `SURA-bookings-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen py-8 px-4 flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <Car className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle>{tl("title")}</CardTitle>
            <CardDescription>{tl("description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{tl("passwordLabel")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tl("passwordPlaceholder")}
                  className={passwordError ? "border-destructive" : ""}
                />
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              </div>
              <Button type="submit" className="w-full">
                {tl("submit")}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button variant="link" asChild>
                <Link href="/">{tl("backHome")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("home")}
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
              <p className="text-muted-foreground">{t("count", { count: bookings.length })}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadBookings} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {t("refresh")}
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              {t("exportCsv")}
            </Button>
          </div>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.id}>{column.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                        {t("empty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-sm">{booking.id}</TableCell>
                        <TableCell className="font-medium">{booking.name}</TableCell>
                        <TableCell>{booking.phone}</TableCell>
                        <TableCell className="max-w-32 truncate" title={booking.pickup}>
                          {booking.pickup}
                        </TableCell>
                        <TableCell className="max-w-32 truncate" title={booking.dropoff}>
                          {booking.dropoff}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {t("dateAt", { date: booking.date, time: booking.time })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {format.number(booking.quoteAmount, {
                            style: "currency",
                            currency: "RWF",
                            maximumFractionDigits: 0,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {statusLabel(booking.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={booking.status}
                            onValueChange={(value) => handleStatusChange(booking.id, value as Booking["status"])}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map((status) => (
                                <SelectItem key={status.id} value={status.id}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
