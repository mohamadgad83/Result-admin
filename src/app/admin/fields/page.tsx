'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Field {
  id: string
  name: string
  field_key: string
  type: 'text' | 'select'
  options: string[] | null
  is_required: boolean
  is_readonly: boolean
  visible_for_student: boolean
  display_order: number
}

export default function AdminFields() {
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingField, setEditingField] = useState<Field | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    field_key: '',
    type: 'text' as 'text' | 'select',
    options: '',
    is_required: false,
    is_readonly: false,
    visible_for_student: true,
    display_order: 0,
  })

  useEffect(() => {
    loadFields()
  }, [])

  const loadFields = async () => {
    try {
      const { data, error } = await supabase
        .from('dynamic_fields')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setFields(data || [])
    } catch (error) {
      console.error('Error loading fields:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const data = {
        name: formData.name,
        field_key: formData.field_key,
        type: formData.type,
        options: formData.type === 'select' ? formData.options.split(',').map(o => o.trim()) : null,
        is_required: formData.is_required,
        is_readonly: formData.is_readonly,
        visible_for_student: formData.visible_for_student,
        display_order: formData.display_order,
      }

      if (editingField) {
        // تحديث
        const { error } = await supabase
          .from('dynamic_fields')
          .update(data)
          .eq('id', editingField.id)

        if (error) throw error
      } else {
        // إضافة جديدة
        const { error } = await supabase
          .from('dynamic_fields')
          .insert(data)

        if (error) throw error
      }

      resetForm()
      loadFields()
    } catch (error) {
      console.error('Error saving field:', error)
    }
  }

  const deleteField = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحقل؟')) return

    try {
      const { error } = await supabase
        .from('dynamic_fields')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadFields()
    } catch (error) {
      console.error('Error deleting field:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      field_key: '',
      type: 'text',
      options: '',
      is_required: false,
      is_readonly: false,
      visible_for_student: true,
      display_order: fields.length + 1,
    })
    setEditingField(null)
    setShowForm(false)
  }

  const editField = (field: Field) => {
    setEditingField(field)
    setFormData({
      name: field.name,
      field_key: field.field_key,
      type: field.type,
      options: field.options?.join(', ') || '',
      is_required: field.is_required,
      is_readonly: field.is_readonly,
      visible_for_student: field.visible_for_student,
      display_order: field.display_order,
    })
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">جاري تحميل الحقول...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">📝 إدارة الحقول الديناميكية</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'إلغاء' : '+ إضافة حقل جديد'}
        </button>
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="font-bold text-blue-900 mb-4">
            {editingField ? '✏️ تعديل حقل' : '➕ إضافة حقل جديد'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-field">اسم الحقل *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label-field">مفتاح الحقل *</label>
                <input
                  type="text"
                  value={formData.field_key}
                  onChange={(e) => setFormData({ ...formData, field_key: e.target.value })}
                  className="input-field"
                  placeholder="field_key_english"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-field">النوع</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'text' | 'select' })}
                  className="input-field"
                >
                  <option value="text">نص قصير</option>
                  <option value="select">قائمة منسدلة</option>
                </select>
              </div>
              <div>
                <label className="label-field">ترتيب العرض</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  min="1"
                />
              </div>
            </div>

            {formData.type === 'select' && (
              <div>
                <label className="label-field">الخيارات (مفصولة بفاصلة)</label>
                <input
                  type="text"
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  className="input-field"
                  placeholder="خيار 1, خيار 2, خيار 3"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  className="w-4 h-4"
                />
                مطلوب
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_readonly}
                  onChange={(e) => setFormData({ ...formData, is_readonly: e.target.checked })}
                  className="w-4 h-4"
                />
                للقراءة فقط
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.visible_for_student}
                  onChange={(e) => setFormData({ ...formData, visible_for_student: e.target.checked })}
                  className="w-4 h-4"
                />
                ظاهر للطالب
              </label>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn-success flex-1">
                {editingField ? '💾 تحديث' : '💾 حفظ'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* جدول الحقول */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-50">
              <th className="text-right p-3">#</th>
              <th className="text-right p-3">الاسم</th>
              <th className="text-right p-3">المفتاح</th>
              <th className="text-right p-3">النوع</th>
              <th className="text-right p-3">مطلوب</th>
              <th className="text-right p-3">للطالب</th>
              <th className="text-right p-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-gray-500">
                  لا توجد حقول ديناميكية
                </td>
              </tr>
            ) : (
              fields.map((field, index) => (
                <tr key={field.id} className="border-b border-gray-100 hover:bg-blue-50">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3 font-semibold">{field.name}</td>
                  <td className="p-3 text-sm" dir="ltr">{field.field_key}</td>
                  <td className="p-3 text-sm">
                    {field.type === 'text' ? 'نص' : 'قائمة'}
                  </td>
                  <td className="p-3 text-center">{field.is_required ? '✅' : '❌'}</td>
                  <td className="p-3 text-center">{field.visible_for_student ? '✅' : '❌'}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => editField(field)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => deleteField(field.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        حذف
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
