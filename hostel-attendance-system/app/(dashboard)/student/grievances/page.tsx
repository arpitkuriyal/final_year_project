'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MessageSquareWarning, Plus, Loader2, MessageCircle } from 'lucide-react'
import { categoryLabels, statusConfig, type Grievance } from '@/lib/mock-data'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const grievanceSchema = z.object({
  category: z.enum(['mess', 'water', 'electricity', 'wifi', 'cleaning', 'room_issue']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
})

type GrievanceForm = z.infer<typeof grievanceSchema>

export default function GrievancesPage() {
  const { data, isLoading, mutate } = useSWR('/api/grievances', fetcher)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null)
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'in_progress' | 'resolved' | 'inappropriate'
  >('all')

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<GrievanceForm>({
    resolver: zodResolver(grievanceSchema),
  })

  const onSubmit = async (formData: GrievanceForm) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        reset()
        mutate()
      }
    } finally {
      setIsSubmitting(false)
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
  
  const filteredGrievances = filter === 'all' 
    ? grievances 
    : grievances.filter(g => g.status === filter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grievances</h1>
        <p className="text-muted-foreground">
          Submit and track your hostel-related issues.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('all')}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('pending')}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('in_progress')}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('resolved')}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('inappropriate')}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Inappropriate</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inappropriate}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Submit Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Submit Grievance
            </CardTitle>
            <CardDescription>
              Report an issue to the hostel warden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => setValue('category', value as GrievanceForm['category'])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  {...register('description')}
                  aria-invalid={!!errors.description}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Grievance
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Grievances List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareWarning className="h-5 w-5" />
                  Your Grievances
                </CardTitle>
                <CardDescription>
                  {filter === 'all' ? 'All submitted issues' : `Filtered by: ${filter.replace('_', ' ')}`}
                </CardDescription>
              </div>
              {filter !== 'all' && (
                <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>
                  Clear filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredGrievances.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquareWarning className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  {filter === 'all' 
                    ? 'No grievances submitted yet.' 
                    : `No ${filter.replace('_', ' ')} grievances found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGrievances.map((grievance) => (
                  <div
                    key={grievance.id}
                    className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    onClick={() => setSelectedGrievance(grievance)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {categoryLabels[grievance.category]}
                          </Badge>
                          <Badge className={statusConfig[grievance.status].color}>
                            {statusConfig[grievance.status].label}
                          </Badge>
                        </div>
                        <p className="text-sm line-clamp-2">{grievance.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(grievance.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {grievance.adminReply && (
                        <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grievance Detail Dialog */}
      <Dialog open={!!selectedGrievance} onOpenChange={() => setSelectedGrievance(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grievance Details</DialogTitle>
            <DialogDescription>
              {selectedGrievance && categoryLabels[selectedGrievance.category]}
            </DialogDescription>
          </DialogHeader>
          {selectedGrievance && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={statusConfig[selectedGrievance.status].color}>
                  {statusConfig[selectedGrievance.status].label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(selectedGrievance.createdAt), { addSuffix: true })}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground rounded-lg bg-muted p-3">
                  {selectedGrievance.description}
                </p>
              </div>

              {selectedGrievance.adminReply && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Warden Response
                  </p>
                  <p className="text-sm rounded-lg border border-primary/20 bg-primary/5 p-3">
                    {selectedGrievance.adminReply}
                  </p>
                </div>
              )}
            </div>
          )}
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
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
      </div>
    </div>
  )
}
