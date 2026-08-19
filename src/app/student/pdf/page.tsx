'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

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
}

interface DynamicField {
  id: string
  name: string
  value: string
}

export default function StudentPDF() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<Student | null>(null)
  const [fields, setFields] = useState<DynamicField[]>([])

  useEffect(() => {
    const studentId = sessionStorage.getItem('studentId')
    if (!studentId) {
      router.push('/')
      return
    }

    loadData(studentId)
  }, [router])

  const loadData = async (studentId: string) => {
    try {
      // جلب بيانات الطالب
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()

      if (studentError) throw studentError
      setStudent(studentData)

      // جلب الحقول الديناميكية وقيمها
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('dynamic_fields')
        .select('id, name')
        .eq('visible_for_student', true)
        .order('display_order', { ascending: true })

      if (fieldsError) throw fieldsError

      // جلب القيم
      const { data: responses, error: responsesError } = await supabase
        .from('student_dynamic_responses')
        .select('field_id, value')
        .eq('student_id', studentId)

      if (responsesError) throw responsesError

      // دمج البيانات
      const fieldsWithValues = fieldsData.map((field: any) => ({
        id: field.id,
        name: field.name,
        value: responses?.find((r: any) => r.field_id === field.id)?.value || '',
      }))

      setFields(fieldsWithValues)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = () => {
    if (!student) return

    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // إعدادات RTL
    doc.setR2L(true)

    // العنوان
    doc.setFontSize(20)
    doc.setTextColor('#1e3c72')
    doc.text('نموذج تسجيل رغبات الطالب', pageWidth / 2, 30, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor('#666')
    doc.text('مدرسة دشنا الثانوية', pageWidth / 2, 40, { align: 'center' })

    // خط فاصل
    doc.setDrawColor('#1e3c72')
    doc.line(20, 45, pageWidth - 20, 45)

    // بيانات الطالب
    doc.setFontSize(14)
    doc.setTextColor('#1e3c72')
    doc.text('بيانات الطالب', 20, 55)

    doc.setFontSize(12)
    doc.setTextColor('#333')
    const studentData = [
      ['الاسم', student.full_name],
      ['كود الطالب', student.student_code],
      ['الرقم القومي', student.national_id],
      ['التشعيب', student.stream || '-'],
    ]

    if (student.stream === 'ثانوي') {
      studentData.push(['التخصص', student.specialization || '-'])
    } else if (student.stream === 'بكالوريا') {
      studentData.push(['المسار', student.track || '-'])
      studentData.push(['المادة الاختيارية', student.optional_subject || '-'])
    }

    let yPos = 65
    studentData.forEach(([label, value]) => {
      doc.text(`${label}:`, 20, yPos)
      doc.text(value, 80, yPos)
      yPos += 8
    })

    // الحقول الديناميكية
    if (fields.length > 0) {
      yPos += 5
      doc.setFontSize(14)
      doc.setTextColor('#1e3c72')
      doc.text('البيانات الإضافية', 20, yPos)
      yPos += 8

      doc.setFontSize(12)
      doc.setTextColor('#333')
      fields.forEach((field) => {
        doc.text(`${field.name}:`, 20, yPos)
        doc.text(field.value || '—', 80, yPos)
        yPos += 8
      })
    }

    // التوقيعات
    yPos += 15
    doc.setFontSize(12)
    doc.setTextColor('#1e3c72')
    doc.text('التوقيعات', 20, yPos)

    yPos += 10
    doc.setFontSize(12)
    doc.setTextColor('#333')

    // خطوط التوقيع
    const signatureY = yPos + 10
    doc.text('توقيع الطالب:', 20, yPos)
    doc.line(60, signatureY, 100, signatureY)

    doc.text('توقيع ولي الأمر:', 120, yPos)
    doc.line(170, signatureY, 210, signatureY)

    // تاريخ الطباعة
    doc.setFontSize(10)
    doc.setTextColor('#999')
    doc.text(
      `تمت الطباعة في: ${new Date().toLocaleDateString('ar-EG')}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    )

    // حفظ PDF
    doc.save(`تسجيل_رغبات_${student.full_name}.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <p className="text-red-600">لم يتم العثور على بيانات الطالب</p>
          <button onClick={() => router.push('/')} className="btn-primary mt-4">
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 py-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-2xl font-bold text-blue-900 mb-6 text-center">
            📄 طباعة تسجيل الرغبات
          </h1>

          {/* معاينة البيانات */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">الاسم</p>
                <p className="font-semibold">{student.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">كود الطالب</p>
                <p className="font-semibold" dir="ltr">{student.student_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الرقم القومي</p>
                <p className="font-semibold" dir="ltr">{student.national_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">التشعيب</p>
                <p className="font-semibold">{student.stream || '-'}</p>
              </div>
              {student.stream === 'ثانوي' && (
                <div>
                  <p className="text-sm text-gray-600">التخصص</p>
                  <p className="font-semibold">{student.specialization || '-'}</p>
                </div>
              )}
              {student.stream === 'بكالوريا' && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">المسار</p>
                    <p className="font-semibold">{student.track || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">المادة الاختيارية</p>
                    <p className="font-semibold">{student.optional_subject || '-'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* الحقول الديناميكية */}
          {fields.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-blue-900 mb-3">البيانات الإضافية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fields.map((field) => (
                  <div key={field.id}>
                    <p className="text-sm text-gray-600">{field.name}</p>
                    <p className="font-semibold">{field.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {student.submitted_at && (
            <div className="bg-green-50 p-3 rounded-lg text-center mb-6">
              <p className="text-green-700 text-sm">
                ✅ تم التقديم في: {new Date(student.submitted_at).toLocaleDateString('ar-EG')}
              </p>
            </div>
          )}

          {/* أزرار التحكم */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={generatePDF}
              className="btn-primary flex-1"
            >
              📄 تحميل PDF
            </button>
            <button
              onClick={() => router.push('/form')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all flex-1"
            >
              🔙 العودة للنموذج
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
