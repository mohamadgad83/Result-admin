window.Auth = {
  async requireAdmin() {
    const { data: { user } } = await SB.auth.getUser();
    if (!user) { location.href = 'admin-login.html'; return null; }
    const { data: admin } = await SB.from('admins').select('id,email').eq('id', user.id).maybeSingle();
    if (!admin) { await SB.auth.signOut(); location.href = 'admin-login.html'; return null; }
    return { user, admin };
  },
  async adminLogout() { await SB.auth.signOut(); sessionStorage.clear(); location.href = 'admin-login.html'; },
  getStudentToken() { return sessionStorage.getItem('studentToken'); },
  requireStudent() {
    const t = sessionStorage.getItem('studentToken');
    if (!t) { location.href = 'index.html'; return null; }
    return t;
  },
  async studentLogout() {
    const t = sessionStorage.getItem('studentToken');
    if (t) try { await SB.rpc('student_logout', { p_token: t }); } catch(e) {}
    sessionStorage.clear();
    location.href = 'index.html';
  }
};
