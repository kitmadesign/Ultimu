// =========================================================
// cabecalho.js - Funcionalidades do cabeçalho expandido
// =========================================================

class GerenciadorCabecalho {
    constructor() {
        this.init();
    }

    // INICIALIZAÇÃO
    init() {
        console.log('📋 Gerenciador de Cabeçalho iniciado!');
        this.setupEventListeners();
        this.carregarDados();
    }

    // CONFIGURAR EVENTOS
    setupEventListeners() {
        // Mostrar/ocultar campos personalizados
        this.setupCamposPersonalizados();
        
        // Salvar automaticamente
        this.setupAutoSave();
        
        // Cálculos baseados no nível
        document.getElementById('nivel').addEventListener('change', () => {
            this.atualizarCalculosNivel();
        });
    }

    // CONFIGURAR CAMPOS PERSONALIZADOS
    setupCamposPersonalizados() {
        const campos = [
            { select: 'classe', custom: 'classe-custom' },
            { select: 'origem', custom: 'origem-custom' },
            { select: 'patente', custom: 'patente-custom' }
        ];

        campos.forEach(({ select, custom }) => {
            const selectElement = document.getElementById(select);
            const customElement = document.getElementById(custom);

            selectElement.addEventListener('change', () => {
                if (selectElement.value === 'custom') {
                    customElement.style.display = 'block';
                    customElement.required = true;
                } else {
                    customElement.style.display = 'none';
                    customElement.required = false;
                    customElement.value = '';
                }
            });
        });
    }

    // CONFIGURAR SALVAMENTO AUTOMÁTICO
    setupAutoSave() {
        const campos = [
            'nome-personagem', 'nome-jogador', 'nex', 'nivel',
            'classe', 'classe-custom', 'origem', 'origem-custom',
            'patente', 'patente-custom', 'trilha', 'divindade', 'afiliacao'
        ];

        campos.forEach(campoId => {
            const elemento = document.getElementById(campoId);
            if (elemento) {
                elemento.addEventListener('input', () => {
                    this.salvarDados();
                });
                
                elemento.addEventListener('change', () => {
                    this.salvarDados();
                });
            }
        });
    }

    // ATUALIZAR CÁLCULOS BASEADOS NO NÍVEL
    atualizarCalculosNivel() {
        // Aqui você pode adicionar cálculos que dependem do nível
        const nivel = parseInt(document.getElementById('nivel').value) || 1;
        console.log(`📊 Nível atualizado para: ${nivel}`);
        
        // Disparar evento para outros sistemas
        document.dispatchEvent(new CustomEvent('nivelMudou', {
            detail: { nivel }
        }));
    }

    // SALVAR DADOS DO CABEÇALHO
    salvarDados() {
        const dados = {
            nomePersonagem: document.getElementById('nome-personagem').value,
            nomeJogador: document.getElementById('nome-jogador').value,
            nex: parseInt(document.getElementById('nex').value) || 5,
            nivel: parseInt(document.getElementById('nivel').value) || 1,
            classe: this.obterValorComCustom('classe', 'classe-custom'),
            origem: this.obterValorComCustom('origem', 'origem-custom'),
            patente: this.obterValorComCustom('patente', 'patente-custom'),
            trilha: document.getElementById('trilha').value,
            divindade: document.getElementById('divindade').value,
            afiliacao: document.getElementById('afiliacao').value,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('dadosCabecalho', JSON.stringify(dados));
        console.log('💾 Dados do cabeçalho salvos!', dados);
    }

    // OBTER VALOR COM SUPORTE A CUSTOM
    obterValorComCustom(selectId, customId) {
        const select = document.getElementById(selectId);
        const custom = document.getElementById(customId);
        
        if (select.value === 'custom' && custom.value.trim()) {
            return custom.value.trim();
        }
        return select.value;
    }

    // CARREGAR DADOS SALVOS
    carregarDados() {
        const dadosSalvos = localStorage.getItem('dadosCabecalho');
        if (dadosSalvos) {
            try {
                const dados = JSON.parse(dadosSalvos);
                
                // Preencher campos básicos
                document.getElementById('nome-personagem').value = dados.nomePersonagem || '';
                document.getElementById('nome-jogador').value = dados.nomeJogador || '';
                document.getElementById('nex').value = dados.nex || 5;
                document.getElementById('nivel').value = dados.nivel || 1;
                document.getElementById('trilha').value = dados.trilha || '';
                document.getElementById('divindade').value = dados.divindade || '';
                document.getElementById('afiliacao').value = dados.afiliacao || '';
                
                // Preencher selects com suporte a custom
                this.preencherSelectComCustom('classe', dados.classe, 'classe-custom');
                this.preencherSelectComCustom('origem', dados.origem, 'origem-custom');
                this.preencherSelectComCustom('patente', dados.patente, 'patente-custom');
                
                console.log('📂 Dados do cabeçalho carregados!');
                
            } catch (error) {
                console.error('❌ Erro ao carregar dados do cabeçalho:', error);
            }
        }
    }

    // PREENCHER SELECT COM SUPORTE A CUSTOM
    preencherSelectComCustom(selectId, valor, customId) {
        const select = document.getElementById(selectId);
        const custom = document.getElementById(customId);
        
        // Verificar se o valor é uma opção padrão
        const opcoesPadrao = Array.from(select.options).map(opt => opt.value);
        
        if (opcoesPadrao.includes(valor)) {
            select.value = valor;
            custom.style.display = 'none';
        } else if (valor) {
            // É um valor personalizado
            select.value = 'custom';
            custom.style.display = 'block';
            custom.value = valor;
        } else {
            select.value = '';
            custom.style.display = 'none';
        }
    }

    // OBTER DADOS PARA OUTROS SISTEMAS
    obterDados() {
        return {
            nomePersonagem: document.getElementById('nome-personagem').value,
            nomeJogador: document.getElementById('nome-jogador').value,
            nex: parseInt(document.getElementById('nex').value) || 5,
            nivel: parseInt(document.getElementById('nivel').value) || 1,
            classe: this.obterValorComCustom('classe', 'classe-custom'),
            origem: this.obterValorComCustom('origem', 'origem-custom'),
            patente: this.obterValorComCustom('patente', 'patente-custom'),
            trilha: document.getElementById('trilha').value,
            divindade: document.getElementById('divindade').value,
            afiliacao: document.getElementById('afiliacao').value
        };
    }
}

// INICIALIZAR QUANDO A PÁGINA CARREGAR
document.addEventListener('DOMContentLoaded', function() {
    window.gerenciadorCabecalho = new GerenciadorCabecalho();
    console.log('📋 Gerenciador de cabeçalho pronto!');
});