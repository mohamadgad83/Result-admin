// قائمة الحقول الأساسية القابلة لطلب التعديل
window.CORE_EDITABLE_FIELDS = [
  { key: 'full_name', label: 'الاسم', getter: s => s.full_name },
  { key: 'grade', label: 'الصف', getter: s => s.grade },
  { key: 'enrollment_status', label: 'حالة القيد', getter: s => s.enrollment_status },
  { key: 'gender', label: 'النوع', getter: s => s.gender },
  { key: 'date_of_birth', label: 'تاريخ الميلاد', getter: s => s.date_of_birth }
];

// بناء قائمة الحقول القابلة لطلب التعديل (أساسية + ديناميكية للقراءة فقط)
window.buildEditableFieldsList = function(student, dynamicFields, dynamicValues) {
  const list = [];

  // الأساسية
  CORE_EDITABLE_FIELDS.forEach(f => {
    list.push({
      key: f.key,
      label: f.label,
      target_type: 'core',
      field_id: null,
      old_value: f.getter(student) || ''
    });
  });

  // الديناميكية (فقط للقراءة فقط)
  (dynamicFields || []).filter(f => f.is_readonly).forEach(f => {
    list.push({
      key: f.field_key,
      label: f.name,
      target_type: 'dynamic',
      field_id: f.id,
      old_value: (dynamicValues[f.id] || '').toString()
    });
  });

  return list;
};
