// =========================================================
// historia.js - Funcionalidades específicas da aba História
// =========================================================

class GerenciadorHistoria {
    constructor() {
        this.pessoas = [];
        this.init();
    }

    // INICIALIZAÇÃO
    init() {
        console.log('📖 Gerenciador de História iniciado!');
        this.setupEventListeners();
        this.carregarDados();
        this.setupCalculoIdade();
    }

    // CONFIGURAR EVENTOS
    setupEventListeners() {
        // Botão adicionar pessoa
        document.getElementById('adicionar-pessoa').addEventListener('click', () => {
            this.adicionarPessoa();
        });

        // Calcular idade quando data mudar
        document.getElementById('data-nascimento').addEventListener('change', () => {
            this.calcularIdade();
        });

        // Salvar automaticamente quando digitar
        this.setupAutoSave();
    }

    // CONFIGURAR SALVAMENTO AUTOMÁTICO
    setupAutoSave() {
        const campos = [
            'biografia', 'data-nascimento', 'local-origem', 
            'medos', 'manias', 'pior-pesadelo', 'objetivos', 'segredos'
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

    // CONFIGURAR CÁLCULO DE IDADE
    setupCalculoIdade() {
        const dataInput = document.getElementById('data-nascimento');
        const idadeInput = document.getElementById('idade');

        // Calcular idade inicial se já tiver data
        if (dataInput.value) {
            this.calcularIdade();
        }

        // Atualizar idade em tempo real enquanto digita
        dataInput.addEventListener('input', () => {
            this.calcularIdade();
        });
    }

    // CALCULAR IDADE A PARTIR DA DATA
    calcularIdade() {
        const dataInput = document.getElementById('data-nascimento');
        const idadeInput = document.getElementById('idade');
        
        if (!dataInput.value) {
            idadeInput.value = '';
            return;
        }

        try {
            const dataNascimento = new Date(dataInput.value);
            const hoje = new Date();
            
            let idade = hoje.getFullYear() - dataNascimento.getFullYear();
            const mesAtual = hoje.getMonth();
            const mesNascimento = dataNascimento.getMonth();
            
            // Ajustar se ainda não fez aniversário este ano
            if (mesAtual < mesNascimento || 
                (mesAtual === mesNascimento && hoje.getDate() < dataNascimento.getDate())) {
                idade--;
            }
            
            idadeInput.value = idade > 0 ? idade : '';
            
        } catch (error) {
            console.error('❌ Erro ao calcular idade:', error);
            idadeInput.value = '';
        }
    }

    // ADICIONAR NOVA PESSOA
    adicionarPessoa(dados = {}) {
        const pessoaId = 'pessoa_' + Date.now();
        const pessoa = {
            id: pessoaId,
            nome: dados.nome || '',
            relacao: dados.relacao || '',
            descricao: dados.descricao || ''
        };

        this.pessoas.push(pessoa);
        this.renderizarPessoa(pessoa);
        this.salvarDados();
        
        // Dar foco no campo nome da nova pessoa
        setTimeout(() => {
            const inputNome = document.querySelector(`[data-pessoa-id="${pessoaId}"] .pessoa-nome`);
            if (inputNome) inputNome.focus();
        }, 100);
    }

    // RENDERIZAR PESSOA NA TELA
    renderizarPessoa(pessoa) {
        const container = document.getElementById('pessoas-container');
        
        const pessoaElement = document.createElement('div');
        pessoaElement.className = 'pessoa-item nova';
        pessoaElement.dataset.pessoaId = pessoa.id;
        
        pessoaElement.innerHTML = `
            <div class="pessoa-cabecalho">
                <input type="text" class="form-control pessoa-nome" 
                       placeholder="Nome da pessoa" value="${pessoa.nome}">
                <input type="text" class="form-control pessoa-relacao" 
                       placeholder="Relação (ex: Mãe, Amigo)" value="${pessoa.relacao}">
                <button type="button" class="btn-remover-pessoa" title="Remover pessoa">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <textarea class="form-control pessoa-descricao" 
                      placeholder="Descrição ou história relacionada...">${pessoa.descricao}</textarea>
        `;

        container.appendChild(pessoaElement);

        // Configurar eventos para esta pessoa
        this.configurarEventosPessoa(pessoaElement, pessoa.id);

        // Remover animação após terminar
        setTimeout(() => {
            pessoaElement.classList.remove('nova');
        }, 300);
    }

    // CONFIGURAR EVENTOS PARA UMA PESSOA
    configurarEventosPessoa(elemento, pessoaId) {
        // Remover pessoa
        elemento.querySelector('.btn-remover-pessoa').addEventListener('click', () => {
            this.removerPessoa(pessoaId);
        });

        // Salvar automaticamente quando editar
        const inputs = elemento.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.atualizarPessoa(pessoaId);
            });
        });
    }

    // ATUALIZAR DADOS DE UMA PESSOA
    atualizarPessoa(pessoaId) {
        const elemento = document.querySelector(`[data-pessoa-id="${pessoaId}"]`);
        if (!elemento) return;

        const pessoaIndex = this.pessoas.findIndex(p => p.id === pessoaId);
        if (pessoaIndex === -1) return;

        this.pessoas[pessoaIndex] = {
            ...this.pessoas[pessoaIndex],
            nome: elemento.querySelector('.pessoa-nome').value,
            relacao: elemento.querySelector('.pessoa-relacao').value,
            descricao: elemento.querySelector('.pessoa-descricao').value
        };

        this.salvarDados();
    }

    // REMOVER PESSOA
    removerPessoa(pessoaId) {
        if (confirm('Tem certeza que deseja remover esta pessoa?')) {
            this.pessoas = this.pessoas.filter(p => p.id !== pessoaId);
            const elemento = document.querySelector(`[data-pessoa-id="${pessoaId}"]`);
            if (elemento) {
                elemento.style.opacity = '0';
                elemento.style.transform = 'translateX(-20px)';
                setTimeout(() => elemento.remove(), 300);
            }
            this.salvarDados();
        }
    }

    // RENDERIZAR TODAS AS PESSOAS
    renderizarTodasPessoas() {
        const container = document.getElementById('pessoas-container');
        container.innerHTML = '';
        
        this.pessoas.forEach(pessoa => {
            this.renderizarPessoa(pessoa);
        });
    }

    // SALVAR TODOS OS DADOS DA ABA HISTÓRIA
    salvarDados() {
        const dados = {
            biografia: document.getElementById('biografia').value,
            dataNascimento: document.getElementById('data-nascimento').value,
            localOrigem: document.getElementById('local-origem').value,
            medos: document.getElementById('medos').value,
            manias: document.getElementById('manias').value,
            piorPesadelo: document.getElementById('pior-pesadelo').value,
            objetivos: document.getElementById('objetivos').value,
            segredos: document.getElementById('segredos').value,
            pessoas: this.pessoas,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('dadosHistoria', JSON.stringify(dados));
        console.log('💾 Dados da história salvos!');
    }

    // CARREGAR DADOS SALVOS
    carregarDados() {
        const dadosSalvos = localStorage.getItem('dadosHistoria');
        if (dadosSalvos) {
            try {
                const dados = JSON.parse(dadosSalvos);
                
                // Preencher campos básicos
                document.getElementById('biografia').value = dados.biografia || '';
                document.getElementById('data-nascimento').value = dados.dataNascimento || '';
                document.getElementById('local-origem').value = dados.localOrigem || '';
                document.getElementById('medos').value = dados.medos || '';
                document.getElementById('manias').value = dados.manias || '';
                document.getElementById('pior-pesadelo').value = dados.piorPesadelo || '';
                document.getElementById('objetivos').value = dados.objetivos || '';
                document.getElementById('segredos').value = dados.segredos || '';
                
                // Carregar pessoas
                this.pessoas = dados.pessoas || [];
                this.renderizarTodasPessoas();
                
                // Calcular idade se tiver data
                if (dados.dataNascimento) {
                    this.calcularIdade();
                }
                
                console.log('📂 Dados da história carregados!', dados);
                
            } catch (error) {
                console.error('❌ Erro ao carregar dados da história:', error);
            }
        }
    }
}

// INICIALIZAR QUANDO A PÁGINA CARREGAR
document.addEventListener('DOMContentLoaded', function() {
    // Só inicializar se estiver na aba história ou quando mudar para ela
    window.gerenciadorHistoria = new GerenciadorHistoria();
    console.log('📖 Gerenciador de história pronto!');
    
    // Observar mudanças de aba para inicializar se necessário
    document.addEventListener('abaMudou', function(e) {
        if (e.detail.aba === 'historia' && !window.gerenciadorHistoria) {
            window.gerenciadorHistoria = new GerenciadorHistoria();
        }
    });
});