'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
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
import { CalendarCheck, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { type Attendance } from '@/lib/mock-data'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AttendancePage() {
  const { data, isLoading, mutate } = useSWR('/api/attendance', fetcher)
  const [isMarking, setIsMarking] = useState(false)

  const handleMarkAttendance = async () => {
    setIsMarking(true)
    try {
      const res = await fetch('/api/attendance', { method: 'POST' })
      if (res.ok) {
        mutate()
      }
    } finally {
      setIsMarking(false)
    }
  }

  if (isLoading) {
    return <AttendanceSkeleton />
  }

  const stats = data?.stats || { percentage: 0, present: 0, absent: 0, total: 30 }
  const records: Attendance[] = data?.records || []
  const hasMarkedToday = data?.hasMarkedToday || false

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          Mark your daily attendance and view your history.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                <p className="text-3xl font-bold">{stats.percentage}%</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <CalendarCheck className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Days Present</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.present}</p>
              </div>
              <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Days Absent</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
              </div>
              <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Days</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <CalendarCheck className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mark Attendance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Attendance</CardTitle>
          <CardDescription>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
            {hasMarkedToday ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">Attendance Marked</p>
                  <p className="text-sm text-muted-foreground">
                    Your attendance has been recorded for today.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <CalendarCheck className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">Mark Your Attendance</p>
                  <p className="text-sm text-muted-foreground">
                    Click the button below to mark your attendance for today.
                  </p>
                </div>
                <Button onClick={handleMarkAttendance} disabled={isMarking} size="lg">
                  {isMarking && <Loader2 className="h-4 w-4 animate-spin" />}
                  Mark Present
                </Button>
              </>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Monthly Progress</span>
              <span className="font-medium">{stats.percentage}%</span>
            </div>
            <Progress value={stats.percentage} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {stats.percentage >= 75 
                ? 'Great attendance! Keep it up.' 
                : 'Try to improve your attendance rate.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>
            Your attendance records for the last 30 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Marked At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No attendance records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.slice(0, 15).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {format(new Date(record.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.date), 'EEEE')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={
                            record.status === 'present'
                              ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400'
                          }
                        >
                          {record.status === 'present' ? 'Present' : 'Absent'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {format(new Date(record.markedAt), 'h:mm a')}
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

function AttendanceSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
