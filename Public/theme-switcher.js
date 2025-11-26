/* theme-switcher.js
   Switcher leve com persistência local + notificação ao servidor.
   Inclui listener para 'theme:aplicar' enviado pelo servidor.
*/
(function(){
  const themes = {
    dark: '/ui-theme-dark.css',
    minimal: '/ui-theme-minimal.css',
    dashboard: '/ui-theme-dashboard.css'
  };

  // Create UI
  const root = document.createElement('div');
  root.id = 'theme-switcher-root';
  Object.assign(root.style, {
    position: 'fixed',
    right: '14px',
    bottom: '14px',
    zIndex: 99999,
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    fontFamily: 'Inter, system-ui, -apple-system'
  });

  const btnStyle = "padding:8px 10px;border-radius:10px;border:none;cursor:pointer;font-weight:700";
  const createBtn = (text, id, bg, color) => {
    const b = document.createElement('button');
    b.innerText = text;
    b.id = id;
    b.style.cssText = btnStyle + `;background:${bg};color:${color};box-shadow:0 8px 24px rgba(2,6,23,0.08)`;
    return b;
  };

  const bDark = createBtn('Dark', 'theme-dark', '#0f1724', '#fff');
  const bMinimal = createBtn('Minimal', 'theme-min', '#fff', '#0f1724');
  const bDash = createBtn('Dashboard', 'theme-dash', '#07112a', '#fff');
  const bReset = createBtn('Reset', 'theme-reset', '#ffffff', '#0f1724');

  [bDark, bMinimal, bDash, bReset].forEach(b => root.appendChild(b));
  document.body.appendChild(root);

  function setTheme(key) {
    let link = document.getElementById('ui-theme-link');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.id = 'ui-theme-link';
      document.head.appendChild(link);
    }
    const themeHref = themes[key] || '';
    link.href = themeHref;
    if (themeHref) localStorage.setItem('ui-theme-selected', key);
    else localStorage.removeItem('ui-theme-selected');

    // Informar servidor (se conectado)
    try {
      if (window.socket && window.socket.emit) {
        window.socket.emit('theme:set', { theme: key });
      }
    } catch (e) {
      console.warn('Erro ao informar servidor sobre tema', e);
    }
  }

  bDark.addEventListener('click', ()=> setTheme('dark'));
  bMinimal.addEventListener('click', ()=> setTheme('minimal'));
  bDash.addEventListener('click', ()=> setTheme('dashboard'));
  bReset.addEventListener('click', ()=> setTheme(''));

  // Load saved theme
  const saved = localStorage.getItem('ui-theme-selected');
  if (saved && themes[saved]) setTheme(saved);

  // Listener para tema vindo do servidor
  function whenSocketReady(cb){
    if (window.socket && window.socket.on) return cb(window.socket);
    const iv = setInterval(()=> {
      if (window.socket && window.socket.on) {
        clearInterval(iv);
        cb(window.socket);
      }
    }, 250);
    setTimeout(()=> clearInterval(iv), 15000);
  }

  whenSocketReady((s) => {
    s.on('theme:aplicar', (data) => {
      if (data && data.theme) {
        setTheme(data.theme);
      }
    });
  });

  root.setAttribute('role','region');
  root.setAttribute('aria-label','Theme switcher');

  // Export small API
  window.themeSwitcher = { setTheme };
})();