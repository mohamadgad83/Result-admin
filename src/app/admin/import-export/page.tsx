'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import * as XLSX from 'xlsx'

export default function ImportExport() {
  const [loading, setLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)

  // تصدير البيانات
  const exportData = async () => {
    try {
      setLoading(true)
      
      // جلب جميع الطلاب
      const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // جلب الحقول الديناميكية
      const { data: fields, error: fieldsError } = await supabase
        .from('dynamic_fields')
        .select('id, name')
        .eq('visible_for_student', true)

      if (fieldsError) throw fieldsError

      // جلب الاستجابات
      const studentIds = students.map(s => s.id)
      const { data: responses, error: responsesError } = await supabase
        .from('student_dynamic_responses')
        .select('student_id, field_id, value')
        .in('student_id', studentIds)

      if (responsesError) throw responsesError

      // تحويل البيانات
      const exportData = students.map(student => {
        const row: any = {
          'الكود': student.student_code,
          'الرقم القومي': student.national_id,
          'الاسم': student.full_name,
          'التشعيب': student.stream || '',
          'التخصص/المسار': student.specialization || student.track || '',
          'المادة الاختيارية': student.optional_subject || '',
          'الحالة': student.is_locked ? 'مقفل' : 'مفتوح',
          'تاريخ التقديم': student.submitted_at ? new Date(student.submitted_at).toLocaleDateString('ar-EG') : '',
        }

        // إضافة الحقول الديناميكية
        fields.forEach(field => {
          const response = responses.find(
            r => r.student_id === student.id && r.field_id === field.id
          )
          row[field.name] = response?.value || ''
        })

        return row
      })

      // إنشاء ملف Excel
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)
      XLSX.utils.book_append_sheet(wb, ws, 'الطلاب')
      
      // تحميل الملف
      XLSX.writeFile(wb, `طلاب_مدرسة_دشنا_${new Date().toISOString().split('T')[0]}.xlsx`)
      
    } catch (error) {
      console.error('Error exporting:', error)
      alert('حدث خطأ أثناء التصدير')
    } finally {
      setLoading(false)
    }
  }

  // استيراد البيانات
  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      setUploadResult(null)

      // قراءة الملف
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(worksheet)

      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (const row of rows) {
        try {
          // التحقق من الحقول المطلوبة
          if (!row['الكود'] || !row['الرقم القومي'] || !row['الاسم'] || !row['التشعيب']) {
            errorCount++
            errors.push(`صف ${rows.indexOf(row) + 2}: الحقول المطلوبة غير مكتملة`)
            continue
          }

          // التحقق من عدم التكرار
          const { data: existing, error: checkError } = await supabase
            .from('students')
            .select('id')
            .or(`student_code.eq.${row['الكود']},national_id.eq.${row['الرقم القومي']}`)
            .maybeSingle()

          if (checkError) {
            errorCount++
            errors.push(`صف ${rows.indexOf(row) + 2}: خطأ في التحقق`)
            continue
          }

          if (existing) {
            errorCount++
            errors.push(`صف ${rows.indexOf(row) + 2}: الكود أو الرقم القومي موجود مسبقاً`)
            continue
          }

          // إضافة الطالب
          const studentData: any = {
            student_code: String(row['الكود']),
            national_id: String(row['الرقم القومي']),
            full_name: String(row['الاسم']),
            stream: row['التشعيب'],
            is_locked: true,
          }

          if (row['التشعيب'] === 'ثانوي') {
            studentData.specialization = row['التخصص/المسار'] || null
          } else if (row['التشعيب'] === 'بكالوريا') {
            studentData.track = row['التخصص/المسار'] || null
            studentData.optional_subject = row['المادة الاختيارية'] || null
          }

          const { data: inserted, error: insertError } = await supabase
            .from('students')
            .insert(studentData)
            .select()
            .single()

          if (insertError) {
            errorCount++
            errors.push(`صف ${rows.indexOf(row) + 2}: ${insertError.message}`)
            continue
          }

          successCount++
        } catch (err) {
          errorCount++
          errors.push(`صف ${rows.indexOf(row) + 2}: خطأ غير متوقع`)
        }
      }

      setUploadResult({
        successCount,
        errorCount,
        errors,
        total: rows.length,
      })

    } catch (error) {
      console.error('Error importing:', error)
      alert('حدث خطأ أثناء الاستيراد')
    } finally {
      setLoading(false)
      e.target.value = '' // إعادة تعيين input
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-900 mb-6">📤 استيراد/تصدير الطلاب</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* تصدير */}
        <div className="card">
          <h3 className="font-bold text-blue-900 mb-4">📥 تصدير البيانات</h3>
          <p className="text-gray-500 text-sm mb-4">
            تصدير جميع بيانات الطلاب إلى ملف Excel شامل
          </p>
          <button
            onClick={exportData}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'جاري التصدير...' : '📥 تحميل ملف Excel'}
          </button>
        </div>

        {/* استيراد */}
        <div className="card">
          <h3 className="font-bold text-blue-900 mb-4">📤 استيراد طلاب</h3>
          <p className="text-gray-500 text-sm mb-4">
            استيراد طلاب من ملف Excel (يجب أن يحتوي على: الكود، الرقم القومي، الاسم، التشعيب)
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={importData}
            disabled={loading}
            className="w-full p-2 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer"
          />
          {loading && (
            <p className="text-center text-gray-600 mt-4">⏳ جاري الاستيراد...</p>
          )}
        </div>
      </div>

      {/* نتائج الاستيراد */}
      {uploadResult && (
        <div className="card mt-6">
          <h3 className="font-bold text-blue-900 mb-4">📊 نتائج الاستيراد</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{uploadResult.successCount}</p>
              <p className="text-sm text-gray-500">تمت الإضافة</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">{uploadResult.errorCount}</p>
              <p className="text-sm text-gray-500">فشل</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{uploadResult.total}</p>
              <p className="text-sm text-gray-500">إجمالي الصفوف</p>
            </div>
          </div>
          {uploadResult.errors.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg max-h-40 overflow-y-auto">
              <p className="font-semibold text-red-700 mb-2">الأخطاء:</p>
              {uploadResult.errors.map((err: string, i: number) => (
                <p key={i} className="text-sm text-red-600">• {err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
