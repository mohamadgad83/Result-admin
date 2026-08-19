'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

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
  updated_at: string
}

export default function StudentDetails() {
  const params = useParams()
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [dynamicFields, setDynamicFields] = useState<any[]>([])

  useEffect(() => {
    if (params.id) {
      loadStudentDetails(params.id as string)
    }
  }, [params.id])

  const loadStudentDetails = async (id: string) => {
    try {
      // جلب بيانات الطالب
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()

      if (studentError) throw studentError
      setStudent(studentData)

      // جلب الحقول الديناميكية وقيمها
      const { data: fields, error: fieldsError } = await supabase
        .from('dynamic_fields')
        .select('*')
        .eq('visible_for_student', true)
        .order('display_order', { ascending: true })

      if (fieldsError) throw fieldsError

      // جلب القيم
      const { data: responses, error: responsesError } = await supabase
        .from('student_dynamic_responses')
        .select('field_id, value')
        .eq('student_id', id)

      if (responsesError) throw responsesError

      // دمج البيانات
      const fieldsWithValues = fields.map((field: any) => {
        const response = responses?.find((r: any) => r.field_id === field.id)
        return {
          ...field,
          value: response?.value || ''
        }
      })

      setDynamicFields(fieldsWithValues)
    } catch (error) {
      console.error('Error loading student:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleLock = async () => {
    if (!student) return

    try {
      const { error } = await supabase
        .from('students')
        .update({ is_locked: !student.is_locked })
        .eq('id', student.id)

      if (error) throw error
      setStudent({ ...student, is_locked: !student.is_locked })
    } catch (error) {
      console.error('Error toggling lock:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">لم يتم العثور على الطالب</p>
        <button onClick={() => router.back()} className="btn-primary mt-4">
          رجوع
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">👨‍🎓 تفاصيل الطالب</h1>
        <button onClick={() => router.back()} className="btn-primary">
          رجوع
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* المعلومات الأساسية */}
        <div className="card">
          <h3 className="font-bold text-blue-900 mb-4">📋 المعلومات الأساسية</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">الاسم</p>
              <p className="font-semibold">{student.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">كود الطالب</p>
              <p className="font-semibold" dir="ltr">{student.student_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">الرقم القومي</p>
              <p className="font-semibold" dir="ltr">{student.national_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">التشعيب</p>
              <p className="font-semibold">{student.stream || '-'}</p>
            </div>
            {student.stream === 'ثانوي' && (
              <div>
                <p className="text-sm text-gray-500">التخصص</p>
                <p className="font-semibold">{student.specialization || '-'}</p>
              </div>
            )}
            {student.stream === 'بكالوريا' && (
              <>
                <div>
                  <p className="text-sm text-gray-500">المسار</p>
                  <p className="font-semibold">{student.track || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">المادة الاختيارية</p>
                  <p className="font-semibold">{student.optional_subject || '-'}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* الحالة والإجراءات */}
        <div className="card">
          <h3 className="font-bold text-blue-900 mb-4">⚙️ الحالة والإجراءات</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">حالة الطلب</p>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                student.is_locked
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {student.is_locked ? '✅ مقفل' : '🔓 مفتوح للتعديل'}
              </span>
            </div>
            {student.submitted_at && (
              <div>
                <p className="text-sm text-gray-500">تاريخ التقديم</p>
                <p className="font-semibold">
                  {new Date(student.submitted_at).toLocaleDateString('ar-EG')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">آخر تحديث</p>
              <p className="font-semibold">
                {new Date(student.updated_at).toLocaleDateString('ar-EG')}
              </p>
            </div>
            <button
              onClick={toggleLock}
              className={`w-full py-3 rounded-xl text-white font-bold transition-all ${
                student.is_locked
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {student.is_locked ? '🔓 فتح التعديل' : '🔒 قفل التعديل'}
            </button>
          </div>
        </div>

        {/* الحقول الديناميكية */}
        {dynamicFields.length > 0 && (
          <div className="md:col-span-2 card">
            <h3 className="font-bold text-blue-900 mb-4">📝 الحقول الديناميكية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dynamicFields.map((field) => (
                <div key={field.id} className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">{field.name}</p>
                  <p className="font-semibold">{field.value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
