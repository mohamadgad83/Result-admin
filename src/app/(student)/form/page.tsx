'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
}

interface DynamicField {
  id: string
  name: string
  field_key: string
  type: 'text' | 'select'
  options: string[] | null
  is_required: boolean
  is_readonly: boolean
  visible_for_student: boolean
  display_order: number
  value?: string
}

export default function StudentForm() {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [fields, setFields] = useState<DynamicField[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // بيانات النموذج
  const [formData, setFormData] = useState({
    stream: '',
    specialization: '',
    track: '',
    optional_subject: '',
    dynamicFields: {} as Record<string, string>
  })

  // خيارات المسارات
  const tracks = {
    'مسار الطب وعلوم الحياة': ['فيزياء', 'رياضيات'],
    'مسار الهندسة وعلوم الحاسب': ['كيمياء', 'برمجة'],
    'مسار الأعمال': ['إدارة أعمال', 'محاسبة'],
    'مسار الآداب والفنون': ['لغة ثانية فرنسي', 'لغة ثانية ألماني', 'علم نفس']
  }

  useEffect(() => {
    const studentId = sessionStorage.getItem('studentId')
    if (!studentId) {
      router.push('/')
      return
    }

    loadStudentData(studentId)
  }, [router])

  const loadStudentData = async (studentId: string) => {
    try {
      // جلب بيانات الطالب
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()

      if (studentError || !studentData) {
        setError('خطأ في جلب بيانات الطالب')
        setLoading(false)
        return
      }

      setStudent(studentData)

      // جلب الحقول الديناميكية
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('dynamic_fields')
        .select('*')
        .eq('visible_for_student', true)
        .order('display_order', { ascending: true })

      if (fieldsError) {
        setError('خطأ في جلب الحقول')
        setLoading(false)
        return
      }

      // جلب قيم الحقول
      const { data: responses, error: responsesError } = await supabase
        .from('student_dynamic_responses')
        .select('field_id, value')
        .eq('student_id', studentId)

      if (!responsesError && responses) {
        fieldsData.forEach((field: DynamicField) => {
          const response = responses.find(r => r.field_id === field.id)
          if (response) {
            field.value = response.value
          }
        })
      }

      setFields(fieldsData)

      // تعبئة البيانات الموجودة
      if (studentData.stream) {
        setFormData(prev => ({
          ...prev,
          stream: studentData.stream,
          specialization: studentData.specialization || '',
          track: studentData.track || '',
          optional_subject: studentData.optional_subject || ''
        }))

        // تعبئة الحقول الديناميكية
        const dynamicValues: Record<string, string> = {}
        fieldsData.forEach((field: DynamicField) => {
          if (field.value) {
            dynamicValues[field.id] = field.value
          }
        })
        setFormData(prev => ({
          ...prev,
          dynamicFields: dynamicValues
        }))
      }

      setLoading(false)
    } catch (err) {
      setError('حدث خطأ أثناء تحميل البيانات')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const studentId = sessionStorage.getItem('studentId')
      if (!studentId) {
        setError('لم يتم العثور على الطالب')
        setSaving(false)
        return
      }

      // التحقق من الحقول المطلوبة
      if (!formData.stream) {
        setError('يرجى اختيار التشعيب')
        setSaving(false)
        return
      }

      if (formData.stream === 'ثانوي' && !formData.specialization) {
        setError('يرجى اختيار التخصص')
        setSaving(false)
        return
      }

      if (formData.stream === 'بكالوريا') {
        if (!formData.track) {
          setError('يرجى اختيار المسار')
          setSaving(false)
          return
        }
        if (!formData.optional_subject) {
          setError('يرجى اختيار المادة الاختيارية')
          setSaving(false)
          return
        }
      }

      // تحديث بيانات الطالب
      const updateData: any = {
        stream: formData.stream,
        submitted_at: student?.submitted_at || new Date().toISOString()
      }

      if (formData.stream === 'ثانوي') {
        updateData.specialization = formData.specialization
        updateData.track = null
        updateData.optional_subject = null
      } else {
        updateData.specialization = null
        updateData.track = formData.track
        updateData.optional_subject = formData.optional_subject
      }

      // إذا كانت أول مرة يتم الحفظ
      if (!student?.submitted_at) {
        updateData.is_locked = true
      }

      const { error: updateError } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', studentId)

      if (updateError) {
        setError('خطأ في حفظ البيانات')
        setSaving(false)
        return
      }

      // حفظ الحقول الديناميكية
      for (const [fieldId, value] of Object.entries(formData.dynamicFields)) {
        if (value) {
          await supabase
            .from('student_dynamic_responses')
            .upsert({
              student_id: studentId,
              field_id: fieldId,
              value: value
            }, {
              onConflict: 'student_id,field_id'
            })
        }
      }

      setSuccess(true)
      setSaving(false)

      // تحديث حالة الطالب
      const { data: updatedStudent } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()

      if (updatedStudent) {
        setStudent(updatedStudent)
      }

    } catch (err) {
      setError('حدث خطأ أثناء حفظ البيانات')
      setSaving(false)
    }
  }

  const handleDynamicFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      dynamicFields: {
        ...prev.dynamicFields,
        [fieldId]: value
      }
    }))
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

  if (error && !student) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-600">{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary mt-4">
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    )
  }

  const isLocked = student?.is_locked && student?.submitted_at

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <h1 className="text-2xl font-bold text-blue-900 mb-6 text-center">
            تسجيل رغبات الطالب
          </h1>

          {/* بيانات الطالب */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">الاسم</p>
                <p className="font-semibold">{student?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">كود الطالب</p>
                <p className="font-semibold" dir="ltr">{student?.student_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الرقم القومي</p>
                <p className="font-semibold" dir="ltr">{student?.national_id}</p>
              </div>
            </div>
          </div>

          {isLocked && (
            <div className="bg-yellow-50 border-r-4 border-yellow-500 p-4 mb-6 rounded">
              <p className="text-yellow-800">
                ⚠️ تم تسجيل الرغبات مسبقاً ولا يمكن التعديل.
                {student?.submitted_at && (
                  <span className="block text-sm mt-1">
                    تاريخ التقديم: {new Date(student.submitted_at).toLocaleDateString('ar-EG')}
                  </span>
                )}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* التشعيب */}
            <div className="mb-6">
              <label className="label-field">التشعيب *</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!isLocked) {
                      setFormData(prev => ({
                        ...prev,
                        stream: 'ثانوي',
                        specialization: '',
                        track: '',
                        optional_subject: ''
                      }))
                    }
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.stream === 'ثانوي'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  } ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  disabled={isLocked}
                >
                  <span className="text-2xl block">🎓</span>
                  ثانوي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isLocked) {
                      setFormData(prev => ({
                        ...prev,
                        stream: 'بكالوريا',
                        specialization: '',
                        track: '',
                        optional_subject: ''
                      }))
                    }
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.stream === 'بكالوريا'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  } ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  disabled={isLocked}
                >
                  <span className="text-2xl block">📚</span>
                  بكالوريا
                </button>
              </div>
            </div>

            {/* التخصص (ثانوي) */}
            {formData.stream === 'ثانوي' && (
              <div className="mb-6">
                <label className="label-field">التخصص *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isLocked) setFormData(prev => ({ ...prev, specialization: 'علمي' }))
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.specialization === 'علمي'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    } ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    disabled={isLocked}
                  >
                    <span className="text-2xl block">🔬</span>
                    علمي
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isLocked) setFormData(prev => ({ ...prev, specialization: 'أدبي' }))
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.specialization === 'أدبي'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    } ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    disabled={isLocked}
                  >
                    <span className="text-2xl block">📝</span>
                    أدبي
                  </button>
                </div>
              </div>
            )}

            {/* المسار والمادة (بكالوريا) */}
            {formData.stream === 'بكالوريا' && (
              <>
                <div className="mb-6">
                  <label className="label-field">المسار *</label>
                  <select
                    value={formData.track}
                    onChange={(e) => {
                      if (!isLocked) {
                        setFormData(prev => ({
                          ...prev,
                          track: e.target.value,
                          optional_subject: ''
                        }))
                      }
                    }}
                    className="input-field"
                    disabled={isLocked}
                    required
                  >
                    <option value="">اختر المسار</option>
                    {Object.keys(tracks).map((track) => (
                      <option key={track} value={track}>{track}</option>
                    ))}
                  </select>
                </div>

                {formData.track && (
                  <div className="mb-6">
                    <label className="label-field">المادة الاختيارية *</label>
                    <select
                      value={formData.optional_subject}
                      onChange={(e) => {
                        if (!isLocked) {
                          setFormData(prev => ({
                            ...prev,
                            optional_subject: e.target.value
                          }))
                        }
                      }}
                      className="input-field"
                      disabled={isLocked}
                      required
                    >
                      <option value="">اختر المادة</option>
                      {tracks[formData.track as keyof typeof tracks]?.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* الحقول الديناميكية */}
            {fields.map((field) => (
              <div key={field.id} className="mb-4">
                <label className="label-field">
                  {field.name}
                  {field.is_required && ' *'}
                </label>
                {field.type === 'text' ? (
                  <input
                    type="text"
                    value={formData.dynamicFields[field.id] || ''}
                    onChange={(e) => {
                      if (!isLocked && !field.is_readonly) {
                        handleDynamicFieldChange(field.id, e.target.value)
                      }
                    }}
                    className="input-field"
                    disabled={isLocked || field.is_readonly}
                    required={field.is_required}
                  />
                ) : (
                  <select
                    value={formData.dynamicFields[field.id] || ''}
                    onChange={(e) => {
                      if (!isLocked && !field.is_readonly) {
                        handleDynamicFieldChange(field.id, e.target.value)
                      }
                    }}
                    className="input-field"
                    disabled={isLocked || field.is_readonly}
                    required={field.is_required}
                  >
                    <option value="">اختر</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-center mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-xl text-center mb-4">
                ✅ تم حفظ البيانات بنجاح!
              </div>
            )}

            {!isLocked && (
              <button
                type="submit"
                disabled={saving}
                className="btn-success w-full"
              >
                {saving ? 'جاري الحفظ...' : '💾 حفظ الرغبات'}
              </button>
            )}

            {isLocked && (
              <div className="text-center text-gray-500">
                <p>✅ تم تسجيل الرغبات بنجاح</p>
                <p className="text-sm mt-2">
                  تاريخ التقديم: {student?.submitted_at && new Date(student.submitted_at).toLocaleDateString('ar-EG')}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
