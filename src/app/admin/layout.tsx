'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [adminId, setAdminId] = useState<string | null>(null)

  useEffect(() => {
    const id = sessionStorage.getItem('adminId')
    if (!id && pathname !== '/admin/login') {
      router.push('/admin/login')
    }
    setAdminId(id)
  }, [pathname, router])

  // إذا كان في صفحة login، لا تظهر القائمة الجانبية
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleLogout = async () => {
    sessionStorage.clear()
    router.push('/admin/login')
  }

  const menuItems = [
    { href: '/admin/dashboard', label: '📊 لوحة التحكم' },
    { href: '/admin/students', label: '👨‍🎓 الطلاب' },
    { href: '/admin/fields', label: '📝 الحقول الديناميكية' },
    { href: '/admin/import-export', label: '📤 استيراد/تصدير' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* القائمة الجانبية */}
      <aside className="w-64 bg-blue-900 text-white min-h-screen p-4 hidden md:block">
        <div className="mb-8">
          <h2 className="text-xl font-bold">لوحة التحكم</h2>
          <p className="text-blue-300 text-sm">مدرسة دشنا الثانوية</p>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 rounded-lg transition-all ${
                pathname === item.href
                  ? 'bg-blue-800 text-white'
                  : 'hover:bg-blue-800 text-blue-200'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 w-48">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all text-white"
          >
            🚪 تسجيل خروج
          </button>
        </div>
      </aside>

      {/* المحتوى */}
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6 md:hidden">
          <h1 className="text-xl font-bold text-blue-900">لوحة التحكم</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
          >
            خروج
          </button>
        </div>
        {children}
      </main>
    </div>
  )
}
