// Lightweight UI enhancements: toasts, autosave badge, audio overlay
(function(){
  // Create containers
  const toastContainer = document.createElement('div');
  toastContainer.className = 'ui-toast-container';
  document.body.appendChild(toastContainer);

  const autosaveBadge = document.createElement('div');
  autosaveBadge.className = 'ui-autosave-badge';
  autosaveBadge.id = 'ui-autosave-badge';
  autosaveBadge.innerHTML = '<span id="autosave-icon">✎</span><span id="autosave-text">Conectando…</span>';
  document.body.appendChild(autosaveBadge);

  // Audio overlay
  const audioOverlay = document.createElement('div');
  audioOverlay.className = 'ui-audio-overlay';
  audioOverlay.id = 'ui-audio-overlay';
  audioOverlay.innerHTML = `
    <div class="title">🎵 Áudio recebido</div>
    <div class="metadata" id="ui-audio-meta" style="color:#555;margin-bottom:8px"></div>
    <div class="controls">
      <audio id="ui-audio-player" controls style="width:100%"></audio>
      <button id="ui-audio-close" class="hit-target" style="margin-left:8px">Fechar</button>
    </div>
  `;
  document.body.appendChild(audioOverlay);

  document.getElementById('ui-audio-close').addEventListener('click', () => {
    audioOverlay.classList.remove('show');
    const player = document.getElementById('ui-audio-player');
    player.pause();
  });

  // Toast API
  function showToast(title, msg, type = 'info', timeout = 4500) {
    const t = document.createElement('div');
    t.className = `ui-toast ${type}`;
    t.innerHTML = `
      <div class="icon">${ type === 'success' ? '✓' : (type === 'error' ? '✖' : 'i') }</div>
      <div class="body"><div class="title">${title}</div><div class="msg">${msg}</div></div>
      <div class="close" aria-label="Fechar">✕</div>
    `;
    const close = t.querySelector('.close');
    close.addEventListener('click', () => { t.classList.remove('show'); setTimeout(()=>t.remove(), 220); });

    toastContainer.prepend(t);
    // animate
    requestAnimationFrame(()=> t.classList.add('show'));

    if (timeout > 0) {
      setTimeout(()=> {
        t.classList.remove('show');
        setTimeout(()=> t.remove(), 220);
      }, timeout);
    }
  }

  // Autosave badge states
  let autosaveTimer = null;
  function setAutosaveState(state, text) {
    const badge = document.getElementById('ui-autosave-badge');
    badge.classList.remove('saving','saved','error','idle');
    if (state) badge.classList.add(state);
    if (text) badge.querySelector('#autosave-text').textContent = text;
  }

  // Hook on inputs within ficha to show "editing" -> "salvando" states
  const autoFieldsSelector = [
    '#ficha-nome','#ficha-origem','#ficha-classe','#ficha-nex','#ficha-nivel',
    '#atr-for','#atr-agi','#atr-int','#atr-vig','#atr-pre',
    '#pv-atual','#san-atual','#pe-atual',
    '#descricao-fisica','#historia-personalidade','#anotacoes-jogador'
  ].join(',');
  function bindInputAutosaveHints() {
    const elems = document.querySelectorAll(autoFieldsSelector);
    elems.forEach(el => {
      el.addEventListener('input', () => {
        setAutosaveState('saving','Salvando…');
        // debounce to show saving (the actual save is handled in jogador.js)
        clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(()=> {
          // if server-confirmation not arrived, keep as "salvando..."
        }, 600);
      });
    });
  }
  // Attempt bind now; jogador.html may load fields later, so add a retry
  let bindAttempts = 0;
  function tryBind() {
    bindInputAutosaveHints();
    bindAttempts++;
    if (document.querySelectorAll(autoFieldsSelector).length === 0 && bindAttempts < 10) {
      setTimeout(tryBind, 300);
    }
  }
  tryBind();

  // Wait for socket availability to listen for 'ficha:salva' and 'audio:tocar'
  function whenSocketReady(cb){
    if (window.socket && window.socket.on) return cb(window.socket);
    const iv = setInterval(()=> {
      if (window.socket && window.socket.on) {
        clearInterval(iv);
        cb(window.socket);
      }
    }, 250);
    // timeout fallback
    setTimeout(()=> clearInterval(iv), 15000);
  }

  whenSocketReady((s) => {
    setAutosaveState('idle','Conectado');

    s.on('ficha:salva', (d) => {
      setAutosaveState('saved','Ficha salva ✓');
      showToast('Ficha salva', 'Sua ficha foi salva no servidor', 'success', 3000);
      // auto-hide "salvo" after a short while
      setTimeout(()=> setAutosaveState('idle','Conectado'), 3000);
    });

    s.on('fichas:atualizar', (d) => {
      showToast('Fichas atualizadas', 'Lista de fichas recebida do Mestre', 'info', 2800);
    });

    s.on('audio:tocar', (data) => {
      // show overlay with audio preview & call the existing audio element too
      const meta = document.getElementById('ui-audio-meta');
      const player = document.getElementById('ui-audio-player');
      meta.textContent = data.nome ? data.nome : 'Áudio do Mestre';
      player.src = data.url;
      player.volume = typeof data.volume === 'number' ? data.volume : 1.0;
      document.getElementById('ui-audio-overlay').classList.add('show');
      showToast('Áudio recebido', data.nome || 'Áudio do Mestre', 'info', 5000);
    });

    s.on('audio:parar', () => {
      const player = document.getElementById('ui-audio-player');
      player.pause();
      player.currentTime = 0;
      showToast('Áudio', 'Áudio parado pelo Mestre', 'info', 1800);
    });

    s.on('mensagem:receber', (msg) => {
      showToast('Mensagem', msg.texto || 'Nova mensagem', 'info', 3500);
    });

    s.on('register:success', (d) => {
      setAutosaveState('idle','Conectado');
      showToast('Conectado', `Você está conectado como ${d.role}`, 'success', 2200);
    });

    s.on('disconnect', () => {
      setAutosaveState('error','Desconectado');
      showToast('Conexão', 'Desconectado do servidor', 'error', 4000);
    });

    // handle ficha save errors if server emits one (optional)
    s.on('ficha:salva:erro', (err) => {
      setAutosaveState('error','Erro ao salvar');
      showToast('Erro', err?.message || 'Falha ao salvar ficha', 'error', 4500);
    });
  });

  // Expose helper to global (optional)
  window.UIEnhancements = {
    showToast, setAutosaveState
  };

})();