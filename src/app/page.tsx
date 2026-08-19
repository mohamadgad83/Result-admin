'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function HomePage() {
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
      // البحث عن الطالب في قاعدة البيانات
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('student_code', studentCode)
        .eq('national_id', nationalId)
        .single()

      if (error || !data) {
        setError('❌ كود الطالب أو الرقم القومي غير صحيح')
        setLoading(false)
        return
      }

      // تخزين بيانات الطالب في Session Storage
      sessionStorage.setItem('studentId', data.id)
      sessionStorage.setItem('studentName', data.full_name)
      
      // التوجيه إلى صفحة النموذج
      router.push('/form')
    } catch (err) {
      setError('❌ حدث خطأ أثناء محاولة الدخول')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        {/* الشعار */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-blue-900">نظام تسجيل الرغبات</h1>
          <p className="text-gray-500 text-sm">مدرسة دشنا الثانوية</p>
          <p className="text-gray-400 text-xs mt-1">الصف الثاني الثانوي</p>
        </div>

        {/* نموذج الدخول */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              كود الطالب
            </label>
            <input
              type="text"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
              placeholder="أدخل كود الطالب"
              required
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              الرقم القومي
            </label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
              placeholder="أدخل الرقم القومي"
              required
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-center text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
          >
            {loading ? '⏳ جاري التحقق...' : '🚪 دخول'}
          </button>
        </form>

        {/* روابط إضافية */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            للأدمن: 
            <a href="/admin/login" className="text-blue-600 hover:underline mr-1">
              تسجيل الدخول
            </a>
          </p>
        </div>

        {/* تذييل */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">© 2025 مدرسة دشنا الثانوية</p>
          <p className="text-xs text-gray-400 mt-1">قسم البرمجة والحاسب الآلي</p>
        </div>
      </div>
    </div>
  )
}
