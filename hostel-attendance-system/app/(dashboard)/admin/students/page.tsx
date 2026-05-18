'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Users, Search, Trash2, Eye, DoorOpen, Loader2 } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Student {
  id: string
  studentId?: string
  name: string
  email: string
  roomNumber: string
  createdAt: string
  attendancePercentage: number
  totalGrievances: number
  pendingGrievances: number
  inProgressGrievances?: number
  resolvedGrievances?: number
}

function grievanceStatusLabel(student: Student) {
  if (student.totalGrievances === 0) return 'None'
  const parts: string[] = []
  if (student.pendingGrievances > 0) parts.push(`${student.pendingGrievances} pending`)
  if ((student.inProgressGrievances ?? 0) > 0) {
    parts.push(`${student.inProgressGrievances} in progress`)
  }
  if ((student.resolvedGrievances ?? 0) > 0) {
    parts.push(`${student.resolvedGrievances} resolved`)
  }
  return parts.join(' · ')
}

function statusBadgeClass(status: string) {
  if (status === 'pending') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
  }
  if (status === 'resolved') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  }
  return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
}

interface StudentDetail {
  student: Student
  attendance: Array<{ id: string; date: string; status: string; markedAt: string }>
  stats: { present: number; absent: number; percentage: number; total: number }
  grievances: Array<{ id: string; category: string; status: string; createdAt: string }>
}

export default function StudentsPage() {
  const { data, isLoading, mutate } = useSWR('/api/students', fetcher)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleViewStudent = async (studentId: string) => {
    setDetailStudentId(studentId)
    setDetailOpen(true)
    setSelectedStudent(null)
    setIsLoadingDetail(true)
    try {
      const res = await fetch(`/api/students/${studentId}`)
      if (res.ok) {
        const detail = await res.json()
        setSelectedStudent(detail)
      }
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setDetailStudentId(null)
    setSelectedStudent(null)
  }

  const handleDeleteStudent = async () => {
    if (!deleteStudent) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/students/${deleteStudent.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        mutate()
        setDeleteStudent(null)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return <StudentsSkeleton />
  }

  const students: Student[] = data?.students || []
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Management</h1>
        <p className="text-muted-foreground">
          View and manage registered hostel students.
        </p>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{students.length} total students</span>
        </div>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            Click on a student to view their details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Grievances</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No students found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <DoorOpen className="h-3 w-3" />
                          {student.roomNumber}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={student.attendancePercentage} 
                            className="h-2 w-16" 
                          />
                          <span className="text-sm">{student.attendancePercentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-[200px] flex-col gap-1">
                          <span className="text-sm font-medium">
                            {student.totalGrievances} total
                          </span>
                          <span className="text-xs text-muted-foreground leading-snug">
                            {grievanceStatusLabel(student)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewStudent(student.id)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View details</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteStudent(student)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete student</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Student Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              {selectedStudent?.student.name ?? 'Loading…'}
            </DialogDescription>
          </DialogHeader>
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedStudent ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {detailStudentId && (
                  <img
                    src={`/api/students/${detailStudentId}/photo`}
                    alt={selectedStudent.student.name}
                    className="h-28 w-28 shrink-0 rounded-lg border object-cover bg-muted"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Student ID</p>
                  <p className="font-medium">{selectedStudent.student.studentId ?? '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedStudent.student.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Room Number</p>
                  <p className="font-medium">{selectedStudent.student.roomNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Registered</p>
                  <p className="font-medium">
                    {format(new Date(selectedStudent.student.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <p className="font-medium">{selectedStudent.stats.percentage}%</p>
                </div>
              </div>
              </div>

              {/* Attendance Stats */}
              <div className="rounded-lg border p-4">
                <p className="font-medium mb-3">Attendance Summary (Last 30 Days)</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {selectedStudent.stats.present}
                    </p>
                    <p className="text-sm text-muted-foreground">Present</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {selectedStudent.stats.absent}
                    </p>
                    <p className="text-sm text-muted-foreground">Absent</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-2xl font-bold">{selectedStudent.stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Days</p>
                  </div>
                </div>
              </div>

              {/* Recent Grievances */}
              {selectedStudent.grievances.length > 0 && (
                <div className="rounded-lg border p-4">
                  <p className="font-medium mb-3">
                    Recent Grievances ({selectedStudent.grievances.length})
                  </p>
                  <div className="space-y-2">
                    {selectedStudent.grievances.slice(0, 3).map((g) => (
                      <div key={g.id} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{g.category.replace('_', ' ')}</span>
                        <Badge variant="secondary" className={statusBadgeClass(g.status)}>
                          {g.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteStudent} onOpenChange={() => setDeleteStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteStudent?.name}? This action cannot be undone
              and will remove all their attendance records and grievances.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStudent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StudentsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
