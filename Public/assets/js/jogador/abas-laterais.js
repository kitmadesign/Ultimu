// =========================================================
// abas-laterais.js - Controle do sistema de abas laterais
// =========================================================

class AbasLaterais {
    constructor() {
        this.abaAtual = 'principal'; // Aba padrão
        this.init();
    }

    // INICIALIZAÇÃO
    init() {
        console.log('🚀 Sistema de Abas Laterais iniciado!');
        this.setupEventListeners();
        this.carregarEstado();
        this.setupMobile();
    }

    // CONFIGURAR EVENTOS (cliques, etc)
    setupEventListeners() {
        // Clique nas abas do menu lateral
        document.querySelectorAll('.aba-item').forEach(aba => {
            aba.addEventListener('click', (e) => {
                const abaId = e.currentTarget.dataset.aba;
                this.mudarAba(abaId);
            });
        });

        // Botão salvar ficha
        document.getElementById('salvar-ficha').addEventListener('click', () => {
            this.salvarFicha();
        });

        // Botão menu mobile
        document.getElementById('menu-mobile').addEventListener('click', () => {
            this.toggleMenuMobile();
        });
    }

    // CONFIGURAÇÃO PARA MOBILE
    setupMobile() {
        // Criar overlay para mobile
        const overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        overlay.addEventListener('click', () => {
            this.toggleMenuMobile(false);
        });
        document.body.appendChild(overlay);

        // Fechar menu ao clicar em uma aba (mobile)
        document.querySelectorAll('.aba-item').forEach(aba => {
            aba.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.toggleMenuMobile(false);
                }
            });
        });
    }

    // ALTERNAR MENU MOBILE
    toggleMenuMobile(abrir) {
        const painel = document.getElementById('painel-lateral');
        const overlay = document.querySelector('.menu-overlay');
        
        if (abrir === undefined) {
            // Alternar estado atual
            abrir = !painel.classList.contains('aberta');
        }

        if (abrir) {
            painel.classList.add('aberta');
            overlay.classList.add('visivel');
            document.body.style.overflow = 'hidden'; // Previne scroll
        } else {
            painel.classList.remove('aberta');
            overlay.classList.remove('visivel');
            document.body.style.overflow = ''; // Restaura scroll
        }
    }

    // MUDAR ABA ATUAL
    mudarAba(abaId) {
        console.log(`📁 Mudando para aba: ${abaId}`);
        
        // 1. Remover classe 'ativa' de todas as abas do menu
        document.querySelectorAll('.aba-item').forEach(item => {
            item.classList.remove('ativa');
        });
        
        // 2. Remover classe 'ativa' de todos os conteúdos
        document.querySelectorAll('.aba-conteudo').forEach(conteudo => {
            conteudo.classList.remove('ativa');
        });
        
        // 3. Adicionar classe 'ativa' na aba clicada
        document.querySelector(`[data-aba="${abaId}"]`).classList.add('ativa');
        
        // 4. Mostrar conteúdo da aba selecionada
        document.getElementById(`aba-${abaId}`).classList.add('ativa');
        
        // 5. Atualizar aba atual e salvar
        this.abaAtual = abaId;
        this.salvarEstado();
        
        // 6. Mostrar feedback visual
        this.mostrarFeedback(`Aba ${this.getNomeAba(abaId)} aberta`);
    }

    // OBTER NOME AMIGÁVEL DA ABA
    getNomeAba(abaId) {
        const nomes = {
            'principal': 'Principal',
            'historia': 'História',
            'descricao': 'Descrição',
            'anotacoes': 'Anotações',
            'mestre': 'Mestre',
            'acoes': 'Ações'
        };
        return nomes[abaId] || abaId;
    }

    // SALVAR ESTADO ATUAL (qual aba estava aberta)
    salvarEstado() {
        const estado = {
            abaAtual: this.abaAtual,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('estadoAbas', JSON.stringify(estado));
        console.log('💾 Estado das abas salvo:', estado);
    }

    // CARREGAR ESTADO SALVO
    carregarEstado() {
        const estadoSalvo = localStorage.getItem('estadoAbas');
        if (estadoSalvo) {
            try {
                const estado = JSON.parse(estadoSalvo);
                this.abaAtual = estado.abaAtual;
                this.mudarAba(this.abaAtual);
                console.log('📂 Estado das abas carregado:', estado);
            } catch (error) {
                console.error('❌ Erro ao carregar estado:', error);
            }
        }
    }

    // SALVAR FICHA COMPLETA
    salvarFicha() {
        // Esta função será expandida depois
        this.mostrarToast('Ficha salva com sucesso!', 'success');
        console.log('💾 Ficha salva!');
    }

    // MOSTRAR NOTIFICAÇÃO TOAST
    mostrarToast(mensagem, tipo = 'info') {
        const toastArea = document.getElementById('toast-area');
        const toastId = 'toast-' + Date.now();
        
        const icones = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        
        const toast = document.createElement('div');
        toast.className = `notification ${tipo}`;
        toast.id = toastId;
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas ${icones[tipo]} me-2"></i>
                <span>${mensagem}</span>
            </div>
            <button onclick="document.getElementById('${toastId}').remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        toastArea.appendChild(toast);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (document.getElementById(toastId)) {
                document.getElementById(toastId).remove();
            }
        }, 5000);
    }

    // MOSTRAR FEEDBACK NO CONSOLE
    mostrarFeedback(mensagem) {
        console.log(`🔔 ${mensagem}`);
    }
}

// INICIALIZAR QUANDO A PÁGINA CARREGAR
document.addEventListener('DOMContentLoaded', function() {
    window.sistemaAbas = new AbasLaterais();
    console.log('🎮 Sistema de abas pronto para uso!');
    
    // Dica para o usuário
    console.log('💡 Dica: Clique nas abas do menu lateral para navegar');
});

// EXPORTAR PARA USO EM OUTROS ARQUIVOS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AbasLaterais;
}