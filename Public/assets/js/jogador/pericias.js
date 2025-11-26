// assets/js/jogador/pericias.js
// PericiasQuadradas: renderiza quadrados dentro de #pericias-grid, espera por window.periciasDefesa de forma tolerante

class PericiasQuadradas {
  constructor(sistemaPericias) {
    this.sistema = sistemaPericias;
    this._inicializado = false;
    this.init();
  }

  init() {
    if (this._inicializado) return;
    if (!this.sistema) {
      console.warn('PericiasQuadradas: sistema não fornecido');
      return;
    }
    this._inicializado = true;
    this.ensureGridAndRender();
    this.observarMudancasAtributos();
    this.setupBusca(); // conecta ao input existente (id busca-pericia)
  }

  ensureGridAndRender() {
    const container = document.getElementById('pericias-container');
    if (!container) {
      console.warn('PericiasQuadradas: pericias-container não encontrado (abort render)');
      return;
    }
    let grid = container.querySelector('#pericias-grid');
    if (!grid) {
      grid = document.createElement('div');
      grid.id = 'pericias-grid';
      grid.className = 'pericias-grid-quadrados';
      container.appendChild(grid);
    }
    this.renderizarPericiasQuadradas();
  }

  renderizarPericiasQuadradas() {
    const grid = document.getElementById('pericias-grid');
    if (!grid) return;
    grid.innerHTML = '';
    (this.sistema.pericias || []).forEach((p,i) => grid.appendChild(this.criarQuadradoPericia(p,i)));
    this.atualizarContador();
  }

  criarQuadradoPericia(pericia,index) {
    const quadrado = document.createElement('div');
    quadrado.className = `pericia-quadrado pericia-${pericia.nivel}`;
    quadrado.dataset.index = index;

    const modificador = (typeof this.sistema.calcularModificadorPericia === 'function') ?
      this.sistema.calcularModificadorPericia(pericia) : 0;

    const temArea = pericia.nome === 'Ciências' || pericia.nome === 'Profissão';
    const simbolosHTML = this.gerarSimbolos(pericia);

    quadrado.innerHTML = `
      <div class="pericia-cabecalho"><span class="pericia-atributo">${this.sistema.formatarAtributo(pericia.atributo)}</span></div>
      <div class="pericia-bonus" data-index="${index}">${modificador >= 0 ? '+' : ''}${modificador}</div>
      <div class="pericia-nome">${pericia.nome}${simbolosHTML}</div>
      ${temArea ? `<input type="text" class="pericia-area" placeholder="${pericia.nome==='Ciências'?'área':'profissão'}" value="${pericia.areaEspecial || ''}" data-index="${index}">` : ''}
      <button class="pericia-status-btn" data-index="${index}" title="Clique para mudar status">${this.obterIconeStatus(pericia.nivel)}</button>
    `;
    this.configurarEventosQuadrado(quadrado,index);
    return quadrado;
  }

  gerarSimbolos(pericia) {
    let s = '';
    if (pericia.penalidadeCarga) s += `<span class="pericia-simbolo ativo" title="Penalidade de carga">⁂</span>`;
    if (pericia.requerTreinamento) s += `<span class="pericia-simbolo ativo" title="Requer treinamento">✔</span>`;
    if (pericia.nome === 'Ciências' || pericia.nome === 'Profissão') s += `<span class="pericia-simbolo ativo" title="Área especial">✎</span>`;
    return s ? `<span class="pericia-simbolos">${s}</span>` : '';
  }

  obterIconeStatus(nivel) {
    const icones = { 'destreinada':'○','treinada':'◔','veterana':'◑','expert':'●' };
    return icones[nivel] || '○';
  }

  configurarEventosQuadrado(quadrado,index) {
    const btn = quadrado.querySelector('.pericia-status-btn');
    if (btn) btn.addEventListener('click', e => { e.stopPropagation(); this.avancarStatus(index); });

    const bonus = quadrado.querySelector('.pericia-bonus');
    if (bonus) bonus.addEventListener('dblclick', () => this.iniciarEdicaoBonus(index, bonus));

    const area = quadrado.querySelector('.pericia-area');
    if (area) {
      area.addEventListener('input', e => { if (typeof this.sistema.mudarAreaEspecial === 'function') this.sistema.mudarAreaEspecial(index,e.target.value); });
      area.addEventListener('focus', () => quadrado.style.borderColor = 'var(--primary-color)');
      area.addEventListener('blur', () => quadrado.style.borderColor = '');
    }

    quadrado.addEventListener('click', e => { if (![btn,bonus,area].includes(e.target)) quadrado.focus(); });
  }

  avancarStatus(index) {
    const niveis=['destreinada','treinada','veterana','expert'];
    const p = this.sistema.pericias[index];
    const i = niveis.indexOf(p.nivel);
    p.nivel = niveis[(i+1)%niveis.length];
    if (typeof this.sistema.mudarNivelPericia === 'function') this.sistema.mudarNivelPericia(index,p.nivel);
    this.renderizarPericiasQuadradas();
  }

  iniciarEdicaoBonus(index,elemento) {
    const valorAtual = elemento.textContent.replace('+','');
    const input = document.createElement('input');
    input.type = 'number';
    input.value = valorAtual;
    input.className = 'pericia-bonus editando';
    input.style.width = '100%';
    elemento.replaceWith(input);
    input.focus();
    const finalizar = () => {
      const novo = parseInt(input.value)||0;
      const div = document.createElement('div');
      div.className = 'pericia-bonus';
      div.textContent = `${novo>=0?'+':''}${novo}`;
      input.replaceWith(div);
    };
    input.addEventListener('blur', finalizar);
    input.addEventListener('keypress', e => { if (e.key==='Enter') finalizar(); });
  }

  setupBusca() {
    const busca = document.getElementById('busca-pericia');
    if (!busca) return;
    // ensure only one listener
    busca.removeAttribute('data-listener-attached');
    busca.addEventListener('input', e => {
      const termo = e.target.value.toLowerCase();
      const items = document.querySelectorAll('.pericia-compacta, .pericia-quadrado');
      let vis = 0;
      items.forEach(it => {
        const nome = (it.querySelector('.pericia-nome, .pericia-nome-compacto')?.textContent || '').toLowerCase();
        const show = nome.includes(termo);
        it.style.display = show ? 'flex' : 'none';
        if (show) vis++;
      });
      this.atualizarContador(vis);
    });
  }

  observarMudancasAtributos() {
    const attrs = ['forca','agilidade','intelecto','vigor','presenca'];
    attrs.forEach(a => {
      const el = document.getElementById(a);
      if (el) el.addEventListener('input', () => this.atualizarTodosBonus());
    });
  }

  atualizarTodosBonus() {
    this.sistema.pericias.forEach((p,i) => {
      const el = document.querySelector(`.pericia-bonus[data-index="${i}"]`);
      if (el && !el.hasAttribute('data-editado')) {
        const mod = (typeof this.sistema.calcularModificadorPericia==='function') ? this.sistema.calcularModificadorPericia(p) : 0;
        el.textContent = `${mod>=0?'+':''}${mod}`;
      }
    });
  }

  atualizarContador(visiveis=null) {
    const contador = document.getElementById('contador-pericias');
    if (!contador) return;
    const total = (this.sistema.pericias || []).length;
    const mostrando = (visiveis !== null) ? visiveis : total;
    contador.textContent = `Mostrando ${mostrando} de ${total} perícias`;
  }
}

// Inicialização tolerante: espera por periciasDefesa e cria PericiasQuadradas
(function bootPericiasQuadradas(){
  function tryInit() {
    if (window.periciasQuadradas) return;
    if (window.periciasDefesa) {
      window.periciasQuadradas = new PericiasQuadradas(window.periciasDefesa);
      console.log('🔲 PericiasQuadradas inicializado');
      return true;
    }
    return false;
  }
  if (!tryInit()) {
    const maxWait = 3000; // ms
    const interval = 100;
    let waited = 0;
    const id = setInterval(() => {
      if (tryInit() || (waited >= maxWait)) {
        clearInterval(id);
      }
      waited += interval;
    }, interval);
  }
})();