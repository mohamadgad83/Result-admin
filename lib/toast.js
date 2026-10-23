window.Toast = {
  show(msg, type = 'success', ms = 3500) {
    let c = document.getElementById('__tc');
    if (!c) {
      c = document.createElement('div'); c.id = '__tc';
      c.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;max-width:420px;';
      document.body.appendChild(c);
    }
    const colors = { success: '#28a745', error: '#dc3545', info: '#17a2b8', warn: '#ffc107' };
    const t = document.createElement('div');
    t.style.cssText = `padding:13px 22px;border-radius:12px;color:${type==='warn'?'#333':'#fff'};
      font-weight:600;box-shadow:0 4px 14px rgba(0,0,0,.2);background:${colors[type]||colors.success};font-size:14px;
      transition:opacity .3s;`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, ms);
  }
};
