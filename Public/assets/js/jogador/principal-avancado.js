// =========================================================
// principal-avancado.js - Funcionalidades avançadas da aba principal
// =========================================================

class PrincipalAvancado {
    constructor() {
        this.secoesEstado = {};
        this.periciasOrdenadas = [];
        this.init();
    }

    // INICIALIZAÇÃO
    init() {
        console.log('🎮 Sistema avançado da aba principal iniciado!');
        this.setupSeccionesExpansibles();
        this.setupCalculosFlexibles();
        this.setupPericiasAvanzadas();
        this.cargarEstado();
    }

    // CONFIGURAR SEÇÕES EXPANSÍVEIS
    setupSeccionesExpansibles() {
        // Botão expandir/recolher tudo
        document.getElementById('toggle-todos').addEventListener('click', () => {
            this.toggleTodasSecciones();
        });

        // Controles de seção individual
        document.querySelectorAll('.toggle-secao').forEach(boton => {
            boton.addEventListener('click', (e) => {
                const seccion = e.target.closest('.seccionavel');
                this.toggleSeccion(seccion);
            });
        });

        // Botões reset
        document.querySelectorAll('.btn-reset').forEach(boton => {
            boton.addEventListener('click', (e) => {
                const campo = e.target.closest('.btn-reset').dataset.campo;
                this.resetarCalculos(campo);
            });
        });
    }

    // ALTERNAR UMA SEÇÃO
    toggleSeccion(seccion) {
        seccion.classList.toggle('recolhida');
        const icono = seccion.querySelector('.toggle-secao i');
        
        if (seccion.classList.contains('recolhida')) {
            icono.classList.remove('fa-minus');
            icono.classList.add('fa-plus');
        } else {
            icono.classList.remove('fa-plus');
            icono.classList.add('fa-minus');
        }
        
        this.guardarEstadoSecciones();
    }

    // ALTERNAR TODAS AS SEÇÕES
    toggleTodasSecciones() {
        const boton = document.getElementById('toggle-todos');
        const secciones = document.querySelectorAll('.seccionavel');
        const todasRecolhidas = Array.from(secciones).every(s => s.classList.contains('recolhida'));
        
        secciones.forEach(seccion => {
            if (todasRecolhidas) {
                seccion.classList.remove('recolhida');
                seccion.querySelector('.toggle-secao i').classList.replace('fa-plus', 'fa-minus');
            } else {
                seccion.classList.add('recolhida');
                seccion.querySelector('.toggle-secao i').classList.replace('fa-minus', 'fa-plus');
            }
        });
        
        boton.classList.toggle('recolher-tudo', !todasRecolhidas);
        this.guardarEstadoSecciones();
    }

    // CONFIGURAR CÁLCULOS FLEXÍVEIS
    setupCalculosFlexibles() {
        document.querySelectorAll('.calculavel').forEach(input => {
            // Marcar como editado manualmente quando o usuário mudar
            input.addEventListener('input', (e) => {
                const valorAtual = e.target.value;
                const valorCalculado = e.target.dataset.calculado;
                
                if (valorAtual !== valorCalculado) {
                    e.target.closest('.calculavel').classList.add('editado-manualmente');
                } else {
                    e.target.closest('.calculavel').classList.remove('editado-manualmente');
                }
            });

            // Permitir edição manual mesmo com cálculos automáticos
            input.addEventListener('focus', (e) => {
                e.target.dataset.valorAnterior = e.target.value;
            });
        });
    }

    // RESETAR CÁLCULOS
    resetarCalculos(campo) {
        if (campo === 'atributos') {
            document.querySelectorAll('.atributo-input').forEach(input => {
                const valorCalculado = input.dataset.calculado;
                input.value = valorCalculado;
                input.closest('.calculavel').classList.remove('editado-manualmente');
            });
            window.fichaPersonagem.atualizarModificadores();
        }
        
        this.mostrarToast('Cálculos resetados para automático!', 'success');
    }

    // CONFIGURAR PERÍCIAS AVANÇADAS
    setupPericiasAvanzadas() {
        this.renderizarPericiasAvancadas();
        this.setupFiltrosPericias();
        this.setupArrastarSoltar();
    }

    // RENDERIZAR PERÍCIAS COM SISTEMA AVANÇADO
    renderizarPericiasAvancadas() {
        const container = document.getElementById('pericias-container');
        container.innerHTML = '';

        // Agrupar perícias por nível de treinamento
        const grupos = {
            veterana: window.fichaPersonagem.pericias.filter(p => p.veterana),
            treinada: window.fichaPersonagem.pericias.filter(p => p.treinada && !p.veterana),
            iniciante: window.fichaPersonagem.pericias.filter(p => !p.treinada && !p.veterana)
        };

        // Renderizar cada grupo
        Object.entries(grupos).forEach(([nivel, pericias]) => {
            if (pericias.length === 0) return;

            const grupoDiv = document.createElement('div');
            grupoDiv.className = 'grupo-pericias';
            
            const titulo = this.obterTituloGrupo(nivel);
            grupoDiv.innerHTML = `<div class="grupo-titulo">${titulo} (${pericias.length})</div>`;
            
            pericias.forEach((pericia, index) => {
                const periciaElement = this.criarElementoPericiaAvancada(pericia, index);
                grupoDiv.appendChild(periciaElement);
            });
            
            container.appendChild(grupoDiv);
        });
    }

    // OBTER TÍTULO DO GRUPO
    obterTituloGrupo(nivel) {
        const titulos = {
            'veterana': '🎯 Perícias Veteranas',
            'treinada': '📚 Perícias Treinadas', 
            'iniciante': '📖 Perícias Iniciantes'
        };
        return titulos[nivel] || nivel;
    }

    // CRIAR ELEMENTO DE PERÍCIA AVANÇADA
    criarElementoPericiaAvancada(pericia, index) {
        const element = document.createElement('div');
        element.className = `pericia-avancada ${pericia.veterana ? 'veterana' : pericia.treinada ? 'treinada' : ''}`;
        element.draggable = true;
        element.dataset.periciaIndex = index;

        const modificador = this.calcularModificadorPericia(pericia);
        
        element.innerHTML = `
            <div class="pericia-controles">
                <span class="pericia-arrastar" title="Arrastar para reordenar">
                    <i class="fas fa-grip-vertical"></i>
                </span>
                <input type="checkbox" class="pericia-checkbox" 
                       ${pericia.treinada ? 'checked' : ''} 
                       ${pericia.veterana ? 'checked' : ''}>
            </div>
            <span class="pericia-nome">${pericia.nome}</span>
            <span class="pericia-atributo">${this.formatarAtributo(pericia.atributo)}</span>
            <span class="pericia-modificador">${modificador >= 0 ? '+' : ''}${modificador}</span>
        `;

        this.configurarEventosPericia(element, pericia, index);
        return element;
    }

    // CALCULAR MODIFICADOR DA PERÍCIA
    calcularModificadorPericia(pericia) {
        const modAtributo = window.fichaPersonagem.obterModificadorAtributo(pericia.atributo);
        let bonus = modAtributo;

        if (pericia.veterana) {
            bonus += 10;
        } else if (pericia.treinada) {
            bonus += 5;
        }

        return bonus;
    }

    // FORMATAR NOME DO ATRIBUTO
    formatarAtributo(atributo) {
        const nomes = {
            'forca': 'Força',
            'agilidade': 'Agilidade', 
            'intelecto': 'Intelecto',
            'vigor': 'Vigor',
            'presenca': 'Presença'
        };
        return nomes[atributo] || atributo;
    }

    // CONFIGURAR EVENTOS DA PERÍCIA
    configurarEventosPericia(element, pericia, index) {
        // Checkbox de treinamento
        const checkbox = element.querySelector('.pericia-checkbox');
        checkbox.addEventListener('change', (e) => {
            this.alternarTreinamentoPericia(index, e.target.checked);
        });

        // Arrastar e soltar
        element.addEventListener('dragstart', this.manejarInicioArrastre.bind(this));
        element.addEventListener('dragover', this.manejarSobreArrastre.bind(this));
        element.addEventListener('drop', this.manejarSoltar.bind(this));
        element.addEventListener('dragend', this.manejarFimArrastre.bind(this));
    }

    // CONFIGURAR FILTROS DE PERÍCIAS
    setupFiltrosPericias() {
        document.querySelectorAll('[data-filtro]').forEach(boton => {
            boton.addEventListener('click', (e) => {
                const filtro = e.target.dataset.filtro;
                this.aplicarFiltroPericias(filtro);
                
                // Atualizar estado dos botões
                document.querySelectorAll('[data-filtro]').forEach(b => {
                    b.classList.toggle('active', b === e.target);
                });
            });
        });
    }

    // APLICAR FILTRO DE PERÍCIAS
    aplicarFiltroPericias(filtro) {
        const todasPericias = document.querySelectorAll('.pericia-avancada');
        
        todasPericias.forEach(pericia => {
            pericia.classList.add('oculta');
            
            switch (filtro) {
                case 'todas':
                    pericia.classList.remove('oculta');
                    break;
                case 'treinadas':
                    if (pericia.classList.contains('treinada') || pericia.classList.contains('veterana')) {
                        pericia.classList.remove('oculta');
                    }
                    break;
                case 'veteranas':
                    if (pericia.classList.contains('veterana')) {
                        pericia.classList.remove('oculta');
                    }
                    break;
            }
        });
    }

    // CONFIGURAR ARRASTAR E SOLTAR
    setupArrastarSoltar() {
        // ... (código completo de arrastar e soltar)
    }

    // MANEJAR INÍCIO DO ARRASTE
    manejarInicioArrastre(e) {
        e.target.classList.add('arrastando');
        e.dataTransfer.setData('text/plain', e.target.dataset.periciaIndex);
        e.dataTransfer.effectAllowed = 'move';
    }

    // MANEJAR SOBRE ARRASTE
    manejarSobreArrastre(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    // MANEJAR SOLTAR
    manejarSoltar(e) {
        e.preventDefault();
        const origemIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const destinoElement = e.target.closest('.pericia-avancada');
        
        if (destinoElement) {
            const destinoIndex = parseInt(destinoElement.dataset.periciaIndex);
            this.reordenarPericias(origemIndex, destinoIndex);
        }
    }

    // MANEJAR FIM DO ARRASTE
    manejarFimArrastre(e) {
        e.target.classList.remove('arrastando');
    }

    // REORDENAR PERÍCIAS
    reordenarPericias(origemIndex, destinoIndex) {
        if (origemIndex === destinoIndex) return;
        
        const pericias = window.fichaPersonagem.pericias;
        const [periciaMovida] = pericias.splice(origemIndex, 1);
        pericias.splice(destinoIndex, 0, periciaMovida);
        
        window.fichaPersonagem.salvarDadosFicha();
        this.renderizarPericiasAvancadas();
        
        this.mostrarToast('Perícias reordenadas!', 'success');
    }

    // ALTERNAR TREINAMENTO DA PERÍCIA
    alternarTreinamentoPericia(index, treinada) {
        window.fichaPersonagem.alternarTreinamentoPericia(index, treinada);
        this.renderizarPericiasAvancadas();
    }

    // SALVAR ESTADO DAS SEÇÕES
    guardarEstadoSecciones() {
        const estado = {};
        document.querySelectorAll('.seccionavel').forEach(seccion => {
            const id = seccion.dataset.secao;
            estado[id] = !seccion.classList.contains('recolhida');
        });
        
        localStorage.setItem('estadoSecciones', JSON.stringify(estado));
    }

    // CARREGAR ESTADO SALVO
    cargarEstado() {
        // Estado das seções
        const estadoSecciones = localStorage.getItem('estadoSecciones');
        if (estadoSecciones) {
            const estado = JSON.parse(estadoSecciones);
            Object.entries(estado).forEach(([id, aberta]) => {
                const seccion = document.querySelector(`[data-secao="${id}"]`);
                if (seccion && !aberta) {
                    this.toggleSeccion(seccion);
                }
            });
        }
    }

    // MOSTRAR NOTIFICAÇÃO
    mostrarToast(mensagem, tipo = 'info') {
        if (window.sistemaAbas && window.sistemaAbas.mostrarToast) {
            window.sistemaAbas.mostrarToast(mensagem, tipo);
        } else {
            console.log(`🔔 ${mensagem}`);
        }
    }
}

// INICIALIZAR QUANDO A PÁGINA CARREGAR
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar a ficha principal carregar primeiro
    setTimeout(() => {
        window.principalAvancado = new PrincipalAvancado();
        console.log('🎮 Sistema avançado da aba principal pronto!');
    }, 100);
});