'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface Student {
  id: string
  full_name: string
  student_code: string
  national_id: string
  stream: string | null
  specialization: string | null
  track: string | null
  optional_subject: string | null
  is_locked: boolean
  submitted_at: string | null
  created_at: string
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStream, setFilterStream] = useState('')

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleLock = async (studentId: string, currentLock: boolean) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ is_locked: !currentLock })
        .eq('id', studentId)

      if (error) throw error

      // تحديث القائمة
      setStudents(prev =>
        prev.map(s =>
          s.id === studentId ? { ...s, is_locked: !currentLock } : s
        )
      )
    } catch (error) {
      console.error('Error toggling lock:', error)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.full_name.includes(searchTerm) ||
      student.student_code.includes(searchTerm) ||
      student.national_id.includes(searchTerm)
    
    const matchesStream = filterStream ? student.stream === filterStream : true
    
    return matchesSearch && matchesStream
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">جاري تحميل الطلاب...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">👨‍🎓 إدارة الطلاب</h1>
        <span className="text-gray-500">عدد الطلاب: {filteredStudents.length}</span>
      </div>

      {/* البحث والفلترة */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="🔍 بحث بالاسم، الكود، أو الرقم القومي..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field flex-1"
        />
        <select
          value={filterStream}
          onChange={(e) => setFilterStream(e.target.value)}
          className="input-field md:w-48"
        >
          <option value="">كل التشعيبات</option>
          <option value="ثانوي">ثانوي</option>
          <option value="بكالوريا">بكالوريا</option>
        </select>
        <button
          onClick={() => {
            setSearchTerm('')
            setFilterStream('')
          }}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all"
        >
          مسح
        </button>
      </div>

      {/* جدول الطلاب */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-50">
              <th className="text-right p-3">الاسم</th>
              <th className="text-right p-3">الكود</th>
              <th className="text-right p-3">التشعيب</th>
              <th className="text-right p-3">الحالة</th>
              <th className="text-right p-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-gray-500">
                  لا يوجد طلاب
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-blue-50">
                  <td className="p-3 font-semibold">{student.full_name}</td>
                  <td className="p-3 text-sm" dir="ltr">{student.student_code}</td>
                  <td className="p-3 text-sm">{student.stream || '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      student.is_locked
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {student.is_locked ? '✅ مقفل' : '🔓 مفتوح'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        عرض
                      </Link>
                      <button
                        onClick={() => toggleLock(student.id, student.is_locked)}
                        className={`text-sm ${
                          student.is_locked
                            ? 'text-yellow-600 hover:text-yellow-800'
                            : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {student.is_locked ? 'فتح' : 'قفل'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
