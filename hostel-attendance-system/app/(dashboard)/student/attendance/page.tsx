'use client'

import useSWR from 'swr'
import { format, formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CalendarCheck, CheckCircle2, ScanFace, Clock, Info } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface AttendanceRecord {
  id: string
  date: string
  status: string
  source?: string
  markedAt: string
}

export default function AttendancePage() {
  const { data, isLoading } = useSWR('/api/attendance', fetcher)

  if (isLoading) return <AttendanceSkeleton />

  const stats = data?.stats || { percentage: 0, present: 0, absent: 0, total: 30 }
  const records: AttendanceRecord[] = data?.records || []
  const hasMarkedIn24h = data?.hasMarkedIn24h ?? data?.hasMarkedToday ?? false
  const nextMark = data?.nextMark

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          Recorded automatically when you scan your face at the hostel gate.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatMini label="Attendance rate" value={`${stats.percentage}%`} />
        <StatMini label="Days present" value={String(stats.present)} accent="green" />
        <StatMini label="Days absent" value={String(stats.absent)} accent="red" />
        <StatMini label="Tracking period" value={`${stats.total} days`} />
      </div>

      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <ScanFace className="h-5 w-5 text-primary" />
            Face scanner — today
          </CardTitle>
          <CardDescription>{format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-muted/20 p-8 text-center">
            {hasMarkedIn24h ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-9 w-9 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Present (face verified)</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your attendance is recorded for the last 24 hours.
                  </p>
                  {records[0]?.markedAt && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Last scan: {format(new Date(records[0].markedAt), 'MMM d, h:mm a')}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <ScanFace className="h-9 w-9 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Not marked yet</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Go to the hostel entrance and look at the face recognition camera.
                    Web marking is disabled.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex gap-3 rounded-lg bg-muted/50 p-4 text-sm">
            <Info className="h-5 w-5 shrink-0 text-primary" />
            <ul className="space-y-1 text-muted-foreground text-left">
              <li>One attendance per 24 hours (rolling window).</li>
              <li>Use the same Student ID and a clear front-facing photo at signup.</li>
              <li>After registering, wait ~1–2 min for the model to retrain.</li>
            </ul>
          </div>

          {nextMark?.blocked && (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>{nextMark.reason}</span>
            </div>
          )}

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monthly progress</span>
              <span className="font-medium">{stats.percentage}%</span>
            </div>
            <Progress value={stats.percentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            History
          </CardTitle>
          <CardDescription>Face-scanned attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No face scans yet. Visit the hostel gate scanner.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.slice(0, 20).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {format(new Date(record.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Present
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {record.source === 'face' ? 'Face scan' : record.source || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDistanceToNow(new Date(record.markedAt), { addSuffix: true })}
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
  )
}

function StatMini({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'green' | 'red'
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={`text-2xl font-bold ${
            accent === 'green'
              ? 'text-green-600 dark:text-green-400'
              : accent === 'red'
                ? 'text-red-600 dark:text-red-400'
                : ''
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

function AttendanceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}
