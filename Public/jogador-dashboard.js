// jogador-dashboard.js
document.addEventListener('DOMContentLoaded', async function() {
    await verificarAutenticacaoJogador();
    await carregarDashboardJogador();
});

async function carregarDashboardJogador() {
    try {
        const [campanhas, fichas, convites] = await Promise.all([
            carregarCampanhasJogador(),
            carregarFichasJogador(),
            carregarConvitesJogador()
        ]);
        
        exibirDashboardJogador(campanhas, fichas, convites);
    } catch (error) {
        console.error('Erro no dashboard jogador:', error);
    }
}

async function carregarCampanhasJogador() {
    const response = await fetch('/api/campaigns', {
        headers: getAuthHeaders()
    });
    return response.ok ? await response.json() : [];
}

async function carregarFichasJogador() {
    const response = await fetch('/api/user/fichas', {
        headers: getAuthHeaders()
    });
    return response.ok ? await response.json() : [];
}

async function carregarConvitesJogador() {
    const response = await fetch('/api/invites', {
        headers: getAuthHeaders()
    });
    return response.ok ? await response.json() : [];
}
