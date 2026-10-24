// ==========================================================
// lib/auth.js — نسخة محصّنة مع حماية قسرية للـ UI
// ==========================================================
window.Auth = {
  /**
   * حارس الأدمن:
   * - يخفي الصفحة فوراً قبل أي فحص (visibility:hidden + opacity:0)
   * - يعيد { user, admin } عند النجاح
   * - يعيد null ويوجّه لـ login عند الفشل
   */
  async requireAdmin() {
    document.documentElement.style.visibility = 'hidden';
    document.documentElement.style.opacity    = '0';
    document.documentElement.style.transition = 'opacity .2s ease';

    try {
      const { data: { user } } = await SB.auth.getUser();
      if (!user) return this._deny();

      const { data: admin, error } = await SB.from('admins')
        .select('id,email')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !admin) {
        try { await SB.auth.signOut(); } catch(e) {}
        return this._deny();
      }

      // كشف الصفحة بعد نجاح التحقق
      document.documentElement.style.visibility = 'visible';
      document.documentElement.style.opacity    = '1';
      return { user, admin };
    } catch (e) {
      return this._deny();
    }
  },

  _deny() {
    document.documentElement.style.visibility = 'hidden';
    location.replace('admin-login.html');
    return null;
  },

  async adminLogout() {
    try { await SB.auth.signOut(); } catch(e) {}
    sessionStorage.clear();
    location.replace('admin-login.html');
  },

  getStudentToken() {
    return sessionStorage.getItem('studentToken');
  },

  requireStudent() {
    const t = sessionStorage.getItem('studentToken');
    if (!t) { location.replace('index.html'); return null; }
    return t;
  },

  async studentLogout() {
    const t = sessionStorage.getItem('studentToken');
    if (t) {
      try { await SB.rpc('student_logout', { p_token: t }); } catch(e) {}
    }
    sessionStorage.clear();
    location.replace('index.html');
  }
};
