// Mock database for hostel management system
// In a real application, this would be replaced with MongoDB/database calls

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: 'student' | 'admin'
  roomNumber?: string
  createdAt: Date
}

export interface Attendance {
  id: string
  studentId: string
  date: string // YYYY-MM-DD
  status: 'present' | 'absent'
  markedAt: Date
}

export interface Grievance {
  id: string
  studentId: string
  studentName: string
  roomNumber: string
  category: 'mess' | 'water' | 'electricity' | 'wifi' | 'cleaning' | 'room_issue'
  description: string
  status: 'pending' | 'in_progress' | 'resolved'
  adminReply?: string
  createdAt: Date
  updatedAt: Date
}

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15)

// Helper to generate dates
const daysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

const formatDate = (date: Date) => date.toISOString().split('T')[0]

// Initial mock data
const initialUsers: User[] = [
  // Admin account
  {
    id: 'admin-1',
    name: 'Dr. Rajesh Kumar',
    email: 'admin@hostel.com',
    password: 'admin123', // In real app, this would be hashed
    role: 'admin',
    createdAt: daysAgo(365),
  },
  // Student accounts
  {
    id: 'student-1',
    name: 'Rahul Sharma',
    email: 'rahul@student.com',
    password: 'password123',
    role: 'student',
    roomNumber: '101',
    createdAt: daysAgo(180),
  },
  {
    id: 'student-2',
    name: 'Priya Patel',
    email: 'priya@student.com',
    password: 'password123',
    role: 'student',
    roomNumber: '102',
    createdAt: daysAgo(175),
  },
  {
    id: 'student-3',
    name: 'Amit Singh',
    email: 'amit@student.com',
    password: 'password123',
    role: 'student',
    roomNumber: '103',
    createdAt: daysAgo(170),
  },
  {
    id: 'student-4',
    name: 'Sneha Gupta',
    email: 'sneha@student.com',
    password: 'password123',
    role: 'student',
    roomNumber: '104',
    createdAt: daysAgo(165),
  },
  {
    id: 'student-5',
    name: 'Vikram Reddy',
    email: 'vikram@student.com',
    password: 'password123',
    role: 'student',
    roomNumber: '105',
    createdAt: daysAgo(160),
  },
  {
    id: 'student-6',
    name: 'Ananya Iyer',
    email: 'ananya@student.com',
    password: 'password123',
    role: 'student',
    roomNumber: '106',
    createdAt: daysAgo(155),
  },
  {
    id: 'student-7',
    name: 'Karan Malhotra',
    email: 'karan@student.com',
    password: 'password123',
    role: 'student',
    roomNumber: '107',
    createdAt: daysAgo(150),
  },
  {
    id: 'student-8',
    name: 'Neha Verma',
    email: 'neha@student.com',
    password: 'password123',
    role: 'student',
    roomNumber: '108',
    createdAt: daysAgo(145),
  },
  {
    id: 'student-9',
    name: 'Arjun Nair',
    email: 'arjun@student.com',
    password: 'password123',
    role: 'student',
    roomNumber: '109',
    createdAt: daysAgo(140),
  },
  {
    id: 'student-10',
    name: 'Divya Menon',
    email: 'divya@student.com',
    password: 'password123',
    role: 'student',
    roomNumber: '110',
    createdAt: daysAgo(135),
  },
]

// Generate attendance records for the last 30 days
const generateAttendanceRecords = (): Attendance[] => {
  const records: Attendance[] = []
  const students = initialUsers.filter(u => u.role === 'student')
  
  for (let day = 0; day < 30; day++) {
    const date = formatDate(daysAgo(day))
    for (const student of students) {
      // Skip some days randomly to simulate missed attendance (80% present rate)
      if (Math.random() < 0.8) {
        records.push({
          id: generateId(),
          studentId: student.id,
          date,
          status: 'present',
          markedAt: daysAgo(day),
        })
      }
    }
  }
  
  return records
}

const categories: Grievance['category'][] = ['mess', 'water', 'electricity', 'wifi', 'cleaning', 'room_issue']
const statuses: Grievance['status'][] = ['pending', 'in_progress', 'resolved']

const grievanceDescriptions: Record<Grievance['category'], string[]> = {
  mess: [
    'Food quality has been poor for the past week. Rice is often undercooked.',
    'The mess timing is not convenient for students with evening classes.',
    'Request for more variety in breakfast options.',
    'Hygiene in the mess area needs improvement.',
  ],
  water: [
    'No hot water supply in the morning for the past 3 days.',
    'Water pressure is very low on the third floor.',
    'Water tank leaking near room 105.',
    'Drinking water filter needs replacement.',
  ],
  electricity: [
    'Frequent power cuts in Block A during study hours.',
    'Fan in room 103 is not working.',
    'Corridor lights are flickering.',
    'AC in common room is malfunctioning.',
  ],
  wifi: [
    'WiFi connectivity is very poor in the east wing.',
    'Internet speed is extremely slow during evening hours.',
    'Unable to connect to WiFi in room 108.',
    'Request for better router placement.',
  ],
  cleaning: [
    'Washroom on the second floor needs immediate cleaning.',
    'Dustbins are not being emptied regularly.',
    'Common area floors are not mopped daily.',
    'Request for pest control in the hostel.',
  ],
  room_issue: [
    'Window lock is broken in room 102.',
    'Cupboard door hinge needs repair.',
    'Ceiling is leaking during rain.',
    'Door lock mechanism is faulty.',
  ],
}

const adminReplies: string[] = [
  'We are looking into this issue. A team will be sent shortly.',
  'Thank you for bringing this to our attention. The issue has been resolved.',
  'We have escalated this to the maintenance team. Expected resolution within 48 hours.',
  'This matter is being addressed. Please bear with us.',
  'A technician has been assigned to resolve this issue.',
]

// Generate sample grievances
const generateGrievances = (): Grievance[] => {
  const grievances: Grievance[] = []
  const students = initialUsers.filter(u => u.role === 'student')
  
  // Generate 18 grievances across different categories and statuses
  for (let i = 0; i < 18; i++) {
    const student = students[i % students.length]
    const category = categories[i % categories.length]
    const status = statuses[i % statuses.length]
    const descriptions = grievanceDescriptions[category]
    const description = descriptions[Math.floor(Math.random() * descriptions.length)]
    
    const grievance: Grievance = {
      id: generateId(),
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || 'N/A',
      category,
      description,
      status,
      createdAt: daysAgo(Math.floor(Math.random() * 30)),
      updatedAt: daysAgo(Math.floor(Math.random() * 10)),
    }
    
    // Add admin reply for non-pending grievances
    if (status !== 'pending') {
      grievance.adminReply = adminReplies[Math.floor(Math.random() * adminReplies.length)]
    }
    
    grievances.push(grievance)
  }
  
  return grievances.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

// In-memory database
export const db = {
  users: [...initialUsers],
  attendance: generateAttendanceRecords(),
  grievances: generateGrievances(),
}

// Database helper functions
export const dbHelpers = {
  // User operations
  findUserByEmail: (email: string) => db.users.find(u => u.email === email),
  findUserById: (id: string) => db.users.find(u => u.id === id),
  createUser: (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...user,
      id: generateId(),
      createdAt: new Date(),
    }
    db.users.push(newUser)
    return newUser
  },
  deleteUser: (id: string) => {
    const index = db.users.findIndex(u => u.id === id)
    if (index !== -1) {
      db.users.splice(index, 1)
      // Also delete related attendance and grievances
      db.attendance = db.attendance.filter(a => a.studentId !== id)
      db.grievances = db.grievances.filter(g => g.studentId !== id)
      return true
    }
    return false
  },
  getStudents: () => db.users.filter(u => u.role === 'student'),

  // Attendance operations
  getAttendanceByStudent: (studentId: string) => 
    db.attendance.filter(a => a.studentId === studentId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
  getAttendanceByDate: (date: string) => 
    db.attendance.filter(a => a.date === date),
  hasMarkedToday: (studentId: string) => {
    const today = formatDate(new Date())
    return db.attendance.some(a => a.studentId === studentId && a.date === today)
  },
  markAttendance: (studentId: string) => {
    const today = formatDate(new Date())
    if (dbHelpers.hasMarkedToday(studentId)) {
      return null
    }
    const record: Attendance = {
      id: generateId(),
      studentId,
      date: today,
      status: 'present',
      markedAt: new Date(),
    }
    db.attendance.push(record)
    return record
  },
  getAttendanceStats: (studentId: string) => {
    const records = dbHelpers.getAttendanceByStudent(studentId)
    const total = 30 // Last 30 days
    const present = records.length
    const percentage = Math.round((present / total) * 100)
    return { total, present, absent: total - present, percentage }
  },

  // Grievance operations
  getGrievancesByStudent: (studentId: string) =>
    db.grievances.filter(g => g.studentId === studentId).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    ),
  getAllGrievances: () => 
    db.grievances.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  createGrievance: (data: {
    studentId: string
    studentName: string
    roomNumber: string
    category: Grievance['category']
    description: string
  }) => {
    const grievance: Grievance = {
      id: generateId(),
      ...data,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    db.grievances.unshift(grievance)
    return grievance
  },
  updateGrievance: (id: string, updates: Partial<Pick<Grievance, 'status' | 'adminReply'>>) => {
    const grievance = db.grievances.find(g => g.id === id)
    if (grievance) {
      Object.assign(grievance, updates, { updatedAt: new Date() })
      return grievance
    }
    return null
  },
  getGrievanceStats: () => {
    const all = db.grievances
    return {
      total: all.length,
      pending: all.filter(g => g.status === 'pending').length,
      inProgress: all.filter(g => g.status === 'in_progress').length,
      resolved: all.filter(g => g.status === 'resolved').length,
    }
  },

  // Admin stats
  getAdminStats: () => {
    const students = dbHelpers.getStudents()
    const today = formatDate(new Date())
    const presentToday = db.attendance.filter(a => a.date === today).length
    const grievanceStats = dbHelpers.getGrievanceStats()
    
    // Attendance trend for last 7 days
    const attendanceTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = formatDate(daysAgo(i))
      const present = db.attendance.filter(a => a.date === date).length
      attendanceTrend.push({
        date,
        present,
        absent: students.length - present,
      })
    }
    
    return {
      totalStudents: students.length,
      presentToday,
      absentToday: students.length - presentToday,
      ...grievanceStats,
      attendanceTrend,
    }
  },
}

// Category labels for UI
export const categoryLabels: Record<Grievance['category'], string> = {
  mess: 'Mess/Food',
  water: 'Water Supply',
  electricity: 'Electricity',
  wifi: 'WiFi/Internet',
  cleaning: 'Cleaning/Hygiene',
  room_issue: 'Room Issues',
}

// Status labels and colors for UI
export const statusConfig: Record<Grievance['status'], { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
}
