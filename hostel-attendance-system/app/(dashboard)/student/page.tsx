'use client'

import useSWR from 'swr'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarCheck, MessageSquareWarning, Clock, CheckCircle2 } from 'lucide-react'
import { statusConfig, categoryLabels, type Grievance } from '@/lib/mock-data'
import { formatDistanceToNow } from 'date-fns'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function StudentDashboard() {
  const { data: attendanceData, isLoading: attendanceLoading } = useSWR('/api/attendance', fetcher)
  const { data: grievanceData, isLoading: grievanceLoading } = useSWR('/api/grievances', fetcher)

  const isLoading = attendanceLoading || grievanceLoading

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const stats = attendanceData?.stats || { percentage: 0, present: 0, absent: 0, total: 30 }
  const hasMarkedToday = attendanceData?.hasMarkedToday || false
  const grievances: Grievance[] = grievanceData?.grievances || []
  const pendingGrievances = grievances.filter(g => g.status === 'pending').length
  const recentGrievances = grievances.slice(0, 3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your hostel overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Attendance Rate"
          value={`${stats.percentage}%`}
          description="Last 30 days"
          icon={CalendarCheck}
        />
        <StatCard
          title="Days Present"
          value={stats.present}
          description={`Out of ${stats.total} days`}
          icon={CheckCircle2}
        />
        <StatCard
          title="Total Grievances"
          value={grievances.length}
          description="Submitted by you"
          icon={MessageSquareWarning}
        />
        <StatCard
          title="Pending Issues"
          value={pendingGrievances}
          description="Awaiting response"
          icon={Clock}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attendance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Today&apos;s Attendance
            </CardTitle>
            <CardDescription>
              Your attendance status for today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              {hasMarkedToday ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                  Present
                </Badge>
              ) : (
                <Badge variant="secondary">Not Marked</Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monthly Progress</span>
                <span className="font-medium">{stats.percentage}%</span>
              </div>
              <Progress value={stats.percentage} className="h-2" />
            </div>
            <p className="text-sm text-muted-foreground">
              {hasMarkedToday
                ? 'Face attendance recorded in the current 12-hour window.'
                : 'Visit the hostel face scanner to mark attendance (not via website).'}
            </p>
          </CardContent>
        </Card>

        {/* Recent Grievances Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareWarning className="h-5 w-5" />
              Recent Grievances
            </CardTitle>
            <CardDescription>
              Your latest submitted issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentGrievances.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No grievances submitted yet.
              </p>
            ) : (
              <div className="space-y-4">
                {recentGrievances.map((grievance) => (
                  <div
                    key={grievance.id}
                    className="flex items-start justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium">
                        {categoryLabels[grievance.category]}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {grievance.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(grievance.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge className={statusConfig[grievance.status].color}>
                      {statusConfig[grievance.status].label}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
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
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )
}
