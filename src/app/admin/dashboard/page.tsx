'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Stats {
  totalStudents: number
  lockedStudents: number
  totalFields: number
  submittedToday: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    lockedStudents: 0,
    totalFields: 0,
    submittedToday: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // عدد الطلاب الكلي
      const { count: total } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      // عدد الطلاب المقفلين
      const { count: locked } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('is_locked', true)

      // عدد الحقول الديناميكية
      const { count: fields } = await supabase
        .from('dynamic_fields')
        .select('*', { count: 'exact', head: true })

      // عدد الطلاب المسجلين اليوم
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: todayCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', today.toISOString())

      setStats({
        totalStudents: total || 0,
        lockedStudents: locked || 0,
        totalFields: fields || 0,
        submittedToday: todayCount || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'إجمالي الطلاب', value: stats.totalStudents, icon: '👨‍🎓', color: 'bg-blue-500' },
    { label: 'الطلاب المسجلين', value: stats.lockedStudents, icon: '✅', color: 'bg-green-500' },
    { label: 'الحقول الديناميكية', value: stats.totalFields, icon: '📝', color: 'bg-purple-500' },
    { label: 'سجلوا اليوم', value: stats.submittedToday, icon: '📅', color: 'bg-orange-500' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-900 mb-6">📊 لوحة التحكم</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-blue-900">{stat.value}</p>
              </div>
              <div className={`w-14 h-14 ${stat.color} rounded-full flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold text-blue-900 mb-4">⚡ إجراءات سريعة</h3>
          <div className="space-y-3">
            <a href="/admin/students" className="block w-full btn-primary text-center">
              👨‍🎓 إدارة الطلاب
            </a>
            <a href="/admin/fields" className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all text-center">
              📝 إدارة الحقول
            </a>
            <a href="/admin/import-export" className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all text-center">
              📤 استيراد/تصدير
            </a>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-blue-900 mb-4">ℹ️ معلومات النظام</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">نظام:</span> تسجيل رغبات طلاب الصف الثاني الثانوي</p>
            <p><span className="text-gray-500">المدرسة:</span> دشنا الثانوية</p>
            <p><span className="text-gray-500">الحالة:</span> <span className="text-green-600">🟢 يعمل</span></p>
            <p><span className="text-gray-500">آخر تحديث:</span> {new Date().toLocaleDateString('ar-EG')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
