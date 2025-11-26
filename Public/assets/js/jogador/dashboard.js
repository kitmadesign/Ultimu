// dashboard.js - VERSÃO SIMPLIFICADA E FUNCIONAL
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎲 Iniciando dashboard...');
    await verificarAutenticacao();
    await carregarDashboardJogador();
    configurarEventListeners();
});

async function carregarDashboardJogador() {
    try {
        console.log('📊 Carregando dashboard...');
        
        // Carregar apenas o que está disponível
        await carregarMinhasFichas();
        
        // Inicializar seções vazias
        document.getElementById('campaigns-list').innerHTML = 
            '<div class="no-results">Nenhuma campanha ativa</div>';
        document.getElementById('invites-list').innerHTML = 
            '<div class="no-results">Nenhum convite pendente</div>';
            
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        mostrarErro('Erro ao carregar dados do dashboard');
    }
}

async function carregarMinhasFichas() {
    try {
        console.log('📋 Carregando fichas...');
        
        // Tentar carregar do localStorage primeiro
        const fichasSalvas = localStorage.getItem('user_fichas');
        let fichas = [];
        
        if (fichasSalvas) {
            fichas = JSON.parse(fichasSalvas);
            console.log('📋 Fichas do localStorage:', fichas);
        }
        
        // Se não há fichas, criar uma exemplo
        if (fichas.length === 0) {
            fichas = [{
                playerId: 'exemplo_' + Date.now(),
                nome: 'Personagem Exemplo',
                nex: '5%',
                classe: 'Combatente',
                nivel: 1
            }];
            localStorage.setItem('user_fichas', JSON.stringify(fichas));
        }
        
        exibirMinhasFichas(fichas);
        
    } catch (error) {
        console.error('Erro ao carregar fichas:', error);
        // Fallback
        const fichas = [{
            playerId: 'fallback_' + Date.now(),
            nome: 'Personagem de Exemplo',
            nex: '5%',
            classe: 'Combatente'
        }];
        exibirMinhasFichas(fichas);
    }
}

function exibirMinhasFichas(fichas) {
    const container = document.getElementById('characters-list');
    const emptyMsg = document.getElementById('characters-empty');
    
    if (!fichas || fichas.length === 0) {
        if (container) container.innerHTML = '';
        if (emptyMsg) emptyMsg.classList.remove('d-none');
        return;
    }
    
    if (emptyMsg) emptyMsg.classList.add('d-none');
    
    container.innerHTML = fichas.map(ficha => `
        <div class="character-card card">
            <div class="card-body">
                <h6 class="card-title">${ficha.nome || 'Personagem Sem Nome'}</h6>
                <div class="small-muted mb-2">
                    <div>${ficha.classe || 'Classe não definida'} • NEX ${ficha.nex || '0%'}</div>
                    <div>Nível ${ficha.nivel || 1}</div>
                </div>
                <div class="actions d-flex gap-2">
                    <button class="btn btn-primary btn-sm" onclick="abrirFicha('${ficha.playerId}')">
                        <i class="fa fa-edit"></i> Abrir
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="editarFicha('${ficha.playerId}')">
                        <i class="fa fa-cog"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function configurarEventListeners() {
    const refreshBtn = document.getElementById('refresh-data');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Atualizando...';
            await carregarDashboardJogador();
            setTimeout(() => {
                refreshBtn.innerHTML = '<i class="fa fa-sync"></i> Atualizar';
                mostrarMensagem('✅ Dashboard atualizado!', 'sucesso');
            }, 1000);
        });
    }
    
    // Botão nova ficha já está no HTML
}

// === FUNÇÕES DE AUTENTICAÇÃO ===
function getAuthHeaders() {
    const token = localStorage.getItem('rpg_token');
    return {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };
}

async function verificarAutenticacao() {
    const token = localStorage.getItem('rpg_token');
    const userRole = localStorage.getItem('rpg_user_role');
    const userName = localStorage.getItem('rpg_user_name');
    
    console.log('🔐 Verificando autenticação...', { token: !!token, userRole, userName });
    
    if (!token) {
        console.log('❌ Sem token, redirecionando para login...');
        window.location.href = '/';
        return;
    }

    try {
        // Tentar validar com o backend
        const response = await fetch('/api/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Usuário autenticado:', data.user);
            atualizarInterfaceUsuario(data.user);
        } else {
            // Se a rota /api/me não existir, usar dados do localStorage
            console.log('⚠️  Rota /api/me não disponível, usando dados locais');
            atualizarInterfaceUsuario({
                username: userName || 'Jogador',
                displayName: userName || 'Jogador',
                role: userRole || 'jogador'
            });
        }
    } catch (error) {
        console.error('Erro na verificação de autenticação:', error);
        // Fallback para dados locais
        console.log('⚠️  Usando fallback de autenticação');
        atualizarInterfaceUsuario({
            username: userName || 'Jogador',
            displayName: userName || 'Jogador', 
            role: userRole || 'jogador'
        });
    }
}

function atualizarInterfaceUsuario(user) {
    console.log('👤 Atualizando interface para:', user);
    
    // Atualizar header se existir
    const userInfoElement = document.querySelector('.navbar .navbar-text') || document.getElementById('user-info');
    if (userInfoElement) {
        userInfoElement.innerHTML = `Olá, <strong>${user.displayName || user.username}</strong>`;
    }
    
    // Atualizar título da página
    document.title = `Dashboard - ${user.displayName || user.username}`;
}

// === FUNÇÕES DE FICHAS ===
function criarNovaFicha() {
    console.log('🆕 Criando nova ficha...');
    window.location.href = 'sessao.html';
}

function abrirFicha(playerId) {
    console.log('📖 Abrindo ficha:', playerId);
    // Por enquanto, redireciona para a página de sessão
    window.location.href = 'sessao.html';
}

function editarFicha(playerId) {
    console.log('⚙️ Editando ficha:', playerId);
    // Por enquanto, mesma função de abrir
    window.location.href = 'sessao.html';
}

// === FUNÇÕES DE MENSAGENS ===
function mostrarMensagem(texto, tipo = 'info') {
    console.log(`💬 ${tipo}: ${texto}`);
    
    // Sistema simples de toast
    const toastArea = document.getElementById('toast-area');
    if (toastArea) {
        const toast = document.createElement('div');
        toast.className = `alert alert-${tipo === 'sucesso' ? 'success' : 'danger'} alert-dismissible fade show`;
        toast.innerHTML = `
            ${texto}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        toastArea.appendChild(toast);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    } else {
        // Fallback para alert simples
        alert(texto);
    }
}

function mostrarErro(mensagem) {
    mostrarMensagem(mensagem, 'erro');
}

// === FUNÇÕES GLOBAIS (para acesso via HTML) ===
window.criarNovaFicha = criarNovaFicha;
window.abrirFicha = abrirFicha;
window.editarFicha = editarFicha;
window.mostrarMensagem = mostrarMensagem;

console.log('✅ dashboard.js carregado');