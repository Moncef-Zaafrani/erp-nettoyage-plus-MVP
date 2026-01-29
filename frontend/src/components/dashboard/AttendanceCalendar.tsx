import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { attendanceApi, Attendance } from '@/services/api'

interface DayData {
  date: Date
  dayOfMonth: number
  isToday: boolean
  isCurrentMonth: boolean
  isWeekend: boolean
  isFuture: boolean
  status: 'worked' | 'missed' | 'absence' | 'weekend' | 'future' | 'none'
  hoursWorked?: number
}

// Legend items (with translation keys)
const legendItems = [
  { status: 'worked', labelKey: 'calendar.legend.worked', color: 'bg-green-500' },
  { status: 'missed', labelKey: 'calendar.legend.missed', color: 'bg-red-500' },
  { status: 'absence', labelKey: 'calendar.legend.absence', color: 'bg-orange-400' },
  { status: 'weekend', labelKey: 'calendar.legend.weekend', color: 'bg-gray-300 dark:bg-gray-600' },
]

const statusColors: Record<string, string> = {
  worked: 'bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800',
  missed: 'bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800',
  absence: 'bg-orange-50 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  weekend: 'bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400 border-gray-200 dark:border-gray-600',
  future: 'bg-gray-50/50 text-gray-400 dark:bg-gray-800/30 dark:text-gray-600 border-gray-100 dark:border-gray-700/50',
  none: 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50',
}

export function AttendanceCalendar() {
  const { t } = useTranslation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Fetch attendance data for the current month
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        
        const data = await attendanceApi.getHistory(
          startOfMonth.toISOString().split('T')[0],
          endOfMonth.toISOString().split('T')[0]
        )
        setAttendanceData(data)
      } catch (err) {
        console.error('Failed to fetch attendance:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentDate])

  // Generate calendar days
  const generateCalendarDays = (): DayData[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay() // 0 = Sunday
    
    const days: DayData[] = []
    
    // Previous month padding
    const prevMonthDays = startingDay === 0 ? 6 : startingDay - 1 // Adjust for Monday start
    const prevMonth = new Date(year, month, 0)
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i
      const date = new Date(year, month - 1, day)
      days.push({
        date,
        dayOfMonth: day,
        isToday: false,
        isCurrentMonth: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isFuture: false,
        status: 'none',
      })
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      date.setHours(0, 0, 0, 0)
      
      const isToday = date.getTime() === today.getTime()
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const isFuture = date > today
      
      // Determine status based on attendance data
      let status: DayData['status'] = 'none'
      let hoursWorked: number | undefined
      
      if (isFuture) {
        status = 'future'
      } else if (isWeekend) {
        status = 'weekend'
      } else {
        // Check if there's attendance for this day
        const dayAttendance = attendanceData.filter(att => {
          const attDate = new Date(att.clockIn)
          return attDate.getFullYear() === date.getFullYear() &&
                 attDate.getMonth() === date.getMonth() &&
                 attDate.getDate() === date.getDate()
        })
        
        if (dayAttendance.length > 0) {
          status = 'worked'
          hoursWorked = dayAttendance.reduce((sum, att) => sum + (parseFloat(String(att.hoursWorked)) || 0), 0)
        } else if (!isToday) {
          // TODO: Check against schedule to determine if truly missed
          // For now, assume weekdays without attendance before today are missed
          status = 'missed'
        }
      }
      
      days.push({
        date,
        dayOfMonth: day,
        isToday,
        isCurrentMonth: true,
        isWeekend,
        isFuture,
        status,
        hoursWorked,
      })
    }
    
    // Next month padding to complete 6 rows
    const remainingDays = 42 - days.length // 6 rows x 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        date,
        dayOfMonth: day,
        isToday: false,
        isCurrentMonth: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isFuture: true,
        status: 'none',
      })
    }
    
    return days
  }

  const calendarDays = generateCalendarDays()
  
  // Get translated month name
  const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
  const monthName = t(`calendar.months.${monthKeys[currentDate.getMonth()]}`, monthKeys[currentDate.getMonth()])
  const monthYear = `${monthName} ${currentDate.getFullYear()}`
  
  // Translated weekday abbreviations
  const weekDays = [
    t('calendar.days.mon', 'Mon'),
    t('calendar.days.tue', 'Tue'),
    t('calendar.days.wed', 'Wed'),
    t('calendar.days.thu', 'Thu'),
    t('calendar.days.fri', 'Fri'),
    t('calendar.days.sat', 'Sat'),
    t('calendar.days.sun', 'Sun'),
  ]

  // Calculate monthly stats
  const workedDays = calendarDays.filter(d => d.isCurrentMonth && d.status === 'worked').length
  const missedDays = calendarDays.filter(d => d.isCurrentMonth && d.status === 'missed').length
  const totalHours = calendarDays
    .filter(d => d.isCurrentMonth && d.hoursWorked)
    .reduce((sum, d) => sum + (d.hoursWorked || 0), 0)

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
            <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('calendar.attendance', 'Attendance')}
          </span>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-gray-400" />
          </button>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[90px] text-center">
            {monthYear}
          </span>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={currentDate.getMonth() >= today.getMonth() && currentDate.getFullYear() >= today.getFullYear()}
          >
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-3">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDays.map((day, idx) => (
                <div key={idx} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
                  {day.slice(0, 2)}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  onMouseEnter={() => day.isCurrentMonth && day.status !== 'future' && setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`relative h-8 w-full flex items-center justify-center rounded-md text-xs font-medium border transition-colors ${
                    day.isToday
                      ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800'
                      : ''
                  } ${
                    day.isCurrentMonth
                      ? statusColors[day.status]
                      : 'text-gray-300 dark:text-gray-700'
                  }`}
                >
                  <span>{day.dayOfMonth}</span>
                </div>
              ))}
            </div>

            {/* Hovered Day Info */}
            {hoveredDay && hoveredDay.hoursWorked !== undefined && (
              <div className="mt-2 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {hoveredDay.date.toLocaleDateString()}: <strong>{hoveredDay.hoursWorked.toFixed(1)}h</strong>
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 border-t border-gray-100 dark:border-gray-700 text-center">
        <div className="py-2.5 px-2 border-r border-gray-100 dark:border-gray-700">
          <p className="text-base font-bold text-green-600 dark:text-green-400">{workedDays}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('calendar.worked', 'Worked')}</p>
        </div>
        <div className="py-2.5 px-2 border-r border-gray-100 dark:border-gray-700">
          <p className="text-base font-bold text-red-600 dark:text-red-400">{missedDays}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('calendar.missed', 'Missed')}</p>
        </div>
        <div className="py-2.5 px-2">
          <p className="text-base font-bold text-blue-600 dark:text-blue-400">{totalHours.toFixed(1)}h</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('calendar.totalHours', 'Hours')}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap gap-3 justify-center">
          {legendItems.map((item) => (
            <div key={item.status} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${item.color}`} />
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{t(item.labelKey)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AttendanceCalendar
