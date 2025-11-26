// assets/js/jogador/pericias-defesa.js
// Robust PericiasDefesa: normaliza UI, garante container, gerencia dados e filtros.

class PericiasDefesa {
  constructor() {
    this.pericias = [];
    this.equipamentosProtecao = [];
    this._inicializado = false;
    this.carregarPericiasCompletas();
  }

  init() {
    if (this._inicializado) return;
    this._inicializado = true;
    console.log('🎯 pericias-defesa: inicializando (robusto)...');
    this.normalizarUI();
    this.setupSistemaDefesa();
    this.carregarDados();
    this.renderizarPericiasCompactas();
    this.setupFiltrosAvancados();
  }

  carregarPericiasCompletas() {
    const dadosSalvos = localStorage.getItem('dadosPericiasCompletas');
    if (dadosSalvos) {
      try { this.pericias = JSON.parse(dadosSalvos); return; } catch(e){ console.warn('dadosPericias inválidos, usando padrão'); }
    }
    this.pericias = [
      { nome: 'Acrobacia', atributo: 'agilidade', nivel: 'destreinada', penalidadeCarga: true, areaEspecial: '' },
      { nome: 'Atletismo', atributo: 'forca', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' },
      { nome: 'Crime', atributo: 'agilidade', nivel: 'destreinada', penalidadeCarga: true, areaEspecial: '' },
      { nome: 'Furtividade', atributo: 'agilidade', nivel: 'destreinada', penalidadeCarga: true, areaEspecial: '' },
      { nome: 'Luta', atributo: 'forca', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' },
      { nome: 'Pontaria', atributo: 'agilidade', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' },
      { nome: 'Reflexos', atributo: 'agilidade', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' },
      { nome: 'Pilotagem', atributo: 'agilidade', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '', requerTreinamento: true },
      { nome: 'Atualidades', atributo: 'intelecto', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' },
      { nome: 'Ciências', atributo: 'intelecto', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '', requerTreinamento: true },
      { nome: 'Investigação', atributo: 'intelecto', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' },
      { nome: 'Medicina', atributo: 'intelecto', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' },
      { nome: 'Ocultismo', atributo: 'intelecto', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '', requerTreinamento: true },
      { nome: 'Percepção', atributo: 'intelecto', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' },
      { nome: 'Profissão', atributo: 'intelecto', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '', requerTreinamento: true },
      { nome: 'Religião', atributo: 'intelecto', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '', requerTreinamento: true },
      { nome: 'Sobrevivência', atributo: 'intelecto', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' },
      { nome: 'Tática', atributo: 'intelecto', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '', requerTreinamento: true },
      { nome: 'Tecnologia', atributo: 'intelecto', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '', requerTreinamento: true },
      { nome: 'Adestramento', atributo: 'presenca', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '', requerTreinamento: true },
      { nome: 'Artes', atributo: 'presenca', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '', requerTreinamento: true },
      { nome: 'Diplomacia', atributo: 'presenca', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' },
      { nome: 'Enganação', atributo: 'presenca', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' },
      { nome: 'Intimidação', atributo: 'presenca', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' },
      { nome: 'Intuição', atributo: 'intelecto', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' },
      { nome: 'Vontade', atributo: 'presenca', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' },
      { nome: 'Fortitude', atributo: 'vigor', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' },
      { nome: 'Iniciativa', atributo: 'agilidade', nivel: 'destreinada', penalidadeCarga: false, areaEspecial: '' }
    ];
  }

  // Normaliza UI: garante 1 filtro-container e 1 pericias-container dentro do card de perícias
  normalizarUI() {
    const periciasCard = document.querySelector('.card[data-card-id="pericias"]');
    const allFiltroNodes = Array.from(document.querySelectorAll('.filtro-pericias-container'));
    const allPericiasContainerNodes = Array.from(document.querySelectorAll('#pericias-container, .pericias-container, .pericias-container-unificado'));

    if (periciasCard) {
      const cardBody = periciasCard.querySelector('.card-body') || periciasCard;

      // Move ou cria filtro-pericias-container dentro do card
      let filtroInCard = periciasCard.querySelector('.filtro-pericias-container');
      if (!filtroInCard && allFiltroNodes.length > 0) {
        const nodeToMove = allFiltroNodes[0];
        try { cardBody.insertBefore(nodeToMove, cardBody.firstChild); filtroInCard = nodeToMove; }
        catch(e) { const clone = nodeToMove.cloneNode(true); cardBody.insertBefore(clone, cardBody.firstChild); filtroInCard = clone; }
      }
      if (!filtroInCard) {
        const fragment = document.createElement('div');
        fragment.className = 'filtro-pericias-container';
        fragment.innerHTML = `
          <div class="busca-pericias">
            <div class="input-group">
              <span class="input-group-text"><i class="fas fa-search"></i></span>
              <input type="text" id="busca-pericia" class="form-control" placeholder="Buscar perícia...">
            </div>
          </div>
          <div class="filtro-pericias">
            <select id="filtro-pericias" class="form-select">
              <option value="todas">Todas</option>
              <option value="destreinada">Destreinada</option>
              <option value="treinada">Treinada</option>
              <option value="veterana">Veterana</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div class="contador-pericias" id="contador-pericias">Mostrando 0 de 0 perícias</div>
        `;
        cardBody.insertBefore(fragment, cardBody.firstChild);
        filtroInCard = fragment;
      }

      // Remove duplicatas externas
      allFiltroNodes.forEach(node => { if (!periciasCard.contains(node) && node !== filtroInCard) node.remove(); });

      // Ensure pericias container and grid
      let periciasContainer = cardBody.querySelector('#pericias-container') || cardBody.querySelector('.pericias-container') || cardBody.querySelector('.pericias-container-unificado');
      if (!periciasContainer) {
        periciasContainer = document.createElement('div');
        periciasContainer.id = 'pericias-container';
        periciasContainer.className = 'pericias-container compacto';
        periciasContainer.innerHTML = '<div id="pericias-grid" class="pericias-grid-quadrados"></div>';
        cardBody.appendChild(periciasContainer);
      } else {
        if (!periciasContainer.querySelector('#pericias-grid')) {
          const grid = document.createElement('div');
          grid.id = 'pericias-grid';
          grid.className = 'pericias-grid-quadrados';
          periciasContainer.appendChild(grid);
        }
      }

      // Remove containers fora do card
      allPericiasContainerNodes.forEach(node => { if (!periciasCard.contains(node) && node !== periciasContainer) node.remove(); });

    } else {
      // fallback global: keep one
      if (allFiltroNodes.length > 1) allFiltroNodes.slice(1).forEach(n => n.remove());
      let globalContainer = document.getElementById('pericias-container') || document.querySelector('.pericias-container, .pericias-container-unificado');
      if (!globalContainer) {
        const main = document.querySelector('main, .container, body') || document.body;
        const wrapper = document.createElement('div');
        wrapper.id = 'pericias-container';
        wrapper.className = 'pericias-container compacto pericias-section-fallback';
        wrapper.innerHTML = '<div id="pericias-grid" class="pericias-grid-quadrados"></div>';
        main.appendChild(wrapper);
      } else {
        if (!globalContainer.querySelector('#pericias-grid')) {
          const grid = document.createElement('div');
          grid.id = 'pericias-grid';
          grid.className = 'pericias-grid-quadrados';
          globalContainer.appendChild(grid);
        }
      }
      allPericiasContainerNodes.slice(1).forEach(n => n.remove());
    }
  }

  renderizarPericiasCompactas() {
    const grid = document.querySelector('#pericias-grid');
    if (!grid) { console.warn('pericias-defesa: #pericias-grid não encontrado'); return; }
    grid.innerHTML = '';
    this.pericias.forEach((p,i) => grid.appendChild(this.criarPericiaCompacta(p,i)));
    this.atualizarContador();
  }

  criarPericiaCompacta(pericia,index) {
    const el = document.createElement('div');
    el.className = `pericia-compacta pericia-${pericia.nivel}`;
    el.dataset.index = index;
    if (pericia.penalidadeCarga) el.classList.add('pericia-penalidade-carga');
    if (pericia.requerTreinamento) el.classList.add('pericia-requer-treinamento');

    const modificador = this.calcularModificadorPericia(pericia);
    el.innerHTML = `
      <select class="form-select form-select-sm pericia-nivel-compacto">
        <option value="destreinada" ${pericia.nivel === 'destreinada' ? 'selected' : ''}>Destreinada</option>
        <option value="treinada" ${pericia.nivel === 'treinada' ? 'selected' : ''}>Treinada</option>
        <option value="veterana" ${pericia.nivel === 'veterana' ? 'selected' : ''}>Veterana</option>
        <option value="expert" ${pericia.nivel === 'expert' ? 'selected' : ''}>Expert</option>
      </select>
      <span class="pericia-nome-compacto">${pericia.nome}</span>
      <span class="pericia-atributo-compacto">${this.formatarAtributo(pericia.atributo)}</span>
      <span class="pericia-modificador-compacto">${modificador >= 0 ? '+' : ''}${modificador}</span>
      ${pericia.nome === 'Ciências' || pericia.nome === 'Profissão' ? 
        `<input type="text" class="form-control form-control-sm area-especial-input" placeholder="Área" value="${pericia.areaEspecial || ''}" style="width: 80px; font-size: 0.7rem; margin-top:0.12rem;">` : ''
      }
      <button class="pericia-status-btn" data-index="${index}" title="Status">${this.obterIconeStatus(pericia.nivel)}</button>
    `;
    this.configurarEventosPericiaCompacta(el,index);
    return el;
  }

  configurarEventosPericiaCompacta(element,index) {
    const selectNivel = element.querySelector('.pericia-nivel-compacto');
    if (selectNivel) selectNivel.addEventListener('change', e => this.mudarNivelPericia(index,e.target.value));
    const areaInput = element.querySelector('.area-especial-input');
    if (areaInput) areaInput.addEventListener('input', e => this.mudarAreaEspecial(index,e.target.value));
    const btnStatus = element.querySelector('.pericia-status-btn');
    if (btnStatus) btnStatus.addEventListener('click', e => { e.stopPropagation(); this.avancarStatus(index); });
  }

  mudarNivelPericia(index, novoNivel) { this.pericias[index].nivel = novoNivel; this.salvarDadosPericias(); this.renderizarPericiasCompactas(); }
  avancarStatus(index) { const niveis=['destreinada','treinada','veterana','expert']; const p=this.pericias[index]; const i=niveis.indexOf(p.nivel); p.nivel=niveis[(i+1)%niveis.length]; this.salvarDadosPericias(); this.renderizarPericiasCompactas(); }

  obterIconeStatus(nivel) {
    const icones = { 'destreinada':'○','treinada':'◔','veterana':'◑','expert':'●' };
    return icones[nivel] || '○';
  }

  calcularModificadorPericia(pericia) {
    const modAtributo = this.obterModificadorAtributo(pericia.atributo);
    let bonus = modAtributo;
    switch(pericia.nivel) { case 'treinada': bonus+=5; break; case 'veterana': bonus+=10; break; case 'expert': bonus+=15; break; }
    return bonus;
  }

  obterModificadorAtributo(atributo) {
    const input = document.getElementById(atributo);
    if (!input) return 0;
    const valor = parseInt(input.value) || 0;
    return Math.floor((valor - 1) / 2);
  }

  formatarAtributo(atributo) {
    const nomes = { 'forca':'For','agilidade':'Agi','intelecto':'Int','vigor':'Vig','presenca':'Pre' };
    return nomes[atributo] || atributo;
  }

  mudarAreaEspecial(index, area) { this.pericias[index].areaEspecial = area; this.salvarDadosPericias(); }

  setupFiltrosAvancados() {
    const filtro = document.getElementById('filtro-pericias');
    if (filtro) {
      try {
        const newFiltro = filtro.cloneNode(true);
        filtro.parentNode.replaceChild(newFiltro,filtro);
        newFiltro.addEventListener('change', e => this.aplicarFiltroAvancado(e.target.value));
      } catch(e){ filtro.addEventListener('change', e => this.aplicarFiltroAvancado(e.target.value)); }
    }
    const busca = document.getElementById('busca-pericia');
    if (busca) {
      try {
        const newBusca = busca.cloneNode(true);
        busca.parentNode.replaceChild(newBusca,busca);
        newBusca.addEventListener('input', e => this.filtrarPorBusca(e.target.value));
      } catch(e){ busca.addEventListener('input', e => this.filtrarPorBusca(e.target.value)); }
    }
    this.atualizarContador();
  }

  aplicarFiltroAvancado(filtro) {
    const nodes = document.querySelectorAll('.pericia-compacta, .pericia-quadrado');
    nodes.forEach(node => {
      const idx = node.dataset.index;
      const p = this.pericias[idx];
      let mostrar = true;
      switch(filtro) {
        case 'todas': mostrar = true; break;
        case 'destreinada': mostrar = p.nivel === 'destreinada'; break;
        case 'treinada': mostrar = p.nivel === 'treinada'; break;
        case 'veterana': mostrar = p.nivel === 'veterana'; break;
        case 'expert': mostrar = p.nivel === 'expert'; break;
        case 'penalidade-carga': mostrar = !!p.penalidadeCarga; break;
        case 'requer-treinamento': mostrar = !!p.requerTreinamento; break;
        default: mostrar = true;
      }
      node.style.display = mostrar ? 'flex' : 'none';
    });
    this.atualizarContador();
  }

  filtrarPorBusca(term) {
    const termo = (term||'').toLowerCase();
    const nodes = document.querySelectorAll('.pericia-compacta, .pericia-quadrado');
    let vis=0;
    nodes.forEach(node => {
      const nome = (node.querySelector('.pericia-nome-compacto, .pericia-nome')?.textContent || '').toLowerCase();
      const ok = nome.includes(termo);
      node.style.display = ok ? 'flex' : 'none';
      if (ok) vis++;
    });
    this.atualizarContador(vis);
  }

  atualizarContador(visiveis=null) {
    const contador = document.getElementById('contador-pericias');
    if (!contador) return;
    const total = this.pericias.length;
    const mostrando = (visiveis!==null) ? visiveis : total;
    contador.textContent = `Mostrando ${mostrando} de ${total} perícias`;
  }

  setupSistemaDefesa() {
    const agilidadeInput = document.getElementById('agilidade');
    if (agilidadeInput) agilidadeInput.addEventListener('input', () => this.atualizarDefesa());
    this.atualizarDefesa();
  }

  atualizarDefesa() {
    const agilidade = parseInt(document.getElementById('agilidade')?.value) || 0;
    const protecao = this.calcularProtecaoTotal();
    const defesa = 10 + agilidade + protecao;
    const defesaTotalInput = document.getElementById('defesa-total');
    if (defesaTotalInput) defesaTotalInput.value = defesa;
    const protecaoSpan = document.getElementById('protecao-total');
    if (protecaoSpan) protecaoSpan.textContent = protecao;
  }

  calcularProtecaoTotal() {
    let protecao = 0;
    this.equipamentosProtecao = [{ nome:'Colete Leve', protecao:2 }, { nome:'Capacete', protecao:1 }];
    this.equipamentosProtecao.forEach(e => protecao += e.protecao);
    return protecao;
  }

  salvarDadosPericias() { localStorage.setItem('dadosPericiasCompletas', JSON.stringify(this.pericias)); }
  carregarDados() { const dados = localStorage.getItem('dadosPericiasCompletas'); if (dados) this.pericias = JSON.parse(dados); }
}

// Inicialização segura: expõe instance em window e chama init quando DOM pronto
document.addEventListener('DOMContentLoaded', () => {
  // create or reuse global instance
  if (!window.periciasDefesa) window.periciasDefesa = new PericiasDefesa();
  // small delay to ensure other markup/scripts ran
  setTimeout(() => window.periciasDefesa.init(), 60);
});