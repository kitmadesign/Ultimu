// public/auth-client.js - VERSÃO CORRIGIDA
document.addEventListener('DOMContentLoaded', function() {
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const btnLogin = document.getElementById('btn-login');
  const btnRegister = document.getElementById('btn-register');
  const toRegister = document.getElementById('to-register');
  const toLogin = document.getElementById('to-login');
  const msg = document.getElementById('msg');
  const title = document.getElementById('title');

  // Alternar entre login e registro
  toRegister.addEventListener('click', () => {
    formLogin.style.display = 'none';
    formRegister.style.display = 'block';
    title.textContent = 'Criar conta';
  });

  toLogin.addEventListener('click', () => {
    formRegister.style.display = 'none';
    formLogin.style.display = 'block';
    title.textContent = 'Entrar';
  });

  // Login
  btnLogin.addEventListener('click', async () => {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      showMessage('Preencha usuário e senha', 'error');
      return;
    }

    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await resp.json();

      if (resp.ok) {
        localStorage.setItem('rpg_token', data.token);
        showMessage('Login realizado! Redirecionando...', 'success');
        
        // ✅ CORREÇÃO: Redirecionamento inteligente
        setTimeout(() => {
          const urlParams = new URLSearchParams(window.location.search);
          const isMestre = urlParams.get('mestre') === 'true';

          if (isMestre) {
            window.location.href = '/mestre-dashboard.html';
          } else {
            window.location.href = '/dashboard.html';
          }
        }, 1000);
      } else {
        showMessage('Erro: ' + data.error, 'error');
      }
    } catch (err) {
      showMessage('Erro de conexão', 'error');
    }
  });

  // Registro
  btnRegister.addEventListener('click', async () => {
    const username = document.getElementById('reg-username').value.trim();
    const display = document.getElementById('reg-display').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!username || !password) {
      showMessage('Preencha usuário e senha', 'error');
      return;
    }

    try {
      const resp = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password, 
          displayName: display || username 
        })
      });

      const data = await resp.json();

      if (resp.ok) {
        localStorage.setItem('rpg_token', data.token);
        showMessage('Conta criada! Redirecionando...', 'success');
        
        // ✅ CORREÇÃO: Redirecionamento inteligente
        setTimeout(() => {
          const urlParams = new URLSearchParams(window.location.search);
          const isMestre = urlParams.get('mestre') === 'true';

          if (isMestre) {
            window.location.href = '/mestre-dashboard.html';
          } else {
            window.location.href = '/dashboard.html';
          }
        }, 1000);
      } else {
        showMessage('Erro: ' + data.error, 'error');
      }
    } catch (err) {
      showMessage('Erro de conexão', 'error');
    }
  });

  function showMessage(text, type) {
    msg.textContent = text;
    msg.style.display = 'block';
    msg.style.color = type === 'error' ? '#dc2626' : '#16a34a';
    setTimeout(() => { msg.style.display = 'none'; }, 4000);
  }

  // Enter key support
  document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      if (formLogin.style.display !== 'none') {
        btnLogin.click();
      } else {
        btnRegister.click();
      }
    }
  });
});