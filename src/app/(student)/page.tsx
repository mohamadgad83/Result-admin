'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function StudentLogin() {
  const router = useRouter()
  const [studentCode, setStudentCode] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('student_code', studentCode)
        .eq('national_id', nationalId)
        .single()

      if (error || !data) {
        setError('كود الطالب أو الرقم القومي غير صحيح')
        setLoading(false)
        return
      }

      // تخزين بيانات الطالب في Session Storage
      sessionStorage.setItem('studentId', data.id)
      router.push('/form')
    } catch (err) {
      setError('حدث خطأ أثناء محاولة الدخول')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            نظام تسجيل الرغبات
          </h1>
          <p className="text-gray-600">الصف الثاني الثانوي</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="label-field">كود الطالب</label>
            <input
              type="text"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              className="input-field"
              placeholder="أدخل كود الطالب"
              required
              dir="ltr"
            />
          </div>

          <div>
            <label className="label-field">الرقم القومي</label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              className="input-field"
              placeholder="أدخل الرقم القومي"
              required
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>للأدمن: <a href="/admin/login" className="text-blue-600 hover:underline">تسجيل الدخول</a></p>
        </div>
      </div>
    </div>
  )
}
