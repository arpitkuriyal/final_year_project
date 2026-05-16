'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Building2,
  LayoutDashboard,
  CalendarCheck,
  MessageSquareWarning,
  Users,
  LogOut,
  DoorOpen,
  ScanFace,
} from 'lucide-react'

const studentNavItems = [
  {
    title: 'Dashboard',
    url: '/student',
    icon: LayoutDashboard,
  },
  {
    title: 'Attendance',
    url: '/student/attendance',
    icon: CalendarCheck,
  },
  {
    title: 'Grievances',
    url: '/student/grievances',
    icon: MessageSquareWarning,
  },
]

const adminNavItems = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Students',
    url: '/admin/students',
    icon: Users,
  },
  {
    title: 'Grievances',
    url: '/admin/grievances',
    icon: MessageSquareWarning,
  },
  {
    title: 'Face Scanner',
    url: '/admin/scanner',
    icon: ScanFace,
  },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const navItems = user?.role === 'admin' ? adminNavItems : studentNavItems

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href={user?.role === 'admin' ? '/admin' : '/student'} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Hostel Management</span>
            <span className="text-xs text-muted-foreground">
              {user?.role === 'admin' ? 'Warden Portal' : 'Student Portal'}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {user ? getInitials(user.name) : '??'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{user?.name}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {user?.role === 'student' && user.roomNumber && (
                <>
                  <DoorOpen className="h-3 w-3" />
                  Room {user.roomNumber}
                </>
              )}
              {user?.role === 'admin' && 'Warden'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="shrink-0"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
