// ==========================================================
// lib/validate.js — التحقق الرياضي من الرقم القومي المصري
// ==========================================================
window.Validation = {
  /**
   * التحقق من الرقم القومي المصري (14 رقم)
   *  - خانة 1: 2 (1900s) أو 3 (2000s)
   *  - خانتان 2-3: السنة
   *  - خانتان 4-5: الشهر (01-12)
   *  - خانتان 6-7: اليوم (01-31) مع التحقق من صحة التاريخ
   *  - خانتان 8-9: كود المحافظة
   *  - خانة 13: النوع (فردي=ذكر، زوجي=أنثى)
   *  - خانة 14: رقم تحقق (لا يمكن التحقق رياضياً بدون خوارزمية رسمية)
   */
  egyptianNationalId(id) {
    const s = String(id || '').trim();

    if (!/^\d{14}$/.test(s))
      return { valid: false, error: 'يجب أن يتكون الرقم القومي من 14 رقماً فقط' };

    const century = s[0];
    if (century !== '2' && century !== '3')
      return { valid: false, error: 'الرقم الأول يجب أن يكون 2 (مواليد 1900s) أو 3 (مواليد 2000s)' };

    const yy = parseInt(s.substr(1, 2), 10);
    const mm = parseInt(s.substr(3, 2), 10);
    const dd = parseInt(s.substr(5, 2), 10);

    if (mm < 1 || mm > 12)
      return { valid: false, error: 'الشهر (خانتان 3-4) غير صحيح' };
    if (dd < 1 || dd > 31)
      return { valid: false, error: 'اليوم (خانتان 5-6) غير صحيح' };

    const fullYear = century === '2' ? 1900 + yy : 2000 + yy;
    const birth = new Date(fullYear, mm - 1, dd);

    if (birth.getFullYear() !== fullYear ||
        birth.getMonth()    !== mm - 1 ||
        birth.getDate()     !== dd)
      return { valid: false, error: 'تاريخ الميلاد غير موجود (تحقق من الشهر واليوم)' };

    if (birth > new Date())
      return { valid: false, error: 'تاريخ الميلاد في المستقبل' };

    // أكواد المحافظات المعتمدة
    const validGovCodes = new Set([
      '01','02','03','04',
      '11','12','13','14','15','16','17','18','19',
      '21','22','23','24','25','26','27','28','29',
      '31','32','33','34','35',
      '88'  // خارج مصر
    ]);

    const gov = s.substr(7, 2);
    if (!validGovCodes.has(gov))
      return { valid: false, error: 'كود المحافظة (خانتان 8-9) غير صحيح' };

    const gender = parseInt(s[12], 10) % 2 === 1 ? 'ذكر' : 'أنثى';

    return {
      valid: true,
      meta: {
        birthDate: birth,
        gender,
        governorate: gov
      }
    };
  }
};
