'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { StatCard } from '@/components/dashboard/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  CalendarCheck,
  MessageSquareWarning,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  Download,
  Loader2,
  Play,
  Square,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444']

function parseBackendDate(value: string) {
  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(value)
  return new Date(hasTimezone ? value : `${value}Z`)
}

function formatSessionTime(value?: string | null) {
  if (!value) return '-'
  return parseBackendDate(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminDashboard() {
  const { data, isLoading, mutate } = useSWR('/api/stats', fetcher)
  const {
    data: scanner,
    isLoading: scannerLoading,
    mutate: mutateScanner,
  } = useSWR('/api/ml/attendance-scanner', fetcher, { refreshInterval: 5000 })
  const [scannerAction, setScannerAction] = useState<'start' | 'stop' | null>(null)
  const [scannerError, setScannerError] = useState('')
  const [scannerDuration, setScannerDuration] = useState<'30' | '60'>('30')

  async function updateScanner(action: 'start' | 'stop') {
    setScannerAction(action)
    setScannerError('')
    try {
      const res = await fetch('/api/ml/attendance-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, durationMinutes: Number(scannerDuration) }),
      })
      const payload = await res.json().catch(() => ({}))

      if (!res.ok || payload.success === false) {
        throw new Error(payload.error || payload.message || `Failed to ${action} scanner`)
      }

      await mutateScanner(payload, { revalidate: true })
      await mutate()
    } catch (error) {
      setScannerError(error instanceof Error ? error.message : `Failed to ${action} scanner`)
    } finally {
      setScannerAction(null)
    }
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const stats = data || {
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    inappropriate: 0,
    attendanceTrend: [],
    attendanceSessions: {
      date: '',
      morning: 0,
      night: 0,
      both: 0,
      any: 0,
      missingAny: 0,
      students: [],
    },
  }
  const attendanceSessions = stats.attendanceSessions || {
    morning: 0,
    night: 0,
    both: 0,
    missingAny: 0,
    students: [],
  }

  const grievanceData = [
    { name: 'Pending', value: stats.pending },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Resolved', value: stats.resolved },
    { name: 'Inappropriate', value: stats.inappropriate },
  ].filter((item) => item.value > 0)

  const grievanceTotal = grievanceData.reduce((sum, item) => sum + item.value, 0)

  const attendanceRate = stats.totalStudents > 0 
    ? Math.round((stats.presentToday / stats.totalStudents) * 100) 
    : 0
  const scannerRunning = Boolean(scanner?.running)
  const scannerBusy = scannerLoading || scannerAction !== null
  const scannerEndsAt = scanner?.expiresAt
    ? new Date(scanner.expiresAt * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Warden Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of hostel attendance and grievance management.
            </p>
          </div>
          <Button asChild variant="outline">
            <a href="/api/attendance/export">
              <Download className="h-4 w-4" />
              Download 30-day sheet
            </a>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          description="Registered residents"
          icon={Users}
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          description={`${attendanceRate}% attendance rate`}
          icon={CheckCircle2}
        />
        <StatCard
          title="Total Grievances"
          value={stats.total}
          description="All time submissions"
          icon={MessageSquareWarning}
        />
        <StatCard
          title="Pending Issues"
          value={stats.pending}
          description="Requires attention"
          icon={Clock}
        />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Face Attendance Scanner
            </CardTitle>
            <CardDescription>
              Start or stop hostel camera attendance for the current marking session.
            </CardDescription>
          </div>
          <Badge
            variant={scannerRunning ? 'default' : 'secondary'}
            className={scannerRunning ? 'bg-emerald-600 text-white' : ''}
          >
            {scannerRunning ? 'Running' : 'Stopped'}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {scannerRunning && scannerEndsAt ? (
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Auto stop scheduled at {scannerEndsAt}.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={scannerDuration}
              onValueChange={(value) => setScannerDuration(value as '30' | '60')}
              disabled={scannerRunning || scannerBusy}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => updateScanner('start')}
              disabled={scannerRunning || scannerBusy}
              className="sm:w-36"
            >
              {scannerAction === 'start' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Start
            </Button>
            <Button
              variant="outline"
              onClick={() => updateScanner('stop')}
              disabled={!scannerRunning || scannerBusy}
              className="sm:w-36"
            >
              {scannerAction === 'stop' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Stop
            </Button>
          </div>
        </CardContent>
        {scannerError && (
          <CardContent className="pt-0">
            <p className="text-sm text-destructive">{scannerError}</p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Today&apos;s Attendance Sessions
          </CardTitle>
          <CardDescription>
            Morning and night scan completion for registered students.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SessionStat label="Morning marked" value={attendanceSessions.morning} />
            <SessionStat label="Night marked" value={attendanceSessions.night} />
            <SessionStat label="Both marked" value={attendanceSessions.both} accent="green" />
            <SessionStat label="Not marked today" value={attendanceSessions.missingAny} accent="red" />
          </div>

          <div className="max-h-[360px] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Morning</TableHead>
                  <TableHead>Night</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceSessions.students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No registered students found.
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceSessions.students.map((student: {
                    userId: string
                    studentId?: string
                    name: string
                    roomNumber?: string
                    morning: boolean
                    night: boolean
                    both: boolean
                    missing: string[]
                    morningMarkedAt?: string | null
                    nightMarkedAt?: string | null
                  }) => (
                    <TableRow key={student.userId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          {student.studentId && (
                            <p className="text-xs text-muted-foreground">{student.studentId}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{student.roomNumber || '-'}</TableCell>
                      <TableCell>
                        <SessionBadge marked={student.morning} label={formatSessionTime(student.morningMarkedAt)} />
                      </TableCell>
                      <TableCell>
                        <SessionBadge marked={student.night} label={formatSessionTime(student.nightMarkedAt)} />
                      </TableCell>
                      <TableCell>
                        {student.both ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Both complete
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Missing {student.missing.join(' & ')}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attendance Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Attendance Trend
            </CardTitle>
            <CardDescription>
              Daily attendance for the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.attendanceTrend}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString('en-US', { weekday: 'short' })
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                      })
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar 
                    dataKey="present" 
                    name="Present" 
                    fill="#22c55e" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="absent" 
                    name="Absent" 
                    fill="#ef4444" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Grievance Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareWarning className="h-5 w-5" />
              Grievance Status
            </CardTitle>
            <CardDescription>
              Distribution by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {grievanceTotal === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No grievances submitted yet
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={grievanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={grievanceData.length > 1 ? 4 : 0}
                    dataKey="value"
                    label={false}
                  >
                    {grievanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} (${grievanceTotal > 0 ? Math.round((Number(value) / grievanceTotal) * 100) : 0}%)`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    layout="horizontal"
                    wrapperStyle={{ paddingTop: 16 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-amber-100 p-3 dark:bg-amber-900/30">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-semibold">{stats.pending} Pending Grievances</p>
              <p className="text-sm text-muted-foreground">Require immediate attention</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
              <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-semibold">{stats.absentToday} Absent Today</p>
              <p className="text-sm text-muted-foreground">Students not marked present</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
              <MessageSquareWarning className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-semibold">{stats.inProgress} In Progress</p>
              <p className="text-sm text-muted-foreground">Issues being addressed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SessionStat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: 'green' | 'red'
}) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          accent === 'green'
            ? 'text-emerald-600 dark:text-emerald-400'
            : accent === 'red'
              ? 'text-red-600 dark:text-red-400'
              : ''
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function SessionBadge({ marked, label }: { marked: boolean; label: string }) {
  if (!marked) {
    return <Badge variant="outline">Missing</Badge>
  }

  return (
    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
      {label}
    </Badge>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[380px] rounded-xl" />
        <Skeleton className="h-[380px] rounded-xl" />
      </div>
    </div>
  )
}
