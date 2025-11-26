// public/accept-invite.js
document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        document.getElementById('convite-info').innerHTML = `
            <p class="text-center" style="color: var(--danger);">
                ❌ Token de convite não encontrado na URL
            </p>
        `;
        return;
    }
    
    await carregarInformacoesConvite(token);
});

async function carregarInformacoesConvite(token) {
    try {
        const response = await fetch(`/api/invites/token/${token}`);
        
        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.error || 'Convite não encontrado');
        }
        
        const convite = await response.json();
        exibirInformacoesConvite(convite);
        
    } catch (error) {
        console.error('Erro ao carregar convite:', error);
        document.getElementById('convite-info').innerHTML = `
            <p class="text-center" style="color: var(--danger);">
                ❌ ${error.message}
            </p>
        `;
    }
}

function exibirInformacoesConvite(convite) {
    const conviteInfo = document.getElementById('convite-info');
    const acaoConvite = document.getElementById('acao-convite');
    
    conviteInfo.innerHTML = `
        <div class="text-center">
            <h3>🎉 Você foi convidado!</h3>
            <p><strong>Campanha:</strong> ${convite.campaign_name}</p>
            <p><strong>Descrição:</strong> ${convite.campaign_description || 'Sem descrição'}</p>
            <p><strong>Convidado por:</strong> ${convite.created_by_username}</p>
            <p><strong>Cargo:</strong> ${convite.role === 'gm' ? 'Mestre' : 'Jogador'}</p>
            ${convite.invited_username ? 
                `<p><strong>Para:</strong> ${convite.invited_username}</p>` : 
                '<p><em>🎊 Convite público - qualquer um pode aceitar</em></p>'
            }
        </div>
    `;
    
    acaoConvite.style.display = 'block';
    
    // Configurar botão de aceitação
    document.getElementById('btn-aceitar-convite').addEventListener('click', () => {
        aceitarConvite(convite.token);
    });
}

function aceitarConvite(token) {
    const estaLogado = localStorage.getItem('rpg_token');
    
    if (estaLogado) {
        // Usuário já está logado - aceitar diretamente
        aceitarConviteLogado(token);
    } else {
        // Usuário não está logado - redirecionar para registro COM O TOKEN
        window.location.href = `/login.html?invite=${token}`;
    }
}

async function aceitarConviteLogado(token) {
    try {
        const response = await fetch(`/api/invites/token/${token}/accept`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('rpg_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // ✅ APENAS o username do usuário logado
                username: await getCurrentUsername()
            })
        });
        
        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.error);
        }
        
        const resultado = await response.json();
        
        document.getElementById('convite-info').innerHTML = `
            <div class="text-center" style="color: var(--success);">
                <h3>✅ Convite Aceito!</h3>
                <p>Você agora faz parte da campanha "${resultado.campaign.name}"!</p>
            </div>
        `;
        
        document.getElementById('acao-convite').style.display = 'none';
        
        setTimeout(() => {
            window.location.href = '/dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('Erro ao aceitar convite:', error);
        alert('❌ Erro ao aceitar convite: ' + error.message);
    }
}

// Função auxiliar para pegar o username do usuário logado
async function getCurrentUsername() {
    try {
        const response = await fetch('/api/me', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('rpg_token')
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            return user.username;
        }
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
    }
    return null;
}