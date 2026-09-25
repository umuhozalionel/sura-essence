"use client"

import { useState } from "react"
import { useFormatter, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Booking } from "@/lib/types"
import { getBookings, updateBookingStatus, exportBookingsCSV } from "@/lib/bookings"
import { Download, RefreshCw } from "lucide-react"

// The bookings table that used to be the whole admin page. Sign-in now
// happens on the server (app/[locale]/admin/page.tsx), so it's gone from here.

interface Column {
  id: string
  label: string
}

interface StatusOption {
  id: Booking["status"]
  label: string
}

export function BookingsPanel() {
  const t = useTranslations("Admin")
  const format = useFormatter()

  const columns = t.raw("columns") as Column[]
  const statuses = t.raw("statuses") as StatusOption[]
  const statusLabel = (status: Booking["status"]) =>
    statuses.find((s) => s.id === status)?.label ?? status

  // This panel only ever renders in the browser (see admin-dashboard.tsx), so
  // localStorage can be read straight away.
  const [bookings, setBookings] = useState<Booking[]>(() => getBookings())
  const [isLoading, setIsLoading] = useState(false)

  const loadBookings = () => {
    setIsLoading(true)
    const data = getBookings()
    setBookings(data)
    setIsLoading(false)
  }


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

  return (
    <section>
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-[#0A1128]">{t("title")}</h2>
            <p className="text-sm font-medium text-[#0A1128]/60">{t("count", { count: bookings.length })}</p>
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
    </section>
  )
}
