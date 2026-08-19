// build.js - يتم تشغيله في Vercel أثناء النشر
const fs = require('fs')
const path = require('path')

// قراءة المفاتيح من البيئة
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

// 🔍 تشخيص: نعرض معلومات مفيدة من غير ما نكشف القيم السرية بالكامل
console.log('🔍 VERCEL_ENV:', process.env.VERCEL_ENV)
console.log('🔍 VERCEL_GIT_COMMIT_REF (البرانش):', process.env.VERCEL_GIT_COMMIT_REF)
console.log('🔍 كل الـ Environment Variables اللي فيها كلمة SUPABASE:')
Object.keys(process.env)
    .filter(k => k.toUpperCase().includes('SUPABASE'))
    .forEach(k => console.log('   -', k, '=', process.env[k] ? `موجود (${process.env[k].length} حرف)` : 'فاضي'))

console.log('🔐 Building with Supabase URL:', SUPABASE_URL ? 'موجود ✅' : 'مفقود ❌ (undefined)')

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌❌❌ خطأ فادح: المتغيرات دي مش وصلة للـ Build. راجع Environment Variables في Vercel.')
    process.exit(1)
}

// قائمة الملفات التي تحتاج إلى تعويض المفاتيح
const files = [
    'index.html',
    'student-form.html',
    'student-pdf.html',
    'admin-login.html',
    'admin-dashboard.html',
    'admin-students.html',
    'admin-student-detail.html',
    'admin-fields.html',
    'admin-import-export.html'
]

files.forEach(file => {
    const filePath = path.join(__dirname, file)
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8')
        content = content.replace(/\{\{SUPABASE_URL\}\}/g, SUPABASE_URL || '')
        content = content.replace(/\{\{SUPABASE_ANON_KEY\}\}/g, SUPABASE_ANON_KEY || '')
        fs.writeFileSync(filePath, content)
        console.log(`✅ Updated ${file}`)
    } else {
        console.log(`⚠️ File not found: ${file}`)
    }
})

console.log('✅ Build completed successfully!')
