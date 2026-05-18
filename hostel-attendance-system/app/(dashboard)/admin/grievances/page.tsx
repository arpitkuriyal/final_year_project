'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { MessageSquareWarning, Search, MessageCircle, Loader2, DoorOpen } from 'lucide-react'
import { categoryLabels, statusConfig, type Grievance } from '@/lib/mock-data'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminGrievancesPage() {
  const { data, isLoading, mutate } = useSWR('/api/grievances', fetcher)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')
  const [adminReply, setAdminReply] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleOpenGrievance = (grievance: Grievance) => {
    setSelectedGrievance(grievance)
    setNewStatus(grievance.status)
    setAdminReply(grievance.adminReply || '')
  }

  const handleUpdateGrievance = async () => {
    if (!selectedGrievance) return
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/grievances/${selectedGrievance.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          adminReply: adminReply || undefined,
        }),
      })
      if (res.ok) {
        mutate()
        setSelectedGrievance(null)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return <GrievancesSkeleton />
  }

  const grievances: Grievance[] = data?.grievances || []
  const stats = data?.stats || {
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    inappropriate: 0,
  }

  const filteredGrievances = grievances.filter((g) => {
    const matchesSearch =
      g.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || g.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grievance Management</h1>
        <p className="text-muted-foreground">
          Review and respond to student grievances.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card 
          className="cursor-pointer hover:bg-muted/50" 
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:bg-muted/50" 
          onClick={() => setStatusFilter('pending')}
        >
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:bg-muted/50" 
          onClick={() => setStatusFilter('in_progress')}
        >
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:bg-muted/50" 
          onClick={() => setStatusFilter('resolved')}
        >
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</p>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:bg-muted/50" 
          onClick={() => setStatusFilter('inappropriate')}
        >
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Inappropriate</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inappropriate}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by student, room, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="inappropriate">Inappropriate</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grievances Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareWarning className="h-5 w-5" />
            All Grievances
          </CardTitle>
          <CardDescription>
            Click on a grievance to update its status or add a reply.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                  <TableHead className="text-right">Reply</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrievances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No grievances found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGrievances.map((grievance) => (
                    <TableRow
                      key={grievance.id}
                      className="cursor-pointer"
                      onClick={() => handleOpenGrievance(grievance)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{grievance.studentName}</p>
                          <Badge variant="outline" className="gap-1 text-xs">
                            <DoorOpen className="h-3 w-3" />
                            {grievance.roomNumber}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {categoryLabels[grievance.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] md:table-cell">
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {grievance.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[grievance.status].color}>
                          {statusConfig[grievance.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(grievance.createdAt), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {grievance.adminReply ? (
                          <MessageCircle className="ml-auto h-4 w-4 text-primary" />
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
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

      {/* Update Grievance Dialog */}
      <Dialog open={!!selectedGrievance} onOpenChange={() => setSelectedGrievance(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Grievance</DialogTitle>
            <DialogDescription>
              {selectedGrievance && categoryLabels[selectedGrievance.category]}
            </DialogDescription>
          </DialogHeader>
          {selectedGrievance && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="flex items-center gap-4 rounded-lg border p-3">
                <div className="flex-1">
                  <p className="font-medium">{selectedGrievance.studentName}</p>
                  <p className="text-sm text-muted-foreground">
                    Room {selectedGrievance.roomNumber}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(selectedGrievance.createdAt), { addSuffix: true })}
                </span>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Issue Description</Label>
                <p className="rounded-lg bg-muted p-3 text-sm">
                  {selectedGrievance.description}
                </p>
              </div>

              {/* Status Update */}
              <div className="space-y-2">
                <Label htmlFor="status">Update Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="inappropriate">Inappropriate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Warden Reply */}
              <div className="space-y-2">
                <Label htmlFor="reply">Warden Reply</Label>
                <Textarea
                  id="reply"
                  placeholder="Add a response for the student..."
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedGrievance(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGrievance} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Grievance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GrievancesSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
