// cabecalho-melhorado.js - Sistema de campos personalizáveis diretos
class CabecalhoMelhorado {
    constructor() {
        this.campos = ['classe', 'origem', 'patente'];
        this.init();
    }

    init() {
        console.log('🎛️ Sistema de cabeçalho melhorado iniciado!');
        this.setupCamposEditaveis();
        this.carregarDadosSalvos();
    }

    setupCamposEditaveis() {
        this.campos.forEach(campo => {
            const select = document.getElementById(campo);
            const container = select.closest('.select-editavel');
            
            if (!container) {
                // Criar container se não existir
                this.criarContainerEditavel(select, campo);
            } else {
                this.configurarCampoExistente(container, campo);
            }
        });
    }

    criarContainerEditavel(select, campo) {
        const container = document.createElement('div');
        container.className = 'select-editavel';
        
        // Criar input editável
        const inputEditavel = document.createElement('input');
        inputEditavel.type = 'text';
        inputEditavel.className = 'input-editavel form-control';
        inputEditavel.placeholder = `Digite a ${this.obterRotulo(campo)} personalizada...`;
        inputEditavel.id = `${campo}-input`;
        
        // Envolver o select no container
        select.parentNode.insertBefore(container, select);
        container.appendChild(select);
        container.appendChild(inputEditavel);
        
        this.configurarCampoExistente(container, campo);
    }

    configurarCampoExistente(container, campo) {
        const select = container.querySelector('select');
        const input = container.querySelector('.input-editavel');
        
        // Verificar se já tem valor personalizado salvo
        const valorSalvo = localStorage.getItem(`${campo}-personalizado`);
        if (valorSalvo && valorSalvo !== '') {
            select.value = 'custom';
            container.classList.add('personalizado', 'campo-personalizado');
            input.value = valorSalvo;
            input.style.display = 'block';
            select.style.display = 'none';
        }

        // Evento de mudança no select
        select.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                this.ativarModoPersonalizado(container, input, select, campo);
            } else {
                this.desativarModoPersonalizado(container, input, select, campo);
                this.salvarDado(campo, e.target.value, false);
            }
        });

        // Evento no input personalizado
        input.addEventListener('input', (e) => {
            this.salvarDado(campo, e.target.value, true);
        });

        input.addEventListener('blur', (e) => {
            if (e.target.value === '') {
                // Se ficar vazio, voltar para o select normal
                select.value = '';
                this.desativarModoPersonalizado(container, input, select, campo);
            }
        });

        // Tecla Enter para confirmar
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });
    }

    ativarModoPersonalizado(container, input, select, campo) {
        container.classList.add('personalizado', 'campo-personalizado');
        input.style.display = 'block';
        select.style.display = 'none';
        input.focus();
        
        // Restaurar valor salvo se existir
        const valorSalvo = localStorage.getItem(`${campo}-personalizado`);
        if (valorSalvo) {
            input.value = valorSalvo;
        }
    }

    desativarModoPersonalizado(container, input, select, campo) {
        container.classList.remove('personalizado', 'campo-personalizado');
        input.style.display = 'none';
        select.style.display = 'block';
        localStorage.removeItem(`${campo}-personalizado`);
    }

    salvarDado(campo, valor, ehPersonalizado) {
        if (ehPersonalizado) {
            localStorage.setItem(`${campo}-personalizado`, valor);
        } else {
            localStorage.setItem(campo, valor);
            localStorage.removeItem(`${campo}-personalizado`);
        }
        
        // Disparar evento personalizado para outros sistemas
        const evento = new CustomEvent('cabecalhoAlterado', {
            detail: { campo, valor, ehPersonalizado }
        });
        document.dispatchEvent(evento);
    }

    carregarDadosSalvos() {
        this.campos.forEach(campo => {
            const valorNormal = localStorage.getItem(campo);
            const valorPersonalizado = localStorage.getItem(`${campo}-personalizado`);
            
            const select = document.getElementById(campo);
            const container = select.closest('.select-editavel');
            const input = container?.querySelector('.input-editavel');
            
            if (valorPersonalizado && container && input) {
                select.value = 'custom';
                container.classList.add('personalizado', 'campo-personalizado');
                input.value = valorPersonalizado;
                input.style.display = 'block';
                select.style.display = 'none';
            } else if (valorNormal && select) {
                select.value = valorNormal;
            }
        });
    }

    obterRotulo(campo) {
        const rotulos = {
            'classe': 'classe',
            'origem': 'origem', 
            'patente': 'patente'
        };
        return rotulos[campo] || campo;
    }

    // Método para obter o valor atual de um campo
    obterValor(campo) {
        const container = document.querySelector(`#${campo}`).closest('.select-editavel');
        if (container.classList.contains('personalizado')) {
            const input = container.querySelector('.input-editavel');
            return input.value;
        } else {
            const select = container.querySelector('select');
            return select.value;
        }
    }

    // Método para definir valor programaticamente
    definirValor(campo, valor, ehPersonalizado = false) {
        const container = document.querySelector(`#${campo}`).closest('.select-editavel');
        const select = container.querySelector('select');
        const input = container.querySelector('.input-editavel');
        
        if (ehPersonalizado) {
            select.value = 'custom';
            this.ativarModoPersonalizado(container, input, select, campo);
            input.value = valor;
            this.salvarDado(campo, valor, true);
        } else {
            this.desativarModoPersonalizado(container, input, select, campo);
            select.value = valor;
            this.salvarDado(campo, valor, false);
        }
    }
}

// Integração automática
document.addEventListener('DOMContentLoaded', function() {
    window.cabecalhoMelhorado = new CabecalhoMelhorado();
    console.log('🎛️ Sistema de cabeçalho melhorado pronto!');
});