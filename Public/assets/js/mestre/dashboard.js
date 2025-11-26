// mestre-dashboard.js - VERSÃO COMPLETA COM GESTÃO
document.addEventListener('DOMContentLoaded', async function() {
    await verificarAutenticacao();
    await carregarDashboardMestre();
    configurarEventListeners();
});

async function carregarDashboardMestre() {
    try {
        mostrarCarregamento(true);
        await Promise.all([
            carregarCampanhas(),
            carregarConvitesAtivos(),
            carregarEstatisticas()
        ]);
        mostrarCarregamento(false);
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        mostrarErro('Erro ao carregar dados do dashboard');
        mostrarCarregamento(false);
    }
}

// === FUNÇÕES PRINCIPAIS ===

async function carregarCampanhas() {
    try {
        const response = await fetch('/api/campaigns', {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const campanhas = await response.json();
            exibirCampanhas(campanhas);
        }
    } catch (error) {
        console.error('Erro ao carregar campanhas:', error);
        mostrarErro('Erro ao carregar campanhas');
    }
}

async function carregarConvitesAtivos() {
    try {
        const response = await fetch('/api/campaigns/invites/created', {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const convites = await response.json();
            exibirConvitesAtivos(convites);
        }
    } catch (error) {
        console.error('Erro ao carregar convites:', error);
    }
}

async function carregarEstatisticas() {
    try {
        // Carregar estatísticas básicas
        const campanhasResponse = await fetch('/api/campaigns', {
            headers: getAuthHeaders()
        });
        
        if (campanhasResponse.ok) {
            const campanhas = await campanhasResponse.json();
            exibirEstatisticas(campanhas);
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// === EXIBIÇÃO MELHORADA ===

function exibirCampanhas(campanhas) {
    const container = document.getElementById('campanhas-lista');
    
    if (!campanhas || campanhas.length === 0) {
        container.innerHTML = `
            <div class="vazio">
                <p>🎭 Nenhuma campanha criada</p>
                <button class="btn btn-primary btn-sm mt-2" onclick="criarNovaCampanha()">
                    ➕ Criar Primeira Campanha
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = campanhas.map(campanha => `
        <div class="campanha-card">
            <div class="campanha-info">
                <div class="campanha-header">
                    <strong>${campanha.name}</strong>
                    <span class="badge ${campanha.role === 'owner' ? 'badge-primary' : 'badge-secondary'}">
                        ${campanha.role === 'owner' ? 'Dono' : 'Mestre'}
                    </span>
                </div>
                <div class="campanha-descricao">
                    ${campanha.description || 'Sem descrição'}
                </div>
                <div class="campanha-meta">
                    <small>ID: ${campanha.id.substring(0, 8)}...</small>
                    <small>Criada em: ${new Date(campanha.created_at).toLocaleDateString()}</small>
                </div>
            </div>
            <div class="campanha-acoes">
                <button class="btn btn-success btn-sm" onclick="iniciarSessao('${campanha.id}')" title="Iniciar sessão de áudio">
                    🎮 Iniciar Sessão
                </button>
                <button class="btn btn-outline btn-sm" onclick="gerenciarCampanha('${campanha.id}', '${campanha.name}')" title="Gerenciar campanha">
                    ⚙️ Gerenciar
                </button>
                <button class="btn btn-danger btn-sm" onclick="excluirCampanha('${campanha.id}', '${campanha.name}')" title="Excluir campanha">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');
}

function exibirConvitesAtivos(convites) {
    const container = document.getElementById('convites-ativos');
    
    if (!convites || convites.length === 0) {
        container.innerHTML = '<p class="vazio">Nenhum convite ativo</p>';
        return;
    }

    container.innerHTML = convites.map(convite => `
        <div class="convite-card">
            <div class="convite-info">
                <div class="convite-header">
                    <strong>${convite.campaign_name}</strong>
                    <span class="badge ${convite.role === 'gm' ? 'badge-warning' : 'badge-info'}">
                        ${convite.role === 'gm' ? 'Mestre' : 'Jogador'}
                    </span>
                </div>
                <div class="convite-detalhes">
                    <small>Para: ${convite.invited_username || 'Link Público'}</small>
                    <small>Token: <code>${convite.token || 'N/A'}</code></small>
                    <small>ID: <code>${convite.id}</code></small>
                    <small>Criado em: ${new Date(convite.created_at).toLocaleDateString()}</small>
                    ${convite.expires_at ? `<small>Expira: ${new Date(convite.expires_at).toLocaleDateString()}</small>` : ''}
                </div>
            </div>
            <div class="convite-acoes">
                <button class="btn btn-sm" onclick="copiarLinkConvite('${convite.token}')" title="Copiar link do convite">
                    📋 Copiar
                </button>
                <button class="btn btn-danger btn-sm" onclick="excluirConvite('${convite.id}', '${convite.campaign_name}')" title="Excluir convite">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');
}

function exibirEstatisticas(campanhas) {
    const container = document.getElementById('estatisticas-rapidas');
    const totalCampanhas = campanhas.length;
    
    container.innerHTML = `
        <div class="estatisticas-grid">
            <div class="estatistica-item">
                <div class="estatistica-valor">${totalCampanhas}</div>
                <div class="estatistica-label">Campanhas</div>
            </div>
            <div class="estatistica-item">
                <div class="estatistica-valor">${totalCampanhas}</div>
                <div class="estatistica-label">Sessões Possíveis</div>
            </div>
            <div class="estatistica-item">
                <div class="estatistica-valor">0</div>
                <div class="estatistica-label">Sessões Ativas</div>
            </div>
        </div>
    `;
}

// === FUNÇÕES DE GESTÃO ===

async function criarNovaCampanha() {
    const nome = prompt('🎭 Nome da Campanha:');
    if (!nome) return;

    const descricao = prompt('📝 Descrição (opcional):') || '';

    try {
        const response = await fetch('/api/campaigns', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name: nome, description: descricao })
        });

        if (response.ok) {
            const novaCampanha = await response.json();
            mostrarSucesso(`Campanha "${novaCampanha.name}" criada com sucesso!`);
            
            // Recarregar a lista
            await carregarCampanhas();
            
            // Perguntar se quer criar um convite
            const criarConvite = confirm('Deseja criar um convite para esta campanha?');
            if (criarConvite) {
                await criarConviteParaCampanha(novaCampanha.id);
            }
        } else {
            const erro = await response.json();
            throw new Error(erro.error);
        }
    } catch (error) {
        console.error('Erro ao criar campanha:', error);
        mostrarErro(error.message);
    }
}

async function criarNovoConvite() {
    try {
        // Carregar campanhas para seleção
        const response = await fetch('/api/campaigns', {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Erro ao carregar campanhas');
        
        const campanhas = await response.json();
        if (campanhas.length === 0) {
            mostrarErro('Crie uma campanha primeiro!');
            return;
        }
        
        // Se só tiver uma campanha, usar automaticamente
        if (campanhas.length === 1) {
            await criarConviteParaCampanha(campanhas[0].id);
            return;
        }
        
        // Listar campanhas para escolha
        const listaCampanhas = campanhas.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
        const escolha = prompt(
            `Para qual campanha?\n\n${listaCampanhas}\n\nDigite o número:`
        );
        
        if (!escolha) return;
        
        const index = parseInt(escolha) - 1;
        if (index >= 0 && index < campanhas.length) {
            await criarConviteParaCampanha(campanhas[index].id);
        } else {
            mostrarErro('Número inválido!');
        }
        
    } catch (error) {
        console.error('Erro ao criar convite:', error);
        mostrarErro(error.message);
    }
}

async function criarConviteParaCampanha(campanhaId) {
    const username = prompt('👤 Nome de usuário específico (deixe em branco para link público):') || null;
    const role = confirm('Deseja que este convite seja para um Mestre?') ? 'gm' : 'player';

    try {
        const response = await fetch(`/api/campaigns/${campanhaId}/invites`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                invited_username: username,
                role: role,
                generateToken: true 
            })
        });

        if (response.ok) {
            const convite = await response.json();
            
            // Mostrar o link do convite
            const link = `${window.location.origin}/accept-invite.html?token=${convite.token}`;
            
            mostrarSucesso(`Convite criado! Link: ${link}`);
            
            // Oferecer para copiar o link
            const copiar = confirm('Deseja copiar o link do convite?');
            if (copiar) {
                navigator.clipboard.writeText(link);
                mostrarSucesso('Link copiado para a área de transferência!');
            }
            
            // Recarregar convites ativos
            await carregarConvitesAtivos();
        } else {
            const erro = await response.json();
            throw new Error(erro.error);
        }
    } catch (error) {
        console.error('Erro ao criar convite:', error);
        mostrarErro(error.message);
    }
}

// === FUNÇÕES DE EXCLUSÃO ===
async function excluirCampanha(campanhaId, campanhaNome) {
    // ✅ CONFIRMAÇÃO MAIS SEGURA
    const confirmacao = confirm(`🚨 TEM CERTEZA que deseja excluir a campanha "${campanhaNome}"?\n\n✅ SERÃO EXCLUÍDOS:\n• Todos os convites ativos\n• Histórico de atividades\n• Lista de membros\n• Configurações da campanha\n\n⚠️ Esta ação NÃO pode ser desfeita!`);
    
    if (!confirmacao) return;
    
    try {
        // ✅ CHAMADA REAL PARA A API
        const response = await fetch(`/api/campaigns/${campanhaId}`, {
            method: 'DELETE',  // ← Usando método DELETE
            headers: getAuthHeaders()  // ← Com token de autenticação
        });

        // ✅ VERIFICANDO SE DEU CERTO
        if (response.ok) {
            const resultado = await response.json();
            mostrarSucesso(resultado.message || `Campanha "${campanhaNome}" excluída com sucesso!`);
            await carregarCampanhas();  // ← Atualiza a lista
        } else {
            const erro = await response.json();
            throw new Error(erro.error);
        }
    } catch (error) {
        console.error('Erro ao excluir campanha:', error);
        mostrarErro(error.message);
    }
}

async function excluirConvite(conviteId, campanhaNome) {
    const confirmacao = confirm(`Deseja excluir o convite para "${campanhaNome}"?`);
    
    if (!confirmacao) return;
    
    try {
        // ✅ CÓDIGO CORRETO - DESCOMENTADO
        const response = await fetch(`/api/invites/${conviteId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            mostrarSucesso('Convite excluído com sucesso!');
            await carregarConvitesAtivos(); // Atualiza a lista
        } else {
            const erro = await response.json();
            throw new Error(erro.error);
        }
        
    } catch (error) {
        console.error('Erro ao excluir convite:', error);
        mostrarErro('Erro ao excluir convite: ' + error.message);
    }
}

// === FUNÇÕES DE SESSÃO ===

async function iniciarSessao(campanhaId) {
    try {
        // Redireciona para o painel de áudio do mestre
        window.location.href = `/mestre.html?campaign=${campanhaId}`;
    } catch (error) {
        console.error('Erro ao iniciar sessão:', error);
        mostrarErro('Erro ao iniciar sessão: ' + error.message);
    }
}

function gerenciarCampanha(campanhaId, campanhaNome) {
    // Aqui podemos abrir um modal ou página de gestão detalhada
    // Por enquanto, vamos mostrar informações básicas
    alert(`Gestão da Campanha: ${campanhaNome}\n\nID: ${campanhaId}\n\nFuncionalidades de gestão detalhada em desenvolvimento!`);
}

// === FUNÇÕES AUXILIARES ===

function configurarEventListeners() {
    document.getElementById('btn-nova-campanha').addEventListener('click', criarNovaCampanha);
    document.getElementById('btn-novo-convite').addEventListener('click', criarNovoConvite);
    document.getElementById('btn-recarregar').addEventListener('click', recarregarDashboard);
    document.getElementById('btn-limpar-localstorage').addEventListener('click', limparLocalStorage);
}

function copiarLinkConvite(token) {
    const link = `${window.location.origin}/accept-invite.html?token=${token}`;
    navigator.clipboard.writeText(link).then(() => {
        mostrarSucesso('Link copiado para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        mostrarErro('Erro ao copiar link');
    });
}

async function recarregarDashboard() {
    await carregarDashboardMestre();
    mostrarSucesso('Dashboard recarregado!');
}

function limparLocalStorage() {
    const confirmacao = confirm('Deseja limpar todos os dados locais (tokens, preferências)?\n\nIsso fará logout de todos os usuários.');
    if (confirmacao) {
        localStorage.clear();
        mostrarSucesso('LocalStorage limpo! Recarregando...');
        setTimeout(() => location.reload(), 1000);
    }
}

// === FUNÇÕES DE UTILIDADE ===

function getAuthHeaders() {
    const token = localStorage.getItem('rpg_token');
    if (!token) {
        window.location.href = '/login.html';
        throw new Error('Token não encontrado');
    }
    return {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };
}

async function verificarAutenticacao() {
    const token = localStorage.getItem('rpg_token');
    const userRole = localStorage.getItem('rpg_user_role');
    
    if (!token || userRole !== 'mestre') {
        window.location.href = '/login-mestre.html';
        return;
    }

    try {
        const response = await fetch('/api/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!response.ok) {
            throw new Error('Token inválido');
        }

        const user = await response.json();
        document.getElementById('user-info').innerHTML = `
            <div class="user-welcome">
                <strong>👑 ${user.displayName}</strong>
                <small>Painel do Mestre</small>
            </div>
        `;
    } catch (error) {
        console.error('Erro de autenticação:', error);
        localStorage.removeItem('rpg_token');
        localStorage.removeItem('rpg_user_role');
        window.location.href = '/login-mestre.html';
    }
}

function mostrarCarregamento(mostrar) {
    const loading = document.getElementById('loading');
    const content = document.getElementById('dashboard-content');
    
    if (loading && content) {
        if (mostrar) {
            loading.style.display = 'block';
            content.style.opacity = '0.5';
        } else {
            loading.style.display = 'none';
            content.style.opacity = '1';
        }
    }
}

function mostrarSucesso(mensagem) {
    // Sistema de notificação melhorado
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        <span>✅ ${mensagem}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function mostrarErro(mensagem) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <span>❌ ${mensagem}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// === FUNÇÕES DE EXPORTAÇÃO/BACKUP ===

async function exportarDados() {
    try {
        const [campanhas, convites] = await Promise.all([
            fetch('/api/campaigns', { headers: getAuthHeaders() }).then(r => r.json()),
            fetch('/api/campaigns/invites/created', { headers: getAuthHeaders() }).then(r => r.json())
        ]);
        
        const dados = {
            exportado_em: new Date().toISOString(),
            campanhas: campanhas,
            convites: convites
        };
        
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-rpg-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        mostrarSucesso('Dados exportados com sucesso!');
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        mostrarErro('Erro ao exportar dados');
    }
}

// === GESTÃO DE MEMBROS ===
async function gerenciarMembros(campanhaId, campanhaNome) {
    try {
        const response = await fetch(`/api/campaigns/${campanhaId}/members-detailed`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const membros = await response.json();
            abrirModalMembros(campanhaNome, membros, campanhaId);
        } else {
            throw new Error('Erro ao carregar membros');
        }
    } catch (error) {
        console.error('Erro ao carregar membros:', error);
        mostrarErro('Erro ao carregar lista de membros');
    }
}

function abrirModalMembros(campanhaNome, membros, campanhaId) {
    const modalHTML = `
        <div class="modal-overlay" id="modal-membros">
            <div class="modal">
                <div class="modal-header">
                    <h3>👥 Membros: ${campanhaNome}</h3>
                    <button onclick="fecharModal('modal-membros')">×</button>
                </div>
                <div class="modal-body">
                    ${membros.length === 0 ? 
                        '<p class="vazio">Nenhum membro nesta campanha</p>' : 
                        membros.map(membro => `
                            <div class="membro-item">
                                <div class="membro-info">
                                    <strong>${membro.display_name || membro.username}</strong>
                                    <span class="badge ${membro.role === 'owner' ? 'badge-primary' : membro.role === 'gm' ? 'badge-warning' : 'badge-info'}">
                                        ${membro.role === 'owner' ? 'Dono' : membro.role === 'gm' ? 'Mestre' : 'Jogador'}
                                    </span>
                                </div>
                                <div class="membro-meta">
                                    <small>Entrou em: ${new Date(membro.joined_at).toLocaleDateString()}</small>
                                </div>
                                <div class="membro-acoes">
                                    ${membro.role !== 'owner' ? `
                                        <button class="btn btn-danger btn-sm" 
                                                onclick="expulsarMembro('${membro.user_id}', '${membro.username}', '${campanhaId}')">
                                            🗑️ Expulsar
                                        </button>
                                    ` : '<small class="text-muted">Dono</small>'}
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="fecharModal('modal-membros')">Fechar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

async function removerMembro(userId, username) {
    const confirmacao = confirm(`Remover ${username} da campanha?`);
    if (!confirmacao) return;
    
    // TODO: Implementar endpoint de remoção de membros
    mostrarErro('Funcionalidade de remoção de membros em desenvolvimento!');
}

// === ATUALIZAÇÃO DA FUNÇÃO GERENCIAR CAMPANHA ===

function gerenciarCampanha(campanhaId, campanhaNome) {
    const modalHTML = `
        <div class="modal-overlay" id="modal-gerenciar">
            <div class="modal">
                <div class="modal-header">
                    <h3>⚙️ Gerenciar: ${campanhaNome}</h3>
                    <button onclick="fecharModal('modal-gerenciar')">×</button>
                </div>
                <div class="modal-body">
                    <div class="gerenciar-opcoes">
                        <button class="btn btn-outline btn-block" onclick="gerenciarMembros('${campanhaId}', '${campanhaNome}'); fecharModal('modal-gerenciar')">
                            👥 Gerenciar Membros
                        </button>
                        <button class="btn btn-outline btn-block" onclick="criarConviteParaCampanha('${campanhaId}'); fecharModal('modal-gerenciar')">
                            📨 Criar Novo Convite
                        </button>
                        <button class="btn btn-outline btn-block" onclick="verEstatisticas('${campanhaId}', '${campanhaNome}'); fecharModal('modal-gerenciar')">
                            📊 Ver Estatísticas
                        </button>
                        <button class="btn btn-danger btn-block" onclick="excluirCampanha('${campanhaId}', '${campanhaNome}'); fecharModal('modal-gerenciar')">
                            🗑️ Excluir Campanha
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="fecharModal('modal-gerenciar')">Fechar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function verEstatisticas(campanhaId, campanhaNome) {
    try {
        const response = await fetch(`/api/campaigns/${campanhaId}/stats`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const stats = await response.json();
            abrirModalEstatisticas(campanhaNome, stats);
        } else {
            throw new Error('Erro ao carregar estatísticas');
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        mostrarErro('Erro ao carregar estatísticas');
    }
}

function abrirModalEstatisticas(campanhaNome, stats) {
    const modalHTML = `
        <div class="modal-overlay" id="modal-stats">
            <div class="modal">
                <div class="modal-header">
                    <h3>📊 Estatísticas: ${campanhaNome}</h3>
                    <button onclick="fecharModal('modal-stats')">×</button>
                </div>
                <div class="modal-body">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${stats.memberStats.reduce((acc, curr) => acc + curr.count, 0)}</div>
                            <div class="stat-label">Total de Membros</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.activeInvites}</div>
                            <div class="stat-label">Convites Ativos</div>
                        </div>
                    </div>
                    
                    <h4>Distribuição de Membros</h4>
                    ${stats.memberStats.map(stat => `
                        <div class="stat-row">
                            <span>${stat.role === 'owner' ? 'Dono' : stat.role === 'gm' ? 'Mestres' : 'Jogadores'}:</span>
                            <strong>${stat.count}</strong>
                        </div>
                    `).join('')}
                    
                    ${stats.recentActivities.length > 0 ? `
                        <h4>Últimas Atividades</h4>
                        <div class="atividades-list">
                            ${stats.recentActivities.slice(0, 5).map(activity => `
                                <div class="atividade-item">
                                    <small>${activity.action} - ${new Date(activity.created_at).toLocaleString()}</small>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="fecharModal('modal-stats')">Fechar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}