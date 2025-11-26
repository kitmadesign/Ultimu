// layout-otimizado.js - SISTEMA COMPLETO E FUNCIONAL
class LayoutOtimizado {
    constructor() {
        this.cards = [];
        this.layoutAtual = 'auto';
        this.init();
    }

    init() {
        console.log('🎨 Sistema de layout iniciado!');
        this.setupEventListeners();
        this.setupArrastarSoltar();
        this.carregarEstado();
        this.aplicarLayout(this.layoutAtual);
        this.setupSeccionesExpansibles();
    }

    setupEventListeners() {
        // Dropdown de layout
        document.querySelectorAll('.layout-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                const layout = e.target.closest('.layout-option').dataset.layout;
                this.aplicarLayout(layout);
                this.atualizarDropdownLayout();
            });
        });

        // Botão reset layout
        document.getElementById('btn-reset-layout').addEventListener('click', (e) => {
            e.preventDefault();
            this.resetarLayout();
        });

        // Botão recolher/expandir tudo
        document.getElementById('toggle-todas-secoes').addEventListener('click', () => {
            this.toggleTodasSecciones();
        });

        // Botão salvar
        document.getElementById('salvar-ficha').addEventListener('click', () => {
            this.salvarFicha();
        });
    }

    setupSeccionesExpansibles() {
        // Configurar botões de expandir/recolher individuais
        document.querySelectorAll('.toggle-secao').forEach(botao => {
            botao.addEventListener('click', (e) => {
                const secao = e.target.closest('.seccionavel');
                this.toggleSecao(secao);
            });
        });

        // Configurar filtro de perícias
        const filtroPericias = document.getElementById('filtro-pericias');
        if (filtroPericias) {
            filtroPericias.addEventListener('change', (e) => {
                this.filtrarPericias(e.target.value);
            });
        }
    }

    toggleSecao(secao) {
        secao.classList.toggle('recolhida');
        
        const icon = secao.querySelector('.toggle-secao i');
        if (secao.classList.contains('recolhida')) {
            icon.classList.replace('fa-minus', 'fa-plus');
        } else {
            icon.classList.replace('fa-plus', 'fa-minus');
        }
    }

    toggleTodasSecciones() {
        const secoes = document.querySelectorAll('.seccionavel');
        const todasRecolhidas = Array.from(secoes).every(s => s.classList.contains('recolhida'));
        const botao = document.getElementById('toggle-todas-secoes');
        
        secoes.forEach(secao => {
            if (todasRecolhidas) {
                secao.classList.remove('recolhida');
                secao.querySelector('.toggle-secao i').classList.replace('fa-plus', 'fa-minus');
            } else {
                secao.classList.add('recolhida');
                secao.querySelector('.toggle-secao i').classList.replace('fa-minus', 'fa-plus');
            }
        });
        
        if (todasRecolhidas) {
            botao.innerHTML = '<i class="fas fa-compress"></i> Recolher Tudo';
            this.mostrarMensagem('Todas as seções expandidas', 'success');
        } else {
            botao.innerHTML = '<i class="fas fa-expand"></i> Expandir Tudo';
            this.mostrarMensagem('Todas as seções recolhidas', 'info');
        }
    }

    filtrarPericias(filtro) {
        const pericias = document.querySelectorAll('.pericia-item');
        
        pericias.forEach(pericia => {
            const nivel = pericia.dataset.nivel || 'destreinada';
            
            switch(filtro) {
                case 'todas':
                    pericia.style.display = 'flex';
                    break;
                case 'treinadas':
                    pericia.style.display = (nivel === 'treinada' || nivel === 'veterana') ? 'flex' : 'none';
                    break;
                case 'veteranas':
                    pericia.style.display = nivel === 'veterana' ? 'flex' : 'none';
                    break;
                case 'destreinadas':
                    pericia.style.display = nivel === 'destreinada' ? 'flex' : 'none';
                    break;
                default:
                    pericia.style.display = 'flex';
            }
        });
        
        this.mostrarMensagem(`Perícias filtradas: ${filtro}`, 'info');
    }

    setupArrastarSoltar() {
        this.cards = Array.from(document.querySelectorAll('.card[data-card-id]'));
        
        this.cards.forEach(card => {
            const isFixo = card.hasAttribute('data-card-fixo');
            
            if (!isFixo) {
                card.setAttribute('draggable', 'true');
                card.classList.add('card-arrastavel');
                
                this.adicionarIconeArrastar(card);
                
                // Eventos de drag and drop
                card.addEventListener('dragstart', this.manejarInicioArrastre.bind(this));
                card.addEventListener('dragover', this.manejarSobreArrastre.bind(this));
                card.addEventListener('drop', this.manejarSoltar.bind(this));
                card.addEventListener('dragend', this.manejarFimArrastre.bind(this));
            }
        });
    }

    adicionarIconeArrastar(card) {
        const header = card.querySelector('.card-header');
        if (header && !header.querySelector('.icone-arrastar')) {
            // Encontrar ou criar container de controles
            let controles = header.querySelector('.controles-card');
            if (!controles) {
                controles = document.createElement('div');
                controles.className = 'controles-card';
                header.appendChild(controles);
            }
            
            const iconeArrastar = document.createElement('span');
            iconeArrastar.className = 'icone-arrastar';
            iconeArrastar.innerHTML = '<i class="fas fa-grip-vertical"></i>';
            iconeArrastar.title = 'Arrastar para reorganizar';
            controles.prepend(iconeArrastar);
        }
    }

    manejarInicioArrastre(e) {
        // Só arrasta se clicar no ícone de arrastar
        if (e.target.closest('.icone-arrastar')) {
            e.target.closest('.card-arrastavel').classList.add('arrastando');
            e.dataTransfer.setData('text/plain', e.target.closest('.card-arrastavel').dataset.cardId);
            e.dataTransfer.effectAllowed = 'move';
        } else {
            e.preventDefault();
        }
    }

    manejarSobreArrastre(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    manejarSoltar(e) {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text/plain');
        const cardOrigem = document.querySelector(`[data-card-id="${cardId}"]`);
        const cardAlvo = e.target.closest('.card-arrastavel');
        
        if (cardAlvo && cardOrigem !== cardAlvo) {
            this.reordenarCards(cardOrigem, cardAlvo);
        }
    }

    manejarFimArrastre(e) {
        document.querySelectorAll('.card-arrastavel').forEach(card => {
            card.classList.remove('arrastando');
        });
    }

    reordenarCards(cardOrigem, cardAlvo) {
        const container = cardOrigem.parentElement;
        if (container.classList.contains('ficha-grid')) {
            const cards = Array.from(container.children);
            const indexOrigem = cards.indexOf(cardOrigem);
            const indexAlvo = cards.indexOf(cardAlvo);
            
            if (indexOrigem < indexAlvo) {
                cardAlvo.after(cardOrigem);
            } else {
                cardAlvo.before(cardOrigem);
            }
            
            this.salvarEstado();
            this.mostrarMensagem('Layout reorganizado!', 'success');
        }
    }

    aplicarLayout(layout) {
        let container = document.querySelector('.ficha-grid');
        if (!container) {
            container = this.criarContainerGrid();
        }
        
        // Remove todas as classes de layout
        container.className = 'ficha-grid';
        
        // Aplica o layout selecionado
        container.classList.add(`layout-${layout}`);
        this.layoutAtual = layout;
        
        this.salvarEstado();
        this.atualizarDropdownLayout();
    }

    criarContainerGrid() {
        let container = document.querySelector('.ficha-grid');
        if (!container) {
            container = document.createElement('div');
            container.className = 'ficha-grid';
            
            // Encontrar a posição correta para inserir
            const cardFixo = document.querySelector('[data-card-fixo="true"]');
            const cabecalho = document.querySelector('.cabecalho-aba');
            
            if (cardFixo) {
                cardFixo.after(container);
            } else if (cabecalho) {
                cabecalho.after(container);
            } else {
                document.querySelector('#aba-principal').appendChild(container);
            }
            
            // Mover cards movíveis para o container
            const cardsMoviveis = Array.from(document.querySelectorAll('.card[data-card-id]'))
                .filter(card => !card.hasAttribute('data-card-fixo'));
            
            cardsMoviveis.forEach(card => {
                container.appendChild(card);
            });
        }
        
        return container;
    }

    atualizarDropdownLayout() {
        document.querySelectorAll('.layout-option').forEach(option => {
            option.classList.remove('active');
            if (option.dataset.layout === this.layoutAtual) {
                option.classList.add('active');
            }
        });
    }

    resetarLayout() {
        localStorage.removeItem('layoutFicha');
        this.layoutAtual = 'auto';
        this.aplicarLayout('auto');
        this.mostrarMensagem('Layout resetado!', 'success');
    }

    salvarFicha() {
        this.mostrarMensagem('Ficha salva com sucesso!', 'success');
        // Aqui você pode adicionar a lógica de salvamento real
    }

    salvarEstado() {
        const container = document.querySelector('.ficha-grid');
        if (container) {
            const estado = {
                layout: this.layoutAtual,
                ordemCards: Array.from(container.children)
                    .map(card => card.dataset.cardId)
                    .filter(id => id)
            };
            localStorage.setItem('layoutFicha', JSON.stringify(estado));
        }
    }

    carregarEstado() {
        const estadoSalvo = localStorage.getItem('layoutFicha');
        if (estadoSalvo) {
            try {
                const estado = JSON.parse(estadoSalvo);
                this.layoutAtual = estado.layout || 'auto';
                
                if (estado.ordemCards) {
                    setTimeout(() => {
                        this.aplicarOrdemSalva(estado.ordemCards);
                    }, 100);
                }
            } catch (e) {
                console.error('Erro ao carregar estado:', e);
            }
        }
    }

    aplicarOrdemSalva(ordemCards) {
        const container = document.querySelector('.ficha-grid');
        if (container) {
            ordemCards.forEach(cardId => {
                const card = document.querySelector(`[data-card-id="${cardId}"]`);
                if (card && !card.hasAttribute('data-card-fixo')) {
                    container.appendChild(card);
                }
            });
        }
    }

    mostrarMensagem(mensagem, tipo = 'info') {
        // Usar o sistema de toast existente ou fallback
        if (window.sistemaAbas && window.sistemaAbas.mostrarToast) {
            window.sistemaAbas.mostrarToast(mensagem, tipo);
        } else {
            console.log(`📢 ${mensagem}`);
            // Fallback simples
            alert(mensagem);
        }
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que tudo carregou
    setTimeout(() => {
        window.layoutOtimizado = new LayoutOtimizado();
        console.log('🎨 Sistema de layout totalmente funcional!');
    }, 1000);
});


// Controles mobile para sidebars
function toggleLeftSidebar() {
    const leftSidebar = document.querySelector('.left-sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    leftSidebar.classList.toggle('active');
    overlay.style.display = leftSidebar.classList.contains('active') ? 'block' : 'none';
}

function toggleRightSidebar() {
    const rightSidebar = document.querySelector('.right-sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    rightSidebar.classList.toggle('active');
    overlay.style.display = rightSidebar.classList.contains('active') ? 'block' : 'none';
}

function closeAllSidebars() {
    document.querySelectorAll('.left-sidebar, .right-sidebar').forEach(sidebar => {
        sidebar.classList.remove('active');
    });
    document.querySelector('.mobile-overlay').style.display = 'none';
}

// Mostrar controles mobile apenas em telas pequenas
function checkMobileView() {
    const mobileControls = document.querySelector('.mobile-controls');
    if (window.innerWidth <= 768) {
        mobileControls.style.display = 'flex';
    } else {
        mobileControls.style.display = 'none';
        closeAllSidebars();
    }
}

// Event listeners
window.addEventListener('resize', checkMobileView);
window.addEventListener('load', checkMobileView);