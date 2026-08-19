'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // تسجيل الدخول باستخدام Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError || !data.user) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        setLoading(false)
        return
      }

      // التحقق من أن المستخدم أدمن
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (adminError || !adminData) {
        setError('ليس لديك صلاحية الدخول كأدمن')
        setLoading(false)
        return
      }

      // تخزين بيانات الجلسة
      sessionStorage.setItem('adminId', data.user.id)
      sessionStorage.setItem('adminEmail', data.user.email || '')
      
      router.push('/admin/dashboard')
    } catch (err) {
      setError('حدث خطأ أثناء محاولة الدخول')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 to-indigo-900">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">👑</span>
          </div>
          <h1 className="text-2xl font-bold text-blue-900">لوحة التحكم</h1>
          <p className="text-gray-500 text-sm">مدرسة دشنا الثانوية</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="label-field">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="admin@school.com"
              required
              dir="ltr"
            />
          </div>

          <div>
            <label className="label-field">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="********"
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
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <a href="/" className="text-blue-600 hover:underline">العودة للصفحة الرئيسية</a>
        </div>
      </div>
    </div>
  )
}
