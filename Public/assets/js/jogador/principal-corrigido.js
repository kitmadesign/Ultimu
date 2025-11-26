// =========================================================
// principal-corrigido.js - Correções completas da aba principal
// =========================================================

class PrincipalCorrigido {
    constructor() {
        this.pericias = [];
        this.secoesEstado = {};
        this.init();
    }

    // INICIALIZAÇÃO
    init() {
        console.log('🔧 Sistema corrigido da aba principal iniciado!');
        this.setupSeccionesFuncionais();
        this.setupRecursosCorrigidos();
        this.setupAtributosD20();
        this.carregarPericias4Niveis();
        this.carregarEstado();
    }

    // CONFIGURAR SEÇÕES EXPANSÍVEIS FUNCIONAIS
// Substitua apenas a função setupSeccionesFuncionais por esta versão segura.
// (Cole no arquivo principal onde a função existe, substituindo a implementação antiga)

setupSeccionesFuncionais() {
    // Botão expandir/recolher tudo — só conecta se element existir
    const toggleTodosBtn = document.getElementById('toggle-todos');
    if (toggleTodosBtn) {
        toggleTodosBtn.addEventListener('click', () => {
            this.toggleTodasSecciones();
        });
    } else {
        console.warn('principal-corrigido: #toggle-todos não encontrado — listener não conectado.');
    }

    // Controles de seção individual ('.toggle-secao') — verifica se existem
    const toggles = document.querySelectorAll('.toggle-secao');
    if (toggles && toggles.length) {
        toggles.forEach(boton => {
            boton.addEventListener('click', (e) => {
                const seccion = e.target.closest('.seccionavel');
                if (seccion) this.toggleSeccion(seccion);
            });
        });
    } else {
        console.info('principal-corrigido: nenhum .toggle-secao encontrado no DOM (ok se intenção é dinâmica).');
    }

    // Botões reset — verifica se há elementos antes de conectar
    const resets = document.querySelectorAll('.btn-reset');
    if (resets && resets.length) {
        resets.forEach(boton => {
            boton.addEventListener('click', (e) => {
                const campo = boton.dataset.campo;
                if (campo) this.resetarCalculos(campo);
            });
        });
    }
}

    // EXPANDIR TODAS AS SEÇÕES (ESTADO INICIAL)
    expandirTodasSecciones() {
        document.querySelectorAll('.seccionavel').forEach(secao => {
            secao.classList.remove('recolhida');
        });
        
        document.getElementById('toggle-todos').innerHTML = '<i class="fas fa-compress"></i> Recolher Tudo';
    }

    // ALTERNAR UMA SEÇÃO
    toggleSecao(secao) {
        secao.classList.toggle('recolhida');
        this.salvarEstadoSecoes();
    }

    // ALTERNAR TODAS AS SEÇÕES
    toggleTodasSecciones() {
        const secoes = document.querySelectorAll('.seccionavel');
        const todasRecolhidas = Array.from(secoes).every(s => s.classList.contains('recolhida'));
        
        secoes.forEach(secao => {
            if (todasRecolhidas) {
                secao.classList.remove('recolhida');
            } else {
                secao.classList.add('recolhida');
            }
        });
        
        const botao = document.getElementById('toggle-todos');
        if (todasRecolhidas) {
            botao.innerHTML = '<i class="fas fa-compress"></i> Recolher Tudo';
        } else {
            botao.innerHTML = '<i class="fas fa-expand"></i> Expandir Tudo';
        }
        
        this.salvarEstadoSecoes();
    }

    // CONFIGURAR RECURSOS CORRIGIDOS
    setupRecursosCorrigidos() {
        // Atualizar barras quando valores mudam
        const recursos = ['pv', 'san', 'pe'];
        
        recursos.forEach(recurso => {
            const atual = document.getElementById(`${recurso}-atual`);
            const max = document.getElementById(`${recurso}-max`);
            const barra = document.getElementById(`barra-${recurso}`);
            const status = document.getElementById(`status-${recurso}`);
            
            [atual, max].forEach(input => {
                input.addEventListener('input', () => {
                    this.atualizarBarraRecurso(recurso, barra, status);
                    this.salvarDadosRecursos();
                });
            });
        });
        
        // Calcular status iniciais
        recursos.forEach(recurso => {
            const barra = document.getElementById(`barra-${recurso}`);
            const status = document.getElementById(`status-${recurso}`);
            this.atualizarBarraRecurso(recurso, barra, status);
        });
    }

    // ATUALIZAR BARRA DE RECURSO
    atualizarBarraRecurso(recurso, barra, status) {
        const atual = parseInt(document.getElementById(`${recurso}-atual`).value) || 0;
        const max = parseInt(document.getElementById(`${recurso}-max`).value) || 1;
        const percentual = Math.max(0, Math.min(100, (atual / max) * 100));
        
        barra.style.width = percentual + '%';
        
        // Atualizar status visual
        const card = barra.closest('.recurso-card');
        card.classList.remove('critico', 'baixo');
        
        if (percentual <= 25) {
            status.textContent = '🔴 Crítico';
            status.style.color = '#dc2626';
            card.classList.add('critico');
        } else if (percentual <= 50) {
            status.textContent = '🟡 Baixo';
            status.style.color = '#f59e0b';
            card.classList.add('baixo');
        } else if (percentual <= 75) {
            status.textContent = '🟢 Normal';
            status.style.color = '#22c55e';
        } else {
            status.textContent = '🔵 Cheio';
            status.style.color = '#3b82f6';
        }
    }

    // CONFIGURAR ATRIBUTOS SISTEMA D20
    setupAtributosD20() {
        const atributos = ['forca', 'agilidade', 'intelecto', 'vigor', 'presenca'];
        
        atributos.forEach(atributo => {
            const input = document.getElementById(atributo);
            const dadosInfo = document.getElementById(`dados-${atributo}`);
            const botaoRolar = document.querySelector(`[data-atributo="${atributo}"]`);
            
            // Atualizar info de dados quando atributo muda
            input.addEventListener('input', () => {
                this.atualizarInfoDados(atributo, dadosInfo);
                this.salvarDadosAtributos();
            });
            
            // Botão rolar dados
            botaoRolar.addEventListener('click', () => {
                this.rolarAtributo(atributo);
            });
            
            // Info inicial
            this.atualizarInfoDados(atributo, dadosInfo);
        });
    }

    // ATUALIZAR INFORMAÇÃO DE DADOS
    atualizarInfoDados(atributo, dadosInfo) {
        const valor = parseInt(document.getElementById(atributo).value) || 0;
        let textoDados = '';
        
        if (valor === 0) {
            textoDados = '🎲 2d20 (menor)';
        } else if (valor === 1) {
            textoDados = '🎲 1d20';
        } else {
            textoDados = `🎲 ${valor}d20 (maior)`;
        }
        
        dadosInfo.textContent = textoDados;
    }

    // ROLAR ATRIBUTO
    rolarAtributo(atributo) {
        const valor = parseInt(document.getElementById(atributo).value) || 0;
        const nomeAtributo = this.formatarNomeAtributo(atributo);
        let resultado = '';
        
        if (valor === 0) {
            // Rola 2d20 e pega o menor
            const dado1 = Math.floor(Math.random() * 20) + 1;
            const dado2 = Math.floor(Math.random() * 20) + 1;
            const menor = Math.min(dado1, dado2);
            resultado = `${dado1} e ${dado2} → 🎯 ${menor}`;
        } else if (valor === 1) {
            // Rola 1d20
            const dado = Math.floor(Math.random() * 20) + 1;
            resultado = `🎯 ${dado}`;
        } else {
            // Rola Xd20 e pega o maior
            const dados = [];
            for (let i = 0; i < valor; i++) {
                dados.push(Math.floor(Math.random() * 20) + 1);
            }
            const maior = Math.max(...dados);
            resultado = `${dados.join(', ')} → 🎯 ${maior}`;
        }
        
        this.mostrarResultadoRolagem(`${nomeAtributo}: ${resultado}`);
    }

    // FORMATAR NOME DO ATRIBUTO
    formatarNomeAtributo(atributo) {
        const nomes = {
            'forca': 'Força',
            'agilidade': 'Agilidade',
            'intelecto': 'Intelecto', 
            'vigor': 'Vigor',
            'presenca': 'Presença'
        };
        return nomes[atributo] || atributo;
    }

    // CARREGAR PERÍCIAS COM 4 NÍVEIS
    carregarPericias4Niveis() {
        this.pericias = [
            // PERÍCIAS FÍSICAS
            { nome: 'Acrobacia', atributo: 'agilidade', nivel: 'destreinada' },
            { nome: 'Atletismo', atributo: 'forca', nivel: 'destreinada' },
            { nome: 'Furtividade', atributo: 'agilidade', nivel: 'destreinada' },
            { nome: 'Luta', atributo: 'forca', nivel: 'destreinada' },
            { nome: 'Pontaria', atributo: 'agilidade', nivel: 'destreinada' },
            { nome: 'Reflexos', atributo: 'agilidade', nivel: 'destreinada' },
            
            // PERÍCIAS MENTAIS
            { nome: 'Atualidades', atributo: 'intelecto', nivel: 'destreinada' },
            { nome: 'Ciências', atributo: 'intelecto', nivel: 'destreinada' },
            { nome: 'Investigação', atributo: 'intelecto', nivel: 'destreinada' },
            { nome: 'Medicina', atributo: 'intelecto', nivel: 'destreinada' },
            { nome: 'Ocultismo', atributo: 'intelecto', nivel: 'destreinada' },
            { nome: 'Percepção', atributo: 'intelecto', nivel: 'destreinada' },
            { nome: 'Religião', atributo: 'intelecto', nivel: 'destreinada' },
            { nome: 'Sobrevivência', atributo: 'intelecto', nivel: 'destreinada' },
            { nome: 'Tática', atributo: 'intelecto', nivel: 'destreinada' },
            { nome: 'Tecnologia', atributo: 'intelecto', nivel: 'destreinada' },
            
            // PERÍCIAS SOCIAIS
            { nome: 'Adestramento', atributo: 'presenca', nivel: 'destreinada' },
            { nome: 'Artes', atributo: 'presenca', nivel: 'destreinada' },
            { nome: 'Diplomacia', atributo: 'presenca', nivel: 'destreinada' },
            { nome: 'Enganação', atributo: 'presenca', nivel: 'destreinada' },
            { nome: 'Intimidação', atributo: 'presenca', nivel: 'destreinada' },
            { nome: 'Intuição', atributo: 'intelecto', nivel: 'destreinada' },
            { nome: 'Vontade', atributo: 'presenca', nivel: 'destreinada' },
            
            // PERÍCIAS DE RESISTÊNCIA
            { nome: 'Fortitude', atributo: 'vigor', nivel: 'destreinada' },
            { nome: 'Iniciativa', atributo: 'agilidade', nivel: 'destreinada' }
        ];
        
        this.renderizarPericias();
        this.setupFiltrosPericias();
    }

    // RENDERIZAR PERÍCIAS
    renderizarPericias() {
        const container = document.getElementById('pericias-container');
        container.innerHTML = '';
        
        this.pericias.forEach((pericia, index) => {
            const periciaElement = this.criarElementoPericia(pericia, index);
            container.appendChild(periciaElement);
        });
    }

    // CRIAR ELEMENTO DE PERÍCIA
    criarElementoPericia(pericia, index) {
        const element = document.createElement('div');
        element.className = `pericia-item pericia-${pericia.nivel}`;
        element.dataset.periciaIndex = index;
        
        const modificador = this.calcularModificadorPericia(pericia);
        
        element.innerHTML = `
            <div class="pericia-controle">
                <select class="form-select form-select-sm pericia-nivel" style="width: 120px;">
                    <option value="destreinada" ${pericia.nivel === 'destreinada' ? 'selected' : ''}>Destreinada</option>
                    <option value="treinada" ${pericia.nivel === 'treinada' ? 'selected' : ''}>Treinada</option>
                    <option value="veterana" ${pericia.nivel === 'veterana' ? 'selected' : ''}>Veterana</option>
                    <option value="expert" ${pericia.nivel === 'expert' ? 'selected' : ''}>Expert</option>
                </select>
            </div>
            <span class="pericia-nome">${pericia.nome}</span>
            <span class="pericia-atributo">${this.formatarNomeAtributo(pericia.atributo)}</span>
            <span class="pericia-modificador">${modificador >= 0 ? '+' : ''}${modificador}</span>
        `;
        
        // Evento para mudar nível
        const selectNivel = element.querySelector('.pericia-nivel');
        selectNivel.addEventListener('change', (e) => {
            this.mudarNivelPericia(index, e.target.value);
        });
        
        return element;
    }

    // CALCULAR MODIFICADOR DA PERÍCIA
    calcularModificadorPericia(pericia) {
        const modAtributo = this.obterModificadorAtributo(pericia.atributo);
        let bonus = modAtributo;
        
        switch(pericia.nivel) {
            case 'treinada': bonus += 5; break;
            case 'veterana': bonus += 10; break;
            case 'expert': bonus += 15; break;
        }
        
        return bonus;
    }

    // OBTER MODIFICADOR DO ATRIBUTO
    obterModificadorAtributo(atributo) {
        const valor = parseInt(document.getElementById(atributo).value) || 0;
        return Math.floor((valor - 1) / 2);
    }

    // MUDAR NÍVEL DA PERÍCIA
    mudarNivelPericia(index, novoNivel) {
        this.pericias[index].nivel = novoNivel;
        this.renderizarPericias();
        this.salvarDadosPericias();
    }

    // CONFIGURAR FILTROS DE PERÍCIAS
    setupFiltrosPericias() {
        const filtroSelect = document.getElementById('filtro-pericias');
        filtroSelect.addEventListener('change', (e) => {
            this.aplicarFiltroPericias(e.target.value);
        });
    }

    // APLICAR FILTRO DE PERÍCIAS
    aplicarFiltroPericias(filtro) {
        const todasPericias = document.querySelectorAll('.pericia-item');
        
        todasPericias.forEach(pericia => {
            const nivel = pericia.dataset.periciaIndex ? 
                this.pericias[pericia.dataset.periciaIndex].nivel : 'destreinada';
            
            if (filtro === 'todas' || nivel === filtro) {
                pericia.style.display = 'flex';
            } else {
                pericia.style.display = 'none';
            }
        });
    }

    // SALVAR DADOS DOS RECURSOS
    salvarDadosRecursos() {
        const dados = {
            pv: {
                atual: parseInt(document.getElementById('pv-atual').value) || 0,
                max: parseInt(document.getElementById('pv-max').value) || 12
            },
            san: {
                atual: parseInt(document.getElementById('san-atual').value) || 0,
                max: parseInt(document.getElementById('san-max').value) || 12
            },
            pe: {
                atual: parseInt(document.getElementById('pe-atual').value) || 0,
                max: parseInt(document.getElementById('pe-max').value) || 1
            }
        };
        
        localStorage.setItem('dadosRecursos', JSON.stringify(dados));
    }

    // SALVAR DADOS DOS ATRIBUTOS
    salvarDadosAtributos() {
        const dados = {
            forca: parseInt(document.getElementById('forca').value) || 1,
            agilidade: parseInt(document.getElementById('agilidade').value) || 1,
            intelecto: parseInt(document.getElementById('intelecto').value) || 1,
            vigor: parseInt(document.getElementById('vigor').value) || 1,
            presenca: parseInt(document.getElementById('presenca').value) || 1
        };
        
        localStorage.setItem('dadosAtributos', JSON.stringify(dados));
    }

    // SALVAR DADOS DAS PERÍCIAS
    salvarDadosPericias() {
        localStorage.setItem('dadosPericias', JSON.stringify(this.pericias));
    }

    // SALVAR ESTADO DAS SEÇÕES
    salvarEstadoSecoes() {
        const estado = {};
        document.querySelectorAll('.seccionavel').forEach(secao => {
            const id = secao.dataset.secao;
            estado[id] = !secao.classList.contains('recolhida');
        });
        
        localStorage.setItem('estadoSecoes', JSON.stringify(estado));
    }

    // CARREGAR ESTADO SALVO
    carregarEstado() {
        // Estado das seções
        const estadoSecoes = localStorage.getItem('estadoSecoes');
        if (estadoSecoes) {
            const estado = JSON.parse(estadoSecoes);
            Object.entries(estado).forEach(([id, aberta]) => {
                const secao = document.querySelector(`[data-secao="${id}"]`);
                if (secao && !aberta) {
                    secao.classList.add('recolhida');
                }
            });
        }
        
        // Dados dos recursos
        const dadosRecursos = localStorage.getItem('dadosRecursos');
        if (dadosRecursos) {
            const dados = JSON.parse(dadosRecursos);
            document.getElementById('pv-atual').value = dados.pv.atual;
            document.getElementById('pv-max').value = dados.pv.max;
            document.getElementById('san-atual').value = dados.san.atual;
            document.getElementById('san-max').value = dados.san.max;
            document.getElementById('pe-atual').value = dados.pe.atual;
            document.getElementById('pe-max').value = dados.pe.max;
        }
        
        // Dados das perícias
        const dadosPericias = localStorage.getItem('dadosPericias');
        if (dadosPericias) {
            this.pericias = JSON.parse(dadosPericias);
            this.renderizarPericias();
        }
    }

    // MOSTRAR RESULTADO DA ROLAGEM
    mostrarResultadoRolagem(mensagem) {
        if (window.sistemaAbas && window.sistemaAbas.mostrarToast) {
            window.sistemaAbas.mostrarToast(mensagem, 'info');
        } else {
            // Fallback simples
            alert(`🎲 ${mensagem}`);
        }
    }
}

// INICIALIZAR QUANDO A PÁGINA CARREGAR
document.addEventListener('DOMContentLoaded', function() {
    window.principalCorrigido = new PrincipalCorrigido();
    console.log('🔧 Sistema corrigido da aba principal pronto!');
});