// =========================================================
// descricao.js - Funcionalidades específicas da aba Descrição
// =========================================================

class GerenciadorDescricao {
    constructor() {
        this.init();
    }

    // INICIALIZAÇÃO
    init() {
        console.log('👤 Gerenciador de Descrição iniciado!');
        this.setupEventListeners();
        this.carregarDados();
        this.sincronizarIdade(); // Sincroniza idade da aba História
    }

    // CONFIGURAR EVENTOS
    setupEventListeners() {
        // Salvar automaticamente quando digitar
        this.setupAutoSave();
        
        // Sincronizar quando mudar para esta aba
        document.addEventListener('abaMudou', (e) => {
            if (e.detail.aba === 'descricao') {
                this.sincronizarIdade();
            }
        });
    }

    // CONFIGURAR SALVAMENTO AUTOMÁTICO
    setupAutoSave() {
        const campos = [
            'altura', 'peso', 'cor-olhos', 'cor-cabelo', 'tipo-cabelo',
            'cor-pele', 'tipo-corpo', 'marcas-tatuagens', 'estilo-roupa',
            'acessorios', 'calcados', 'cicatrizes', 'defeitos-fisicos',
            'particularidades', 'descricao-completa'
        ];

        campos.forEach(campoId => {
            const elemento = document.getElementById(campoId);
            if (elemento) {
                elemento.addEventListener('input', () => {
                    this.salvarDados();
                });
            }
        });
    }

    // SINCRONIZAR IDADE DA ABA HISTÓRIA
    sincronizarIdade() {
        const idadeHistoria = document.getElementById('idade')?.value;
        const idadeDescricao = document.getElementById('idade-descricao');
        
        if (idadeDescricao && idadeHistoria) {
            idadeDescricao.value = idadeHistoria;
        }
    }

    // SALVAR TODOS OS DADOS DA ABA DESCRIÇÃO
    salvarDados() {
        const dados = {
            altura: document.getElementById('altura').value,
            peso: document.getElementById('peso').value,
            corOlhos: document.getElementById('cor-olhos').value,
            corCabelo: document.getElementById('cor-cabelo').value,
            tipoCabelo: document.getElementById('tipo-cabelo').value,
            corPele: document.getElementById('cor-pele').value,
            tipoCorpo: document.getElementById('tipo-corpo').value,
            marcasTatuagens: document.getElementById('marcas-tatuagens').value,
            estiloRoupa: document.getElementById('estilo-roupa').value,
            acessorios: document.getElementById('acessorios').value,
            calcados: document.getElementById('calcados').value,
            cicatrizes: document.getElementById('cicatrizes').value,
            defeitosFisicos: document.getElementById('defeitos-fisicos').value,
            particularidades: document.getElementById('particularidades').value,
            descricaoCompleta: document.getElementById('descricao-completa').value,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('dadosDescricao', JSON.stringify(dados));
        console.log('💾 Dados da descrição salvos!');
    }

    // CARREGAR DADOS SALVOS
    carregarDados() {
        const dadosSalvos = localStorage.getItem('dadosDescricao');
        if (dadosSalvos) {
            try {
                const dados = JSON.parse(dadosSalvos);
                
                // Preencher todos os campos
                document.getElementById('altura').value = dados.altura || '';
                document.getElementById('peso').value = dados.peso || '';
                document.getElementById('cor-olhos').value = dados.corOlhos || '';
                document.getElementById('cor-cabelo').value = dados.corCabelo || '';
                document.getElementById('tipo-cabelo').value = dados.tipoCabelo || '';
                document.getElementById('cor-pele').value = dados.corPele || '';
                document.getElementById('tipo-corpo').value = dados.tipoCorpo || '';
                document.getElementById('marcas-tatuagens').value = dados.marcasTatuagens || '';
                document.getElementById('estilo-roupa').value = dados.estiloRoupa || '';
                document.getElementById('acessorios').value = dados.acessorios || '';
                document.getElementById('calcados').value = dados.calcados || '';
                document.getElementById('cicatrizes').value = dados.cicatrizes || '';
                document.getElementById('defeitos-fisicos').value = dados.defeitosFisicos || '';
                document.getElementById('particularidades').value = dados.particularidades || '';
                document.getElementById('descricao-completa').value = dados.descricaoCompleta || '';
                
                // Sincronizar idade
                this.sincronizarIdade();
                
                console.log('📂 Dados da descrição carregados!');
                
            } catch (error) {
                console.error('❌ Erro ao carregar dados da descrição:', error);
            }
        }
    }
}

// INICIALIZAR QUANDO A PÁGINA CARREGAR
document.addEventListener('DOMContentLoaded', function() {
    window.gerenciadorDescricao = new GerenciadorDescricao();
    console.log('👤 Gerenciador de descrição pronto!');
});